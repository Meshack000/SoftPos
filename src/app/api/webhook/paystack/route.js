import { NextResponse } from "next/server";
import { getPayment, updatePayment, updateRequest } from "@/lib/store";
import { validSignature } from "@/lib/paystack";
import { safe } from "@/lib/http";

export const POST = safe(async (request) => {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!validSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  if (event.event === "charge.success") {
    const data = event.data || {};
    const payment = await getPayment(data.reference);
    if (
      payment &&
      payment.status === "pending" &&
      data.amount === Math.round(payment.amount * 100)
    ) {
      await updatePayment(payment.reference, { status: "success", message: "" });
      await updateRequest(payment.requestId, { status: "paid", message: "" });
    }
  }

  return NextResponse.json({ received: true });
});
