import { NextResponse } from "next/server";
import { getPayment, updatePayment, toPublic } from "@/lib/store";
import { getMobileMoneyStatus, mapChargeStatus } from "@/lib/paystack";

export async function GET(_request, { params }) {
  const { reference } = await params;
  const payment = getPayment(reference);
  if (!payment) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  if (payment.status === "pending") {
    try {
      const transaction = await getMobileMoneyStatus(reference);
      if (transaction) {
        const status = mapChargeStatus(transaction.status);
        if (status !== "pending") {
          const updated = updatePayment(reference, {
            status,
            message: status === "success"
              ? "Payment approved."
              : transaction.gateway_response || "The payment was not approved.",
          });
          return NextResponse.json({ ok: true, payment: toPublic(updated) });
        }
      }
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true, payment: toPublic(payment) });
}
