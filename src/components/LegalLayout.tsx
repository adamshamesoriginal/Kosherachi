import Link from "next/link";
import { ReactNode } from "react";

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="flex-1 flex flex-col px-4 py-6 gap-4">
      <Link href="/more" className="text-sm text-emerald-700">
        ← חזרה
      </Link>
      <div>
        <h1 className="text-xl font-extrabold text-stone-900">{title}</h1>
        {updated && <p className="text-xs text-stone-400 mt-1">עודכן: {updated}</p>}
      </div>
      <article className="flex flex-col gap-4 text-sm leading-relaxed text-stone-700 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-stone-900 [&_h2]:mt-2 [&_ul]:list-disc [&_ul]:pr-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_strong]:text-stone-900">
        {children}
      </article>
    </main>
  );
}
