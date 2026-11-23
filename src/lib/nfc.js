// Web NFC only works in Chrome on Android, over HTTPS.
export function nfcSupported() {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

// Finds the SoftPOS card ID inside the card's NFC message.
// The card holds a link like https://yoursite.com/c/ab12cd34
function cardIdFromMessage(message) {
  const decoder = new TextDecoder();
  for (const record of message.records) {
    if (record.recordType !== "url" && record.recordType !== "text") continue;
    try {
      const text = decoder.decode(record.data);
      const match = text.match(/\/c\/([A-Za-z0-9_-]{6,64})\/?$/);
      if (match) return match[1];
    } catch {
      // Ignore records we can't read.
    }
  }
  return null;
}

// Waits for a card to be tapped and returns its card ID.
export async function readCardId(signal) {
  const reader = new NDEFReader();
  await reader.scan({ signal });

  return new Promise((resolve, reject) => {
    reader.onreading = (event) => {
      const id = cardIdFromMessage(event.message);
      if (id) resolve(id);
      else reject(new Error("This card isn't set up for SoftPOS."));
    };
    reader.onreadingerror = () =>
      reject(new Error("Could not read this card. Tap again."));
    signal?.addEventListener("abort", () =>
      reject(new DOMException("Cancelled", "AbortError"))
    );
  });
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
