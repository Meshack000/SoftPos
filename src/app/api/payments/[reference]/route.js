import { NextResponse } from "next/server";
import { toPublic } from "@/lib/store";
import { refreshPayment, syncRequest } from "@/lib/payments";
import { safe } from "@/lib/http";

// The buyer's page checks on its payment.
export const GET = safe(async (_request, { params }) => {
  const { reference } = await params;
  const payment = await refreshPayment(reference);

  if (!payment) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  // Keep the vendor's request in step, so a failed payment can be retried.
  await syncRequest(payment.requestId);

  return NextResponse.json({ ok: true, payment: toPublic(payment) });
});
