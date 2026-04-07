'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="bg-white rounded-xl shadow-md p-8 md:p-12 max-w-md w-full text-center">
        <h1 className="text-3xl mb-4" style={{ color: 'var(--primary)' }}>
          エラーが発生しました
        </h1>
        <p className="mb-6" style={{ color: 'var(--text)' }}>
          Something went wrong. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 rounded-full text-white"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Retry / 再試行
          </button>
          <Link
            href="/"
            className="px-6 py-2 rounded-full border"
            style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
          >
            Home / ホーム
          </Link>
        </div>
      </div>
    </div>
  );
}
