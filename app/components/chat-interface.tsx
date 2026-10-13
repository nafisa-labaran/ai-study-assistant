"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";

/**
 * Design tokens. Every surface sets its own text colour from these, so the
 * component no longer inherits the page's foreground colour (the usual cause
 * of pale text on a light background). Change the values here to retheme.
 *
 * Contrast on --ink (#14161b):
 *   --text   #ecebe6  ~15:1
 *   --muted  #a3a7b0  ~7.5:1
 *   --accent #e3b866  ~10:1
 */
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

const feedbackButton = `${ghostButton} aria-pressed:border-[var(--accent)] aria-pressed:text-[var(--accent)]`;

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const {
    messages,
    sendMessage,
    status,
    stop,
    regenerate,
    error,
    clearError,
  } = useChat();

  const isBusy = status === "submitted" || status === "streaming";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = input.trim();
    if (!text || isBusy) return;

    clearError();
    setInput("");
    await sendMessage({ text });
  }

  async function copyMessage(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.alert("Copy failed. Please select and copy the text manually.");
    }
  }

  return (
    <section
      style={tokens}
      className="mx-auto flex w-full max-w-3xl flex-col gap-5 rounded-2xl bg-[var(--ink)] p-4 text-[var(--text)] sm:p-6"
    >
      <div
        aria-label="Conversation"
        aria-live="off"
        className="flex min-h-64 flex-col gap-6"
      >
        {messages.length === 0 && (
          <p className="my-auto text-center text-[var(--muted)]">
            What are you studying? Ask a question to get started.
          </p>
        )}

        {messages.map((message) => {
          const text = message.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("");

          if (!text && message.role !== "assistant") return null;

          if (message.role === "user") {
            return (
              <article
                key={message.id}
                className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-[var(--user)] px-4 py-3 text-[var(--text)]"
              >
                <p className="sr-only">You</p>
                <p className="whitespace-pre-wrap break-words">{text}</p>
              </article>
            );
          }

          return (
            <article
              key={message.id}
              className="max-w-[92%] self-start border-l-2 border-[var(--line)] pl-4 text-[var(--text)]"
            >
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-[var(--accent)]"
                />
                AI Study Assistant
              </p>

              <p className="whitespace-pre-wrap break-words font-serif text-[1.0625rem] leading-8 text-[var(--text)]">
                {text}
              </p>

              {text && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copyMessage(text)}
                    className={ghostButton}
                  >
                    Copy
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFeedback((previous) => ({
                        ...previous,
                        [message.id]: "Helpful",
                      }))
                    }
                    aria-pressed={feedback[message.id] === "Helpful"}
                    className={feedbackButton}
                  >
                    Helpful
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFeedback((previous) => ({
                        ...previous,
                        [message.id]: "Not helpful",
                      }))
                    }
                    aria-pressed={feedback[message.id] === "Not helpful"}
                    className={feedbackButton}
                  >
                    Not helpful
                  </button>
                </div>
              )}
            </article>
          );
        })}

        {status === "submitted" && (
          <p className="animate-pulse text-sm text-[var(--muted)] motion-reduce:animate-none">
            Preparing your answer…
          </p>
        )}

        {status === "streaming" && (
          <p className="animate-pulse text-sm text-[var(--muted)] motion-reduce:animate-none">
            Generating your answer…
          </p>
        )}
      </div>

      {/* Screen-reader announcements only; the visible indicators are above. */}
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {status === "submitted"
          ? "Your question has been sent."
          : status === "streaming"
            ? "The assistant is responding."
            : status === "ready"
              ? "The assistant is ready."
              : ""}
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-[var(--danger-line)] bg-[var(--danger-bg)] p-4 text-[var(--danger-text)]"
        >
          <p>Something went wrong. Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => void regenerate()}
            className={`mt-3 rounded-full border border-[var(--danger-line)] px-3 py-1.5 text-sm text-[var(--danger-text)] transition-colors hover:border-[var(--danger-text)] ${focusRing}`}
          >
            Retry answer
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="study-question" className="sr-only">
          Ask a study question
        </label>

        <input
          id="study-question"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask a study question..."
          disabled={isBusy}
          className={`min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--user)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--muted)] disabled:opacity-60 ${focusRing}`}
        />

        {isBusy ? (
          <button
            type="button"
            onClick={stop}
            className={`rounded-xl border border-[var(--muted)] px-5 py-3 text-[var(--text)] transition-colors hover:bg-[var(--user)] ${focusRing}`}
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className={`rounded-xl bg-[var(--accent)] px-5 py-3 font-medium text-[var(--accent-ink)] transition-opacity disabled:opacity-40 ${focusRing}`}
          >
            Send
          </button>
        )}
      </form>

      {!isBusy && messages.some((message) => message.role === "assistant") && (
        <button
          type="button"
          onClick={() => void regenerate()}
          className={`self-start ${ghostButton}`}
        >
          Regenerate last answer
        </button>
      )}
    </section>
  );
}