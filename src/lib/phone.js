export const NETWORKS = {
  mtn: { label: "MTN MoMo", prefixes: ["024", "025", "053", "054", "055", "059"] },
  vodafone: { label: "Telecel/Vodafone Cash", prefixes: ["020", "050"] },
  airteltigo: { label: "AirtelTigo Money", prefixes: ["026", "027", "056", "057"] },
};

export function normalizePhone(value) {
  let phone = String(value || "").replace(/\D/g, "");
  if (phone.startsWith("233")) phone = `0${phone.slice(3)}`;
  if (!phone.startsWith("0")) phone = `0${phone}`;
  return /^0\d{9}$/.test(phone) ? phone : "";
}

export function detectNetwork(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return "";
  const prefix = normalized.slice(0, 3);
  for (const [key, network] of Object.entries(NETWORKS)) {
    if (network.prefixes.includes(prefix)) return key;
  }
  return "";
}
