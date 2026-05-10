'use client';

import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Download,
  FileText,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useOpenAuth } from '@/features/marketing/open-auth-context';

const mockReview = {
  filename: 'Rental_Agreement_2025.pdf',
  summary:
    'This is a residential tenancy agreement between a landlord and tenant for a 2BHK apartment in Mumbai. The agreement is for 11 months with an option to renew. Several clauses appear standard under Maharashtra Rent Control Act, but some clauses warrant attention.',
  keyClauses: [
    {
      title: 'Security Deposit',
      content:
        'Security deposit of ₹60,000 (3 months rent) is required. Must be refunded within 30 days of vacating, subject to deductions for damages. This is within legal limits under the Maharashtra Rent Control Act.',
    },
    {
      title: 'Rent Escalation',
      content:
        'Annual rent increase of 10% is specified. Note: Under Maharashtra Rent Control Act, rent increases for controlled properties are capped. Verify if your property falls under controlled category.',
    },
    {
      title: 'Notice Period',
      content:
        'Both parties must give 1 month written notice before terminating. This meets the minimum statutory requirement of 15 days under the Transfer of Property Act.',
    },
    {
      title: 'Maintenance Charges',
      content:
        "Tenant is responsible for minor repairs (under ₹2,000). Major structural repairs are the landlord's responsibility. This aligns with standard practice.",
    },
  ],
  redFlags: [
    {
      severity: 'high',
      text: 'Clause 8: Landlord reserves the right to enter premises "at any time" without notice. This violates tenant privacy rights. Minimum 24-hour notice is legally required.',
    },
    {
      severity: 'medium',
      text: 'Clause 12: No provision for interest on security deposit. Under some state laws, landlords must pay interest on deposits held over 12 months.',
    },
    {
      severity: 'low',
      text: 'Clause 15: Subletting prohibited entirely. You may want to negotiate a partial subletting right if needed.',
    },
  ],
  plainLanguage:
    "You're renting a 2BHK flat for ₹20,000/month for 11 months. You need to pay ₹60,000 upfront as deposit (you'll get this back when you leave, minus any damage costs). Rent can go up by 10% each year. Give 1 month notice before leaving. You fix small things (under ₹2,000); landlord fixes big structural issues. There are 3 problematic clauses — most importantly, the landlord cannot enter your home without notice, regardless of what Clause 8 says.",
};

