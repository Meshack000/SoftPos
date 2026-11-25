"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NETWORKS, normalizePhone, detectNetwork } from "@/lib/phone";

const PHONE_KEY = "softpos_phone";
const WAIT_LIMIT_MS = 190000; // Paystack gives the customer 180 seconds
const inputClass = "mt-1 w-full rounded-ui border border-line px-4 py-3 text-lg";

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
      {view === "loading" && <p className="text-muted">Loading...</p>}

      {view === "missing" && (
        <div className="rounded-ui border border-danger p-5">
          <p className="text-lg font-bold text-danger">{message}</p>
          <p className="mt-1">Check that you tapped the right card.</p>
        </div>
      )}

      {view === "ready" && (
        <>
          <p className="text-muted">Pay</p>
          <h1 className="text-2xl font-bold">{vendorName}</h1>

          {!sale && (
            <div className="mt-6 rounded-ui border border-line p-5">
              <p className="text-lg font-bold">Waiting for the vendor</p>
              <p className="mt-1 text-muted">
                The vendor needs to enter the amount first. This page updates by itself.
              </p>
            </div>
          )}

          {sale && (
            <form onSubmit={pay} className="mt-6 flex flex-col gap-5">
              <p className="text-5xl font-bold">GH&#8373; {sale.amount.toFixed(2)}</p>

              <label className="block">
                <span className="font-bold">Your MoMo number</span>
                <input
                  className={inputClass}
                  value={phone}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  inputMode="tel"
                  placeholder="0241234567"
                  autoComplete="tel"
                />
              </label>

              <label className="block">
                <span className="font-bold">Network</span>
                <select
                  className={inputClass}
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                >
                  <option value="">Choose a network</option>
                  {Object.entries(NETWORKS).map(([key, n]) => (
                    <option key={key} value={key}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </label>

              <p className="text-sm text-muted">
                Check the name and amount above. You will get a prompt on this number and
                approve with your MoMo PIN.
              </p>

              {error && <p className="text-danger">{error}</p>}

              <button
                type="submit"
                disabled={!phone || !network}
                className="rounded-ui bg-brand px-5 py-4 text-lg font-bold text-white hover:bg-brand-dark disabled:bg-line disabled:text-muted"
              >
                Pay GH&#8373; {sale.amount.toFixed(2)}
              </button>
            </form>
          )}

          {!sale && error && <p className="mt-4 text-danger">{error}</p>}
        </>
      )}

      {view === "sending" && (
        <div className="rounded-ui border border-line p-5">
          <p className="text-lg font-bold">Sending the request</p>
          <p className="mt-1 text-muted">One moment.</p>
        </div>
      )}

      {view === "pending" && payment && (
        <div className="rounded-ui border border-gold p-5">
          <p className="text-lg font-bold">Approve on your phone</p>
          <p className="mt-1">
            A prompt for GH&#8373; {payment.amount.toFixed(2)} to {payment.vendorName} was
            sent to your {NETWORKS[payment.network]?.label} number. Enter your MoMo PIN to
            approve.
          </p>
          {message && <p className="mt-2 text-sm text-muted">{message}</p>}
        </div>
      )}

      {view === "success" && payment && (
        <div className="rounded-ui border border-brand p-5">
          <p className="text-lg font-bold text-brand">Payment complete</p>
          <p className="mt-1">
            GH&#8373; {payment.amount.toFixed(2)} paid to {payment.vendorName}.
          </p>
        </div>
      )}

      {view === "failed" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-ui border border-danger p-5">
            <p className="text-lg font-bold text-danger">Payment failed</p>
            <p className="mt-1">{message || "The payment was not approved."}</p>
          </div>
          <button
            type="button"
            onClick={tryAgain}
            className="rounded-ui border border-line px-5 py-4 font-bold"
          >
            Try again
          </button>
        </div>
      )}
    </main>
  );
}
