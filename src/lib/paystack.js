const PAYSTACK_API = "https://api.paystack.co";

export function mapChargeStatus(status) {
  if (!status) return "failed";
  const normalized = String(status).toLower();
  if (["success", "successful", "paid"].includes(normalized)) return "success";
  if (["pending", "pay_offline", "ongoing", "processing", "send_otp"].includes(normalized)) {
    return "pending";
  }
  if (["failed", "abandoned", "reversed", "cancelled", "canceled"].includes(normalized)) {
    return "failed";
  }
  return "unsupported";
}

async function paystackRequest(path, options = {}) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY is missing. Add it to .env.local and restart the server.");
  }

  const res = await fetch(`${PAYSTACK_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);

  if (!res.ok || !data) {
    const message = data?.message || `Paystack returned HTTP ${res.status}.`;
    throw new Error(message);
  }
  return data;
}

export async function chargeMobileMoney({ reference, amount, phone, network, email }) {
  const providers = {
    mtn: "mtn",
    vodafone: "vod",
    airteltigo: "tgo",
  };
  const provider = providers[network];
  if (!provider) return { ok: false, message: "This mobile money network isn't supported." };

  try {
    const data = await paystackRequest("/charge", {
      method: "POST",
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        currency: "GHS",
        reference,
        mobile_money: { phone, provider },
      }),
    });
    if (!data.status) return { ok: false, message: data.message };
    return { ok: true, data: data.data };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

export async function getMobileMoneyStatus(reference) {
  const data = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
  return data.data || null;
}
