import Link from "next/link";
import { BackIcon } from "@/components/Icons";

export default function Premium() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted">
        <BackIcon />
        Back
      </Link>
      <h1 className="mt-6 text-2xl font-bold">Premium</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-ui border border-line p-5">
          <h2 className="text-lg font-bold">Free</h2>
          <ul className="mt-4 flex flex-col gap-2 text-muted">
            <li>1 vendor card</li>
            <li>Basic terminal</li>
            <li>Last 10 transactions</li>
          </ul>
        </section>

        <section className="rounded-ui border border-line p-5">
          <h2 className="text-lg font-bold">Premium</h2>
          <ul className="mt-4 flex flex-col gap-2 text-muted">
            <li>Business profile with logo</li>
            <li>Full transaction history with daily totals</li>
            <li>Card management (extra cards, freeze and replace)</li>
            <li>Staff PINs</li>
            <li>Buyer receipts</li>
          </ul>
          <button
            type="button"
            disabled
            className="mt-5 rounded-ui border border-line px-4 py-2 font-bold text-muted disabled:cursor-not-allowed"
          >
            Upgrade (coming soon)
          </button>
        </section>
      </div>
    </main>
  );
}
