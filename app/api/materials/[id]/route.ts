import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { splitIntoPassages } from "../../../../lib/retrieval";
import { materialIdSchema } from "../../../../types/material-qa";

// Returns one study material, split into its sections, so the student
// can inspect the original source behind a citation.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsedId = materialIdSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json(
      { error: "Invalid study material id." },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("study_materials")
    .select("id, title, subject, content")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error) {
    console.error("Loading study material failed:", error);

    return NextResponse.json(
      { error: "Unable to load this study material right now." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "This study material could not be found." },
      { status: 404 },
    );
  }

  const passages = splitIntoPassages(data).map((passage) => ({
    id: passage.id,
    index: passage.index,
    heading: passage.heading,
    text: passage.text,
  }));

  return NextResponse.json({
    material: {
      id: data.id,
      title: data.title,
      subject: data.subject,
      passages,
    },
  });
}
