import { computeRazorpayWebhookSignature, verifyRazorpayWebhookSignature } from './razorpay-webhook';

describe('Razorpay webhook signature', () => {
  it('verifies correct signature', () => {
    const secret = 'test_secret';
    const body = Buffer.from(JSON.stringify({ hello: 'world' }));
    const sig = computeRazorpayWebhookSignature({ secret, body });

    expect(
      verifyRazorpayWebhookSignature({
        secret,
        body,
        signatureHeader: sig,
      }),
    ).toBe(true);
  });

  it('rejects missing or invalid signature', () => {
    const secret = 'test_secret';
    const body = Buffer.from(JSON.stringify({ hello: 'world' }));
    const sig = computeRazorpayWebhookSignature({ secret, body });

    expect(
      verifyRazorpayWebhookSignature({
        secret,
        body,
        signatureHeader: undefined,
      }),
    ).toBe(false);

    expect(
      verifyRazorpayWebhookSignature({
        secret,
        body,
        signatureHeader: `${sig}x`,
      }),
    ).toBe(false);
  });
});

