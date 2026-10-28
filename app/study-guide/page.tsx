"use client";

import Link from "next/link";
import { useState } from "react";
import { studyGuideSchema, type StudyGuide } from "@/types/study-guide";

const tokens = {
  "--ink": "#14161b",
  "--user": "#262a35",
  "--line": "#2e323d",
  "--text": "#ecebe6",
  "--muted": "#a3a7b0",
  "--accent": "#e3b866",
  "--accent-ink": "#14161b",
  "--danger-bg": "#2b1a1c",
  "--danger-line": "#5a2c2f",
  "--danger-text": "#ffb3a7",
} as React.CSSProperties;

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

const ghostButton = `rounded-full border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:border-[var(--muted)] hover:text-[var(--text)] ${focusRing}`;

export default function StudyGuidePage() {
  const [topic, setTopic] = useState("");
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateGuide() {
    const trimmedTopic = topic.trim();

    if (!trimmedTopic) {
      setError("Please enter a topic to study.");
      return;
    }

    setLoading(true);
    setError("");
    setGuide(null);

    try {
      const response = await fetch("/api/study-guide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: trimmedTopic }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Unable to generate your study guide.",
        );
      }

      const result = studyGuideSchema.safeParse(data.studyGuide);

      if (!result.success) {
        console.error("Invalid study guide response:", result.error.issues);

        throw new Error(
          "The generated study guide had an unexpected format. Please try again.",
        );
      }

      setGuide(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={tokens}
      className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 bg-[var(--ink)] p-4 text-[var(--text)] sm:p-6"
    >
      <Link href="/" className={`self-start ${ghostButton}`}>
        ← Back to AI Assistant
      </Link>

      <header>
        <h1 className="text-3xl font-semibold">AI Study Guide Generator</h1>
        <p className="mt-2 text-[var(--muted)]">
          Enter an academic topic to generate a summary, key concepts, and
          practice questions.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <label htmlFor="study-topic" className="font-medium">
          What would you like to study?
        </label>

        <div className="flex gap-2">
          <input
            id="study-topic"
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !loading) {
                void generateGuide();
              }
            }}
            maxLength={200}
            disabled={loading}
            placeholder="e.g. Introduction to Software Engineering"
            className={`min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--user)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--muted)] disabled:opacity-60 ${focusRing}`}
          />

          <button
            type="button"
            onClick={() => void generateGuide()}
            disabled={loading || !topic.trim()}
            className={`rounded-xl bg-[var(--accent)] px-5 py-3 font-medium text-[var(--accent-ink)] transition-opacity disabled:opacity-40 ${focusRing}`}
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[var(--danger-line)] bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger-text)]"
          >
            {error}
          </div>
        )}

        {loading && (
          <p
            role="status"
            className="animate-pulse text-sm text-[var(--muted)] motion-reduce:animate-none"
          >
            Creating your study guide. This may take a moment.
          </p>
        )}
      </section>

      {guide && (
        <article className="flex flex-col gap-6 border-l-2 border-[var(--line)] pl-4">
          <header>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[var(--accent)]"
              />
              AI Study Assistant
            </p>
            <h2 className="text-2xl font-semibold">{guide.title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Language: {guide.locale}
            </p>
          </header>

          <section>
            <h3 className="text-lg font-semibold">Summary</h3>
            <p className="mt-3 whitespace-pre-wrap break-words font-serif text-[1.0625rem] leading-8">
              {guide.summary}
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold">Key Concepts</h3>
            <div className="mt-3 flex flex-col gap-3">
              {guide.keyConcepts.map((concept, index) => (
                <div
                  key={`${concept.name}-${index}`}
                  className="rounded-xl border border-[var(--line)] p-4"
                >
                  <h4 className="font-semibold">{concept.name}</h4>
                  <p className="mt-2 font-serif text-[1.0625rem] leading-8 text-[var(--text)]">
                    {concept.explanation}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold">Practice Questions</h3>
            <div className="mt-3 flex flex-col gap-3">
              {guide.practiceQuestions.map((item, index) => (
                <div
                  key={`${item.question}-${index}`}
                  className="rounded-xl border border-[var(--line)] bg-[var(--user)] p-4"
                >
                  <h4 className="font-semibold">
                    {index + 1}. {item.question}
                  </h4>
                  <p className="mt-3 font-serif text-[1.0625rem] leading-8">
                    <span className="font-sans text-sm font-medium text-[var(--accent)]">
                      Answer:{" "}
                    </span>
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </article>
      )}
    </main>
  );
}