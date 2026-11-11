import { z } from "zod";

// The id of one study material (a UUID from the study_materials table).
export const materialIdSchema = z.string().uuid("Invalid study material id.");

// What the browser sends when a student asks a question.
export const askMaterialsRequestSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, "Question must contain at least 3 characters.")
    .max(500, "Question cannot exceed 500 characters."),

  materialIds: z
    .array(materialIdSchema)
    .min(1, "Select at least one study material.")
    .max(10, "Select no more than 10 study materials."),
});

// What Gemini must return. Citations are passage numbers (1, 2, 3...)
// that the server later checks against the passages it actually sent.
export const modelAnswerSchema = z.object({
  answerable: z
    .boolean()
    .describe(
      "True only if the numbered passages contain enough information to answer the question.",
    ),

  answer: z
    .string()
    .describe(
      "The answer, written using only the numbered passages. Empty if answerable is false.",
    ),

  citations: z
    .array(z.number().int())
    .describe("The numbers of the passages that support the answer."),
});

export type AskMaterialsRequest = z.infer<typeof askMaterialsRequestSchema>;
export type ModelAnswer = z.infer<typeof modelAnswerSchema>;

// A material as shown in the selection list (no content).
export type MaterialSummary = {
  id: string;
  title: string;
  subject: string | null;
};

// One section of a material, as shown in the source viewer.
export type MaterialPassage = {
  id: string;
  index: number;
  heading: string;
  text: string;
};

// A full material, as shown in the source viewer.
export type MaterialSource = MaterialSummary & {
  passages: MaterialPassage[];
};

// A citation shown beside an answer. The excerpt is copied from the
// database by the server, never written by the AI.
export type Citation = {
  number: number;
  passageId: string;
  materialId: string;
  materialTitle: string;
  heading: string;
  excerpt: string;
};

// The three possible outcomes of asking a question.
export type AskMaterialsResponse =
  | { status: "answered"; answer: string; citations: Citation[] }
  | { status: "no_relevant_passages"; message: string }
  | { status: "insufficient_information"; message: string };
