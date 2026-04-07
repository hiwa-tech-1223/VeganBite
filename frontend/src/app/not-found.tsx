import Link from 'next/link';
import { Leaf } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="bg-white rounded-xl shadow-md p-8 md:p-12 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <Leaf className="w-16 h-16" style={{ color: 'var(--primary)' }} />
        </div>
        <h1 className="text-4xl mb-2" style={{ color: 'var(--primary)' }}>
          404
        </h1>
        <p className="text-xl mb-2" style={{ color: 'var(--text)' }}>
          Page Not Found
        </p>
        <p className="mb-6" style={{ color: 'var(--text)' }}>
          お探しのページは見つかりませんでした
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2 rounded-full text-white"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          Back to Home / ホームに戻る
        </Link>
      </div>
    </div>
  );
}
