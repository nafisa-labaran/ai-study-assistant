import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { studyGuideSchema } from "../../../types/study-guide";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body: { topic?: unknown } = await request.json();
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";

    if (!topic || topic.length > 200) {
      return Response.json(
        { error: "Enter a topic of up to 200 characters." },
        { status: 400 },
      );
    }

    const { output } = await generateText({
      model: google("gemini-3.5-flash-lite"),
      output: Output.object({
        schema: studyGuideSchema,
        name: "study_guide",
        description:
          "A structured study guide with a summary, key concepts, and practice questions.",
      }),
      system:
        "You are a university study tutor. Generate accurate, clear study guides. Return a concise summary, 3 to 5 key concepts, and 3 practice questions with answers. Use English and set locale to en. Follow the required output schema exactly.",
      prompt: `Create a study guide about: ${topic}`,
      maxOutputTokens: 1500,
      maxRetries: 2,
    });

    if (!output) {
      return Response.json(
        {
          error: "The study guide could not be generated. Please try again.",
        },
        { status: 502 },
      );
    }

    return Response.json({ studyGuide: output });
  } catch (error) {
    console.error("Study guide generation failed:", error);

    return Response.json(
      {
        error:
          "Unable to generate a study guide right now. Please try again later.",
      },
      { status: 502 },
    );
  }
}
