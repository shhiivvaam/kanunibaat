export function loadRazorpayCheckoutScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Razorpay can only load in the browser.'));
      return;
    }
    const w = window as unknown as { Razorpay?: unknown };
    if (w.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector(
      'script[data-razorpay="checkout"]',
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay.')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpay = 'checkout';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay.'));
    document.body.appendChild(script);
  });
}

export type RazorpayCheckoutCtor = new (opts: unknown) => { open: () => void };

export function getRazorpayCtor(): RazorpayCheckoutCtor {
  const w = window as unknown as { Razorpay?: RazorpayCheckoutCtor };
  const ctor = w.Razorpay;
  if (!ctor) throw new Error('Razorpay is not available.');
  return ctor;
}
