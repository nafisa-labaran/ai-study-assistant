import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { retrievePassages } from "../../../../lib/retrieval";
import {
  ANSWER_SYSTEM_PROMPT,
  NO_RELEVANT_PASSAGES_MESSAGE,
  buildAnswerPrompt,
  buildAskResponse,
} from "../../../../lib/material-answer";
import {
  askMaterialsRequestSchema,
  modelAnswerSchema,
  type AskMaterialsResponse,
} from "../../../../types/material-qa";

export const maxDuration = 30;

// Records each question in the existing tool_logs table.
async function logQuestion(
  status: "success" | "failed",
  input: { question: string; materialIds: string[] },
  details: string,
) {
  const { error } = await supabaseAdmin.from("tool_logs").insert({
    tool_name: "askStudyMaterials",
    status,
    input,
    details,
  });

  if (error) {
    console.error("Logging the materials question failed:", error);
  }
}

export async function POST(request: Request) {
  // 1. Check the request.
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The request is invalid." }, { status: 400 });
  }

  const parsed = askMaterialsRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "The request is invalid." },
      { status: 400 },
    );
  }

  const question = parsed.data.question;
  const materialIds = [...new Set(parsed.data.materialIds)];
  const logInput = { question, materialIds };

  try {
    // 2. Fetch only the materials the student selected.
    const { data: materials, error } = await supabaseAdmin
      .from("study_materials")
      .select("id, title, content")
      .in("id", materialIds);

    if (error) {
      throw error;
    }

    if (!materials || materials.length === 0) {
      return Response.json(
        { error: "The selected study materials could not be found." },
        { status: 404 },
      );
    }

    // 3. Retrieve the most relevant passages.
    const passages = retrievePassages(question, materials);

    if (passages.length === 0) {
      // Nothing matched, so Gemini is not called at all.
      await logQuestion("success", logInput, "No relevant passages were found.");

      const response: AskMaterialsResponse = {
        status: "no_relevant_passages",
        message: NO_RELEVANT_PASSAGES_MESSAGE,
      };

      return Response.json(response);
    }

    // 4. Ask Gemini to answer using only those passages.
    const { output } = await generateText({
      model: google("gemini-3.5-flash-lite"),
      output: Output.object({
        schema: modelAnswerSchema,
        name: "material_answer",
        description:
          "An answer based only on the numbered passages, with the passage numbers used.",
      }),
      system: ANSWER_SYSTEM_PROMPT,
      prompt: buildAnswerPrompt(question, passages),
      maxOutputTokens: 800,
      maxRetries: 2,
    });

    if (!output) {
      throw new Error("Gemini returned no answer.");
    }

    // 5. Check the citations and build the response.
    const response = buildAskResponse(output, passages);

    await logQuestion(
      "success",
      logInput,
      response.status === "answered"
        ? `Answered with ${response.citations.length} citation(s) from ${passages.length} retrieved passage(s).`
        : `Retrieved ${passages.length} passage(s), but they did not contain enough information.`,
    );

    return Response.json(response);
  } catch (error) {
    console.error("Materials question failed:", error);

    await logQuestion("failed", logInput, "The question could not be answered.");

    return Response.json(
      { error: "Unable to answer your question right now. Please try again." },
      { status: 502 },
    );
  }
}
