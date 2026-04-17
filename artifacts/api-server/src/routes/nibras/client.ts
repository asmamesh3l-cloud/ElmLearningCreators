import OpenAI from "openai";

export const nuhaClient = new OpenAI({
  baseURL: process.env.NUHA_BASE_URL || "https://elmodels.ngrok.app/v1",
  apiKey: process.env.NUHA_API_KEY || process.env.OPENAI_API_KEY || "demo-key",
  timeout: 60000,
  maxRetries: 0,
});

export const AI_MODEL = process.env.NUHA_MODEL || "nuha-2.0";
export const EMBEDDING_MODEL = process.env.NUHA_EMBEDDING_MODEL || "text-embedding-3-small";
export const RAG_TOP_K = 3;
export const EMBEDDING_DIM = 1536;
