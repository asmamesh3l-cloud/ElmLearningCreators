/**
 * Nibras API Routes
 * Exposes lesson plan generation, RAG retrieval, and chat endpoints
 * powered by the Nuha 2.0 engine (Elm Company).
 */

import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { GenerateLessonBody, ChatWithNuhaBody, ChatWithNuhaResponse, GetRagContextBody } from "@workspace/api-zod";
import { nuhaClient, AI_MODEL } from "./client.js";
import { CURRICULUM_DATA } from "./curriculum-data.js";
import { retrieveRagContext, seedRagDocuments } from "./rag.js";
import { generateFallbackLessonPlan, generateFallbackChatResponse } from "./fallback.js";
import { buildLessonSystemPrompt, buildLessonUserPrompt, buildChatSystemPrompt } from "./prompts.js";
import { normalizeTimeDistribution } from "./utils.js";

const router: IRouter = Router();

// Seed RAG database on startup
seedRagDocuments().catch(console.error);

// ── Helper: call Nuha with fallback ─────────────────────────────────────────

async function callNuha(systemPrompt: string, userPrompt: string, req: any): Promise<string> {
  try {
    const completion = await nuhaClient.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });
    return completion.choices[0]?.message?.content || "";
  } catch (err) {
    req.log.warn({ err }, "Nuha API call failed, using intelligent fallback generation");
    return generateFallbackLessonPlan(userPrompt);
  }
}

// ── GET /api/nibras/curriculum-options ──────────────────────────────────────

router.get("/nibras/curriculum-options", async (_req, res): Promise<void> => {
  res.json({ stages: CURRICULUM_DATA.stages });
});

// ── POST /api/nibras/rag-context ─────────────────────────────────────────────

router.post("/nibras/rag-context", async (req, res): Promise<void> => {
  const parsed = GetRagContextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", message: parsed.error.message });
    return;
  }
  const { subject, lessonTitle, stage = "", grade = "" } = parsed.data;
  const query = `${subject} ${lessonTitle} ${stage} ${grade}`;
  const ragResult = await retrieveRagContext(query, subject, stage ?? "", grade ?? "");
  res.json({ sources: ragResult.sources, context: ragResult.context, retrievedAt: new Date().toISOString() });
});

// ── POST /api/nibras/generate-lesson ─────────────────────────────────────────

router.post("/nibras/generate-lesson", async (req, res): Promise<void> => {
  const parsed = GenerateLessonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", message: parsed.error.message });
    return;
  }

  const { teacherName, stage, grade, subject, lessonTitle, duration = 45, learningOutcomes, studentLevel, classNature, learningNeeds } = parsed.data;

  const ragResult = await retrieveRagContext(`${subject} ${lessonTitle} ${stage} ${grade}`, subject, stage, grade);

  const systemPrompt = buildLessonSystemPrompt(duration);
  const userPrompt = buildLessonUserPrompt({ teacherName, stage, grade, subject, lessonTitle, duration, learningOutcomes, studentLevel, classNature, learningNeeds, ragContext: ragResult.context });

  req.log.info({ teacherName, subject, lessonTitle }, "Generating lesson plan with RAG");

  const rawResponse = await callNuha(systemPrompt, userPrompt, req);

  let lessonPlan;
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    lessonPlan = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
  } catch {
    req.log.warn("JSON parse failed, using fallback");
    lessonPlan = JSON.parse(generateFallbackLessonPlan(userPrompt));
  }

  lessonPlan = normalizeTimeDistribution(lessonPlan, duration);

  res.json({ lessonPlan, ragSources: ragResult.sources, generatedAt: new Date().toISOString() });
});

// ── POST /api/nibras/suggest-outcomes ────────────────────────────────────────

