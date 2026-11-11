import { describe, expect, it } from "vitest";
import {
  askMaterialsRequestSchema,
  materialIdSchema,
  modelAnswerSchema,
} from "./material-qa";

const validId = "86b858f7-ede6-4ccb-9ad4-e9a99f360134";

describe("materialIdSchema", () => {
  it("accepts a UUID", () => {
    expect(materialIdSchema.safeParse(validId).success).toBe(true);
  });

  it("rejects anything that is not a UUID", () => {
    expect(materialIdSchema.safeParse("1 or 1=1").success).toBe(false);
  });
});

describe("askMaterialsRequestSchema", () => {
  it("accepts a question with selected materials and trims it", () => {
    const result = askMaterialsRequestSchema.safeParse({
      question: "  What is regression testing?  ",
      materialIds: [validId],
    });

    expect(result.success).toBe(true);
    expect(result.data?.question).toBe("What is regression testing?");
  });

  it("rejects an empty question", () => {
    const result = askMaterialsRequestSchema.safeParse({
      question: "   ",
      materialIds: [validId],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a question that is too long", () => {
    const result = askMaterialsRequestSchema.safeParse({
      question: "a".repeat(501),
      materialIds: [validId],
    });

    expect(result.success).toBe(false);
  });

  it("requires at least one selected material", () => {
    const result = askMaterialsRequestSchema.safeParse({
      question: "What is regression testing?",
      materialIds: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects more than 10 selected materials", () => {
    const result = askMaterialsRequestSchema.safeParse({
      question: "What is regression testing?",
      materialIds: Array(11).fill(validId),
    });

    expect(result.success).toBe(false);
  });

  it("rejects material ids that are not UUIDs", () => {
    const result = askMaterialsRequestSchema.safeParse({
      question: "What is regression testing?",
      materialIds: ["not-an-id"],
    });

    expect(result.success).toBe(false);
  });
});

describe("modelAnswerSchema", () => {
  it("accepts an answer with citation numbers", () => {
    const result = modelAnswerSchema.safeParse({
      answerable: true,
      answer: "Regression testing re-runs existing tests after a change [1].",
      citations: [1],
    });

    expect(result.success).toBe(true);
  });

  it("rejects citations that are not whole numbers", () => {
    const result = modelAnswerSchema.safeParse({
      answerable: true,
      answer: "An answer.",
      citations: ["Chapter 3"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a response with missing fields", () => {
    expect(modelAnswerSchema.safeParse({ answer: "An answer." }).success).toBe(
      false,
    );
  });
});
