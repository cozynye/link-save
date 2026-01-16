import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/react-query/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://gieok.app'),
  title: {
    default: "기억 - 링크와 지식을 기억하는 공간",
    template: "%s | 기억",
  },
  description: "중요한 링크를 저장하고 지식을 정리하세요. 기억은 링크 관리와 마크다운 기반 지식 정리를 위한 통합 플랫폼입니다.",
  keywords: ["링크 관리", "북마크", "지식 정리", "문서화", "마크다운", "기억", "SaveLink", "Docs"],
  authors: [{ name: "기억" }],
  creator: "기억",
  publisher: "기억",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://gieok.app",
    title: "기억 - 링크와 지식을 기억하는 공간",
    description: "중요한 링크를 저장하고 지식을 정리하세요. 기억은 링크 관리와 마크다운 기반 지식 정리를 위한 통합 플랫폼입니다.",
    siteName: "기억",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "기억 로고",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "기억 - 링크와 지식을 기억하는 공간",
    description: "중요한 링크를 저장하고 지식을 정리하세요.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code", // 나중에 Google Search Console에서 받은 코드로 교체
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
