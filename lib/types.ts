export type TourStatus = "draft" | "published";

export interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
}

export interface Tour {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  status: TourStatus;
  language: "en" | "ar" | string;
  cover_image_url: string | null;
  created_at: string;
}

export interface Room {
  id: string;
  tour_id: string;
  name: string;
  order_index: number;
  panorama_url: string | null;
  created_at: string;
}

export interface RoomPhoto {
  id: string;
  room_id: string;
  photo_url: string;
  created_at: string;
}

export interface Hotspot {
  id: string;
  room_id: string;
  target_room_id: string;
  yaw: number;
  pitch: number;
  label: string | null;
  created_at: string;
}

export interface RoomWithRelations extends Room {
  room_photos?: RoomPhoto[];
  hotspots?: Hotspot[];
}
