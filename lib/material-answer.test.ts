import { describe, expect, it } from "vitest";
import {
  buildAnswerPrompt,
  buildAskResponse,
  INSUFFICIENT_INFORMATION_MESSAGE,
} from "./material-answer";
import type { RetrievedPassage } from "./retrieval";

const passages: RetrievedPassage[] = [
  {
    id: "testing#5",
    materialId: "testing",
    materialTitle: "Introduction to Software Testing",
    heading: "Regression Testing and Automation",
    text: "Regression testing means re-running existing tests after a change.",
    index: 5,
    matchedTerms: ["regression", "testing"],
  },
  {
    id: "testing#3",
    materialId: "testing",
    materialTitle: "Introduction to Software Testing",
    heading: "",
    text: "Unit testing checks individual components.",
    index: 3,
    matchedTerms: ["testing"],
  },
];

describe("buildAnswerPrompt", () => {
  it("numbers the passages and includes the question and sources", () => {
    const prompt = buildAnswerPrompt("What is regression testing?", passages);

    expect(prompt).toContain("Question: What is regression testing?");
    expect(prompt).toContain(
      "[1] Source: Introduction to Software Testing — Regression Testing and Automation",
    );
    expect(prompt).toContain("[2] Source: Introduction to Software Testing\n");
    expect(prompt).toContain(passages[1].text);
  });
});

describe("buildAskResponse", () => {
  it("returns the answer with citations copied from the passages", () => {
    const response = buildAskResponse(
      {
        answerable: true,
        answer: "Regression testing re-runs existing tests after a change [1].",
        citations: [1],
      },
      passages,
    );

    expect(response).toEqual({
      status: "answered",
      answer: "Regression testing re-runs existing tests after a change [1].",
      citations: [
        {
          number: 1,
          passageId: "testing#5",
          materialId: "testing",
          materialTitle: "Introduction to Software Testing",
          heading: "Regression Testing and Automation",
          excerpt: passages[0].text,
        },
      ],
    });
  });

  it("drops citation numbers that do not match a passage", () => {
    const response = buildAskResponse(
      {
        answerable: true,
        answer: "It re-runs tests [1]. It was invented in 1970 [7].",
        citations: [1, 7, 0, -2],
      },
      passages,
    );

    expect(response.status).toBe("answered");

    if (response.status === "answered") {
      expect(response.citations.map((citation) => citation.number)).toEqual([1]);
      expect(response.answer).toBe(
        "It re-runs tests [1]. It was invented in 1970.",
      );
    }
  });

  it("includes passages cited in the text but missing from the list", () => {
    const response = buildAskResponse(
      {
        answerable: true,
        answer: "It re-runs tests [1]. Unit tests check components [2].",
        citations: [1],
      },
      passages,
    );

    expect(response.status).toBe("answered");

    if (response.status === "answered") {
      expect(response.citations.map((citation) => citation.number)).toEqual([
        1, 2,
      ]);
    }
  });

  it("does not repeat a citation that is listed twice", () => {
    const response = buildAskResponse(
      { answerable: true, answer: "It re-runs tests [1].", citations: [1, 1] },
      passages,
    );

    expect(response.status).toBe("answered");

    if (response.status === "answered") {
      expect(response.citations).toHaveLength(1);
    }
  });

  it("reports insufficient information when the model cannot answer", () => {
    const response = buildAskResponse(
      { answerable: false, answer: "", citations: [] },
      passages,
    );

    expect(response).toEqual({
      status: "insufficient_information",
      message: INSUFFICIENT_INFORMATION_MESSAGE,
    });
  });

  it("does not show an answer that has no valid citation", () => {
    const response = buildAskResponse(
      {
        answerable: true,
        answer: "Regression testing was invented in 1970 [9].",
        citations: [9],
      },
      passages,
    );

    expect(response.status).toBe("insufficient_information");
  });

  it("treats an empty answer as insufficient information", () => {
    const response = buildAskResponse(
      { answerable: true, answer: "   ", citations: [1] },
      passages,
    );

    expect(response.status).toBe("insufficient_information");
  });
});
