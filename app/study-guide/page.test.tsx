import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import StudyGuidePage from "./page";

const validStudyGuide = {
  title: "Introduction to Software Engineering",
  locale: "en",
  summary: "Software engineering is the systematic development of software.",
  keyConcepts: [
    {
      name: "Requirements",
      explanation: "Requirements describe what a software system must do.",
    },
    {
      name: "Testing",
      explanation: "Testing helps identify defects in software.",
    },
  ],
  practiceQuestions: [
    {
      question: "What is software engineering?",
      answer:
        "It is a systematic approach to developing and maintaining software.",
    },
  ],
};

let fetchMock: ReturnType<typeof vi.fn>;

function mockFetchResponse(body: unknown, ok = true) {
  fetchMock.mockResolvedValueOnce({
    ok,
    json: async () => body,
  } as Response);
}

describe("StudyGuidePage", () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the page and topic input", () => {
    render(<StudyGuidePage />);

    expect(
      screen.getByRole("heading", { name: "AI Study Guide Generator" }),
    ).toBeTruthy();

    expect(screen.getByLabelText("What would you like to study?")).toBeTruthy();

    expect(
      screen.getByRole("button", { name: "Generate Study Guide" }),
    ).toBeTruthy();
  });

  it("shows an error when the topic is empty", async () => {
    render(<StudyGuidePage />);

    fireEvent.click(
      screen.getByRole("button", { name: "Generate Study Guide" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please enter a topic to study.",
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("displays the generated study guide after a successful response", async () => {
    mockFetchResponse({ studyGuide: validStudyGuide });

    render(<StudyGuidePage />);

    fireEvent.change(screen.getByLabelText("What would you like to study?"), {
      target: { value: "Introduction to Software Engineering" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Generate Study Guide" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Introduction to Software Engineering",
      }),
    ).toBeTruthy();

    expect(screen.getByText("Language: en")).toBeTruthy();
    expect(screen.getByText("Summary")).toBeTruthy();
    expect(
      screen.getByText(
        "Software engineering is the systematic development of software.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Key Concepts")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Requirements/ })).toBeTruthy();

    expect(screen.getByRole("heading", { name: /Testing/ })).toBeTruthy();
    expect(screen.getByText("Practice Questions")).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: /What is software engineering\?/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "It is a systematic approach to developing and maintaining software.",
      ),
    ).toBeTruthy();

    expect(fetchMock).toHaveBeenCalledWith("/api/study-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "Introduction to Software Engineering",
      }),
    });
  });

  it("shows loading feedback while waiting for the API", async () => {
    let resolveFetch!: (response: Response) => void;

    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );

    render(<StudyGuidePage />);

    fireEvent.change(screen.getByLabelText("What would you like to study?"), {
      target: { value: "Software testing" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Generate Study Guide" }),
    );

    expect(
      screen.getByRole("button", { name: "Generating..." }),
    ).toBeDisabled();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Creating your study guide.",
    );

    resolveFetch({
      ok: true,
      json: async () => ({ studyGuide: validStudyGuide }),
    } as Response);

    expect(
      await screen.findByRole("heading", {
        name: "Introduction to Software Engineering",
      }),
    ).toBeTruthy();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Generate Study Guide" }),
      ).toBeEnabled();
    });
  });

  it("displays the API error when generation fails", async () => {
    mockFetchResponse(
      { error: "Unable to generate a study guide right now." },
      false,
    );

    render(<StudyGuidePage />);

    fireEvent.change(screen.getByLabelText("What would you like to study?"), {
      target: { value: "Software testing" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Generate Study Guide" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to generate a study guide right now.",
    );
  });

  it("rejects an invalid study-guide response", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockFetchResponse({
      studyGuide: {
        title: "Incomplete guide",
        locale: "en",
      },
    });

    render(<StudyGuidePage />);

    fireEvent.change(screen.getByLabelText("What would you like to study?"), {
      target: { value: "Software testing" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Generate Study Guide" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The generated study guide had an unexpected format. Please try again.",
    );

    expect(
      screen.queryByRole("heading", { name: "Incomplete guide" }),
    ).toBeNull();

    expect(consoleError).toHaveBeenCalled();
  });

  it("renders valid data even when the response contains unexpected fields", async () => {
    mockFetchResponse({
      studyGuide: {
        ...validStudyGuide,
        unexpectedField: "This field should not affect the UI.",
      },
    });

    render(<StudyGuidePage />);

    fireEvent.change(screen.getByLabelText("What would you like to study?"), {
      target: { value: "Software testing" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Generate Study Guide" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Introduction to Software Engineering",
      }),
    ).toBeTruthy();

    expect(
      screen.queryByText("This field should not affect the UI."),
    ).toBeNull();
  });

  it("allows the user to retry after a failed request", async () => {
    mockFetchResponse({ error: "Temporary server error." }, false);
    mockFetchResponse({ studyGuide: validStudyGuide });

    render(<StudyGuidePage />);

    fireEvent.change(screen.getByLabelText("What would you like to study?"), {
      target: { value: "Software testing" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Generate Study Guide" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Temporary server error.",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Generate Study Guide" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Introduction to Software Engineering",
      }),
    ).toBeTruthy();

    expect(screen.queryByRole("alert")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
