
import { z } from "zod";
import { studyGuideSchema } from "./study-guide";

// 1. Search study materials
export const searchStudyMaterialsSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, "Search query must contain at least 2 characters.")
    .max(100, "Search query cannot exceed 100 characters.")
    .describe("The topic or keyword to search for in study materials."),
});

// 2. Save a generated study guide
export const saveStudyGuideSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must contain at least 3 characters.")
    .max(100, "Title cannot exceed 100 characters.")
    .describe("The title under which the study guide will be saved."),

  studyGuide: studyGuideSchema.describe(
    "The complete structured study guide to save.",
  ),
});

// 3. Create a revision task
export const createStudyTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Task title must contain at least 3 characters.")
    .max(100, "Task title cannot exceed 100 characters.")
    .describe("A short title for the revision task."),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters.")
    .optional()
    .describe("Optional details about what the student should revise."),

  dueDate: z
    .string()
    .date()
    .optional()
    .describe("Optional due date in YYYY-MM-DD format."),

  priority: z
    .enum(["low", "medium", "high"])
    .default("medium")
    .describe("The importance of the revision task."),
});

// Export inferred TypeScript types
export type SearchStudyMaterialsInput = z.infer<
  typeof searchStudyMaterialsSchema
>;

export type SaveStudyGuideInput = z.infer<
  typeof saveStudyGuideSchema
>;

export type CreateStudyTaskInput = z.infer<
  typeof createStudyTaskSchema
>;

// Define which tools require user approval
export const toolApprovalRequirements = {
  searchStudyMaterials: false,
  saveStudyGuide: true,
  createStudyTask: true,
} as const;
