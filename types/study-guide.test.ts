import { describe, expect, it } from "vitest";
import { studyGuideSchema } from "./study-guide";

const validGuide = {
  title: "Introduction to Software Engineering",
  locale: "en",
  summary:
    "Software engineering is a systematic approach to building software.",
  keyConcepts: [
    {
      name: "Requirements",
      explanation: "Requirements describe what a system should do.",
    },
  ],
  practiceQuestions: [
    {
      question: "What is software engineering?",
      answer: "A systematic approach to developing and maintaining software.",
    },
  ],
};

describe("studyGuideSchema", () => {
  it("accepts valid study-guide data", () => {
    const result = studyGuideSchema.safeParse(validGuide);

    expect(result.success).toBe(true);
  });

  it("rejects data with a missing required field", () => {
    const { summary, ...missingSummary } = validGuide;

    const result = studyGuideSchema.safeParse(missingSummary);

    expect(result.success).toBe(false);
  });

  it("rejects fields with incorrect data types", () => {
    const invalidGuide = {
      ...validGuide,
      title: 123,
    };

    const result = studyGuideSchema.safeParse(invalidGuide);

    expect(result.success).toBe(false);
  });

  it("removes unexpected fields from the parsed output", () => {
    const guideWithExtraField = {
      ...validGuide,
      unexpectedField: "This field is not in the schema",
    };

    const result = studyGuideSchema.safeParse(guideWithExtraField);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("unexpectedField");
    }
  });

  it("rejects empty key-concept and practice-question lists", () => {
    const emptyLists = {
      ...validGuide,
      keyConcepts: [],
      practiceQuestions: [],
    };

    const result = studyGuideSchema.safeParse(emptyLists);

    expect(result.success).toBe(false);
  });
});
