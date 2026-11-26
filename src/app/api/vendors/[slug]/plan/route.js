import { NextResponse } from "next/server";
import { setVendorPlan } from "@/lib/store";
import { safe } from "@/lib/http";

export const POST = safe(async (request, { params }) => {
  if (request.headers.get("x-admin-passcode") !== process.env.ADMIN_PASSCODE) {
    return NextResponse.json({ error: "Wrong passcode." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const plan = body?.plan;
  if (plan !== "free" && plan !== "premium") {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const { slug } = await params;
  const vendor = await setVendorPlan(slug, plan);
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, plan: vendor.plan });
});
