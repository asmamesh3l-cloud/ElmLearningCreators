import { pgTable, serial, text, jsonb, customType } from "drizzle-orm/pg-core";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config?: Record<string, unknown>) {
    const dim = (config?.dim as number) ?? 1536;
    return `vector(${dim})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return value
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map(Number);
  },
});

export const ragDocumentsTable = pgTable("rag_documents", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dim: 1536 }).notNull(),
  subject: text("subject"),
  stage: text("stage"),
  grade: text("grade"),
  sourceType: text("source_type"),
  metadata: jsonb("metadata"),
});

export type RagDocument = typeof ragDocumentsTable.$inferSelect;
export type InsertRagDocument = typeof ragDocumentsTable.$inferInsert;
