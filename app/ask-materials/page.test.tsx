import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import AskMaterialsPage from "./page";

const materials = [
  {
    id: "86b858f7-ede6-4ccb-9ad4-e9a99f360134",
    title: "Introduction to Software Testing",
    subject: "Software Testing",
  },
  {
    id: "66f37d0a-4dfe-4766-98d3-b77223e567a8",
    title: "Software Architecture",
    subject: "Software Engineering",
  },
];

const answeredResponse = {
  status: "answered",
  answer: "Regression testing re-runs existing tests after a change [1].",
  citations: [
    {
      number: 1,
      passageId: `${materials[0].id}#5`,
      materialId: materials[0].id,
      materialTitle: "Introduction to Software Testing",
      heading: "Regression Testing and Automation",
      excerpt:
        "Regression testing means re-running existing tests after a change.",
    },
  ],
};

const sourceResponse = {
  material: {
    ...materials[0],
    passages: [
      {
        id: `${materials[0].id}#0`,
        index: 0,
        heading: "Overview",
        text: "Software testing is the process of evaluating software.",
      },
      {
        id: `${materials[0].id}#5`,
        index: 5,
        heading: "Regression Testing and Automation",
        text: "Regression testing means re-running existing tests after a change.",
      },
    ],
  },
};

let fetchMock: ReturnType<typeof vi.fn>;

function mockFetchResponse(body: unknown, ok = true) {
  fetchMock.mockResolvedValueOnce({
    ok,
    json: async () => body,
  } as Response);
}

// Renders the page and waits for the material list to appear.
async function renderWithMaterials() {
  mockFetchResponse({ materials });
  render(<AskMaterialsPage />);
  await screen.findByLabelText(/Introduction to Software Testing/);
}

function ask(question: string) {
  fireEvent.change(screen.getByLabelText("2. Ask a question"), {
    target: { value: question },
  });
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
}

describe("AskMaterialsPage", () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("lists the available study materials", async () => {
    await renderWithMaterials();

    expect(
      screen.getByRole("heading", { name: "Ask Your Materials" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Software Architecture/)).toBeInTheDocument();
    expect(screen.getByText("0 of 2 selected")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/materials");
  });

  it("shows an error when the materials cannot be loaded", async () => {
    mockFetchResponse(
      { error: "Unable to load study materials right now." },
      false,
    );
    render(<AskMaterialsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load study materials right now.",
    );
  });

  it("asks the student to select a material first", async () => {
    await renderWithMaterials();

    ask("What is regression testing?");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Select at least one study material.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("asks the student to enter a question", async () => {
    await renderWithMaterials();

    fireEvent.click(screen.getByLabelText(/Introduction to Software Testing/));
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter a question of at least 3 characters.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("selects and clears all materials", async () => {
    await renderWithMaterials();

    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    expect(screen.getByText("2 of 2 selected")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(screen.getByText("0 of 2 selected")).toBeInTheDocument();
  });

  it("sends the question with only the selected materials", async () => {
    await renderWithMaterials();
    mockFetchResponse(answeredResponse);

    fireEvent.click(screen.getByLabelText(/Introduction to Software Testing/));
    ask("  What is regression testing?  ");

    await screen.findByRole("heading", { name: "Answer" });

    const [url, options] = fetchMock.mock.calls[1];

    expect(url).toBe("/api/materials/ask");
    expect(JSON.parse(options.body)).toEqual({
      question: "What is regression testing?",
      materialIds: [materials[0].id],
    });
  });

  it("shows the answer with its citation and supporting excerpt", async () => {
    await renderWithMaterials();
    mockFetchResponse(answeredResponse);

    fireEvent.click(screen.getByLabelText(/Introduction to Software Testing/));
    ask("What is regression testing?");

    expect(
      await screen.findByText(/Regression testing re-runs existing tests/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Introduction to Software Testing — Regression Testing and Automation/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Regression testing means re-running existing tests after a change.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Citation 1:/ }),
    ).toBeInTheDocument();
  });

  it("explains when no relevant passages were found", async () => {
    await renderWithMaterials();
    mockFetchResponse({
      status: "no_relevant_passages",
      message: "No relevant passages were found in the selected materials.",
    });

    fireEvent.click(screen.getByLabelText(/Software Architecture/));
    ask("What is photosynthesis?");

    expect(
      await screen.findByRole("heading", { name: "No relevant passages found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No relevant passages were found in the selected materials.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Answer" })).toBeNull();
  });

  it("explains when the materials do not contain enough information", async () => {
    await renderWithMaterials();
    mockFetchResponse({
      status: "insufficient_information",
      message:
        "The selected materials do not contain enough information to answer this question.",
    });

    fireEvent.click(screen.getByLabelText(/Introduction to Software Testing/));
    ask("Which testing tool should I use?");

    expect(
      await screen.findByRole("heading", { name: "Not enough information" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sources" })).toBeNull();
  });

  it("shows an error when the question cannot be answered", async () => {
    await renderWithMaterials();
    mockFetchResponse(
      { error: "Unable to answer your question right now. Please try again." },
      false,
    );

    fireEvent.click(screen.getByLabelText(/Introduction to Software Testing/));
    ask("What is regression testing?");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to answer your question right now. Please try again.",
    );
  });

  it("opens the original source and highlights the cited passage", async () => {
    await renderWithMaterials();
    mockFetchResponse(answeredResponse);

    fireEvent.click(screen.getByLabelText(/Introduction to Software Testing/));
    ask("What is regression testing?");

    const viewButton = await screen.findByRole("button", {
      name: "View source for citation 1",
    });
    mockFetchResponse(sourceResponse);
    fireEvent.click(viewButton);

    const source = await screen.findByRole("region", {
      name: "Original source: Introduction to Software Testing",
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      `/api/materials/${materials[0].id}`,
    );
    expect(within(source).getByText("Overview")).toBeInTheDocument();

    const cited = within(source).getByText("Cited passage").parentElement;

    expect(cited).toHaveAttribute("data-cited", "true");
    expect(cited).toHaveTextContent("Regression Testing and Automation");

    fireEvent.click(screen.getByRole("button", { name: "Close source" }));
    expect(screen.queryByText("Cited passage")).toBeNull();
  });

  it("opens the source from a citation marker inside the answer", async () => {
    await renderWithMaterials();
    mockFetchResponse(answeredResponse);

    fireEvent.click(screen.getByLabelText(/Introduction to Software Testing/));
    ask("What is regression testing?");

    const marker = await screen.findByRole("button", { name: /^Citation 1:/ });
    mockFetchResponse(sourceResponse);
    fireEvent.click(marker);

    expect(await screen.findByText("Cited passage")).toBeInTheDocument();
  });

  it("shows an error when the source cannot be loaded", async () => {
    await renderWithMaterials();
    mockFetchResponse(answeredResponse);

    fireEvent.click(screen.getByLabelText(/Introduction to Software Testing/));
    ask("What is regression testing?");

    const button = await screen.findByRole("button", {
      name: "View source for citation 1",
    });
    mockFetchResponse(
      { error: "This study material could not be found." },
      false,
    );
    fireEvent.click(button);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This study material could not be found.",
    );
  });
});
