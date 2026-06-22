import Link from 'next/link';

export function PageBackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 text-sm text-slate-500">
      <Link href={href} className="hover:text-indigo-600">
        {children}
      </Link>
    </div>
  );
}
