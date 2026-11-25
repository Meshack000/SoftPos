import { NextResponse } from "next/server";
import { getRequest, updateRequest, toPublicRequest } from "@/lib/store";
import { authVendor } from "@/lib/vendorAuth";
import { syncRequest } from "@/lib/payments";
import { safe } from "@/lib/http";

// The vendor checks on a request.
export const GET = safe(async (request, { params }) => {
  const vendor = await authVendor(request);
  if (!vendor) {
    return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  }

  const { id } = await params;
  const sale = await syncRequest(id);
  if (!sale || sale.slug !== vendor.slug) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, request: toPublicRequest(sale) });
});

// The vendor cancels a request.
export const DELETE = safe(async (request, { params }) => {
  const vendor = await authVendor(request);
  if (!vendor) {
    return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  }

  const { id } = await params;
  const sale = await getRequest(id);
  if (!sale || sale.slug !== vendor.slug) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  if (sale.status === "pending") {
    return NextResponse.json(
      { error: "A customer is already approving this payment." },
      { status: 409 }
    );
  }
  if (sale.status === "open" || sale.status === "failed") {
    await updateRequest(id, { status: "cancelled" });
  }
  return NextResponse.json({ ok: true });
});
