import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Horror Pipeline - Reddit Story to YouTube",
  description: "Source, analyze, rewrite, and narrate Reddit horror stories for YouTube",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-zinc-950 text-zinc-100 font-sans">
        {children}
      </body>
    </html>
  );
}
