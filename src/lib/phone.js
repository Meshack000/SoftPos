export const NETWORKS = {
  mtn: { label: "MTN MoMo", prefixes: ["024", "025", "053", "054", "055", "059"] },
  vod: { label: "Telecel Cash", prefixes: ["020", "050"] },
  atl: { label: "AirtelTigo Money", prefixes: ["026", "027", "056", "057"] },
};

// Turns +233 24 123 4567, 233241234567 or 241234567 into 0241234567.
// Returns null if it isn't a valid Ghana number.
export function normalizePhone(input) {
  let digits = String(input || "").replace(/\D/g, "");
  if (digits.startsWith("233")) digits = "0" + digits.slice(3);
  else if (digits.length === 9) digits = "0" + digits;
  return /^0\d{9}$/.test(digits) ? digits : null;
}

// Guesses the network from the first 3 digits. Returns null if unknown.
export function detectNetwork(phone) {
  const prefix = phone.slice(0, 3);
  for (const [key, network] of Object.entries(NETWORKS)) {
    if (network.prefixes.includes(prefix)) return key;
  }
  return null;
}
