## jawla MVP

Street View style 360 virtual tour MVP built with Next.js App Router, TypeScript, Tailwind CSS, Supabase (Auth + Postgres + Storage), Marzipano, and Vercel AI SDK (Gemini provider).

### Tech + MVP scope

- Next.js App Router
- TypeScript + Tailwind CSS
- Supabase Auth (magic link), Postgres, Storage
- Marzipano for 360 panorama viewer and hotspots
- Vercel AI SDK with Gemini (`GEMINI_API_KEY`) for lightweight generated descriptions
- Nano Banana adapter with fallback mode when stitching API contract is missing/unavailable

### Routes

- Public:
  - `/` landing
  - `/t/[slug]` public tour viewer
- Authenticated:
  - `/auth` magic link login
  - `/app` list tours
  - `/app/new` create tour
  - `/app/tours/[tourId]` manage rooms, uploads, stitching, hotspots, publish

### Environment variables

Copy `.env.example` to `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` — used for both Gemini AI calls and the Nano Banana stitching adapter
- `NANOBANANA_API_URL` — base URL for the stitching endpoint (leave blank until API contract is confirmed)
- `NEXT_PUBLIC_APP_URL`

### Local development

1. Install deps
   - `npm install`
2. Run SQL schema in Supabase SQL editor
   - `supabase/schema.sql`
3. Start dev server
   - `npm run dev`

### Supabase setup

1. Create Supabase project
2. Enable Email OTP / Magic Link in Auth settings
3. Run `supabase/schema.sql`
4. Confirm buckets:
   - `tour-uploads` (private)
   - `tour-public` (public)

### Upload + stitching flow

1. Client uploads room photos directly to `tour-uploads` bucket
2. Client calls `POST /api/rooms/[roomId]/photos` to store photo metadata
3. Stitch endpoint signs upload URLs, calls Nano Banana adapter, uploads result to `tour-public`, updates `rooms.panorama_url`
4. If stitching fails/unconfigured, fallback uses first room photo as pseudo-panorama and leaves adapter TODOs in `lib/nanobanana.ts`

### Nano Banana adapter

`lib/nanobanana.ts` contains:

- `NanobananaClient` interface
- `NanobananaHttpClient` implementation
- `stitchRoomToPanorama(photoUrls)` helper

Update endpoint/payload parsing TODOs based on your real API contract.

### OpenGraph + WhatsApp

`/t/[slug]` uses dynamic metadata with OG image from:

1. `tours.cover_image_url`
2. First room panorama
3. Unsplash fallback

Public page includes a WhatsApp share button (`https://wa.me/?text=...`).

### shadcn compatibility

This repo is configured for shadcn:

- Components path: `components/ui`
- Styles path: `app/globals.css`
- Config: `components.json`
- Utility: `lib/utils.ts`

If your existing app uses a different component path, create `components/ui` and set `"ui": "@/components/ui"` in `components.json`. Keeping this convention matters because shadcn generators and many copied components assume this path.

### Deploy to Vercel

1. Push repo to Git provider
2. Import project in Vercel
3. Add all env vars in Vercel project settings
4. Deploy

### Notes

- MVP keeps ownership simple: tour owner CRUD, public read for published tours only.
- Tested path for mobile camera input uses `<input type="file" accept="image/*" capture="environment" />`.
- WhatsApp in-app browser compatibility: no popups required for core flow.
