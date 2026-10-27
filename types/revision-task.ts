
import { z } from "zod";

export const revisionTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Task title must contain at least 3 characters.")
      .max(120, "Task title must not exceed 120 characters."),

    description: z
      .string()
      .trim()
      .min(1, "Task description is required.")
      .max(500, "Task description must not exceed 500 characters."),

    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.")
      .refine((value) => {
        const date = new Date(`${value}T00:00:00.000Z`);

        return (
          !Number.isNaN(date.getTime()) &&
          date.toISOString().slice(0, 10) === value
        );
      }, "Enter a valid calendar date."),
  })
  .strict();

export const createdRevisionTaskSchema = revisionTaskSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export type RevisionTask = z.infer<typeof revisionTaskSchema>;

export type CreatedRevisionTask = z.infer<
  typeof createdRevisionTaskSchema
>;
