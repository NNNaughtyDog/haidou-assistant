import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://haidou-assistant.chunyu-yin2018.chatgpt.site"),
  title: "海斗助手｜海克斯大乱斗决策工具",
  description: "查询英雄强度、强化搭配和动态出装，快速完成海克斯大乱斗局内决策。",
  openGraph: {
    title: "海斗助手",
    description: "选英雄、记强化、比三选一，下一张值得等什么一眼看懂。",
    type: "website",
    images: [{ url: "/og.png", width: 1730, height: 909, alt: "海斗助手｜海克斯大乱斗决策工具" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "海斗助手",
    description: "海克斯大乱斗局内决策工具",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  other: { "codex-preview": "development" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#090b12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
