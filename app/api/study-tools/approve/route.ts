import { NextResponse } from "next/server";
import {
  createStudyTaskSchema,
  saveStudyGuideSchema,
} from "../../../../types/study-tools";
import {
  verifyApprovalToken,
  hashApprovalToken,
} from "../../../../lib/tool-approval";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body: { token?: unknown } = await request.json();

    if (typeof body.token !== "string" || !body.token) {
      return NextResponse.json(
        { error: "An approval token is required." },
        { status: 400 },
      );
    }

    // Verify the signature and expiry of the approval token.
    const payload = verifyApprovalToken(body.token);

    // Validate the proposed action again on the server.
    if (payload.toolName === "createStudyTask") {
      const parsed = createStudyTaskSchema.safeParse(payload.input);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "The proposed task contains invalid data." },
          { status: 400 },
        );
      }

      // Record the token so it cannot be used again.
      const { error: tokenError } = await supabaseAdmin
        .from("used_approval_tokens")
        .insert({ token_hash: hashApprovalToken(body.token) });

      if (tokenError) {
        if (tokenError.code === "23505") {
          return NextResponse.json(
            { error: "This approval has already been used. Request a new proposal." },
            { status: 409 },
          );
        }

        console.error("Approval token recording failed:", tokenError);

        return NextResponse.json(
          { error: "Could not record approval. Please try again." },
          { status: 500 },
        );
      }

      const task = parsed.data;

      const { data, error } = await supabaseAdmin
        .from("study_tasks")
        .insert({
          title: task.title,
          description: task.description ?? null,
          due_date: task.dueDate ?? null,
          priority: task.priority,
        })
        .select("id, title, description, due_date, priority, created_at")
        .single();

      if (error) {
        console.error("Task creation failed:", error);

        await supabaseAdmin.from("tool_logs").insert({
          tool_name: "createStudyTask",
          status: "failed",
          input: { title: task.title },
          details: "The task could not be created after approval.",
        });

        return NextResponse.json(
          {
            error: "Approval was recorded, but the task could not be created. Request a new proposal.",
          },
          { status: 500 },
        );
      }

      await supabaseAdmin.from("tool_logs").insert({
        tool_name: "createStudyTask",
        status: "success",
        input: { title: task.title },
        details: `Created revision task ${data.id}`,
      });

      return NextResponse.json({
        status: "success",
        toolName: payload.toolName,
        message: "Your revision task was created successfully.",
        result: data,
      });
    }

    // Handle saving a study guide.
    const parsed = saveStudyGuideSchema.safeParse(payload.input);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "The proposed study guide contains invalid data." },
        { status: 400 },
      );
    }

    const { error: tokenError } = await supabaseAdmin
      .from("used_approval_tokens")
      .insert({ token_hash: hashApprovalToken(body.token) });

    if (tokenError) {
      if (tokenError.code === "23505") {
        return NextResponse.json(
          { error: "This approval has already been used. Request a new proposal." },
          { status: 409 },
        );
      }

      console.error("Approval token recording failed:", tokenError);

      return NextResponse.json(
        { error: "Could not record approval. Please try again." },
        { status: 500 },
      );
    }

    const guide = parsed.data;

    const { data, error } = await supabaseAdmin
      .from("study_guides")
      .insert({
        title: guide.title,
        content: guide.studyGuide,
      })
      .select("id, title, created_at")
      .single();

    if (error) {
      console.error("Study guide saving failed:", error);

      await supabaseAdmin.from("tool_logs").insert({
        tool_name: "saveStudyGuide",
        status: "failed",
        input: { title: guide.title },
        details: "The study guide could not be saved after approval.",
      });

      return NextResponse.json(
        {
          error: "Approval was recorded, but the study guide could not be saved. Request a new proposal.",
        },
        { status: 500 },
      );
    }

    await supabaseAdmin.from("tool_logs").insert({
      tool_name: "saveStudyGuide",
      status: "success",
      input: { title: guide.title },
      details: `Saved study guide ${data.id}`,
    });

    return NextResponse.json({
      status: "success",
      toolName: payload.toolName,
      message: "Your study guide was saved successfully.",
      result: data,
    });
  } catch (error) {
    console.error("Study tool execution failed:", error);

    return NextResponse.json(
      { error: "The action could not be completed. Request a new proposal." },
      { status: 401 },
    );
  }
}