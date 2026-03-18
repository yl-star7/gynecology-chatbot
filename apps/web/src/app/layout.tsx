import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "모성간호 챗봇 운영 콘솔",
  description: "모성간호 챗봇의 사용자 채팅과 관리자 운영 화면",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "모성간호 챗봇",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7eee8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
                          try {
                            const rawProfile = window.localStorage.getItem("phedy-mobile-profile");
                            const parsedProfile = rawProfile ? JSON.parse(rawProfile) : null;
                            const themeKey = parsedProfile?.themeKey || "rose-sand";
                            document.documentElement.setAttribute("data-theme", themeKey);
                          } catch {}
                          window.PhedyNative = {
                            available: typeof window !== "undefined" && !!window.ReactNativeWebView,
                            post(type, payload) {
                              if (!window.ReactNativeWebView) return false;
                              window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload: payload || {} }));
                              return true;
                            },
                            openExternal(url) {
                              return this.post("open-external", { url });
                            },
                            openNative(path) {
                              return this.post("open-native", { path });
                            },
                            setTitle(title) {
                              return this.post("set-title", { title });
                            },
                            reload() {
                              return this.post("reload");
                            },
                          };
                        `,
          }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
