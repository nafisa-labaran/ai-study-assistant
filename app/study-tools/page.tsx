
"use client";

import { FormEvent, useState } from "react";

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
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-12">
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium text-blue-600">
          AI Study Assistant
        </p>

        <h1 className="text-3xl font-bold tracking-tight">
          Study Tools
        </h1>

        <p className="mt-2 text-gray-600">
          Find study materials, save study guides, or create revision tasks.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-gray-200 p-5"
      >
        <label
          htmlFor="study-request"
          className="block text-sm font-semibold"
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
          className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500">
            {message.length}/1000 characters
          </span>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Processing..." : "Send request"}
          </button>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </form>

      {responseMessage && (
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-semibold">
            Assistant response
          </h2>

          <p className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">
            {responseMessage}
          </p>
        </section>
      )}

      {proposals.length > 0 && (
        <section className="mt-8 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              Tool results and proposed actions
            </h2>

            <p className="mt-1 text-sm text-gray-600">
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
                className="rounded-xl border border-gray-200 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">
                    {getActionTitle(proposal.toolName)}
                  </h3>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {isReadOnly ? "Read-only search" : status.state}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    {isReadOnly ? "Search query" : "Proposed details"}
                  </p>

                  <pre className="overflow-x-auto rounded-lg bg-gray-50 p-4 text-xs leading-6 text-gray-700">
                    {JSON.stringify(proposal.input ?? {}, null, 2)}
                  </pre>
                </div>

                {isReadOnly ? (
                  <div className="mt-5 space-y-4">
                    <h4 className="text-sm font-semibold">
                      Matching study materials
                    </h4>

                    {proposal.result?.error ? (
                      <p className="text-sm text-red-600">
                        {proposal.result.error}
                      </p>
                    ) : proposal.result?.materials &&
                      proposal.result.materials.length > 0 ? (
                      <>
                        <p className="text-sm text-gray-500">
                          Found {proposal.result.count ?? 0} matching
                          material(s).
                        </p>

                        {proposal.result.materials.map((material) => (
                          <div
                            key={material.id}
                            className="rounded-lg border border-gray-200 p-4"
                          >
                            <h5 className="font-semibold text-gray-900">
                              {material.title}
                            </h5>

                            {material.subject && (
                              <p className="mt-1 text-xs font-medium text-blue-600">
                                {material.subject}
                              </p>
                            )}

                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                              {material.content}
                            </p>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                        No matching study materials were found.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {status.message && (
                      <p
                        role="status"
                        className="mt-4 text-sm text-gray-700"
                      >
                        {status.message}
                      </p>
                    )}

                    {status.state === "pending" && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleApprove(index)}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReject(index)}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {status.state === "approving" && (
                      <p className="mt-4 text-sm text-blue-600">
                        Processing your approval...
                      </p>
                    )}
                  </>
                )}
              </article>
            );
          })}

          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Searching study materials is read-only. Saving study guides
            and creating revision tasks require your approval.
          </p>
        </section>
      )}

      {!loading && responseMessage && proposals.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">
          No tool action was proposed for this request.
        </p>
      )}
    </main>
  );
}



