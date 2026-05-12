import { z } from "zod";

// ---------- Industry ----------
export const IndustrySchema = z
  .object({
    id: z.string(),
    label: z.string(),
    tagline: z.string().optional().default(""),
    theme: z
      .object({
        accent: z.string().optional().default("#58a6ff"),
        accent2: z.string().optional().default("#7ee787"),
        bg: z.string().optional().default("#0e1117"),
      })
      .passthrough()
      .default({ accent: "#58a6ff", accent2: "#7ee787", bg: "#0e1117" }),
    language: z
      .object({
        scenarioWord: z.string().optional().default("scenario"),
        practiceWord: z.string().optional().default("practice"),
        peerWord: z.string().optional().default("peer"),
      })
      .passthrough()
      .default({}),
    homeEmphasis: z.array(z.string()).optional().default([]),
    exampleAlerts: z.array(z.string()).optional().default([]),
  })
  .passthrough();
export type Industry = z.infer<typeof IndustrySchema>;

// ---------- Learner ----------
export const LearnerSchema = z
  .object({
    learnerId: z.string(),
    name: z.string(),
    role: z.string().optional().default(""),
    industry: z.string(),
    experienceLevel: z.string().optional().default(""),
    yearsInRole: z.number().optional().default(0),
    certifications: z
      .array(
        z
          .object({
            id: z.string(),
            label: z.string(),
            expiresInDays: z.number().optional(),
          })
          .passthrough()
      )
      .optional()
      .default([]),
    preferences: z
      .object({
        theme: z.string().optional(),
        coachTone: z.string().optional(),
        mediaPreference: z.array(z.string()).optional().default([]),
      })
      .passthrough()
      .optional()
      .default({}),
    stats: z
      .object({
        weeklyMinutes: z.number().optional(),
        scenariosThisMonth: z.number().optional(),
        streakDays: z.number().optional(),
      })
      .passthrough()
      .optional()
      .default({}),
  })
  .passthrough();
export type Learner = z.infer<typeof LearnerSchema>;

// ---------- Course ----------
export const ConceptSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    mastery: z.number().optional(),
  })
  .passthrough();

export const LessonBlockSchema = z
  .object({
    type: z.string(),
  })
  .passthrough();

export const LessonSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    minutes: z.number().optional(),
    kicker: z.string().optional(),
    blocks: z.array(LessonBlockSchema).optional().default([]),
  })
  .passthrough();

export const CourseSchema = z
  .object({
    id: z.string(),
    industry: z.string(),
    title: z.string(),
    summary: z.string().optional().default(""),
    estMinutes: z.number().optional(),
    mandated: z.boolean().optional(),
    credibility: z.string().optional(),
    capabilities: z.array(z.string()).optional().default([]),
    concepts: z.array(ConceptSchema).optional().default([]),
    lessons: z.array(LessonSchema).optional().default([]),
  })
  .passthrough();
export type Course = z.infer<typeof CourseSchema>;

export const CoursesFileSchema = z.object({ courses: z.array(CourseSchema) });

// ---------- Scenario ----------
export const ScenarioOptionSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    outcome: z.enum(["good", "ok", "bad"]).optional(),
    feedback: z.string().optional(),
    insight: z.string().optional(),
  })
  .passthrough();

export const ScenarioStepSchema = z
  .object({
    id: z.string(),
    title: z.string().optional(),
    kicker: z.string().optional(),
    tension: z.string().optional(),
    prompt: z.string().optional(),
    coachHint: z.string().optional(),
    indicator: z.string().optional(),
    input: z.string().optional(),
    inputLabel: z.string().optional(),
    voicePrompt: z.string().optional(),
    modelAnswer: z.string().optional(),
    rubric: z.array(z.string()).optional(),
    options: z.array(ScenarioOptionSchema).optional(),
  })
  .passthrough();

export const ScenarioWelcomeSchema = z
  .object({
    kicker: z.string().optional(),
    title: z.string().optional(),
    body: z.string().optional(),
    highlight: z.string().optional(),
    reassurance: z.string().optional(),
    expectedOutcome: z.string().optional(),
  })
  .passthrough();

export const ScenarioSchema = z
  .object({
    id: z.string(),
    courseId: z.string(),
    industry: z.string(),
    title: z.string(),
    kicker: z.string().optional(),
    moduleLabel: z.string().optional(),
    outcomeType: z.string().optional(),
    estMinutes: z.number().optional(),
    concepts: z.array(z.string()).optional().default([]),
    tier: z.string().optional(),
    difficulty: z.string().optional(),
    topics: z.array(z.string()).optional().default([]),
    icon: z.string().optional(),
    status: z.string().optional(),
    featured: z.boolean().optional(),
    phaseHint: z.number().optional(),
    phaseContext: z.string().optional(),
    welcome: ScenarioWelcomeSchema.optional(),
    context: z.string().optional(),
    steps: z.array(ScenarioStepSchema).optional().default([]),
  })
  .passthrough();
export type Scenario = z.infer<typeof ScenarioSchema>;

export const ScenariosFileSchema = z.object({ scenarios: z.array(ScenarioSchema) });

// ---------- Mastery ----------
export const LearnerMasterySchema = z
  .object({
    courseProgress: z.record(z.any()).optional().default({}),
    concepts: z.record(z.number()).optional().default({}),
    saved: z.array(z.any()).optional().default([]),
    recentPractice: z.array(z.any()).optional().default([]),
  })
  .passthrough();

export const MasteryFileSchema = z.object({
  byLearner: z.record(LearnerMasterySchema),
});

// ---------- Coach script ----------
export const CoachEntrySchema = z
  .object({
    id: z.string(),
    when: z.string().optional(),
    match: z.string().optional(),
    text: z.string().optional(),
    threshold: z.number().optional(),
    thresholdDays: z.number().optional(),
    suggested: z.array(z.string()).optional().default([]),
    card: z.any().optional(),
  })
  .passthrough();

export const CoachScriptSchema = z
  .object({
    openers: z.array(CoachEntrySchema).optional().default([]),
    intents: z.array(CoachEntrySchema).optional().default([]),
  })
  .passthrough();

// ---------- Reference ----------
export const ReferenceItemSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    industry: z.string().optional(),
    kind: z.string().optional(),
    lastUpdated: z.string().optional(),
  })
  .passthrough();

export const ReferenceCategorySchema = z
  .object({
    id: z.string(),
    label: z.string(),
    items: z.array(ReferenceItemSchema).optional().default([]),
  })
  .passthrough();

export const ReferenceFileSchema = z.object({
  categories: z.array(ReferenceCategorySchema),
});
