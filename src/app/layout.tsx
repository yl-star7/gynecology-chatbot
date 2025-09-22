import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 한국어 텍스트에 최적화된 Inter 폰트 사용
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "부인과 AI 챗봇 | 전문의와 함께하는 건강한 임신",
  description: "임신, 출산, 여성 건강에 대한 궁금증을 언제든지 전문의에게 물어보세요. 안전하고 정확한 의료 정보를 제공합니다.",
  keywords: ["부인과", "임신", "출산", "여성건강", "의료상담", "AI챗봇", "전문의"],
  authors: [{ name: "부인과 AI 챗봇 팀" }],
  creator: "부인과 AI 챗봇",
  publisher: "부인과 AI 챗봇",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "부인과 AI 챗봇",
    description: "전문의와 함께하는 건강한 임신 여정",
    url: "/",
    siteName: "부인과 AI 챗봇",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "부인과 AI 챗봇 - 전문의와 함께하는 건강한 임신",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "부인과 AI 챗봇",
    description: "전문의와 함께하는 건강한 임신 여정",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="font-sans antialiased bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-light/20 min-h-screen">
        <div id="root">{children}</div>
        
        {/* 전역 스크립트 및 SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "부인과 AI 챗봇",
              "description": "임신, 출산, 여성 건강에 대한 전문적인 의료 상담 서비스",
              "url": process.env.NEXT_PUBLIC_APP_URL,
              "medicalAudience": [
                {
                  "@type": "MedicalAudience",
                  "audienceType": "임산부 및 여성"
                }
              ],
              "specialty": {
                "@type": "MedicalSpecialty",
                "name": "부인과학"
              },
              "provider": {
                "@type": "Organization",
                "name": "부인과 AI 챗봇",
                "description": "AI 기반 부인과 전문 의료 상담 서비스"
              }
            }),
          }}
        />
      </body>
    </html>
  );
}
