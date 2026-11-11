
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

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

const primaryButton = `rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-ink)] disabled:opacity-50 ${focusRing}`;

// Link shown in the light page header, styled like the links on the home page.
const pageLink =
  "inline-flex rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900";

type StudyMaterial = {
  id: string;
  title: string;
  subject: string | null;
  content: string;
  created_at: string;
};

type SearchResult = {
  query?: string;
  count?: number;
  materials?: StudyMaterial[];
  error?: string;
};

type ProposedToolCall = {
  toolName: string;
  input?: unknown;
  approvalToken?: string;
  result?: SearchResult;
};

type ActionStatus = {
  state: "pending" | "approving" | "approved" | "rejected" | "failed";
  message?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getToolCalls(value: unknown): ProposedToolCall[] {
  if (!isRecord(value) || !Array.isArray(value.toolCalls)) {
    return [];
  }

  return value.toolCalls.filter(
    (item): item is ProposedToolCall =>
      isRecord(item) && typeof item.toolName === "string",
  );
}

function getActionTitle(toolName: string) {
  switch (toolName) {
    case "searchStudyMaterials":
      return "Search study materials";
    case "saveStudyGuide":
      return "Save study guide";
    case "createStudyTask":
      return "Create revision task";
    default:
      return toolName;
  }
}

export default function StudyToolsPage() {
  const [message, setMessage] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [proposals, setProposals] = useState<ProposedToolCall[]>([]);
  const [statuses, setStatuses] = useState<Record<number, ActionStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError("Enter a request for the study assistant.");
      return;
    }

    setLoading(true);
    setError("");
    setResponseMessage("");
    setProposals([]);
    setStatuses({});

    try {
      const response = await fetch("/api/study-tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmedMessage }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : "The request could not be processed.";

        throw new Error(errorMessage);
      }

      if (!isRecord(data)) {
        throw new Error("The server returned an invalid response.");
      }

      setResponseMessage(
        typeof data.message === "string" ? data.message : "",
      );

      const newProposals = getToolCalls(data);
      setProposals(newProposals);

      const initialStatuses: Record<number, ActionStatus> = {};

      newProposals.forEach((proposal, index) => {
        initialStatuses[index] = { state: "pending" };
      });

      setStatuses(initialStatuses);
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

  async function handleApprove(index: number) {
    const proposal = proposals[index];

    if (!proposal?.approvalToken) {
      setStatuses((current) => ({
        ...current,
        [index]: {
          state: "failed",
          message: "This proposal does not have a valid approval token.",
        },
      }));
      return;
    }

    setStatuses((current) => ({
      ...current,
      [index]: {
        state: "approving",
        message: "Processing your approval...",
      },
    }));

    try {
      const response = await fetch("/api/study-tools/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: proposal.approvalToken }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : "Approval could not be verified.";

        throw new Error(errorMessage);
      }

      const successMessage =
        isRecord(data) && typeof data.message === "string"
          ? data.message
          : "Action completed successfully.";

      setStatuses((current) => ({
        ...current,
        [index]: {
          state: "approved",
          message: successMessage,
        },
      }));
    } catch (err) {
      setStatuses((current) => ({
        ...current,
        [index]: {
          state: "failed",
          message:
            err instanceof Error
              ? err.message
              : "Something went wrong. Please try again.",
        },
      }));
    }
  }

  function handleReject(index: number) {
    setStatuses((current) => ({
      ...current,
      [index]: {
        state: "rejected",
        message: "You rejected this proposed action.",
      },
    }));
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-gray-900 sm:px-6">
      <header className="mx-auto mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold">Study Tools</h1>

        <p className="mt-2 text-gray-600">
          Find study materials, save study guides, or create revision tasks.
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

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <label
          htmlFor="study-request"
          className="font-medium"
        >
          What would you like to do?
        </label>

        <textarea
          id="study-request"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Example: Search for Requirements Engineering materials."
          maxLength={1000}
          rows={4}
          className={`w-full rounded-xl border border-[var(--line)] bg-[var(--user)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--muted)] ${focusRing}`}
        />

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-[var(--muted)]">
            {message.length}/1000 characters
          </span>

          <button
            type="submit"
            disabled={loading}
            className={`rounded-xl bg-[var(--accent)] px-5 py-3 font-medium text-[var(--accent-ink)] transition-opacity disabled:opacity-40 ${focusRing}`}
          >
            {loading ? "Processing..." : "Send request"}
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-[var(--danger-line)] bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger-text)]"
          >
            {error}
          </p>
        )}
      </form>

      {responseMessage && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">
            Assistant response
          </h2>

          <p className="whitespace-pre-wrap rounded-xl bg-[var(--user)] p-4 leading-7 text-[var(--text)]">
            {responseMessage}
          </p>
        </section>
      )}

      {proposals.length > 0 && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              Tool results and proposed actions
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Review search results or proposed actions below.
            </p>
          </div>

          {proposals.map((proposal, index) => {
            const status: ActionStatus =
              statuses[index] ?? { state: "pending" };

            const isReadOnly =
              proposal.toolName === "searchStudyMaterials";

            return (
              <article
                key={`${proposal.toolName}-${index}`}
                className="rounded-xl border border-[var(--line)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">
                    {getActionTitle(proposal.toolName)}
                  </h3>

                  <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                    {isReadOnly ? "Read-only search" : status.state}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-[var(--muted)]">
                    {isReadOnly ? "Search query" : "Proposed details"}
                  </p>

                  <pre className="overflow-x-auto rounded-lg bg-[var(--user)] p-4 text-xs leading-6 text-[var(--text)]">
                    {JSON.stringify(proposal.input ?? {}, null, 2)}
                  </pre>
                </div>

                {isReadOnly ? (
                  <div className="mt-5 space-y-4">
                    <h4 className="text-sm font-semibold">
                      Matching study materials
                    </h4>

                    {proposal.result?.error ? (
                      <p className="text-sm text-[var(--danger-text)]">
                        {proposal.result.error}
                      </p>
                    ) : proposal.result?.materials &&
                      proposal.result.materials.length > 0 ? (
                      <>
                        <p className="text-sm text-[var(--muted)]">
                          Found {proposal.result.count ?? 0} matching
                          material(s).
                        </p>

                        {proposal.result.materials.map((material) => (
                          <div
                            key={material.id}
                            className="rounded-lg border border-[var(--line)] p-4"
                          >
                            <h5 className="font-semibold">
                              {material.title}
                            </h5>

                            {material.subject && (
                              <p className="mt-1 text-xs font-medium text-[var(--accent)]">
                                {material.subject}
                              </p>
                            )}

                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">
                              {material.content}
                            </p>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="rounded-lg bg-[var(--user)] p-4 text-sm text-[var(--muted)]">
                        No matching study materials were found.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {status.message && (
                      <p
                        role="status"
                        className="mt-4 text-sm text-[var(--text)]"
                      >
                        {status.message}
                      </p>
                    )}

                    {status.state === "pending" && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleApprove(index)}
                          className={primaryButton}
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReject(index)}
                          className={ghostButton}
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {status.state === "approving" && (
                      <p className="mt-4 text-sm text-[var(--accent)]">
                        Processing your approval...
                      </p>
                    )}
                  </>
                )}
              </article>
            );
          })}

          <p className="rounded-xl border border-[var(--line)] p-3 text-sm text-[var(--muted)]">
            Searching study materials is read-only. Saving study guides
            and creating revision tasks require your approval.
          </p>
        </section>
      )}

      {!loading && responseMessage && proposals.length === 0 && (
        <p className="text-sm text-[var(--muted)]">
          No tool action was proposed for this request.
        </p>
      )}
      </div>
    </main>
  );
}
