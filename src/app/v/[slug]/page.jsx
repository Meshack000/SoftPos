"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NETWORKS, normalizePhone, detectNetwork } from "@/lib/phone";
import {
  AlertCircleIcon,
  CheckIcon,
  LockIcon,
  PhoneIcon,
  XIcon,
} from "@/components/Icons";

const PHONE_KEY = "softpos_phone";
const WAIT_LIMIT_MS = 190000; // Paystack gives the customer 180 seconds
const inputClass = "mt-1 w-full rounded-ui border border-line py-3 pl-11 pr-4 text-lg";

export default function BuyerPage() {
  const { slug } = useParams();
  // loading | missing | ready | sending | pending | success | failed
  const [view, setView] = useState("loading");
  const [vendorName, setVendorName] = useState("");
  const [sale, setSale] = useState(null);
  const [payment, setPayment] = useState(null);
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reference = payment?.reference;

  async function loadSale() {
    try {
      const res = await fetch(`/api/v/${slug}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "This card isn't recognised.");
        setView("missing");
        return;
      }
      setVendorName(data.vendor.name);
      setSale(data.request);
      setView((v) => (v === "loading" || v === "ready" ? "ready" : v));
    } catch {
      setError("Could not reach the server. Check your connection.");
      setView((v) => (v === "loading" ? "ready" : v));
    }
  }

  // First load, and remember the customer's number on this phone.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PHONE_KEY);
      if (saved) {
        setPhone(saved);
        const clean = normalizePhone(saved);
        const detected = clean ? detectNetwork(clean) : null;
        if (detected) setNetwork(detected);
      }
    } catch {
      // Ignore.
    }
    loadSale();
  }, [slug]);

  // While waiting for the vendor's amount, refresh every 3 seconds.
  useEffect(() => {
    if (view !== "ready") return;
    const timer = setInterval(loadSale, 3000);
    return () => clearInterval(timer);
  }, [view, slug]);

  function onPhoneChange(value) {
    setPhone(value);
    const clean = normalizePhone(value);
    if (clean) {
      const detected = detectNetwork(clean);
      if (detected) setNetwork(detected);
    }
  }

  async function pay(event) {
    event.preventDefault();
    setError("");
    if (!sale) return;
    setView("sending");
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: sale.id, phone, network }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "The payment could not be started.");
        setView("ready");
        loadSale();
        return;
      }
      try {
        localStorage.setItem(PHONE_KEY, phone);
      } catch {
        // Ignore.
      }
      setPayment(data.payment);
      setMessage(data.payment.message || "");
      setView(data.payment.status === "pending" ? "pending" : data.payment.status);
    } catch {
      setError("Could not reach the server. Check your connection.");
      setView("ready");
    }
  }

  function tryAgain() {
    setPayment(null);
    setMessage("");
    setError("");
    setView("ready");
    loadSale();
  }

  // While the customer enters their PIN, check the payment every 3 seconds.
  useEffect(() => {
    if (view !== "pending" || !reference) return;

    const started = Date.now();
    const timer = setInterval(async () => {
      if (Date.now() - started > WAIT_LIMIT_MS) {
        clearInterval(timer);
        setMessage("No approval received. Check your phone for the prompt and try again.");
        setView("failed");
        return;
      }
      try {
        const res = await fetch(`/api/payments/${reference}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          clearInterval(timer);
          setMessage(data.error || "Lost track of this payment.");
          setView("failed");
          return;
        }
        if (data.payment.status !== "pending") {
          clearInterval(timer);
          setPayment(data.payment);
          setMessage(data.payment.message || "");
          setView(data.payment.status);
        }
      } catch {
        // Network blip. Try again on the next tick.
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [view, reference]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
      <header className="mb-8 flex items-center justify-between">
        <span className="text-sm font-bold">SoftPOS</span>
        <span className="flex items-center gap-1.5 text-sm text-muted">
          <LockIcon className="h-4 w-4" />
          Mobile money payment
        </span>
      </header>

      {view === "loading" && <p className="text-muted">Loading...</p>}

      {view === "missing" && (
        <div className="rounded-ui border border-danger p-5">
          <AlertCircleIcon className="mb-3 h-6 w-6 text-danger" />
          <p className="text-lg font-bold text-danger">{message}</p>
          <p className="mt-1">Check that you tapped the right card.</p>
        </div>
      )}

      {view === "ready" && (
        <>
          <p className="text-sm text-muted">Pay</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-xl font-bold text-white">
              {vendorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">{vendorName}</h1>
              <p className="text-muted">is requesting a payment</p>
            </div>
          </div>

          {!sale && (
            <div className="mt-6 rounded-ui border border-line p-5">
              <div className="flex items-center gap-3">
                <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-line border-t-brand motion-reduce:animate-none" />
                <p className="text-lg font-bold">Waiting for the vendor</p>
              </div>
              <p className="mt-1 text-muted">
                The vendor needs to enter the amount first. This page updates by itself.
              </p>
            </div>
          )}

          {sale && (
            <form onSubmit={pay} className="mt-6 flex flex-col gap-5">
              <div className="rounded-ui bg-soft p-5">
                <p className="text-sm text-muted">Amount to pay</p>
                <p className="mt-1 text-5xl font-bold">
                  <span className="mr-2 text-2xl font-normal text-muted">GH&#8373;</span>
                  {sale.amount.toFixed(2)}
                </p>
              </div>

              <label className="block">
                <span className="font-bold">Your MoMo number</span>
                <span className="relative block">
                  <PhoneIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                  <input
                    className={inputClass}
                    value={phone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    inputMode="tel"
                    placeholder="0241234567"
                    autoComplete="tel"
                  />
                </span>
              </label>

              <div>
                <span className="font-bold">Network</span>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {Object.entries(NETWORKS).map(([key]) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={network === key}
                      onClick={() => setNetwork(key)}
                      className={`relative flex min-h-14 items-center justify-center gap-2 rounded-ui px-2 py-3 text-sm font-bold ${
                        network === key
                          ? "border-2 border-brand"
                          : "border border-line"
                      }`}
                    >
                      {network === key && (
                        <CheckIcon className="absolute right-1 top-1 h-4 w-4 text-brand" />
                      )}
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            key === "mtn" ? "#FFCC00" : key === "vod" ? "#E60000" : "#0057B8",
                        }}
                      />
                      {key === "mtn" ? "MTN" : key === "vod" ? "Telecel" : "AirtelTigo"}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-sm text-muted">
                Check the name and amount above. You will get a prompt on this number and
                approve with your MoMo PIN.
              </p>

              {error && <p className="text-danger">{error}</p>}

              <button
                type="submit"
                disabled={!phone || !network}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-ui bg-brand px-5 text-lg font-bold text-white hover:bg-brand-dark disabled:bg-line disabled:text-muted"
              >
                <LockIcon className="h-5 w-5" />
                Pay GH&#8373; {sale.amount.toFixed(2)}
              </button>
              <p className="-mt-3 text-sm text-muted">
                You will get a prompt on your phone. Approve it with your MoMo PIN.
              </p>
            </form>
          )}

          {!sale && error && <p className="mt-4 text-danger">{error}</p>}
        </>
      )}

      {view === "sending" && (
        <div className="flex flex-col items-center py-12 text-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand motion-reduce:animate-none" />
          <p className="mt-5 text-lg font-bold">Sending the request</p>
          <p className="mt-1 text-muted">One moment.</p>
        </div>
      )}

      {view === "pending" && payment && (
        <div className="rounded-ui border border-gold p-5">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-soft text-brand">
            <PhoneIcon className="h-7 w-7" />
          </div>
          <p className="text-lg font-bold">Approve on your phone</p>
          <ol className="mt-4 flex flex-col gap-3">
            {[
              "Look for the MoMo prompt",
              "Enter your MoMo PIN",
              "Wait for confirmation",
            ].map((step, index) => (
              <li key={step} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-soft text-sm font-bold text-muted">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-4">
            A prompt for GH&#8373; {payment.amount.toFixed(2)} to {payment.vendorName} was
            sent to your {NETWORKS[payment.network]?.label} number. Enter your MoMo PIN to
            approve.
          </p>
          {message && <p className="mt-2 text-sm text-muted">{message}</p>}
        </div>
      )}

      {view === "success" && payment && (
        <div className="flex flex-col items-center rounded-ui border border-brand p-5 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-brand text-white">
            <CheckIcon className="h-8 w-8" />
          </div>
          <p className="mt-5 text-2xl font-bold">Payment complete</p>
          <p className="mt-2 text-4xl font-bold">GH&#8373; {payment.amount.toFixed(2)}</p>
          <p className="mt-1 text-muted">Paid to {payment.vendorName}</p>
          <p className="mt-2 text-sm text-muted">{new Date().toLocaleString()}</p>
        </div>
      )}

      {view === "failed" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex w-full flex-col items-center rounded-ui border border-danger p-5 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-danger text-danger">
              <XIcon className="h-8 w-8" />
            </div>
            <p className="mt-4 text-lg font-bold text-danger">Payment failed</p>
            <p className="mt-1">{message || "The payment was not approved."}</p>
          </div>
          <button
            type="button"
            onClick={tryAgain}
            className="h-14 w-full rounded-ui bg-brand px-5 font-bold text-white hover:bg-brand-dark"
          >
            Try again
          </button>
        </div>
      )}
    </main>
  );
}
