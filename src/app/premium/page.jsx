import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { BackIcon, CheckIcon } from "@/components/Icons";

export default function Premium() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-6">
      <AppHeader>
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-muted">
          <BackIcon className="h-4 w-4" />
          Back
        </Link>
      </AppHeader>
      <section className="mt-10">
        <p className="text-sm font-bold uppercase tracking-wide text-brand">Plans</p>
        <h1 className="mt-2 text-3xl font-bold">Premium</h1>
        <p className="mt-2 max-w-xl leading-relaxed text-muted">
          Start simple and get more tools as your business grows.
        </p>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="flex flex-col rounded-ui border border-line p-6">
          <span className="w-fit rounded-full border border-line px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted">
            Get started
          </span>
          <h2 className="mt-4 text-2xl font-bold">Free</h2>
          <p className="mt-2 text-sm text-muted">The essentials for accepting MoMo.</p>
          <ul className="mt-6 flex flex-col gap-4">
            <li className="flex items-start gap-3">
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              1 vendor card
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              Basic terminal
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              Last 10 transactions
            </li>
          </ul>
        </section>

        <section className="flex flex-col rounded-ui border-2 border-brand p-6">
          <span className="w-fit rounded-full bg-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
            For growing teams
          </span>
          <h2 className="mt-4 text-2xl font-bold">Premium</h2>
          <p className="mt-2 text-sm text-muted">More visibility and control for your team.</p>
          <ul className="mt-6 flex flex-col gap-4">
            <li className="flex items-start gap-3">
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              Business profile with logo
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              Full transaction history with daily totals
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              Card management (extra cards, freeze and replace)
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              Staff PINs
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              Buyer receipts
            </li>
          </ul>
          <button
            type="button"
            disabled
            className="mt-8 h-12 rounded-ui border border-line px-4 font-bold text-muted disabled:cursor-not-allowed"
          >
            Upgrade (coming soon)
          </button>
        </section>
      </div>
    </main>
  );
}
