"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NETWORKS, normalizePhone, detectNetwork } from "@/lib/phone";

const inputClass = "mt-1 w-full rounded-ui border border-line px-4 py-3 text-lg";

export default function CustomerCard() {
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justLinked, setJustLinked] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/cards/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) setLoadError(data.error || "Could not load this card.");
        else setCard(data.card);
      } catch {
        setLoadError("Could not reach the server. Check your connection.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function onPhoneChange(value) {
    setPhone(value);
    const clean = normalizePhone(value);
    if (clean) {
      const detected = detectNetwork(clean);
      if (detected) setNetwork(detected);
    }
  }

  async function link(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/cards/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, network }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save. Try again.");
        return;
      }
      setCard(data.card);
      setJustLinked(true);
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
      <h1 className="text-2xl font-bold">SoftPOS card</h1>

      {loading && <p className="mt-6 text-muted">Loading...</p>}

      {!loading && loadError && (
        <div className="mt-6 rounded-ui border border-danger p-5">
          <p className="font-bold text-danger">{loadError}</p>
          <p className="mt-1">Check that you tapped the right card, or ask the person who gave it to you.</p>
        </div>
      )}

      {!loading && card?.status === "linked" && (
        <div className="mt-6 rounded-ui border border-brand p-5">
          <p className="text-lg font-bold text-brand">
            {justLinked ? "Your card is ready" : "This card is active"}
          </p>
          <p className="mt-2 text-lg">{card.name}</p>
          <p className="text-muted">
            {card.maskedPhone} &middot; {NETWORKS[card.network]?.label}
          </p>
          <p className="mt-3">
            Tap it at a vendor. You will get a prompt on this number and approve with your
            MoMo PIN. Nobody can take money without your PIN.
          </p>
        </div>
      )}

      {!loading && card?.status === "new" && (
        <form onSubmit={link} className="mt-6 flex flex-col gap-5">
          <p>Link this card to your own mobile money number.</p>

          <label className="block">
            <span className="font-bold">Your name</span>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>

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
            <span className="mt-1 block text-sm text-muted">
              We guess this from your number. Change it if you moved networks.
            </span>
          </label>

          {error && <p className="text-danger">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-ui bg-brand px-5 py-4 text-lg font-bold text-white hover:bg-brand-dark disabled:bg-line disabled:text-muted"
          >
            {saving ? "Saving..." : "Link my card"}
          </button>
        </form>
      )}
    </main>
  );
}
