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
          <span className="block text-lg font-bold">Take a payment</span>
          <span className="mt-1 block text-sm text-white/80">
            Enter an amount and tap the customer&rsquo;s NFC tag.
          </span>
        </Link>

        <Link
          href="/register"
          className="block rounded-ui border border-line px-5 py-5 hover:bg-soft"
        >
          <span className="block text-lg font-bold">Register a tag</span>
          <span className="mt-1 block text-sm text-muted">
            Link a tag to a customer&rsquo;s MoMo number.
          </span>
        </Link>
      </div>
    </main>
  );
}