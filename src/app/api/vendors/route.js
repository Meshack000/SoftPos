import { NextResponse } from "next/server";
import { saveVendor } from "@/lib/store";
import { makeSlug, makePin, hashPin } from "@/lib/vendorAuth";
import { NETWORKS, normalizePhone } from "@/lib/phone";
import { createSubaccount } from "@/lib/paystack";

// Creates a vendor and their Paystack payout account. Staff only.
export async function POST(request) {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSCODE is missing. Add it to .env.local and restart the server." },
      { status: 500 }
    );
  }
  if (request.headers.get("x-admin-passcode") !== expected) {
    return NextResponse.json({ error: "Wrong passcode." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const phone = normalizePhone(body?.phone);
  const confirmPhone = normalizePhone(body?.confirmPhone);
  const network = String(body?.network || "");

  if (!name || name.length > 60) {
    return NextResponse.json(
      { error: "Enter the vendor's business name (up to 60 characters)." },
      { status: 400 }
    );
  }
  if (!phone) {
    return NextResponse.json(
      { error: "Enter a valid Ghana MoMo number for the vendor, like 0241234567." },
      { status: 400 }
    );
  }
  if (phone !== confirmPhone) {
    return NextResponse.json(
      { error: "The two MoMo numbers don't match. Check them carefully." },
      { status: 400 }
    );
  }
  if (!NETWORKS[network]) {
    return NextResponse.json({ error: "Choose the vendor's MoMo network." }, { status: 400 });
  }

  let sub;
  try {
    sub = await createSubaccount({ businessName: name, phone, network });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
  if (!sub.ok || !sub.code) {
    return NextResponse.json(
      { error: sub.message || "Paystack could not set up this vendor's payout account." },
      { status: 502 }
    );
  }

  const slug = makeSlug(name);
  const pin = makePin();
  const { salt, hash } = hashPin(pin);

  saveVendor({
    slug,
    name,
    pinSalt: salt,
    pinHash: hash,
    payoutPhone: phone,
    payoutNetwork: network,
    subaccountCode: sub.code,
    currentRequestId: null,
    createdAt: Date.now(),
  });

  // The PIN is returned once, here. We only store a hash of it.
  return NextResponse.json({
    ok: true,
    slug,
    name,
    pin,
    payoutName: sub.accountName,
  });
}
