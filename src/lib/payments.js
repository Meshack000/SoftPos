import { getPayment, updatePayment, getRequest, updateRequest } from "@/lib/store";
import { verifyTransaction, mapVerifyStatus } from "@/lib/paystack";

// If a payment is still pending, ask Paystack directly for its final status.
// This also works on localhost, where Paystack's webhook can't reach us.
export async function refreshPayment(reference) {
  let payment = await getPayment(reference);
  if (!payment) return null;

  if (payment.status === "pending") {
    try {
      const check = await verifyTransaction(reference);
      if (check.ok) {
        const status = mapVerifyStatus(check.data?.status);
        const amountMatches = check.data?.amount === Math.round(payment.amount * 100);

        if (status === "success" && amountMatches) {
          payment = await updatePayment(reference, { status: "success", message: "" });
        } else if (status === "failed") {
          payment = await updatePayment(reference, {
            status: "failed",
            message: check.data?.gateway_response || "The payment was not approved.",
          });
        }
      }
    } catch {
      // Try again on the next check.
    }
  }
  return payment;
}

// Brings a sale request up to date with its payment.
export async function syncRequest(requestId) {
  let request = await getRequest(requestId);
  if (!request) return null;

  if (request.status === "pending" && request.reference) {
    const payment = await refreshPayment(request.reference);
    if (payment?.status === "success") {
      request = await updateRequest(requestId, { status: "paid", message: "" });
    } else if (payment?.status === "failed") {
      request = await updateRequest(requestId, { status: "failed", message: payment.message });
    }
  }
  return request;
}
