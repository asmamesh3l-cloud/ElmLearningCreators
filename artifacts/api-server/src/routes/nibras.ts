/**
 * Entry point for Nibras routes.
 * Implementation is split into focused modules under ./nibras/
 *
 * @see ./nibras/index.ts     - Route handlers
 * @see ./nibras/client.ts    - Nuha AI client configuration
 * @see ./nibras/prompts.ts   - System and user prompt templates
 * @see ./nibras/rag.ts       - RAG retrieval and database seeding
 * @see ./nibras/fallback.ts  - Offline fallback generators
 * @see ./nibras/utils.ts     - Time distribution utilities
 * @see ./nibras/curriculum-data.ts - Saudi curriculum data
 */
export { default } from "./nibras/index.js";
