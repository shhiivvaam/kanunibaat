import { Resend } from 'resend';

export async function sendBillingReceiptEmail(opts: {
  resendApiKey: string | undefined;
  fromEmail: string | undefined;
  toEmail: string;
  subject: string;
  text: string;
}): Promise<void> {
  const apiKey = opts.resendApiKey?.trim();
  const from = opts.fromEmail?.trim();
  if (!apiKey || !from) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'RESEND_API_KEY and FROM_EMAIL are required for billing emails in production.',
      );
    }
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [opts.toEmail],
    subject: opts.subject,
    text: opts.text,
  });
  if (error) throw new Error(error.message);
}
