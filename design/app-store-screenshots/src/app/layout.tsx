import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const font = localFont({ src: "../../public/fonts/Outfit.ttf" });

export const metadata: Metadata = {
  title: "WakaBoard Store Screenshots",
  description: "Design and export WakaBoard App Store and Google Play screenshots.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  );
}
