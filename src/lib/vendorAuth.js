import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "crypto";
import { getVendor } from "@/lib/store";

// A readable, unguessable vendor code, like kumasi-mart-7f3a
export function makeSlug(name) {
  const base =
    String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "vendor";
  return `${base}-${randomBytes(2).toString("hex")}`;
}

export function validSlug(slug) {
  return /^[a-z0-9-]{3,60}$/.test(String(slug || ""));
}

// A 6-digit PIN the vendor uses to sign in.
export function makePin() {
  return String(randomInt(100000, 1000000));
}

export function hashPin(pin) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(String(pin), salt, 32).toString("hex");
  return { salt, hash };
}

export function checkPin(pin, salt, hash) {
  const test = scryptSync(String(pin), salt, 32);
  const real = Buffer.from(hash, "hex");
  return test.length === real.length && timingSafeEqual(test, real);
}

// Reads the vendor code and PIN from request headers. Returns the vendor or null.
export async function authVendor(request) {
  const slug = (request.headers.get("x-vendor-slug") || "").trim().toLowerCase();
  const pin = (request.headers.get("x-vendor-pin") || "").trim();
  if (!validSlug(slug)) return null;
  const vendor = await getVendor(slug);
  if (!vendor || !checkPin(pin, vendor.pinSalt, vendor.pinHash)) return null;
  return vendor;
}
