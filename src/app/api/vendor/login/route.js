import { NextResponse } from "next/server";
import { getVendor } from "@/lib/store";
import { validSlug, checkPin } from "@/lib/vendorAuth";
import { safe } from "@/lib/http";

export const POST = safe(async (request) => {
  const body = await request.json().catch(() => null);
  const slug = String(body?.slug || "").trim().toLowerCase();
  const pin = String(body?.pin || "").trim();

  const vendor = validSlug(slug) ? await getVendor(slug) : null;
  if (!vendor || !checkPin(pin, vendor.pinSalt, vendor.pinHash)) {
    return NextResponse.json({ error: "Wrong vendor code or PIN." }, { status: 401 });
  }
  return NextResponse.json({ ok: true, name: vendor.name, plan: vendor.plan });
});
