import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
      <h1 className="text-2xl font-bold">SoftPOS</h1>

      <div className="mt-10 flex flex-col gap-3">
        <Link
          href="/terminal"
          className="block rounded-ui bg-brand px-5 py-5 text-white hover:bg-brand-dark"
        >
          <span className="block text-lg font-bold">Vendor terminal</span>
          <span className="mt-1 block text-sm text-white/80">
            Sign in, enter an amount, and get paid.
          </span>
        </Link>

        <Link
          href="/program"
          className="block rounded-ui border border-line px-5 py-5 hover:bg-soft"
        >
          <span className="block text-lg font-bold">Set up a vendor card</span>
          <span className="mt-1 block text-sm text-muted">
            Staff only. Create a vendor and write their link onto an NFC tag.
          </span>
        </Link>
      </div>
    </main>
  );
}
