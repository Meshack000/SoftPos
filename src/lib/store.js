// Database layer (Supabase). Server only.
// Every function here is async, so always call it with await.
import { randomUUID } from "crypto";
import { db } from "@/lib/db";

const REQUEST_TTL_MS = 5 * 60 * 1000;

function check(error) {
  if (error) throw new Error(`Database error: ${error.message}`);
}

export function maskPhone(phone) {
  return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
}

// Row mappers: the database uses snake_case, the rest of the app uses camelCase.

function toVendor(row) {
  if (!row) return null;
  return {
    slug: row.slug,
    name: row.name,
    plan: row.plan || "free",
    pinSalt: row.pin_salt,
    pinHash: row.pin_hash,
    payoutPhone: row.payout_phone,
    payoutNetwork: row.payout_network,
    subaccountCode: row.subaccount_code,
    currentRequestId: row.current_request_id,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function toRequest(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    amount: Number(row.amount),
    status: row.status,
    reference: row.reference,
    maskedPhone: row.masked_phone || "",
    message: row.message || "",
    createdAt: new Date(row.created_at).getTime(),
    expiresAt: new Date(row.expires_at).getTime(),
  };
}

function toPaymentObj(row) {
  if (!row) return null;
  return {
    reference: row.reference,
    requestId: row.request_id,
    slug: row.slug,
    vendorName: row.vendor_name,
    phone: row.phone,
    network: row.network,
    amount: Number(row.amount),
    status: row.status,
    message: row.message || "",
    createdAt: new Date(row.created_at).getTime(),
  };
}

// Vendors

export async function saveVendor(vendor) {
  const { data, error } = await db()
    .from("vendors")
    .insert({
      slug: vendor.slug,
      name: vendor.name,
      pin_salt: vendor.pinSalt,
      pin_hash: vendor.pinHash,
      payout_phone: vendor.payoutPhone,
      payout_network: vendor.payoutNetwork,
      subaccount_code: vendor.subaccountCode,
      current_request_id: null,
    })
    .select()
    .single();
  check(error);
  return toVendor(data);
}

export async function getVendor(slug) {
  const { data, error } = await db()
    .from("vendors")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  check(error);
  return toVendor(data);
}

export async function setVendorPlan(slug, plan) {
  if (plan !== "free" && plan !== "premium") {
    throw new Error("Invalid vendor plan.");
  }

  const { data, error } = await db()
    .from("vendors")
    .update({ plan })
    .eq("slug", slug)
    .select()
    .maybeSingle();
  check(error);
  return toVendor(data);
}

// Sale requests: the amount a vendor is asking for right now.
// status: open | pending | paid | failed | cancelled | expired

export async function getRequest(id) {
  const { data, error } = await db()
    .from("requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  check(error);
  if (!data) return null;

  const request = toRequest(data);
  if (
    (request.status === "open" || request.status === "failed") &&
    Date.now() > request.expiresAt
  ) {
    const { error: updateError } = await db()
      .from("requests")
      .update({ status: "expired" })
      .eq("id", id)
      .in("status", ["open", "failed"]);
    check(updateError);
    request.status = "expired";
  }
  return request;
}

export async function createRequest(slug, amount) {
  const vendor = await getVendor(slug);
  if (!vendor) return null;

  // Cancel anything still waiting for this vendor.
  const { error: cancelError } = await db()
    .from("requests")
    .update({ status: "cancelled" })
    .eq("slug", slug)
    .in("status", ["open", "failed"]);
  check(cancelError);

  const { data, error } = await db()
    .from("requests")
    .insert({
      id: `rq_${randomUUID().replace(/-/g, "")}`,
      slug,
      amount,
      status: "open",
      expires_at: new Date(Date.now() + REQUEST_TTL_MS).toISOString(),
    })
    .select()
    .single();
  check(error);

  const { error: linkError } = await db()
    .from("vendors")
    .update({ current_request_id: data.id })
    .eq("slug", slug);
  check(linkError);

  return toRequest(data);
}

export async function updateRequest(id, changes) {
  const row = {};
  if ("status" in changes) row.status = changes.status;
  if ("reference" in changes) row.reference = changes.reference;
  if ("maskedPhone" in changes) row.masked_phone = changes.maskedPhone;
  if ("message" in changes) row.message = changes.message;

  const { data, error } = await db()
    .from("requests")
    .update(row)
    .eq("id", id)
    .select()
    .maybeSingle();
  check(error);
  return toRequest(data);
}

// Moves a request from open/failed to pending in ONE step, so two buyers
// (or a double tap) can never both start a payment. Returns null if someone
// else got there first, or if the request has expired.
export async function lockRequestForPayment(id, { reference, maskedPhone }) {
  const { data, error } = await db()
    .from("requests")
    .update({
      status: "pending",
      reference,
      masked_phone: maskedPhone,
      message: "",
    })
    .eq("id", id)
    .in("status", ["open", "failed"])
    .gt("expires_at", new Date().toISOString())
    .select()
    .maybeSingle();
  check(error);
  return toRequest(data);
}

export function toPublicRequest(request) {
  return {
    id: request.id,
    amount: request.amount,
    status: request.status,
    message: request.message || "",
    maskedPhone: request.maskedPhone || "",
    expiresAt: request.expiresAt,
  };
}

// Payments

export async function savePayment(payment) {
  const { data, error } = await db()
    .from("payments")
    .insert({
      reference: payment.reference,
      request_id: payment.requestId,
      slug: payment.slug,
      vendor_name: payment.vendorName,
      phone: payment.phone,
      network: payment.network,
      amount: payment.amount,
      status: payment.status,
      message: payment.message || "",
    })
    .select()
    .single();
  check(error);
  return toPaymentObj(data);
}

export async function getPayment(reference) {
  const { data, error } = await db()
    .from("payments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();
  check(error);
  return toPaymentObj(data);
}

export async function updatePayment(reference, changes) {
  const row = {};
  if ("status" in changes) row.status = changes.status;
  if ("message" in changes) row.message = changes.message;

  const { data, error } = await db()
    .from("payments")
    .update(row)
    .eq("reference", reference)
    .select()
    .maybeSingle();
  check(error);
  return toPaymentObj(data);
}

// What the buyer's browser is allowed to see. The phone number stays on the server.
export function toPublic(payment) {
  return {
    reference: payment.reference,
    status: payment.status,
    message: payment.message || "",
    amount: payment.amount,
    vendorName: payment.vendorName,
    network: payment.network,
  };
}
