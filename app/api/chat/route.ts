import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";

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
      system:
        "You are AI Study Assistant, a friendly tutor for university students. Explain concepts clearly, use examples when helpful, and support learning rather than simply giving unexplained answers.",
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 1200,
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
