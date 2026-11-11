// Simple keyword retrieval for study materials.
//
// These functions are "pure": they take text in and give results back,
// without touching the database or Gemini. That keeps them easy to test.

export type MaterialForRetrieval = {
  id: string;
  title: string;
  content: string;
};

export type Passage = {
  /** Unique id made from the material id and the passage position, e.g. "abc#2". */
  id: string;
  materialId: string;
  materialTitle: string;
  /** Section heading, or an empty string if the passage has none. */
  heading: string;
  /** The passage text exactly as stored in the database. */
  text: string;
  /** Position of the passage inside its material, starting at 0. */
  index: number;
};

export type RetrievedPassage = Passage & {
  /** The question keywords that were found in this passage. */
  matchedTerms: string[];
};

// Very common words that say nothing about the topic of a question.
const STOP_WORDS = new Set([
  "a", "about", "all", "also", "an", "and", "any", "are", "as", "at", "be",
  "been", "between", "both", "but", "by", "can", "could", "define", "describe",
  "did", "do", "does", "each", "explain", "for", "from", "give", "had", "has",
  "have", "how", "i", "if", "in", "into", "is", "it", "its", "list", "me",
  "mean", "meant", "more", "most", "my", "name", "of", "on", "or", "our",
  "should", "some", "tell", "than", "that", "the", "their", "them", "there",
  "these", "they", "this", "those", "to", "use", "used", "using", "was", "we",
  "were", "what", "when", "where", "which", "who", "why", "will", "with",
  "would", "you", "your",
]);

/**
 * Reduces a word to a simple base form so that "tests" matches "test"
 * and "requirements" matches "requirement".
 */
function normaliseWord(word: string): string {
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }

  return word;
}

/** Splits text into lowercase, normalised words. */
function toWords(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).map(normaliseWord);
}

/**
 * Picks out the meaningful words in a question.
 * "What is boundary value analysis?" -> ["boundary", "value", "analysi"]
 */
export function extractKeywords(question: string): string[] {
  const keywords = (question.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
    .map(normaliseWord);

  return [...new Set(keywords)];
}

/**
 * Splits one material into passages.
 * Passages are separated by blank lines. If a passage starts with a short
 * line that is not a sentence, that line is treated as its heading.
 */
export function splitIntoPassages(material: MaterialForRetrieval): Passage[] {
  const blocks = material.content
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block.split("\n");
    const firstLine = lines[0].trim();

    const hasHeading =
      lines.length > 1 && firstLine.length <= 80 && !/[.?!:]$/.test(firstLine);

    return {
      id: `${material.id}#${index}`,
      materialId: material.id,
      materialTitle: material.title,
      heading: hasHeading ? firstLine : "",
      text: hasHeading ? lines.slice(1).join("\n").trim() : block,
      index,
    };
  });
}

/**
 * Finds the passages that best match a question.
 *
 * A passage is ranked by how many different question keywords it contains,
 * then by how often they appear. Passages with no matching keyword are
 * never returned, so an empty array means "nothing relevant was found".
 */
export function retrievePassages(
  question: string,
  materials: MaterialForRetrieval[],
  limit = 4,
): RetrievedPassage[] {
  const keywords = extractKeywords(question);

  if (keywords.length === 0) {
    return [];
  }

  const ranked = materials
    .flatMap(splitIntoPassages)
    .map((passage, order) => {
      const words = toWords(`${passage.heading} ${passage.text}`);
      const matchedTerms = keywords.filter((keyword) => words.includes(keyword));
      const occurrences = words.filter((word) => keywords.includes(word)).length;

      return { passage, matchedTerms, occurrences, order };
    })
    .filter((item) => item.matchedTerms.length > 0)
    .sort(
      (a, b) =>
        b.matchedTerms.length - a.matchedTerms.length ||
        b.occurrences - a.occurrences ||
        a.order - b.order,
    );

  return ranked.slice(0, limit).map((item) => ({
    ...item.passage,
    matchedTerms: item.matchedTerms,
  }));
}
