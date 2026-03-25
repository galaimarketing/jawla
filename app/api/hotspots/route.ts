import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CreateHotspotSchema = z.object({
  roomId: z.string().uuid(),
  targetRoomId: z.string().uuid(),
  yaw: z.number(),
  pitch: z.number(),
  label: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parse = CreateHotspotSchema.safeParse(body);

  if (!parse.success) {
    return NextResponse.json({ message: parse.error.flatten() }, { status: 400 });
  }

  const { error } = await supabase.from("hotspots").insert({
    room_id: parse.data.roomId,
    target_room_id: parse.data.targetRoomId,
    yaw: parse.data.yaw,
    pitch: parse.data.pitch,
    label: parse.data.label ?? null,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
