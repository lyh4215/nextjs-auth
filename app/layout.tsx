import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Server Session Auth",
  description: "Next.js server-side session authentication example",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
