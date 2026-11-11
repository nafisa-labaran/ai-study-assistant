"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type {
  AskMaterialsResponse,
  Citation,
  MaterialSource,
  MaterialSummary,
} from "@/types/material-qa";

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

// Link shown in the light page header, styled like the links on the home page.
const pageLink =
  "inline-flex rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900";

const errorBox =
  "rounded-xl border border-[var(--danger-line)] bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger-text)]";

// The source currently open in the viewer, and which passage to highlight.
type OpenSource = {
  material: MaterialSource;
  passageId: string;
};

function getErrorMessage(data: unknown, fallback: string) {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return fallback;
}

function citationLabel(citation: Citation) {
  return citation.heading
    ? `${citation.materialTitle} — ${citation.heading}`
    : citation.materialTitle;
}

export default function AskMaterialsPage() {
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [question, setQuestion] = useState("");

  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AskMaterialsResponse | null>(null);

  const [openSource, setOpenSource] = useState<OpenSource | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState("");

  const citedPassageRef = useRef<HTMLDivElement | null>(null);

  // Load the list of materials when the page opens.
  useEffect(() => {
    let cancelled = false;

    async function loadMaterials() {
      try {
        const response = await fetch("/api/materials");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            getErrorMessage(data, "Unable to load study materials."),
          );
        }

        if (!cancelled) {
          setMaterials(Array.isArray(data.materials) ? data.materials : []);
        }
      } catch (err) {
        if (!cancelled) {
          setMaterialsError(
            err instanceof Error
              ? err.message
              : "Unable to load study materials.",
          );
        }
      } finally {
        if (!cancelled) {
          setMaterialsLoading(false);
        }
      }
    }

    void loadMaterials();

    return () => {
      cancelled = true;
    };
  }, []);

  // When a source opens, bring the cited passage into view.
  useEffect(() => {
    citedPassageRef.current?.scrollIntoView?.({
      behavior: "smooth",
      block: "center",
    });
  }, [openSource]);

  function toggleMaterial(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (selectedIds.length === 0) {
      setError("Select at least one study material.");
      return;
    }

    if (trimmedQuestion.length < 3) {
      setError("Enter a question of at least 3 characters.");
      return;
    }

    setAsking(true);
    setError("");
    setResult(null);
    setOpenSource(null);
    setSourceError("");

    try {
      const response = await fetch("/api/materials/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmedQuestion,
          materialIds: selectedIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to answer your question."),
        );
      }

      setResult(data as AskMaterialsResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setAsking(false);
    }
  }

  // Load the original material behind a citation.
  async function viewSource(citation: Citation) {
    setSourceLoading(true);
    setSourceError("");
    setOpenSource(null);

    try {
      const response = await fetch(`/api/materials/${citation.materialId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to load this source."));
      }

      setOpenSource({
        material: data.material as MaterialSource,
        passageId: citation.passageId,
      });
    } catch (err) {
      setSourceError(
        err instanceof Error ? err.message : "Unable to load this source.",
      );
    } finally {
      setSourceLoading(false);
    }
  }

  // Shows the answer text, turning each [n] marker into a clickable citation.
  function renderAnswer(answer: string, citations: Citation[]) {
    return answer.split(/(\[\d+\])/).map((part, index) => {
      const match = part.match(/^\[(\d+)\]$/);
      const citation = match
        ? citations.find((item) => item.number === Number(match[1]))
        : undefined;

      if (!citation) {
        return <span key={index}>{part}</span>;
      }

      return (
        <button
          key={index}
          type="button"
          onClick={() => void viewSource(citation)}
          aria-label={`Citation ${citation.number}: ${citationLabel(citation)}`}
          className={`mx-0.5 rounded px-1 font-sans text-sm font-semibold text-[var(--accent)] underline-offset-2 hover:underline ${focusRing}`}
        >
          [{citation.number}]
        </button>
      );
    });
  }

  const allSelected =
    materials.length > 0 && selectedIds.length === materials.length;

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-gray-900 sm:px-6">
      <header className="mx-auto mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold">Ask Your Materials</h1>
        <p className="mt-2 text-gray-600">
          Select study materials and ask a question. Answers use only the
          selected materials and show the passages they are based on.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/" className={pageLink}>
            ← Back to AI Assistant
          </Link>
        </div>
      </header>

      <div
        style={tokens}
        className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-2xl bg-[var(--ink)] p-4 text-[var(--text)] sm:p-6"
      >

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <fieldset className="rounded-xl border border-[var(--line)] p-4">
          <legend className="px-1 font-medium">1. Select study materials</legend>

          {materialsLoading && (
            <p role="status" className="text-sm text-[var(--muted)]">
              Loading study materials…
            </p>
          )}

          {materialsError && (
            <p role="alert" className={errorBox}>
              {materialsError}
            </p>
          )}

          {!materialsLoading && !materialsError && materials.length === 0 && (
            <p className="text-sm text-[var(--muted)]">
              No study materials are available yet.
            </p>
          )}

          {materials.length > 0 && (
            <>
              <ul className="flex flex-col gap-2">
                {materials.map((material) => (
                  <li key={material.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-[var(--user)]">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(material.id)}
                        onChange={() => toggleMaterial(material.id)}
                        disabled={asking}
                        className="mt-1 h-4 w-4 accent-[var(--accent)]"
                      />
                      <span>
                        <span className="block">{material.title}</span>
                        {material.subject && (
                          <span className="block text-sm text-[var(--muted)]">
                            {material.subject}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={asking}
                  onClick={() =>
                    setSelectedIds(
                      allSelected ? [] : materials.map((item) => item.id),
                    )
                  }
                  className={ghostButton}
                >
                  {allSelected ? "Clear selection" : "Select all"}
                </button>

                <p className="text-sm text-[var(--muted)]">
                  {selectedIds.length} of {materials.length} selected
                </p>
              </div>
            </>
          )}
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="material-question" className="font-medium">
            2. Ask a question
          </label>

          <div className="flex gap-2">
            <input
              id="material-question"
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={500}
              disabled={asking}
              placeholder="e.g. What is regression testing?"
              className={`min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--user)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--muted)] disabled:opacity-60 ${focusRing}`}
            />

            <button
              type="submit"
              disabled={asking}
              className={`rounded-xl bg-[var(--accent)] px-5 py-3 font-medium text-[var(--accent-ink)] transition-opacity disabled:opacity-40 ${focusRing}`}
            >
              {asking ? "Searching…" : "Ask"}
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className={errorBox}>
            {error}
          </div>
        )}

        {asking && (
          <p
            role="status"
            className="animate-pulse text-sm text-[var(--muted)] motion-reduce:animate-none"
          >
            Searching your materials and preparing an answer…
          </p>
        )}
      </form>

      {result && result.status !== "answered" && (
        <section
          role="status"
          className="rounded-xl border border-[var(--line)] bg-[var(--user)] p-4"
        >
          <h2 className="font-semibold">
            {result.status === "no_relevant_passages"
              ? "No relevant passages found"
              : "Not enough information"}
          </h2>
          <p className="mt-2 text-[var(--muted)]">{result.message}</p>
        </section>
      )}

      {result && result.status === "answered" && (
        <article className="flex flex-col gap-6 border-l-2 border-[var(--line)] pl-4">
          <section>
            <h2 className="text-lg font-semibold">Answer</h2>
            <p className="mt-3 whitespace-pre-wrap break-words font-serif text-[1.0625rem] leading-8">
              {renderAnswer(result.answer, result.citations)}
            </p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              This answer is based only on the passages cited below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Sources</h2>

            <ol className="mt-3 flex flex-col gap-3">
              {result.citations.map((citation) => (
                <li
                  key={citation.passageId}
                  className="rounded-xl border border-[var(--line)] p-4"
                >
                  <h3 className="font-semibold">
                    <span className="text-[var(--accent)]">
                      [{citation.number}]
                    </span>{" "}
                    {citationLabel(citation)}
                  </h3>

                  <blockquote className="mt-2 border-l-2 border-[var(--line)] pl-3 text-sm leading-6 text-[var(--muted)]">
                    {citation.excerpt}
                  </blockquote>

                  <button
                    type="button"
                    onClick={() => void viewSource(citation)}
                    aria-label={`View source for citation ${citation.number}`}
                    className={`mt-3 ${ghostButton}`}
                  >
                    View in original source
                  </button>
                </li>
              ))}
            </ol>
          </section>
        </article>
      )}

      {sourceLoading && (
        <p role="status" className="text-sm text-[var(--muted)]">
          Loading the original source…
        </p>
      )}

      {sourceError && (
        <div role="alert" className={errorBox}>
          {sourceError}
        </div>
      )}

      {openSource && (
        <section
          aria-label={`Original source: ${openSource.material.title}`}
          className="rounded-xl border border-[var(--accent)]/60 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                Original source
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                {openSource.material.title}
              </h2>
              {openSource.material.subject && (
                <p className="text-sm text-[var(--muted)]">
                  {openSource.material.subject}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpenSource(null)}
              className={ghostButton}
            >
              Close source
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {openSource.material.passages.map((passage) => {
              const isCited = passage.id === openSource.passageId;

              return (
                <div
                  key={passage.id}
                  ref={isCited ? citedPassageRef : undefined}
                  data-cited={isCited ? "true" : undefined}
                  className={
                    isCited
                      ? "rounded-lg border border-[var(--accent)] bg-[var(--user)] p-3"
                      : "rounded-lg border border-transparent p-3"
                  }
                >
                  {isCited && (
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                      Cited passage
                    </p>
                  )}

                  {passage.heading && (
                    <h3 className="font-semibold">{passage.heading}</h3>
                  )}

                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                    {passage.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
      </div>
    </main>
  );
}
