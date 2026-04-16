import {
  computeRazorpayWebhookSignature,
  rollupLawyerInvoiceStatus,
  verifyRazorpayWebhookSignature,
} from './razorpay-webhook';

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

describe('rollupLawyerInvoiceStatus (invoice webhook path)', () => {
  it('marks paid when sum covers total', () => {
    expect(
      rollupLawyerInvoiceStatus({
        previousStatus: 'sent',
        totalInr: 1180,
        paidSumInr: 1180,
      }),
    ).toBe('paid');
  });

  it('marks partially_paid when sum is positive but below total', () => {
    expect(
      rollupLawyerInvoiceStatus({
        previousStatus: 'sent',
        totalInr: 1180,
        paidSumInr: 500,
      }),
    ).toBe('partially_paid');
  });

  it('keeps previous status when nothing paid', () => {
    expect(
      rollupLawyerInvoiceStatus({
        previousStatus: 'sent',
        totalInr: 1180,
        paidSumInr: 0,
      }),
    ).toBe('sent');
  });
});
