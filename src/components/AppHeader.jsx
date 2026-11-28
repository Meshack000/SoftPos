import Link from "next/link";

export default function AppHeader({ children }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-line pb-4">
      <Link href="/" className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-soft text-lg font-bold text-brand">
          S
        </span>
        <span className="leading-tight">
          <span className="block font-bold">SoftPOS</span>
          <span className="mt-1 block text-xs text-muted">Mobile money payments</span>
        </span>
      </Link>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </header>
  );
}
