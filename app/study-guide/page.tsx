"use client";
import Link from "next/link";
import { useState } from "react";
import { studyGuideSchema, type StudyGuide } from "@/types/study-guide";
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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex text-sm font-medium text-blue-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        ← Back to AI Assistant
      </Link>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">AI Study Guide Generator</h1>
        <p className="mt-2 text-gray-600">
          Enter an academic topic to generate a summary, key concepts, and
          practice questions.
        </p>
      </header>

      <section className="rounded-xl border p-5">
        <label htmlFor="study-topic" className="mb-2 block font-medium">
          What would you like to study?
        </label>

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
          placeholder="e.g. Introduction to Software Engineering"
          className="w-full rounded-lg border px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="button"
          onClick={() => void generateGuide()}
          disabled={loading}
          className="mt-4 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Generating..." : "Generate Study Guide"}
        </button>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        {loading && (
          <p role="status" className="mt-4 text-sm text-gray-600">
            Creating your study guide. This may take a moment.
          </p>
        )}
      </section>

      {guide && (
        <article className="mt-8 space-y-6">
          <header>
            <h2 className="text-2xl font-bold">{guide.title}</h2>
            <p className="mt-1 text-sm text-gray-500">
              Language: {guide.locale}
            </p>
          </header>

          <section className="rounded-xl border p-5">
            <h3 className="text-xl font-semibold">Summary</h3>
            <p className="mt-3 whitespace-pre-wrap leading-7">
              {guide.summary}
            </p>
          </section>

          <section className="rounded-xl border p-5">
            <h3 className="text-xl font-semibold">Key Concepts</h3>
            <div className="mt-4 space-y-4">
              {guide.keyConcepts.map((concept, index) => (
                <div key={`${concept.name}-${index}`}>
                  <h4 className="font-semibold">
                    {index + 1}. {concept.name}
                  </h4>
                  <p className="mt-1 leading-7 text-gray-700">
                    {concept.explanation}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border p-5">
            <h3 className="text-xl font-semibold">Practice Questions</h3>
            <div className="mt-4 space-y-5">
              {guide.practiceQuestions.map((item, index) => (
                <div key={`${item.question}-${index}`}>
                  <h4 className="font-semibold">
                    {index + 1}. {item.question}
                  </h4>
                  <p className="mt-2 leading-7 text-gray-700">
                    <span className="font-medium">Answer: </span>
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
