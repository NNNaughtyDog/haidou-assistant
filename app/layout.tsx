import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hex.aicollie.cn"),
  title: "海斗实验室｜白天玩一局，晚上做助手",
  description: "手机直接玩的原创构筑乱斗，加上海克斯大乱斗英雄、强化与出装实战助手。",
  openGraph: {
    title: "海斗实验室",
    description: "三选一、赌天胡、做构筑。白天随时玩一局，晚上打开实战助手。",
    type: "website",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "海斗实验室｜构筑乱斗与实战助手" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "海斗实验室",
    description: "白天玩构筑乱斗，晚上用实战助手",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
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
