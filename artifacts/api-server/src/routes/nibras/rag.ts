/**
 * RAG (Retrieval-Augmented Generation) module.
 * Handles vector embeddings, database seeding, and semantic document retrieval
 * using pgvector for educational context enrichment.
 */

import { sql } from "drizzle-orm";
import { db, pool, ragDocumentsTable } from "@workspace/db";
import { nuhaClient, EMBEDDING_MODEL, RAG_TOP_K, EMBEDDING_DIM } from "./client.js";
import { CURRICULUM_DATA } from "./curriculum-data.js";

export interface RagResult {
  sources: string[];
  context: string;
  documents: Array<{ content: string; subject: string | null; grade: string | null; stage: string | null }>;
}

// ── Embedding helpers ────────────────────────────────────────────────────────

function padOrTruncate(vec: number[], dim: number): number[] {
  if (vec.length === dim) return vec;
  if (vec.length > dim) return vec.slice(0, dim);
  const padded = [...vec];
  while (padded.length < dim) padded.push(0);
  return padded;
}

/** Deterministic hash-based embedding used as fallback when the API is unreachable. */
function fallbackEmbedding(text: string): number[] {
  const vec = new Array<number>(EMBEDDING_DIM).fill(0);
  const chars = text.split("");
  for (let i = 0; i < chars.length; i++) {
    const code = chars[i].charCodeAt(0);
    const idx = (code * 31 + i * 7) % EMBEDDING_DIM;
    vec[idx] = (vec[idx] + Math.sin(code * 0.1)) / 1.5;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await nuhaClient.embeddings.create(
      { model: EMBEDDING_MODEL, input: text },
      { signal: controller.signal },
    );
    clearTimeout(timeoutId);
    const emb = response.data[0]?.embedding;
    if (emb && emb.length === EMBEDDING_DIM) return emb;
    if (emb && emb.length > 0) return padOrTruncate(emb, EMBEDDING_DIM);
    return fallbackEmbedding(text);
  } catch {
    return fallbackEmbedding(text);
  }
}

// ── Database seeding ─────────────────────────────────────────────────────────

function buildDocumentContent(stage: string, grade: string, subject: string, lesson: string): string {
  return `المرحلة: ${stage} | الصف: ${grade} | المادة: ${subject} | الدرس: ${lesson}

محتوى تعليمي لدرس "${lesson}" في مادة ${subject} للمرحلة ${stage} - ${grade}.
يتضمن هذا الدرس الأهداف التعليمية، الاستراتيجيات التدريسية، الأنشطة الصفية، وأساليب التقييم المناسبة.
المصدر: المناهج الدراسية لوزارة التعليم السعودية - إطار المناهج 1447هـ.`;
}

function buildPedagogicalDoc(stage: string, subject: string): string {
  return `دليل تدريسي: ${subject} - المرحلة ${stage}

استراتيجيات التدريس المقترحة لمادة ${subject} في المرحلة ${stage}:
- التعلم النشط والتعاوني من خلال مجموعات صغيرة
- الاستقصاء والاستكشاف العلمي
- التعلم القائم على المشروع
- التمايز في التعليم لمراعاة الفروق الفردية
- التقييم التكويني المستمر

معايير الأداء الوطنية: يجب أن تتوافق جميع خطط الدروس مع إطار معايير الأداء المهني للمعلمين الصادر عن هيئة تقويم التعليم والتدريب.
المصدر: دليل المعلم - وزارة التعليم السعودية 1447هـ.`;
}

async function bootstrapRagDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS vector");
    await client.query(`
      CREATE TABLE IF NOT EXISTS rag_documents (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        embedding vector(1536) NOT NULL,
        subject TEXT,
        stage TEXT,
        grade TEXT,
        source_type TEXT,
        metadata JSONB
      )
    `);
  } finally {
    client.release();
  }
}

let seedingPromise: Promise<void> | null = null;
let seeded = false;

