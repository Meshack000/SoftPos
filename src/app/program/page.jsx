"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { nfcSupported, writeCardLink, lockCard } from "@/lib/nfc";
import { NETWORKS, normalizePhone, detectNetwork } from "@/lib/phone";

const inputClass = "mt-1 w-full rounded-ui border border-line px-4 py-3 text-lg";

export default function Program() {
  const [passcode, setPasscode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPhone, setConfirmPhone] = useState("");
  const [network, setNetwork] = useState("");
  const [vendor, setVendor] = useState(null); // { slug, name, pin, payoutName, url }
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("idle"); // idle | writing | written | locking | locked
  const [error, setError] = useState("");
  const controller = useRef(null);

  const isLocal = vendor && /localhost|127\.0\.0\.1/.test(vendor.url);

  function onPhoneChange(value) {
    setPhone(value);
    const clean = normalizePhone(value);
    if (clean) {
      const detected = detectNetwork(clean);
      if (detected) setNetwork(detected);
    }
  }

  async function createVendor(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-passcode": passcode },
        body: JSON.stringify({ name, phone, confirmPhone, network }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create the vendor.");
        return;
      }
      setVendor({
        slug: data.slug,
        name: data.name,
        pin: data.pin,
        payoutName: data.payoutName,
        url: `${window.location.origin}/v/${data.slug}`,
      });
      setStep("idle");
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  function nfcError(err) {
    if (err.name === "NotAllowedError") return "NFC permission was blocked. Allow it and try again.";
    if (err.name === "NotSupportedError") return "This phone can't use NFC, or NFC is turned off.";
    return err.message || "Something went wrong. Try again.";
  }

  async function write() {
    setError("");
    if (!nfcSupported()) {
      setError("NFC isn't available here. Use Chrome on an Android phone with NFC turned on.");
      return;
    }
    controller.current = new AbortController();
    setStep("writing");
    try {
      await writeCardLink(vendor.url, controller.current.signal);
      setStep("written");
    } catch (err) {
      setStep("idle");
      if (err.name !== "AbortError") setError(nfcError(err));
    }
  }

  async function lock() {
    setError("");
    controller.current = new AbortController();
    setStep("locking");
    try {
      await lockCard(controller.current.signal);
      setStep("locked");
    } catch (err) {
      setStep("written");
      if (err.name !== "AbortError") setError(nfcError(err));
    }
  }

  function cancel() {
    controller.current?.abort();
  }

  function another() {
    setVendor(null);
    setName("");
    setPhone("");
    setConfirmPhone("");
    setNetwork("");
    setStep("idle");
    setError("");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
      <Link href="/" className="text-sm text-muted">
        Back
      </Link>
      <h1 className="mt-6 text-2xl font-bold">Set up a vendor card</h1>

      {!vendor && (
        <form onSubmit={createVendor} className="mt-6 flex flex-col gap-4">
          <label className="block">
            <span className="font-bold">Staff passcode</span>
            <input
              type="password"
              className={inputClass}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="font-bold">Vendor business name</span>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kumasi Mart"
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="font-bold">Vendor&rsquo;s MoMo number (where they get paid)</span>
            <input
              className={inputClass}
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              inputMode="tel"
              placeholder="0241234567"
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="font-bold">Type the MoMo number again</span>
            <input
              className={inputClass}
              value={confirmPhone}
              onChange={(e) => setConfirmPhone(e.target.value)}
              inputMode="tel"
              autoComplete="off"
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
          {error && <p className="text-danger">{error}</p>}
          <button
            type="submit"
            disabled={busy || !passcode || !name.trim() || !phone || !confirmPhone || !network}
            className="rounded-ui bg-brand px-5 py-4 text-lg font-bold text-white hover:bg-brand-dark disabled:bg-line disabled:text-muted"
          >
            {busy ? "Creating..." : "Create vendor"}
          </button>
        </form>
      )}

      {vendor && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="rounded-ui border border-gold p-5">
            <p className="font-bold">Give these to {vendor.name}</p>
            <p className="mt-3 text-sm text-muted">Vendor code</p>
            <p className="break-all text-lg font-bold">{vendor.slug}</p>
            <p className="mt-3 text-sm text-muted">Vendor PIN</p>
            <p className="text-3xl font-bold tracking-widest">{vendor.pin}</p>
            <p className="mt-3 text-sm">
              The PIN is shown only once. Copy it now. It can&rsquo;t be viewed again.
            </p>
          </div>

          <div className="rounded-ui border border-line p-5">
            <p className="font-bold">Payout account</p>
            {vendor.payoutName ? (
              <>
                <p className="mt-1 text-lg">{vendor.payoutName}</p>
                <p className="mt-1 text-sm text-muted">
                  This is the name Paystack found for that number. Check that it matches the
                  vendor. If it doesn&rsquo;t, the number is wrong.
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted">
                Paystack did not return an account name, so the number could not be
                checked. Confirm it with the vendor.
              </p>
            )}
          </div>

          <div className="rounded-ui border border-line p-5">
            <p className="font-bold">Link for the card</p>
            <p className="mt-1 break-all text-muted">{vendor.url}</p>
          </div>

          {isLocal && (
            <p className="rounded-ui border border-gold p-4 text-sm">
              This link points to your computer (localhost), so a card written now won&rsquo;t
              work on anyone else&rsquo;s phone. Write real cards from the deployed website.
            </p>
          )}

          {step === "idle" && (
            <button
              type="button"
              onClick={write}
              className="rounded-ui bg-brand px-5 py-4 text-lg font-bold text-white hover:bg-brand-dark"
            >
              Write to a card
            </button>
          )}

          {(step === "writing" || step === "locking") && (
            <div className="flex flex-col gap-2">
              <p className="rounded-ui border border-line p-4">
                Hold the card against the back of this phone.
              </p>
              <button
                type="button"
                onClick={cancel}
                className="rounded-ui border border-line px-5 py-4 font-bold"
              >
                Cancel
              </button>
            </div>
          )}

          {step === "written" && (
            <div className="flex flex-col gap-3">
              <p className="rounded-ui border border-brand p-4 font-bold text-brand">
                Link written to the card.
              </p>
              <button
                type="button"
                onClick={lock}
                className="rounded-ui border border-line px-5 py-4 font-bold"
              >
                Lock the card (cannot be undone)
              </button>
              <p className="text-sm text-muted">
                Locking stops anyone from overwriting the card. Test that the link opens
                correctly before you lock.
              </p>
            </div>
          )}

          {step === "locked" && (
            <p className="rounded-ui border border-brand p-4 font-bold text-brand">
              Card locked. It can no longer be changed.
            </p>
          )}

          {error && <p className="text-danger">{error}</p>}

          <button
            type="button"
            onClick={another}
            className="rounded-ui border border-line px-5 py-4 font-bold"
          >
            Set up another vendor
          </button>
        </div>
      )}
    </main>
  );
}
