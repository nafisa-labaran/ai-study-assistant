
import { describe, expect, it } from "vitest";
import {
  searchStudyMaterialsSchema,
  saveStudyGuideSchema,
  createStudyTaskSchema,
  toolApprovalRequirements,
} from "./study-tools";

describe("Study tool schemas", () => {
  it("accepts a valid material search query", () => {
    const result = searchStudyMaterialsSchema.safeParse({
      query: "Software testing",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a search query that is too short", () => {
    const result = searchStudyMaterialsSchema.safeParse({
      query: "a",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid revision task", () => {
    const result = createStudyTaskSchema.safeParse({
      title: "Revise software testing",
      description: "Review the different testing levels.",
      dueDate: "2026-11-14",
      priority: "high",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid due date", () => {
    const result = createStudyTaskSchema.safeParse({
      title: "Revise software testing",
      dueDate: "next Friday",
      priority: "medium",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid task priority", () => {
    const result = createStudyTaskSchema.safeParse({
      title: "Revise software testing",
      priority: "urgent",
    });

    expect(result.success).toBe(false);
  });

  it("requires approval for sensitive tools only", () => {
    expect(toolApprovalRequirements).toEqual({
      searchStudyMaterials: false,
      saveStudyGuide: true,
      createStudyTask: true,
    });
  });

  it("rejects a save request with an invalid study guide", () => {
    const result = saveStudyGuideSchema.safeParse({
      title: "My study guide",
      studyGuide: {
        title: "Software testing",
      },
    });

    expect(result.success).toBe(false);
  });
});
