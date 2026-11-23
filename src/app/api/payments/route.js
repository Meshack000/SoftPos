import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCard, savePayment, toPublic } from "@/lib/store";
import { chargeMobileMoney, mapChargeStatus } from "@/lib/paystack";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const cardId = String(body?.cardId || "").trim();
  const amount = Math.round(Number(body?.amount) * 100) / 100;

  if (!cardId) {
    return NextResponse.json({ error: "Tap a card first." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter an amount above zero." }, { status: 400 });
  }

  const card = getCard(cardId);
  if (!card) {
    return NextResponse.json({ error: "This card isn't recognised." }, { status: 404 });
  }
  if (card.status !== "linked") {
    return NextResponse.json(
      {
        error:
          "This card isn't linked to a MoMo number yet. The customer needs to tap it on their own phone and finish setup.",
      },
      { status: 409 }
    );
  }

  const reference = `sp_${randomUUID().replace(/-/g, "")}`;

  let result;
  try {
    result = await chargeMobileMoney({
      reference,
      amount,
      phone: card.phone,
      network: card.network,
      // Paystack requires an email. We don't collect one, so we make a placeholder.
      email: `${card.phone}@softpos.app`,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message || "Paystack could not start this payment." },
      { status: 502 }
    );
  }

  const mapped = mapChargeStatus(result.data?.status);
  const unsupported = mapped === "unsupported";

  const payment = savePayment({
    reference,
    cardId,
    name: card.name,
    phone: card.phone,
    network: card.network,
    amount,
    status: unsupported ? "failed" : mapped,
    message: unsupported
      ? "This network asked for an extra step that SoftPOS doesn't support yet."
      : result.data?.display_text || "",
    createdAt: Date.now(),
  });

  return NextResponse.json({ ok: true, payment: toPublic(payment) });
}
