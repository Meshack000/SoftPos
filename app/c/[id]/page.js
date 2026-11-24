import { Suspense } from "react";
import CustomerCard from "@/app/c/[id]/page";

export default function CardPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md px-5 py-8">
          <p className="text-muted">Loading...</p>
        </main>
      }
    >
      <CustomerCard />
    </Suspense>
  );
}
