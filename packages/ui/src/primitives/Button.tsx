import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', style, ...props },
  ref,
) {
  const base: React.CSSProperties = {
    borderRadius: 10,
    padding: '10px 14px',
    fontWeight: 600,
    border: '1px solid transparent',
    cursor: 'pointer',
  };

  const variants: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
    primary: { background: '#16A34A', color: '#fff' },
    secondary: { background: '#fff', color: '#0F172A', borderColor: '#E2E8F0' },
  };

  return <button ref={ref} style={{ ...base, ...variants[variant], ...style }} {...props} />;
});
