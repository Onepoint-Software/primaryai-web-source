export const runtime = 'edge';

import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem', fontFamily: 'inherit' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>404</h1>
      <p style={{ color: 'var(--muted, #64748b)' }}>Page not found</p>
      <Link href="/" style={{ color: 'var(--orange, #ff9f43)' }}>Go home</Link>
    </main>
  );
}
