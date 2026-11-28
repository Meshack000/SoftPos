"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Keypad from "@/components/Keypad";
import PasswordInput from "@/components/PasswordInput";
import AppHeader from "@/components/AppHeader";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  LogoutIcon,
} from "@/components/Icons";

const STORE_KEY = "softpos_vendor";
const inputClass = "mt-1 w-full rounded-ui border border-line bg-white px-4 py-3 text-lg";

export default function Terminal() {
  const [ready, setReady] = useState(false);
  const [vendor, setVendor] = useState(null); // { slug, pin, name }
  const [slugInput, setSlugInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState("");
  const [sale, setSale] = useState(null);
  const [notice, setNotice] = useState("");

  const numeric = parseFloat(amount) || 0;
  const saleId = sale?.id;
  const saleStatus = sale?.status;

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORE_KEY);
      if (saved) setVendor(JSON.parse(saved));
    } catch {
      // Ignore a broken saved session.
    }
    setReady(true);
  }, []);

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      "x-vendor-slug": vendor.slug,
      "x-vendor-pin": vendor.pin,
    };
  }

  function signOut(message = "") {
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      // Ignore.
    }
    setVendor(null);
    setSale(null);
    setAmount("");
    setPinInput("");
    setLoginError(message);
  }

  async function login(event) {
    event.preventDefault();
    setLoginError("");
    setBusy(true);
    try {
      const res = await fetch("/api/vendor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slugInput, pin: pinInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Could not sign in.");
        return;
      }
      const v = {
        slug: slugInput.trim().toLowerCase(),
        pin: pinInput.trim(),
        name: data.name,
        plan: data.plan,
      };
      try {
        sessionStorage.setItem(STORE_KEY, JSON.stringify(v));
      } catch {
        // Ignore.
      }
      setVendor(v);
    } catch {
      setLoginError("Could not reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  async function requestPayment() {
    setNotice("");
    setBusy(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ amount: numeric }),
      });
      const data = await res.json();
      if (res.status === 401) {
        signOut("Your session ended. Sign in again.");
        return;
      }
      if (!res.ok) {
        setNotice(data.error || "Could not start the request.");
        return;
      }
      setSale(data.request);
    } catch {
      setNotice("Could not reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setSale(null);
    setAmount("");
    setNotice("");
  }

  async function cancelRequest() {
    if (!sale) return;
    try {
      const res = await fetch(`/api/requests/${sale.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.status === 409) return; // A customer is already approving.
    } catch {
      // If we can't reach the server, still let the vendor move on.
    }
    reset();
  }

  // While a request is active, check on it every 3 seconds.
  useEffect(() => {
    if (!vendor || !saleId) return;
    if (!["open", "pending", "failed"].includes(saleStatus)) return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/requests/${saleId}`, {
          headers: { "x-vendor-slug": vendor.slug, "x-vendor-pin": vendor.pin },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        setSale(data.request);
      } catch {
        // Network blip. Try again on the next tick.
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [vendor, saleId, saleStatus]);

  if (!ready) return null;

  // Sign in
  if (!vendor) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
        <AppHeader backHref="/" />
        <section className="mt-10 rounded-ui border border-line p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-brand">Vendor account</p>
          <h1 className="mt-2 text-2xl font-bold">Vendor sign in</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Sign in to open your payment terminal.
          </p>
          <form onSubmit={login} className="mt-6 flex flex-col gap-4">
            <label className="block">
              <span className="font-bold">Vendor code</span>
              <input
                className={inputClass}
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder="kumasi-mart-7f3a"
                autoCapitalize="none"
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="font-bold">PIN</span>
              <PasswordInput
                inputMode="numeric"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                autoComplete="off"
              />
            </label>
            {loginError && (
              <p className="flex items-start gap-2 text-danger">
                <AlertCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                {loginError}
              </p>
            )}
            <button
              type="submit"
              disabled={busy || !slugInput || !pinInput}
              className="h-14 rounded-ui bg-brand px-5 text-lg font-bold text-white hover:bg-brand-dark disabled:bg-line disabled:text-muted"
            >
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  const gone = sale && ["expired", "cancelled"].includes(sale.status);
  const plan = vendor.plan || "free";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
      <AppHeader>
        <button
          type="button"
          onClick={() => signOut()}
          className="inline-flex items-center gap-1 rounded-ui border border-line px-3 py-2 text-sm font-bold text-muted hover:bg-soft"
        >
          <LogoutIcon className="h-4 w-4" />
          Sign out
        </button>
      </AppHeader>

      <div className="mt-6 flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-soft text-lg font-bold text-brand">
          {vendor.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{vendor.name}</p>
          <span
            className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${
              plan === "premium" ? "border-brand text-brand" : "border-line text-muted"
            }`}
          >
            {plan === "premium" ? "Premium" : "Free"} plan
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-ui bg-soft p-5">
        <p className="text-sm font-bold text-muted">Amount to collect</p>
        <p className="mt-2 text-5xl font-bold">
          <span className="mr-2 text-2xl font-normal text-muted">GH&#8373;</span>
          {sale && !gone ? sale.amount.toFixed(2) : amount || "0"}
        </p>
      </div>

      {(!sale || gone) && (
        <div className="mt-8 flex flex-col gap-4">
          {gone && (
            <p className="flex items-start gap-2 rounded-ui border border-line p-4 text-muted">
              <AlertCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
              {sale.status === "expired"
                ? "That request expired. Enter the amount again."
                : "Request cancelled."}
            </p>
          )}
          <Keypad value={amount} onChange={setAmount} />
          {notice && <p className="text-danger">{notice}</p>}
          <button
            type="button"
            onClick={requestPayment}
            disabled={busy || numeric <= 0}
            className="h-14 rounded-ui bg-brand px-5 text-lg font-bold text-white hover:bg-brand-dark disabled:bg-line disabled:text-muted"
          >
            {busy ? "One moment..." : "Request payment"}
          </button>
        </div>
      )}

      {sale?.status === "open" && (
        <div className="mt-8 flex flex-col gap-4">
          <div className="rounded-ui border border-line p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-soft text-brand">
                <ClockIcon className="h-5 w-5" />
              </span>
              <p className="text-lg font-bold">Waiting for the customer</p>
            </div>
            <p className="mt-1 text-muted">
              Ask them to tap their phone on your card. They will see this amount and
              approve with their MoMo PIN.
            </p>
          </div>
          <button
            type="button"
            onClick={cancelRequest}
            className="h-14 rounded-ui border border-line px-5 font-bold hover:bg-soft"
          >
            Cancel
          </button>
        </div>
      )}

      {sale?.status === "pending" && (
        <div className="mt-8 rounded-ui border border-gold p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-soft text-gold">
              <ClockIcon className="h-5 w-5" />
            </span>
            <p className="text-lg font-bold">Customer is approving</p>
          </div>
          <p className="mt-1">
            A prompt was sent to {sale.maskedPhone}. Waiting for their MoMo PIN.
          </p>
        </div>
      )}

      {sale?.status === "paid" && (
        <div className="mt-8 flex flex-col gap-4">
          <div className="rounded-ui border border-brand p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-soft text-brand">
                <CheckCircleIcon className="h-5 w-5" />
              </span>
              <p className="text-lg font-bold text-brand">Paid</p>
            </div>
            <p className="mt-3">
              GH&#8373; {sale.amount.toFixed(2)} received from {sale.maskedPhone}
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="h-14 rounded-ui bg-brand px-5 text-lg font-bold text-white hover:bg-brand-dark"
          >
            New payment
          </button>
        </div>
      )}

      {sale?.status === "failed" && (
        <div className="mt-8 flex flex-col gap-4">
          <div className="rounded-ui border border-danger p-5">
            <div className="flex items-center gap-3">
              <AlertCircleIcon className="h-6 w-6 shrink-0 text-danger" />
              <p className="text-lg font-bold text-danger">Payment failed</p>
            </div>
            <p className="mt-3">{sale.message || "The payment was not approved."}</p>
            <p className="mt-2 text-sm text-muted">
              The customer can try again on their phone, or you can start a new request.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="h-14 rounded-ui border border-line px-5 font-bold hover:bg-soft"
          >
            New request
          </button>
        </div>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent transactions</h2>
          <ClockIcon className="h-5 w-5 text-muted" />
        </div>
        <div className="mt-3 rounded-ui border border-line p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-soft text-muted">
              <ClockIcon className="h-5 w-5" />
            </span>
            <p className="text-sm leading-relaxed text-muted">
              No transactions yet. Payments will show here.
            </p>
          </div>
          {plan === "free" && (
            <p className="mt-2 text-sm text-muted">
              Free plan shows your last 10 transactions.
              <Link href="/premium" className="ml-1 text-brand underline">
                See Premium
              </Link>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