router.post("/nibras/suggest-outcomes", async (req, res): Promise<void> => {
  const { subject, grade, lessonTitle, stage } = req.body as {
    subject: string; grade: string; lessonTitle: string; stage: string;
  };
  if (!subject || !lessonTitle) {
    res.status(400).json({ error: "subject and lessonTitle are required" });
    return;
  }

  const systemPrompt = "أنت خبير تربوي سعودي متخصص في صياغة نواتج التعلم وفق تصنيف بلوم المعدّل. أجب دائماً بـ JSON فقط بدون أي نص إضافي.";
  const userPrompt = `اقترح 6 نواتج تعلم قابلة للقياس للدرس التالي:
المرحلة: ${stage || ""}، الصف: ${grade || ""}، المادة: ${subject}، الدرس: ${lessonTitle}

الشروط:
- كل ناتج يبدأ بفعل إجرائي من تصنيف بلوم (يُعرّف، يصف، يُطبّق، يحلل، يقارن، يُنشئ...)
- مختصر وواضح — جملة واحدة لكل ناتج
- متنوع بين مستويات: التذكر، الفهم، التطبيق، التحليل
- مناسب للمرحلة الدراسية

أجب بهذا الشكل الحرفي: {"outcomes":["...","...","...","...","...","..."]}`;

  let outcomes: string[];
  try {
    const completion = await nuhaClient.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 700,
    });
    const raw = completion.choices[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    outcomes = Array.isArray(parsed.outcomes) ? parsed.outcomes.slice(0, 6) : [];
  } catch {
    req.log.warn("suggest-outcomes: Nuha failed, using fallback");
    outcomes = [
      `يُعرّف الطالب المفاهيم الأساسية لدرس ${lessonTitle}`,
      `يصف الطالب مكونات ${lessonTitle} وخصائصها الرئيسية`,
      `يُطبّق الطالب ما تعلمه من ${lessonTitle} في مواقف جديدة`,
      `يُميّز الطالب بين مفاهيم ${lessonTitle} المختلفة`,
      `يُحلّل الطالب العلاقة بين عناصر ${lessonTitle}`,
      `يُقيّم الطالب أهمية ${lessonTitle} في الحياة اليومية`,
    ];
  }

  res.json({ outcomes });
});

// ── POST /api/nibras/chat ─────────────────────────────────────────────────────

router.post("/nibras/chat", async (req, res): Promise<void> => {
  const parsed = ChatWithNuhaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", message: parsed.error.message });
    return;
  }

  const { message, lessonContext, history = [] } = parsed.data;

  const ragQuery = lessonContext
    ? [message, lessonContext.subject, lessonContext.title, lessonContext.stage, lessonContext.grade, lessonContext.objectives?.join(" ") ?? "", lessonContext.mainContent ?? "", lessonContext.introduction ?? "", lessonContext.activities?.map((a) => `${a.name}: ${a.description}`).join(" ") ?? "", lessonContext.materials?.join(" ") ?? "", lessonContext.homework ?? ""].filter(Boolean).join(" ")
    : message;

  const ragResult = await retrieveRagContext(ragQuery, lessonContext?.subject, lessonContext?.stage, lessonContext?.grade);

  const systemPrompt = buildChatSystemPrompt(
    lessonContext ? { subject: lessonContext.subject, title: lessonContext.title, stage: lessonContext.stage, grade: lessonContext.grade } : undefined,
    ragResult.context,
  );

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...(history || []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ];

  let rawReply: string;
  try {
    const completion = await nuhaClient.chat.completions.create({
      model: AI_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });
    rawReply = completion.choices[0]?.message?.content || "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.";
  } catch {
    req.log.warn("Chat API failed, using fallback response");
    rawReply = generateFallbackChatResponse(message);
  }

  let reply = rawReply;
  let lessonPatch: Record<string, unknown> | undefined;

  const jsonMatches = rawReply.match(/\{[\s\S]*\}/g);
  if (jsonMatches) {
    for (const candidate of jsonMatches) {
      try {
        const parsed = JSON.parse(candidate);
        if (parsed && typeof parsed === "object" && typeof parsed.message === "string") {
          reply = parsed.message;
          if (parsed.lessonPatch && typeof parsed.lessonPatch === "object") {
            const validatedPatch = ChatWithNuhaResponse.shape.lessonPatch.safeParse(parsed.lessonPatch);
            if (validatedPatch.success && validatedPatch.data) {
              lessonPatch = validatedPatch.data as Record<string, unknown>;
            } else {
              req.log.warn({ err: validatedPatch.error }, "lessonPatch failed Zod validation, ignoring patch");
            }
          }
          break;
        }
      } catch {
        // Not valid JSON, try next match
      }
    }
  }

  res.json({ reply, ragSources: ragResult.sources, ...(lessonPatch ? { lessonPatch } : {}), timestamp: new Date().toISOString() });
});

export default router;
