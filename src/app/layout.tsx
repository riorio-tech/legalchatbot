import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "契約書レビューAIチャットボット",
  description: "一流の弁護士視点で契約書をレビューし、法務リスクを自動検出します。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <header className="bg-white border-b border-gray-200 py-4 mb-8">
          <nav className="container mx-auto flex gap-6 items-center px-4">
            <Link href="/" className="text-xl font-bold text-blue-700 hover:underline">
              契約書レビューAI
            </Link>
            <Link href="/knowledge" className="text-gray-700 hover:text-blue-700 hover:underline">
              法務ナレッジ管理
            </Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
