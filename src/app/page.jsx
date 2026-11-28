import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { BackIcon } from "@/components/Icons";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
      <AppHeader>
        <span className="text-xs font-bold uppercase tracking-wide text-muted">
          Ghana MoMo
        </span>
      </AppHeader>

      <section className="mt-12">
        <p className="text-sm font-bold uppercase tracking-wide text-brand">
          Simple, secure payments
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight">
          Get paid with a tap.
        </h1>
        <p className="mt-3 leading-relaxed text-muted">
          Accept mobile money in person. Your customers approve every payment on their phone.
        </p>
      </section>

      <section className="mt-10 flex flex-col gap-3" aria-label="Choose a service">
        <Link
          href="/terminal"
          className="group rounded-ui border border-brand bg-brand p-5 text-white"
        >
          <span className="block text-xs font-bold uppercase tracking-wide text-white/80">
            For vendors
          </span>
          <span className="mt-2 block text-xl font-bold">Vendor terminal</span>
          <span className="mt-1 block text-sm leading-relaxed text-white/80">
            Sign in, enter an amount, and get paid.
          </span>
          <span className="mt-5 flex items-center justify-between border-t border-white/25 pt-4 text-sm font-bold">
            Open terminal
            <BackIcon className="h-5 w-5 rotate-180" />
          </span>
        </Link>

        <Link
          href="/program"
          className="rounded-ui border border-line bg-white p-5 hover:bg-soft"
        >
          <span className="block text-xs font-bold uppercase tracking-wide text-muted">
            Staff setup
          </span>
          <span className="mt-2 block text-xl font-bold">Set up a vendor card</span>
          <span className="mt-1 block text-sm leading-relaxed text-muted">
            Staff only. Create a vendor and write their link onto an NFC tag.
          </span>
          <span className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm font-bold text-brand">
            Create a vendor card
            <BackIcon className="h-5 w-5 rotate-180" />
          </span>
        </Link>
      </section>

      <p className="mt-auto pt-10 text-center text-xs text-muted">
        Fast at the counter. Simple on every phone.
      </p>
    </main>
  );
}
