"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { nfcSupported, writeCardLink, lockCard } from "@/lib/nfc";

const inputClass = "mt-1 w-full rounded-ui border border-line px-4 py-3 text-lg";

export default function Program() {
  const [passcode, setPasscode] = useState("");
  const [card, setCard] = useState(null); // { cardId, url }
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("idle"); // idle | writing | written | locking | locked
  const [error, setError] = useState("");
  const controller = useRef(null);

  const isLocal = card && /localhost|127\.0\.0\.1/.test(card.url);

  async function createCard() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "x-admin-passcode": passcode },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create the card.");
        return;
      }
      setCard({
        cardId: data.cardId,
        url: `${window.location.origin}/c/${data.cardId}`,
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
      await writeCardLink(card.url, controller.current.signal);
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
    setCard(null);
    setStep("idle");
    setError("");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
      <Link href="/" className="text-sm text-muted">
        Back
      </Link>
      <h1 className="mt-6 text-2xl font-bold">Set up a card</h1>

      {!card && (
        <div className="mt-6 flex flex-col gap-4">
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
          {error && <p className="text-danger">{error}</p>}
          <button
            type="button"
            onClick={createCard}
            disabled={busy || !passcode}
            className="rounded-ui bg-brand px-5 py-4 text-lg font-bold text-white hover:bg-brand-dark disabled:bg-line disabled:text-muted"
          >
            {busy ? "Creating..." : "Create a card"}
          </button>
        </div>
      )}

      {card && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="rounded-ui border border-line p-5">
            <p className="font-bold">Card ID</p>
            <p className="mt-1 break-all text-lg">{card.cardId}</p>
            <p className="mt-3 font-bold">Link for the tag</p>
            <p className="mt-1 break-all text-muted">{card.url}</p>
          </div>

          {isLocal && (
            <p className="rounded-ui border border-gold p-4 text-sm">
              This link points to your computer (localhost), so a tag written now won&rsquo;t
              work on anyone else&rsquo;s phone. Write real tags from the deployed website.
            </p>
          )}

          {step === "idle" && (
            <button
              type="button"
              onClick={write}
              className="rounded-ui bg-brand px-5 py-4 text-lg font-bold text-white hover:bg-brand-dark"
            >
              Write to a tag
            </button>
          )}

          {(step === "writing" || step === "locking") && (
            <div className="flex flex-col gap-2">
              <p className="rounded-ui border border-line p-4">
                Hold the tag against the back of this phone.
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
                Link written to the tag.
              </p>
              <button
                type="button"
                onClick={lock}
                className="rounded-ui border border-line px-5 py-4 font-bold"
              >
                Lock the tag (cannot be undone)
              </button>
              <p className="text-sm text-muted">
                Locking stops anyone from overwriting the tag. Only lock after you have
                tested that the link opens correctly.
              </p>
            </div>
          )}

          {step === "locked" && (
            <p className="rounded-ui border border-brand p-4 font-bold text-brand">
              Tag locked. It can no longer be changed.
            </p>
          )}

          {error && <p className="text-danger">{error}</p>}

          <button
            type="button"
            onClick={another}
            className="rounded-ui border border-line px-5 py-4 font-bold"
          >
            Set up another card
          </button>
        </div>
      )}
    </main>
  );
}
