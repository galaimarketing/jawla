import type { Metadata } from "next";
import { Inter, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const notoArabic = Noto_Kufi_Arabic({ subsets: ["arabic"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "jawla",
  description: "Street View style 360 virtual tours",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${notoArabic.className}`}>{children}</body>
    </html>
  );
}
