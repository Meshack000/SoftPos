// Web NFC only works in Chrome on Android, over HTTPS.
export function nfcSupported() {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

// Writes a link onto a blank tag. The tag must be held against the phone.
export async function writeCardLink(url, signal) {
  const writer = new NDEFReader();
  await writer.write({ records: [{ recordType: "url", data: url }] }, { signal });
}

// Makes a tag permanently read-only. This cannot be undone.
export async function lockCard(signal) {
  const writer = new NDEFReader();
  await writer.makeReadOnly({ signal });
}
