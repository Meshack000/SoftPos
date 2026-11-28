import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { BackIcon, NfcIcon, PhoneIcon } from "@/components/Icons";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
      <AppHeader />

      <section className="mt-16">
        <h1 className="text-4xl font-bold leading-tight tracking-tight">
          Get paid with
          <br />
          a tap.
        </h1>
      </section>

      <nav className="mt-10 flex flex-col gap-3" aria-label="Choose a service">
        <Link
          href="/terminal"
          className="flex items-center gap-4 rounded-ui border border-brand bg-brand p-5 text-white"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/15">
            <PhoneIcon className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1 text-lg font-bold">
            Vendor terminal
          </span>
          <BackIcon className="h-5 w-5 shrink-0 rotate-180" />
        </Link>

        <Link
          href="/program"
          className="flex items-center gap-4 rounded-ui border border-line bg-white p-5 hover:bg-soft"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-soft text-brand">
            <NfcIcon className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1 text-lg font-bold">
            Set up a vendor card
          </span>
          <BackIcon className="h-5 w-5 shrink-0 rotate-180 text-muted" />
        </Link>
      </nav>
    </main>
  );
}
