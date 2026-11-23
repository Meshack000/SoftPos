// TEMPORARY storage. It lives in server memory, so everything is lost when
// the server restarts. We replace this with a real database before deploying.
const g = globalThis;
if (!g.__softpos) g.__softpos = {};
if (!g.__softpos.cards) g.__softpos.cards = new Map();
if (!g.__softpos.payments) g.__softpos.payments = new Map();

export function saveCard(card) {
  g.__softpos.cards.set(card.cardId, card);
  return card;
}

export function getCard(cardId) {
  return g.__softpos.cards.get(cardId) || null;
}

export function updateCard(cardId, changes) {
  const current = g.__softpos.cards.get(cardId);
  if (!current) return null;
  const next = { ...current, ...changes };
  g.__softpos.cards.set(cardId, next);
  return next;
}

// What the browser is allowed to see. The full number stays on the server.
export function toPublicCard(card) {
  return {
    cardId: card.cardId,
    status: card.status,
    name: card.name || "",
    maskedPhone: card.phone
      ? `${card.phone.slice(0, 3)}****${card.phone.slice(-3)}`
      : "",
    network: card.network || "",
  };
}

export function savePayment(payment) {
  g.__softpos.payments.set(payment.reference, payment);
  return payment;
}

export function getPayment(reference) {
  return g.__softpos.payments.get(reference) || null;
}

export function updatePayment(reference, changes) {
  const current = g.__softpos.payments.get(reference);
  if (!current) return null;
  const next = { ...current, ...changes };
  g.__softpos.payments.set(reference, next);
  return next;
}

export function toPublic(payment) {
  return {
    reference: payment.reference,
    status: payment.status,
    message: payment.message || "",
    amount: payment.amount,
    name: payment.name,
    network: payment.network,
  };
}
