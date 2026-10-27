import { convertToModelMessages, streamText, tool, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import {
  createdRevisionTaskSchema,
  revisionTaskSchema,
} from "../../../types/revision-task";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body: { messages?: UIMessage[] } = await request.json();
    const messages = body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Please send a message to begin." },
        { status: 400 },
      );
    }

    if (
      messages.length > 50 ||
      messages.some(
        (message) =>
          !message ||
          !["user", "assistant"].includes(message.role) ||
          !Array.isArray(message.parts) ||
          message.parts.some(
            (part) =>
              part.type === "text" &&
              (typeof part.text !== "string" || part.text.length > 10000),
          ),
      )
    ) {
      return Response.json(
        { error: "The conversation is invalid or too long." },
        { status: 400 },
      );
    }

    const result = streamText({
      model: google("gemini-3.5-flash-lite"),

      system: `
You are AI Study Assistant, a friendly tutor for university students.
Explain concepts clearly and use examples when helpful.

You can propose a revision task using the createRevisionTask tool.
Only use this tool when the student explicitly asks to create or schedule
a revision task. Do not create tasks just because the student asks a
question about studying.

A task needs a title, description, and due date.
Never invent a due date. If the student has not specified a due date,
ask them what date they want before calling the tool.

The tool requires user approval. Explain that the task is only a proposal
until the student approves it. Never claim a task was created unless
the tool returns a successful result.
      `.trim(),

      messages: await convertToModelMessages(messages),

      tools: {
        createRevisionTask: tool({
          description:
            "Propose a revision task for the student to review. Requires a title, description, and due date. The student must approve before the task is created.",

          inputSchema: revisionTaskSchema,

          needsApproval: true,

          execute: async (input, { toolCallId }) => {
            // Validate the input again on the server before execution.
            const validatedInput = revisionTaskSchema.parse(input);

            const task = createdRevisionTaskSchema.parse({
              ...validatedInput,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            });

            // Log successful execution for debugging and review.
            console.info("[tool:createRevisionTask]", {
              toolCallId,
              status: "success",
              taskId: task.id,
              dueDate: task.dueDate,
              createdAt: task.createdAt,
            });

            return {
              success: true,
              message: "Revision task created successfully.",
              task,
            };
          },
        }),
      },

      onStepFinish({ toolCalls }) {
        for (const toolCall of toolCalls) {
          if (toolCall.toolName === "createRevisionTask") {
            console.info("[tool:createRevisionTask]", {
              toolCallId: toolCall.toolCallId,
              status: "proposed",
            });
          }
        }
      },

      maxOutputTokens: 1200,
      maxRetries: 0,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat request failed:", error);

    return Response.json(
      { error: "Unable to process your request. Please try again." },
      { status: 500 },
    );
  }
}
