import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold text-neutral-900">페이지를 찾을 수 없어요.</h1>
      <p className="text-sm text-neutral-600">
        주소를 다시 확인하거나 홈으로 돌아가 주세요.
      </p>
      <Link
        href="/"
        className="rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white"
      >
        홈으로 이동
      </Link>
    </main>
  );
}
