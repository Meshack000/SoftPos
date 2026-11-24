import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getRequest,
  updateRequest,
  getVendor,
  savePayment,
  maskPhone,
  toPublic,
} from "@/lib/store";
import { chargeMobileMoney, mapChargeStatus } from "@/lib/paystack";
import { NETWORKS, normalizePhone } from "@/lib/phone";

// The buyer confirms. The amount comes from the server's saved request,
// never from the buyer's browser.
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const requestId = String(body?.requestId || "");
  const phone = normalizePhone(body?.phone);
  const network = String(body?.network || "");

  if (!phone) {
    return NextResponse.json(
      { error: "Enter a valid Ghana mobile number, like 0241234567." },
      { status: 400 }
    );
  }
  if (!NETWORKS[network]) {
    return NextResponse.json({ error: "Choose your MoMo network." }, { status: 400 });
  }

  const sale = getRequest(requestId);
  if (!sale) {
    return NextResponse.json({ error: "This payment request no longer exists." }, { status: 404 });
  }
  if (sale.status === "pending") {
    return NextResponse.json(
      { error: "A payment is already waiting for approval." },
      { status: 409 }
    );
  }
  if (sale.status !== "open" && sale.status !== "failed") {
    return NextResponse.json(
      { error: "This payment request is no longer available. Ask the vendor to enter the amount again." },
      { status: 410 }
    );
  }

  const vendor = getVendor(sale.slug);
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
  }
  if (!vendor.subaccountCode) {
    return NextResponse.json(
      { error: "This vendor isn't set up to receive payments yet." },
      { status: 409 }
    );
  }

  const reference = `sp_${randomUUID().replace(/-/g, "")}`;

  // Lock the request first so a double tap can't charge twice.
  updateRequest(sale.id, {
    status: "pending",
    reference,
    maskedPhone: maskPhone(phone),
    message: "",
  });

  let result;
  try {
    result = await chargeMobileMoney({
      reference,
      amount: sale.amount,
      phone,
      network,
      // Paystack requires an email. We don't collect one, so we make a placeholder.
      email: `${phone}@softpos.app`,
      subaccount: vendor.subaccountCode,
    });
  } catch (err) {
    updateRequest(sale.id, { status: "open", reference: null });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  if (!result.ok) {
    updateRequest(sale.id, { status: "open", reference: null });
    return NextResponse.json(
      { error: result.message || "Paystack could not start this payment." },
      { status: 502 }
    );
  }

  const mapped = mapChargeStatus(result.data?.status);
  const unsupported = mapped === "unsupported";
  const status = unsupported ? "failed" : mapped;
  const message = unsupported
    ? "This network asked for an extra step that SoftPOS doesn't support yet."
    : result.data?.display_text || "";

  const payment = savePayment({
    reference,
    requestId: sale.id,
    slug: sale.slug,
    vendorName: vendor.name,
    phone,
    network,
    amount: sale.amount,
    status,
    message,
    createdAt: Date.now(),
  });

  if (status === "success") updateRequest(sale.id, { status: "paid", message: "" });
  else if (status === "failed") updateRequest(sale.id, { status: "failed", message });

  return NextResponse.json({ ok: true, payment: toPublic(payment) });
}
