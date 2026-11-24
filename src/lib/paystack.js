// Server only. Never import this file into a "use client" component,
// because it reads the secret key.
import crypto from "crypto";

const BASE = "https://api.paystack.co";

// Paystack's codes for the mobile money networks.
const PAYOUT_CODES = { mtn: "MTN", vod: "VOD", atl: "ATL" };

function authHeaders() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is missing. Add it to .env.local and restart the server."
    );
  }
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

// The share of each payment that the platform keeps. 0 means the vendor keeps it all.
export function platformFeePercent() {
  const value = Number(process.env.PLATFORM_FEE_PERCENT);
  if (!Number.isFinite(value) || value < 0 || value > 100) return 0;
  return value;
}

// Creates a Paystack subaccount so a vendor's share is paid to their MoMo number.
export async function createSubaccount({ businessName, phone, network }) {
  const code = PAYOUT_CODES[network];
  if (!code) return { ok: false, message: "Unsupported network for payouts." };

  const res = await fetch(`${BASE}/subaccount`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      business_name: businessName,
      settlement_bank: code,
      account_number: phone,
      percentage_charge: platformFeePercent(),
    }),
  });
  const json = await res.json().catch(() => ({}));
  return {
    ok: res.ok && json.status === true,
    message: json.message,
    code: json.data?.subaccount_code,
    accountName: json.data?.account_name || "",
  };
}

// Asks Paystack to send a MoMo prompt to the customer's phone.
// amount is in cedis. Paystack wants pesewas, so we multiply by 100.
export async function chargeMobileMoney({
  reference,
  amount,
  phone,
  network,
  email,
  subaccount,
}) {
  const payload = {
    email,
    amount: Math.round(amount * 100),
    currency: "GHS",
    reference,
    mobile_money: { phone, provider: network },
  };

  if (subaccount) {
    payload.subaccount = subaccount;
    payload.bearer =
      process.env.PAYSTACK_FEE_BEARER === "subaccount" ? "subaccount" : "account";
  }

  const res = await fetch(`${BASE}/charge`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok && json.status === true, message: json.message, data: json.data };
}

// Asks Paystack for the final status of a payment.
export async function verifyTransaction(reference) {
  const res = await fetch(
    `${BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: authHeaders(), cache: "no-store" }
  );
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok && json.status === true, message: json.message, data: json.data };
}

export async function getMobileMoneyStatus(reference) {
  const result = await verifyTransaction(reference);
  if (!result.ok) throw new Error(result.message || "Paystack could not verify this payment.");
  return result.data || null;
}

// Status right after the charge is created.
export function mapChargeStatus(status) {
  if (status === "success") return "success";
  if (status === "failed") return "failed";
  if (["pay_offline", "pending", "ongoing"].includes(status)) return "pending";
  return "unsupported"; // e.g. send_otp: an extra step we haven't built yet
}

// Status when we verify later.
export function mapVerifyStatus(status) {
  if (status === "success") return "success";
  if (["failed", "abandoned", "reversed"].includes(status)) return "failed";
  return "pending";
}

// Checks that a webhook really came from Paystack.
export function validSignature(rawBody, signature) {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || !signature) return false;
  const expected = crypto.createHmac("sha512", key).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
