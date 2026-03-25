import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  photoPath: z.string().min(1),
});

interface Params {
  params: Promise<{ roomId: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { roomId } = await params;
  const body = await request.json();
  const parse = BodySchema.safeParse(body);

  if (!parse.success) {
    return NextResponse.json({ message: parse.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: row, error } = await supabase
    .from("room_photos")
    .insert({
      room_id: roomId,
      photo_url: parse.data.photoPath,
    })
    .select("id")
    .single();

  if (error || !row) {
    return NextResponse.json({ message: error?.message || "Failed to create photo row" }, { status: 400 });
  }

  return NextResponse.json({ photoId: row.id });
}
