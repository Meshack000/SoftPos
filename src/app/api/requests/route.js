import { NextResponse } from "next/server";
import { createRequest, toPublicRequest } from "@/lib/store";
import { authVendor } from "@/lib/vendorAuth";
import { syncRequest } from "@/lib/payments";

// The vendor asks for an amount.
export async function POST(request) {
  const vendor = authVendor(request);
  if (!vendor) {
    return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const amount = Math.round(Number(body?.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter an amount above zero." }, { status: 400 });
  }

  if (vendor.currentRequestId) {
    const current = await syncRequest(vendor.currentRequestId);
    if (current?.status === "pending") {
      return NextResponse.json(
        { error: "A customer is still approving the last payment. Wait for it to finish." },
        { status: 409 }
      );
    }
  }

  const sale = createRequest(vendor.slug, amount);
  return NextResponse.json({ ok: true, request: toPublicRequest(sale) });
}
