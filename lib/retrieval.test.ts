import { describe, expect, it } from "vitest";
import {
  extractKeywords,
  retrievePassages,
  splitIntoPassages,
  type MaterialForRetrieval,
} from "./retrieval";

const testing: MaterialForRetrieval = {
  id: "testing",
  title: "Introduction to Software Testing",
  content: [
    "Overview\nSoftware testing is the process of evaluating software to identify defects.",
    "Levels of Testing\nUnit testing checks individual components. Integration testing checks that components work together.",
    "Black-Box and White-Box Testing\nBoundary value analysis tests values at the edges of input groups.",
  ].join("\n\n"),
};

const architecture: MaterialForRetrieval = {
  id: "architecture",
  title: "Software Architecture",
  content: [
    "Overview\nSoftware architecture describes the high-level structure of a software system.",
    "Architectural Styles\nIn a layered architecture, components are arranged in layers.",
  ].join("\n\n"),
};

describe("extractKeywords", () => {
  it("removes common words and punctuation", () => {
    expect(extractKeywords("What is boundary value analysis?")).toEqual([
      "boundary",
      "value",
      "analysi",
    ]);
  });

  it("treats singular and plural words as the same keyword", () => {
    expect(extractKeywords("tests test")).toEqual(["test"]);
  });

  it("returns nothing when the question has no meaningful words", () => {
    expect(extractKeywords("What is it?")).toEqual([]);
  });
});

describe("splitIntoPassages", () => {
  it("creates one passage per section with its heading", () => {
    const passages = splitIntoPassages(testing);

    expect(passages).toHaveLength(3);
    expect(passages[1]).toMatchObject({
      id: "testing#1",
      materialId: "testing",
      materialTitle: "Introduction to Software Testing",
      heading: "Levels of Testing",
      index: 1,
    });
    expect(passages[1].text).toMatch(/^Unit testing checks/);
  });

  it("keeps a single-sentence material as one passage without a heading", () => {
    const passages = splitIntoPassages({
      id: "short",
      title: "Short",
      content: "Software testing identifies defects.",
    });

    expect(passages).toEqual([
      {
        id: "short#0",
        materialId: "short",
        materialTitle: "Short",
        heading: "",
        text: "Software testing identifies defects.",
        index: 0,
      },
    ]);
  });

  it("handles Windows line endings and extra blank lines", () => {
    const passages = splitIntoPassages({
      id: "m",
      title: "M",
      content: "First Heading\r\nFirst text.\r\n\r\n\r\nSecond Heading\r\nSecond text.",
    });

    expect(passages.map((passage) => passage.heading)).toEqual([
      "First Heading",
      "Second Heading",
    ]);
  });
});

describe("retrievePassages", () => {
  it("returns the passage that best matches the question first", () => {
    const results = retrievePassages("What is boundary value analysis?", [
      testing,
      architecture,
    ]);

    expect(results[0].id).toBe("testing#2");
    expect(results[0].matchedTerms).toEqual(["boundary", "value", "analysi"]);
  });

  it("can return passages from more than one material", () => {
    const results = retrievePassages("How are components organised?", [
      testing,
      architecture,
    ]);

    const materialIds = new Set(results.map((passage) => passage.materialId));

    expect(materialIds).toEqual(new Set(["testing", "architecture"]));
  });

  it("only searches the materials it is given", () => {
    const results = retrievePassages("What is boundary value analysis?", [
      architecture,
    ]);

    expect(results).toEqual([]);
  });

  it("returns nothing when no passage matches", () => {
    expect(
      retrievePassages("What is photosynthesis?", [testing, architecture]),
    ).toEqual([]);
  });

  it("returns nothing when the question has no keywords", () => {
    expect(retrievePassages("What is it?", [testing])).toEqual([]);
  });

  it("respects the passage limit", () => {
    const results = retrievePassages(
      "software testing components",
      [testing, architecture],
      2,
    );

    expect(results).toHaveLength(2);
  });

  it("returns passage text exactly as stored", () => {
    const [first] = retrievePassages("layered architecture", [architecture]);

    expect(architecture.content).toContain(first.text);
  });
});