export function DocumentReviewPage() {
  const openAuth = useOpenAuth();
  const [stage, setStage] = useState<'upload' | 'processing' | 'result'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [openAccordion, setOpenAccordion] = useState<string | null>('summary');
  const fileRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearProcessingTimers = useCallback(() => {
    if (progressIntervalRef.current !== null) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (resultTimeoutRef.current !== null) {
      clearTimeout(resultTimeoutRef.current);
      resultTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => clearProcessingTimers(), [clearProcessingTimers]);

  const handleFile = () => {
    clearProcessingTimers();
    setStage('processing');
    let p = 0;
    progressIntervalRef.current = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 100) {
        p = 100;
        if (progressIntervalRef.current !== null) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setProgress(100);
        resultTimeoutRef.current = setTimeout(() => {
          resultTimeoutRef.current = null;
          setStage('result');
        }, 400);
        return;
      }
      setProgress(Math.min(p, 100));
    }, 200);
  };

  const severityColor = {
    high: { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', label: 'High Risk' },
    medium: { bg: '#FFFBEB', border: '#FEF08A', text: '#D97706', label: 'Note' },
    low: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', label: 'Low' },
  };

  const accordions = [
    { id: 'summary', label: 'Summary', icon: <FileText size={16} /> },
    { id: 'clauses', label: 'Key Clauses', icon: <CheckCircle size={16} /> },
    { id: 'flags', label: 'Red Flags', icon: <AlertTriangle size={16} /> },
    { id: 'plain', label: 'Plain Language Translation', icon: <FileText size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="border-b border-[#E7E5E4] bg-white px-6 py-4">
        <div className="mx-auto max-w-[900px]">
          <div
            className="flex items-center gap-2 text-sm text-[#78716C]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <span>Home</span>
            <span>/</span>
            <span className="text-[#C2410C]">Document Review</span>
          </div>
          <h1
            className="mt-1 text-[#1C1917]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px' }}
          >
            Document Review
          </h1>
          <p className="mt-1 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
            Upload any legal document and get a plain-language breakdown in seconds.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[900px] px-6 py-8">
        {stage === 'upload' && (
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile();
            }}
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[24px] border-2 border-dashed transition-all"
            style={{
              height: '280px',
              borderColor: dragOver ? '#C2410C' : '#E7E5E4',
              background: dragOver ? '#FFF7ED' : 'white',
            }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#FFF7ED]">
              <Upload size={28} className="text-[#C2410C]" />
            </div>
            <div className="text-center">
              <p
                className="mb-1 text-[#1C1917]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '16px' }}
              >
                Drag your document here
              </p>
              <p className="text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
                or{' '}
                <span className="text-[#C2410C] hover:underline" style={{ fontWeight: 600 }}>
                  Browse files
                </span>
              </p>
              <p className="mt-3 text-xs text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
                PDF, DOCX, JPG — max 10MB
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              onChange={handleFile}
            />
          </div>
        )}

        {stage === 'processing' && (
          <div className="flex flex-col items-center gap-6 rounded-[24px] border border-[#E7E5E4] bg-white p-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#FFF7ED]">
              <FileText size={28} className="text-[#C2410C]" />
            </div>
            <div className="w-full max-w-sm">
              <div className="mb-2 flex justify-between text-sm text-[#78716C]">
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                  Analysing document…
                </span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#E7E5E4]">
                <div
                  className="h-full rounded-full bg-[#C2410C] transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
              Reading clauses · Identifying obligations · Checking red flags
            </p>
          </div>
        )}

        {stage === 'result' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-[20px] border border-[#E7E5E4] bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FFF7ED]">
                  <FileText size={18} className="text-[#C2410C]" />
                </div>
                <div>
                  <p
                    className="text-sm text-[#1C1917]"
                    style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                  >
                    {mockReview.filename}
                  </p>
                  <p className="text-xs text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
                    {mockReview.redFlags.filter((f) => f.severity === 'high').length} high risk ·{' '}
                    {mockReview.redFlags.filter((f) => f.severity === 'medium').length} notes ·{' '}
                    {mockReview.keyClauses.length} key clauses found
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearProcessingTimers();
                  setStage('upload');
                  setProgress(0);
                }}
                className="text-[#78716C] transition-colors hover:text-[#1C1917]"
                aria-label="Remove file"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-[#E7E5E4] bg-white">
              {accordions.map((acc, idx) => (
                <div key={acc.id} className={idx > 0 ? 'border-t border-[#E7E5E4]' : ''}>
                  <button
                    type="button"
                    onClick={() => setOpenAccordion(openAccordion === acc.id ? null : acc.id)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-[#FAFAF9]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[#C2410C]">{acc.icon}</span>
                      <span
                        className="text-[#1C1917]"
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontWeight: 600,
                          fontSize: '15px',
                        }}
                      >
                        {acc.label}
                      </span>
                    </div>
                    <ChevronDown
                      size={18}
                      className="text-[#78716C] transition-transform duration-200"
                      style={{
                        transform: openAccordion === acc.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>

                  {openAccordion === acc.id && (
                    <div
                      className="px-6 pb-6 text-[#1C1917]"
                      style={{ animation: 'kb-marketing-panel-reveal 250ms ease-out' }}
                    >
                      {acc.id === 'summary' && (
                        <p
                          className="leading-relaxed"
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '15px',
                            lineHeight: 1.7,
                          }}
                        >
                          {mockReview.summary}
                        </p>
                      )}

                      {acc.id === 'clauses' && (
                        <div className="space-y-4">
                          {mockReview.keyClauses.map((clause) => (
                            <div
                              key={clause.title}
                              className="rounded-[12px] border border-[#E7E5E4] bg-[#FAFAF9] p-4"
                            >
                              <p
                                className="mb-1.5 text-[#1C1917]"
                                style={{
                                  fontFamily: 'var(--font-body)',
                                  fontWeight: 600,
                                  fontSize: '14px',
                                }}
                              >
                                {clause.title}
                              </p>
                              <p
                                className="text-[#78716C]"
                                style={{
                                  fontFamily: 'var(--font-body)',
                                  fontSize: '14px',
                                  lineHeight: 1.6,
                                }}
                              >
                                {clause.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {acc.id === 'flags' && (
                        <div className="space-y-3">
                          {mockReview.redFlags.map((flag, i) => {
                            const colors =
                              severityColor[flag.severity as keyof typeof severityColor];
                            return (
                              <div
                                key={i}
                                className="flex items-start gap-3 rounded-[12px] border p-4"
                                style={{ background: colors.bg, borderColor: colors.border }}
                              >
                                <AlertTriangle
                                  size={16}
                                  style={{ color: colors.text, marginTop: '2px', flexShrink: 0 }}
                                />
                                <div>
                                  <span
                                    className="mr-2 rounded-full px-2 py-0.5 text-xs"
                                    style={{
                                      background: colors.border,
                                      color: colors.text,
                                      fontFamily: 'var(--font-body)',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {colors.label}
                                  </span>
                                  <p
                                    className="mt-1.5 text-[#1C1917]"
                                    style={{
                                      fontFamily: 'var(--font-body)',
                                      fontSize: '14px',
                                      lineHeight: 1.6,
                                    }}
                                  >
                                    {flag.text}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {acc.id === 'plain' && (
                        <div className="rounded-[12px] border border-[#FED7AA] bg-[#FFF7ED] p-4">
                          <p
                            className="leading-relaxed text-[#1C1917]"
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontStyle: 'italic',
                              fontSize: '16px',
                              lineHeight: 1.7,
                            }}
                          >
                            {mockReview.plainLanguage}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => openAuth('signup')}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-[#E7E5E4] bg-white text-[#1C1917] transition-all hover:bg-[#FAFAF9] active:scale-[0.97]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15px' }}
            >
              <Download size={16} className="text-[#C2410C]" />
              Download Summary PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
