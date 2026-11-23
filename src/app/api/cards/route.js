import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { saveCard } from "@/lib/store";

// Creates a new, unlinked card. Staff only.
export async function POST(request) {
  const expected = process.env.ADMIN_PASSCODE;
  const given = request.headers.get("x-admin-passcode");

  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSCODE is missing. Add it to .env.local and restart the server." },
      { status: 500 }
    );
  }
  if (given !== expected) {
    return NextResponse.json({ error: "Wrong passcode." }, { status: 401 });
  }

  const cardId = randomBytes(6).toString("base64url");
  saveCard({ cardId, status: "new", createdAt: Date.now() });
  return NextResponse.json({ ok: true, cardId });
}
