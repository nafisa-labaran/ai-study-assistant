import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

// Lists the available study materials for the selection list.
// Only titles and subjects are returned; the content stays on the server.
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("study_materials")
    .select("id, title, subject")
    .order("title", { ascending: true })
    .limit(100);

  if (error) {
    console.error("Listing study materials failed:", error);

    return NextResponse.json(
      { error: "Unable to load study materials right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({ materials: data ?? [] });
}
