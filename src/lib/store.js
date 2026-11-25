// TEMPORARY storage. It lives in server memory, so everything is lost when
// the server restarts. We replace this with a real database before deploying.
import { randomUUID } from "crypto";

const g = globalThis;
if (!g.__softpos) g.__softpos = {};
for (const key of ["vendors", "requests", "payments"]) {
  if (!g.__softpos[key]) g.__softpos[key] = new Map();
}
const db = g.__softpos;

const REQUEST_TTL_MS = 5 * 60 * 1000;

export function maskPhone(phone) {
  return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
}

// Vendors

export function saveVendor(vendor) {
  db.vendors.set(vendor.slug, vendor);
  return vendor;
}

export function getVendor(slug) {
  return db.vendors.get(slug) || null;
}

// Sale requests: the amount a vendor is asking for right now.
// status: open | pending | paid | failed | cancelled | expired

export function getRequest(id) {
  const request = db.requests.get(id);
  if (!request) return null;
  if (
    (request.status === "open" || request.status === "failed") &&
    Date.now() > request.expiresAt
  ) {
    request.status = "expired";
  }
  return request;
}

export function createRequest(slug, amount) {
  const vendor = db.vendors.get(slug);
  if (!vendor) return null;

  const old = vendor.currentRequestId ? getRequest(vendor.currentRequestId) : null;
  if (old && (old.status === "open" || old.status === "failed")) {
    old.status = "cancelled";
  }

  const request = {
    id: `rq_${randomUUID().replace(/-/g, "")}`,
    slug,
    amount,
    status: "open",
    reference: null,
    maskedPhone: "",
    message: "",
    createdAt: Date.now(),
    expiresAt: Date.now() + REQUEST_TTL_MS,
  };
  db.requests.set(request.id, request);
  vendor.currentRequestId = request.id;
  return request;
}

export function updateRequest(id, changes) {
  const request = db.requests.get(id);
  if (!request) return null;
  Object.assign(request, changes);
  return request;
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

export function savePayment(payment) {
  db.payments.set(payment.reference, payment);
  return payment;
}

export function getPayment(reference) {
  return db.payments.get(reference) || null;
}

export function updatePayment(reference, changes) {
  const current = db.payments.get(reference);
  if (!current) return null;
  const next = { ...current, ...changes };
  db.payments.set(reference, next);
  return next;
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
