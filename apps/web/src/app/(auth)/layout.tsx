import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: '부인과 AI 챗봇 - 로그인',
  description: '부인과 전문의와 함께하는 건강한 임신 여정을 시작해보세요.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
            border: '1px solid #f3f4f6',
          },
          success: {
            iconTheme: {
              primary: '#f28b5c',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}