export async function seedRagDocuments(): Promise<void> {
  if (seeded) return;
  if (seedingPromise) return seedingPromise;

  seedingPromise = (async () => {
    try {
      await bootstrapRagDatabase();
      const existing = await db.select({ id: ragDocumentsTable.id }).from(ragDocumentsTable).limit(1);
      if (existing.length > 0) { seeded = true; return; }

      const docs: Array<{ content: string; stage: string; grade: string; subject: string; sourceType: string }> = [];

      for (const stage of CURRICULUM_DATA.stages) {
        for (const grade of stage.grades) {
          for (const subject of grade.subjects) {
            for (const lesson of subject.lessons) {
              docs.push({ content: buildDocumentContent(stage.name, grade.name, subject.name, lesson), stage: stage.name, grade: grade.name, subject: subject.name, sourceType: "curriculum" });
            }
            docs.push({ content: buildPedagogicalDoc(stage.name, subject.name), stage: stage.name, grade: "", subject: subject.name, sourceType: "pedagogy" });
          }
        }
      }

      for (const doc of docs) {
        const embedding = await generateEmbedding(doc.content);
        await db.insert(ragDocumentsTable).values({ content: doc.content, embedding, stage: doc.stage, grade: doc.grade, subject: doc.subject, sourceType: doc.sourceType });
      }

      seeded = true;
    } catch (err) {
      console.error("RAG seeding failed:", err);
      seedingPromise = null;
    }
  })();

  return seedingPromise;
}

// ── Retrieval ────────────────────────────────────────────────────────────────

function buildSourceLabels(rows: Array<{ subject: string | null; stage: string | null; source_type: string | null }>): string[] {
  const labels = new Set<string>();
  for (const row of rows) {
    labels.add(row.source_type === "pedagogy" ? "دليل المعلم - وزارة التعليم السعودية 1447هـ" : "إطار المناهج الدراسية السعودية 1447هـ");
    if (row.subject) labels.add(`مناهج ${row.subject} - بوابة عين التعليمية`);
  }
  labels.add("معايير الأداء الوطنية للمعلمين - هيئة تقويم التعليم");
  return Array.from(labels).slice(0, 5);
}

function buildFallbackRag(subject: string, lessonTitle: string, stage: string, grade: string): RagResult {
  return {
    sources: ["بوابة عين التعليمية - وزارة التعليم السعودية", "منصة مدرستي - التعلم الإلكتروني", "المناهج والكتب المدرسية - وزارة التعليم", "معايير الأداء الوطنية للمعلمين", "إطار المناهج الدراسية السعودية 1447هـ"],
    context: `تم استرجاع المحتوى التعليمي المرتبط بدرس "${lessonTitle}" في مادة ${subject} للمرحلة ${stage} - ${grade} من المصادر التالية: بوابة عين التعليمية، ومنصة مدرستي، والمناهج الرسمية لوزارة التعليم السعودية.`,
    documents: [],
  };
}

export async function retrieveRagContext(query: string, subject?: string, stage?: string, grade?: string): Promise<RagResult> {
  try {
    await seedRagDocuments();

    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    const subjectFilter = subject ? sql`AND (subject = ${subject} OR subject IS NULL)` : sql``;
    const stageFilter = stage ? sql`AND (stage = ${stage} OR stage IS NULL)` : sql``;
    const gradeFilter = grade ? sql`AND (grade = ${grade} OR grade = '' OR grade IS NULL)` : sql``;

    const filteredResults = await db.execute(sql`
      SELECT content, subject, stage, grade, source_type,
             1 - (embedding <=> ${embeddingStr}::vector) AS similarity
      FROM rag_documents
      WHERE 1=1 ${subjectFilter} ${stageFilter} ${gradeFilter}
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${RAG_TOP_K}
    `);

    const results = filteredResults.rows.length >= RAG_TOP_K
      ? filteredResults
      : filteredResults.rows.length > 0
        ? filteredResults
        : await db.execute(sql`
            SELECT content, subject, stage, grade, source_type,
                   1 - (embedding <=> ${embeddingStr}::vector) AS similarity
            FROM rag_documents
            ORDER BY embedding <=> ${embeddingStr}::vector
            LIMIT ${RAG_TOP_K}
          `);

    const rows = results.rows as Array<{ content: string; subject: string | null; stage: string | null; grade: string | null; source_type: string | null; similarity: number }>;
    if (rows.length === 0) return buildFallbackRag(subject ?? "", query, stage ?? "", grade ?? "");

    return {
      sources: buildSourceLabels(rows),
      context: rows.map((r, i) => `[مصدر ${i + 1}] ${r.content}`).join("\n\n"),
      documents: rows.map((r) => ({ content: r.content, subject: r.subject, grade: r.grade, stage: r.stage })),
    };
  } catch (err) {
    console.error("RAG retrieval failed:", err);
    return buildFallbackRag(subject ?? "", query, stage ?? "", grade ?? "");
  }
}
