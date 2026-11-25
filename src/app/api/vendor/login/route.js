import { NextResponse } from "next/server";
import { getVendor } from "@/lib/store";
import { validSlug, checkPin } from "@/lib/vendorAuth";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const slug = String(body?.slug || "").trim().toLowerCase();
  const pin = String(body?.pin || "").trim();

  const vendor = validSlug(slug) ? getVendor(slug) : null;
  if (!vendor || !checkPin(pin, vendor.pinSalt, vendor.pinHash)) {
    return NextResponse.json({ error: "Wrong vendor code or PIN." }, { status: 401 });
  }
  return NextResponse.json({ ok: true, name: vendor.name });
}
