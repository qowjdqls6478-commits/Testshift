import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TextShift - 텍스트 포맷 변환기",
  description: "Elasticsearch 쿼리 변환 및 JSON 포맷팅 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
