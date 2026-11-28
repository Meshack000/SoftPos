import Link from "next/link";
import { BackIcon } from "@/components/Icons";

export default function AppHeader({ children, backHref }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-line pb-4">
      <div className="flex min-w-0 items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Back"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-brand hover:bg-soft"
          >
            <BackIcon className="h-6 w-6" />
          </Link>
        )}
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-soft text-lg font-bold text-brand">
            S
          </span>
          <span className="font-bold">SoftPOS</span>
        </Link>
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </header>
  );
}
