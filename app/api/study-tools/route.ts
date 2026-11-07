
import { generateText, tool } from "ai";
import { google } from "@ai-sdk/google";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { createApprovalToken } from "../../../lib/tool-approval";
import {
  searchStudyMaterialsSchema,
  saveStudyGuideSchema,
  createStudyTaskSchema,
} from "../../../types/study-tools";

export const maxDuration = 30;

const studyTools = {
  searchStudyMaterials: tool({
    description:
      "Search for academic study materials matching a student's topic or keywords.",
    inputSchema: searchStudyMaterialsSchema,
  }),

  saveStudyGuide: tool({
    description:
      "Propose saving a generated study guide. This action requires the student's approval.",
    inputSchema: saveStudyGuideSchema,
  }),

  createStudyTask: tool({
    description:
      "Propose creating a revision task for the student. This action requires the student's approval.",
    inputSchema: createStudyTaskSchema,
  }),
};

export async function POST(request: Request) {
  try {
    const body: { message?: unknown } = await request.json();

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!message || message.length > 1000) {
      return Response.json(
        { error: "Enter a message of up to 1000 characters." },
        { status: 400 },
      );
    }

    const result = await generateText({
      model: google("gemini-3.5-flash-lite"),

      system: `
You are a university study assistant.

You can use the available tools to help students manage their study activities.

Follow these rules:
- Use searchStudyMaterials when a student wants to find study materials.
- Use saveStudyGuide when a student asks to save a study guide.
- Use createStudyTask when a student asks to create a revision task.
- Do not invent study materials or claim that an action has been completed.
- For saving or creating tasks, propose the action for the student to review.
- Do not call a tool when the student's request does not require one.
- If information needed for a tool is missing, ask the student for it instead.
`,

      prompt: message,
      tools: studyTools,
      toolChoice: "auto",
      maxOutputTokens: 1200,
      maxRetries: 2,
    });

    const processedToolCalls = await Promise.all(
      result.toolCalls.map(async (call) => {
        // Execute read-only study material searches immediately.
        if (call.toolName === "searchStudyMaterials") {
          const parsed = searchStudyMaterialsSchema.safeParse(call.input);

          if (!parsed.success) {
            return {
              ...call,
              result: {
                error: "The search query is invalid.",
                materials: [],
              },
            };
          }

          const query = parsed.data.query;
          const pattern = `%${query}%`;

          try {
            const [titleSearch, subjectSearch, contentSearch] =
              await Promise.all([
                supabaseAdmin
                  .from("study_materials")
                  .select("id, title, subject, content, created_at")
                  .ilike("title", pattern)
                  .limit(5),

                supabaseAdmin
                  .from("study_materials")
                  .select("id, title, subject, content, created_at")
                  .ilike("subject", pattern)
                  .limit(5),

                supabaseAdmin
                  .from("study_materials")
                  .select("id, title, subject, content, created_at")
                  .ilike("content", pattern)
                  .limit(5),
              ]);

            const searchError =
              titleSearch.error ||
              subjectSearch.error ||
              contentSearch.error;

            if (searchError) {
              throw searchError;
            }

            const allMaterials = [
              ...(titleSearch.data ?? []),
              ...(subjectSearch.data ?? []),
              ...(contentSearch.data ?? []),
            ];

            // Remove duplicate materials.
            const materials = allMaterials
              .filter(
                (material, index, all) =>
                  all.findIndex((item) => item.id === material.id) === index,
              )
              .slice(0, 5);

            await supabaseAdmin.from("tool_logs").insert({
              tool_name: "searchStudyMaterials",
              status: "success",
              input: { query },
              details: `Found ${materials.length} matching study materials.`,
            });

            return {
              ...call,
              result: {
                query,
                count: materials.length,
                materials,
              },
            };
          } catch (error) {
            console.error("Study material search failed:", error);

            await supabaseAdmin.from("tool_logs").insert({
              tool_name: "searchStudyMaterials",
              status: "failed",
              input: { query },
              details: "The study material search failed.",
            });

            return {
              ...call,
              result: {
                error: "Unable to search study materials right now.",
                materials: [],
              },
            };
          }
        }

        // Generate approval tokens for actions that need confirmation.
        if (
          call.toolName === "saveStudyGuide" ||
          call.toolName === "createStudyTask"
        ) {
          const approvalToken = createApprovalToken({
            toolName: call.toolName,
            input: call.input,
            expiresAt: Date.now() + 5 * 60 * 1000,
          });

          return {
            ...call,
            approvalToken,
          };
        }

        return call;
      }),
    );

    return Response.json({
      message: result.text,
      toolCalls: processedToolCalls,
    });
  } catch (error) {
    console.error("Study tool request failed:", error);

    return Response.json(
      {
        error: "Unable to process your request right now. Please try again.",
      },
      { status: 502 },
    );
  }
}
