"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Keypad from "@/components/Keypad";
import { nfcSupported, readTag } from "@/lib/nfc";

export default function Terminal() {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("entry"); // entry | waiting | read | error
  const [tagId, setTagId] = useState("");
  const [message, setMessage] = useState("");
  const controller = useRef(null);

  const numeric = parseFloat(amount) || 0;

  async function startTap() {
    if (!nfcSupported()) {
      setStatus("error");
      setMessage(
        "NFC reading isn't available here. Use Chrome on an Android phone with NFC turned on."
      );
      return;
    }

    controller.current = new AbortController();
    setStatus("waiting");

    try {
      const id = await readTag(controller.current.signal);
      setTagId(id);
      setStatus("read");
    } catch (err) {
      if (err.name === "AbortError") return;
      setStatus("error");
      setMessage(
        err.name === "NotAllowedError"
          ? "NFC permission was blocked. Allow it and try again."
          : err.message
      );
    }
  }

  function cancel() {
    controller.current?.abort();
    setStatus("entry");
  }

  function reset() {
    setAmount("");
    setTagId("");
    setMessage("");
    setStatus("entry");
  }

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
          <button
            type="button"
            disabled={numeric <= 0}
            onClick={() => {
              setTagId("04:A2:3F:1B:6C:80");
              setStatus("read");
            }}
            className="text-sm text-muted underline disabled:opacity-40"
          >
            Simulate a tap (testing)
          </button>
        </div>
      )}

      {status === "waiting" && (
        <div className="mt-8 flex flex-col gap-4">
          <div className="rounded-ui border border-line p-5">
            <p className="text-lg font-bold">Waiting for the tag</p>
            <p className="mt-1 text-muted">
              Hold the customer&rsquo;s tag against the back of this phone.
            </p>
          </div>
          <button
            type="button"
            onClick={cancel}
            className="rounded-ui border border-line px-5 py-4 font-bold"
          >
            Cancel
          </button>
        </div>
      )}

      {status === "read" && (
        <div className="mt-8 flex flex-col gap-4">
          <div className="rounded-ui border border-line p-5">
            <p className="text-lg font-bold">Tag read</p>
            <p className="mt-1 break-all text-muted">{tagId}</p>
            <p className="mt-3 text-sm text-muted">
              Next step: look up this tag and send the MoMo prompt.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-ui border border-line px-5 py-4 font-bold"
          >
            Start a new payment
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="mt-8 flex flex-col gap-4">
          <div className="rounded-ui border border-danger p-5">
            <p className="text-lg font-bold text-danger">Couldn&rsquo;t read the tag</p>
            <p className="mt-1">{message}</p>
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
