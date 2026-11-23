import { NextResponse } from "next/server";
import { getCard, updateCard, toPublicCard } from "@/lib/store";
import { NETWORKS, normalizePhone } from "@/lib/phone";

export async function GET(_request, { params }) {
  const { id } = await params;
  const card = getCard(id);
  if (!card) {
    return NextResponse.json({ error: "This card isn't recognised." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, card: toPublicCard(card) });
}

// The customer links their own MoMo number to the card.
export async function POST(request, { params }) {
  const { id } = await params;
  const card = getCard(id);
  if (!card) {
    return NextResponse.json({ error: "This card isn't recognised." }, { status: 404 });
  }
  if (card.status !== "new") {
    return NextResponse.json(
      { error: "This card is already linked to a number." },
      { status: 409 }
    );
  }

  const body = await request.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const phone = normalizePhone(body?.phone);
  const network = String(body?.network || "");

  if (!name) {
    return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json(
      { error: "Enter a valid Ghana mobile number, like 0241234567." },
      { status: 400 }
    );
  }
  if (!NETWORKS[network]) {
    return NextResponse.json({ error: "Choose your MoMo network." }, { status: 400 });
  }

  const updated = updateCard(id, { status: "linked", name, phone, network });
  return NextResponse.json({ ok: true, card: toPublicCard(updated) });
}
