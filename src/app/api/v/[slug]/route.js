import { NextResponse } from "next/server";
import { getVendor, getRequest } from "@/lib/store";
import { validSlug } from "@/lib/vendorAuth";

// The buyer's page asks: who is this vendor, and what amount is open right now?
export async function GET(_request, { params }) {
  const { slug } = await params;
  const vendor = validSlug(slug) ? getVendor(slug) : null;
  if (!vendor) {
    return NextResponse.json({ error: "This vendor card isn't recognised." }, { status: 404 });
  }

  const current = vendor.currentRequestId ? getRequest(vendor.currentRequestId) : null;
  const payable = current && (current.status === "open" || current.status === "failed");

  return NextResponse.json({
    ok: true,
    vendor: { name: vendor.name },
    request: payable ? { id: current.id, amount: current.amount } : null,
  });
}
