import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateTourDescription } from "@/lib/gemini";

interface Params {
  params: Promise<{ tourId: string }>;
}

export async function POST(_request: Request, { params }: Params) {
  const { tourId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: tour, error: tourError } = await supabase.from("tours").select("id, title, language").eq("id", tourId).single();
  if (tourError || !tour) {
    return NextResponse.json({ message: tourError?.message || "Tour not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("tours")
    .update({
      status: "published",
      cover_image_url:
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop",
    })
    .eq("id", tourId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  const description = await generateTourDescription(tour.title, tour.language ?? "en");

  return NextResponse.json({ ok: true, description });
}
