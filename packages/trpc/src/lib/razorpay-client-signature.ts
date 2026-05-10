import crypto from 'node:crypto';

/** HMAC-SHA256 hex digest Razorpay uses for order|payment client-side verification. */
export function computeRazorpayClientSignature(opts: {
  secret: string;
  orderId: string;
  paymentId: string;
}): string {
  const msg = `${opts.orderId}|${opts.paymentId}`;
  return crypto.createHmac('sha256', opts.secret).update(msg).digest('hex');
}

/** Constant-time compare of HMAC hex digests (defense in depth vs string `!==`). */
export function verifyRazorpayClientSignature(opts: {
  secret: string;
  orderId: string;
  paymentId: string;
  clientSignature: string;
}): boolean {
  const expected = computeRazorpayClientSignature({
    secret: opts.secret,
    orderId: opts.orderId,
    paymentId: opts.paymentId,
  });
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(opts.clientSignature.trim(), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
