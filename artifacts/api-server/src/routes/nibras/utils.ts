/**
 * Allocates total minutes across weights proportionally, ensuring the sum equals total exactly.
 */
export function allocateMinutes(weights: number[], total: number): number[] {
  const weightSum = weights.reduce((s, w) => s + w, 0);
  if (weightSum <= 0) {
    const base = Math.floor(total / weights.length);
    const rem = total % weights.length;
    return weights.map((_, i) => base + (i < rem ? 1 : 0));
  }
  const result = weights.map(w => Math.round((w / weightSum) * total));
  const diff = total - result.reduce((s, v) => s + v, 0);
  result[result.length - 1] += diff;
  return result.map(v => Math.max(0, v));
}

/**
 * Normalizes the lesson plan's time distribution to ensure all durations
 * sum exactly to the session duration.
 */
export function normalizeTimeDistribution(lessonPlan: any, duration: number): any {
  if (!lessonPlan || typeof lessonPlan !== "object") return lessonPlan;

  const td = lessonPlan.timeDistribution;
  const hasTd = td && typeof td === "object";

  const rawIntro = hasTd ? Math.max(0, Number(td.introduction) || 0) : Math.round(duration * 0.10);
  const rawExplanation = hasTd ? Math.max(0, Number(td.explanation) || 0) : Math.round(duration * 0.33);
  const rawActivity = hasTd ? Math.max(0, Number(td.activity) || 0) : Math.round(duration * 0.47);
  const rawAssessment = hasTd ? Math.max(0, Number(td.assessment) || 0) : Math.round(duration * 0.10);

  const [intro, explanation, activity, assessment] = allocateMinutes(
    [rawIntro, rawExplanation, rawActivity, rawAssessment],
    duration,
  );

  lessonPlan.timeDistribution = { introduction: intro, explanation, activity, assessment };

  if (!Array.isArray(lessonPlan.activities)) {
    lessonPlan.activities = [];
  }

  if (lessonPlan.activities.length > 0) {
    const acts = lessonPlan.activities;
    const rawDurations = acts.map((a: any) => Math.max(0, Number(a.duration) || 0));
    const normalized = allocateMinutes(rawDurations, activity);
    lessonPlan.activities = acts.map((a: any, i: number) => ({ ...a, duration: normalized[i] }));
  }

  lessonPlan.duration = duration;
  return lessonPlan;
}
