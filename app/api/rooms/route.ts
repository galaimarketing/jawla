import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const AddRoomSchema = z.object({
  tourId: z.string().uuid(),
  name: z.string().min(1),
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
  const parse = AddRoomSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ message: parse.error.flatten() }, { status: 400 });
  }

  const { data: existingRooms } = await supabase
    .from("rooms")
    .select("id")
    .eq("tour_id", parse.data.tourId);

  const orderIndex = existingRooms?.length ?? 0;

  const { data, error } = await supabase
    .from("rooms")
    .insert({
      tour_id: parse.data.tourId,
      name: parse.data.name,
      order_index: orderIndex,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ message: error?.message || "Failed to add room" }, { status: 400 });
  }

  return NextResponse.json({ roomId: data.id });
}
