
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export async function GET() {
  const { error } = await supabaseAdmin
    .from("study_materials")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Supabase connection failed:", error);

    return NextResponse.json(
      { connected: false, message: "Database connection failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    connected: true,
    message: "Supabase connection successful!",
  });
}
