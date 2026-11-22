// Web NFC only works in Chrome on Android, over HTTPS.
export function nfcSupported() {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

// Waits for a tag to be tapped and returns its serial number.
export async function readTag(signal) {
  const reader = new NDEFReader();
  await reader.scan({ signal });

  return new Promise((resolve, reject) => {
    reader.onreading = (event) => resolve(event.serialNumber);
    reader.onreadingerror = () =>
      reject(new Error("Could not read this tag. Tap again."));
    signal?.addEventListener("abort", () =>
      reject(new DOMException("Cancelled", "AbortError"))
    );
  });
}
