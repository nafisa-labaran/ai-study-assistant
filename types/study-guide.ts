
import { z } from "zod";

export const studyGuideSchema = z.object({
  title: z.string().min(1),
  locale: z.string().min(2),
  summary: z.string().min(1),
  keyConcepts: z
    .array(
      z.object({
        name: z.string().min(1),
        explanation: z.string().min(1),
      }),
    )
    .min(1),
  practiceQuestions: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      }),
    )
    .min(1),
});

export type StudyGuide = z.infer<typeof studyGuideSchema>;
