"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Keypad from "@/components/Keypad";
import { nfcSupported, readCardId } from "@/lib/nfc";
import { NETWORKS } from "@/lib/phone";

const WAIT_LIMIT_MS = 190000; // Paystack gives the customer 180 seconds

export default function Terminal() {
  const [amount, setAmount] = useState("");
  // entry | tapping | sending | pending | success | failed
  const [status, setStatus] = useState("entry");
  const [payment, setPayment] = useState(null);
  const [message, setMessage] = useState("");
  const [testId, setTestId] = useState("");
  const controller = useRef(null);

  const numeric = parseFloat(amount) || 0;
  const reference = payment?.reference;

  function fail(text) {
    setMessage(text);
    setStatus("failed");
  }

  async function pay(cardId) {
    setStatus("sending");
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, amount: numeric }),
      });
      const data = await res.json();
      if (!res.ok) {
        fail(data.error || "The payment could not be started.");
        return;
      }
      setPayment(data.payment);
      setMessage(data.payment.message || "");
      setStatus(data.payment.status);
    } catch {
      fail("Could not reach the server. Check your connection.");
    }
  }

  async function startTap() {
    if (!nfcSupported()) {
      fail(
        "NFC reading isn't available here. Use Chrome on an Android phone with NFC turned on."
      );
      return;
    }

    controller.current = new AbortController();
    setStatus("tapping");

    try {
      const id = await readCardId(controller.current.signal);
      await pay(id);
    } catch (err) {
      if (err.name === "AbortError") return;
      fail(
        err.name === "NotAllowedError"
          ? "NFC permission was blocked. Allow it and try again."
          : err.message
      );
    }
  }

  function cancelTap() {
    controller.current?.abort();
    setStatus("entry");
  }

  function newPayment() {
    setAmount("");
    setPayment(null);
    setMessage("");
    setStatus("entry");
  }

  // While the customer is entering their PIN, check on the payment every 3 seconds.
  useEffect(() => {
    if (status !== "pending" || !reference) return;

    const started = Date.now();
    const timer = setInterval(async () => {
      if (Date.now() - started > WAIT_LIMIT_MS) {
        clearInterval(timer);
        fail("No approval received. The customer may not have entered their PIN in time.");
        return;
      }
      try {
        const res = await fetch(`/api/payments/${reference}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          clearInterval(timer);
          fail(data.error || "Lost track of this payment.");
          return;
        }
        if (data.payment.status !== "pending") {
          clearInterval(timer);
          setPayment(data.payment);
          setMessage(data.payment.message || "");
          setStatus(data.payment.status);
        }
      } catch {
        // Network blip. Try again on the next tick.
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [status, reference]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
      <Link href="/" className="text-sm text-muted">
        Back
      </Link>

      <div className="mt-6">
        <p className="text-sm text-muted">Amount to collect</p>
        <p className="mt-1 text-5xl font-bold">GH&#8373; {amount || "0"}</p>
      </div>

      {status === "entry" && (
        <div className="mt-8 flex flex-col gap-4">
          <Keypad value={amount} onChange={setAmount} />
          <button
            type="button"
            onClick={startTap}
            disabled={numeric <= 0}
            className="rounded-ui bg-brand px-5 py-4 text-lg font-bold text-white hover:bg-brand-dark disabled:bg-line disabled:text-muted"
          >
            Tap to pay
          </button>

          {/* Testing only. We remove this once we test on a real phone. */}
          <div className="rounded-ui border border-line p-4">
            <p className="text-sm font-bold">Testing without a tag</p>
            <p className="mt-1 text-sm text-muted">
              Paste a card ID from the Set up a card page.
            </p>
            <input
              className="mt-2 w-full rounded-ui border border-line px-3 py-2"
              value={testId}
              onChange={(e) => setTestId(e.target.value.trim())}
              placeholder="Card ID"
              autoComplete="off"
            />
            <button
              type="button"
              disabled={numeric <= 0 || !testId}
              onClick={() => pay(testId)}
              className="mt-2 text-sm text-muted underline disabled:opacity-40"
            >
              Simulate a tap
            </button>
          </div>
        </div>
      )}

      {status === "tapping" && (
        <div className="mt-8 flex flex-col gap-4">
          <div className="rounded-ui border border-line p-5">
            <p className="text-lg font-bold">Waiting for the card</p>
            <p className="mt-1 text-muted">
              Hold the customer&rsquo;s card against the back of this phone.
            </p>
          </div>
          <button
            type="button"
            onClick={cancelTap}
            className="rounded-ui border border-line px-5 py-4 font-bold"
          >
            Cancel
          </button>
        </div>
      )}

      {status === "sending" && (
        <div className="mt-8 rounded-ui border border-line p-5">
          <p className="text-lg font-bold">Sending the request</p>
          <p className="mt-1 text-muted">One moment.</p>
        </div>
      )}

      {status === "pending" && payment && (
        <div className="mt-8 rounded-ui border border-gold p-5">
          <p className="text-lg font-bold">
            Waiting for {payment.name} to approve
          </p>
          <p className="mt-1">
            A prompt was sent to their {NETWORKS[payment.network]?.label} phone.
            Ask them to enter their MoMo PIN.
          </p>
          {message && <p className="mt-2 text-sm text-muted">{message}</p>}
        </div>
      )}

      {status === "success" && payment && (
        <div className="mt-8 flex flex-col gap-4">
          <div className="rounded-ui border border-brand p-5">
            <p className="text-lg font-bold text-brand">Paid</p>
            <p className="mt-1">
              GH&#8373; {payment.amount.toFixed(2)} from {payment.name}
            </p>
          </div>
          <button
            type="button"
            onClick={newPayment}
            className="rounded-ui bg-brand px-5 py-4 text-lg font-bold text-white hover:bg-brand-dark"
          >
            New payment
          </button>
        </div>
      )}

      {status === "failed" && (
        <div className="mt-8 flex flex-col gap-4">
          <div className="rounded-ui border border-danger p-5">
            <p className="text-lg font-bold text-danger">Payment failed</p>
            <p className="mt-1">{message || "The payment was not approved."}</p>
          </div>
          <button
            type="button"
            onClick={() => setStatus("entry")}
            className="rounded-ui border border-line px-5 py-4 font-bold"
          >
            Try again
          </button>
        </div>
      )}
    </main>
  );
}
