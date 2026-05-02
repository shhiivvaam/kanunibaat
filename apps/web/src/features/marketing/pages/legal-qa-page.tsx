'use client';

import { ArrowRight, Search, Send, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { useOpenAuth } from '@/features/marketing/open-auth-context';
import { renderSafeInlineText } from '@/features/marketing/utils/render-safe-inline-text';

const categories = [
  { id: 'consumer', label: 'Consumer Rights', icon: '🛒' },
  { id: 'family', label: 'Family Law', icon: '👨‍👩‍👧' },
  { id: 'property', label: 'Property', icon: '🏠' },
  { id: 'employment', label: 'Employment', icon: '💼' },
  { id: 'criminal', label: 'Criminal', icon: '⚖️' },
  { id: 'startup', label: 'Startup / Business', icon: '🚀' },
] as const;

type LegalCategoryId = (typeof categories)[number]['id'];

const popularQuestions: readonly { categoryId: LegalCategoryId; text: string }[] = [
  { categoryId: 'consumer', text: 'How to file a consumer complaint?' },
  { categoryId: 'family', text: 'How is child custody decided in divorce?' },
  { categoryId: 'property', text: 'Can my landlord evict me without notice?' },
  { categoryId: 'property', text: 'Is verbal rental agreement valid?' },
  { categoryId: 'property', text: 'What is minimum notice period?' },
  { categoryId: 'employment', text: 'Can employer deduct salary?' },
  { categoryId: 'criminal', text: 'What are my rights if arrested?' },
  { categoryId: 'startup', text: 'How to register a startup?' },
];

const mockAnswers: Record<string, { answer: string; law: string; date: string }> = {
  'Can my landlord evict me without notice?': {
    answer: `No. Under the <strong>Transfer of Property Act, 1882</strong> (Section 106), a landlord must give a minimum of 15 days written notice for a monthly tenancy before seeking eviction. For longer tenancies, the notice period is typically 6 months.\n\nIn most states, the <strong>Rent Control Act</strong> provides additional protections. Key points:\n\n• Eviction is only valid for specific grounds (non-payment of rent, personal use by landlord, illegal subletting, or structural damage)\n• The landlord must file an eviction suit in Rent Court — self-help eviction (changing locks, cutting electricity) is illegal\n• If you've received an illegal eviction notice, you can file for injunction in civil court\n\nIf you're in a state with Rent Control (Delhi, Maharashtra, Karnataka, etc.), your protections are even stronger.`,
    law: 'Transfer of Property Act, 1882 · State Rent Control Acts',
    date: 'March 2025',
  },
  'What are my rights if arrested?': {
    answer: `Under <strong>Article 22 of the Constitution</strong> and the <strong>Code of Criminal Procedure (CrPC)</strong>, you have the following rights upon arrest:\n\n• <strong>Right to know the grounds of arrest</strong> — police must tell you why you're being arrested\n• <strong>Right to legal representation</strong> — you can consult a lawyer of your choice\n• <strong>Right to be produced before a Magistrate within 24 hours</strong> (excluding travel time)\n• <strong>Right against self-incrimination</strong> — you cannot be forced to confess\n• <strong>Right to inform a family member or friend</strong> of your arrest\n• <strong>Right to medical examination</strong> if you claim mistreatment\n\nIn 2023, the Supreme Court reiterated in D.K. Basu Guidelines that handcuffing is only permissible in exceptional circumstances.`,
    law: 'Constitution of India, Art. 22 · CrPC Sections 41, 50, 56, 57',
    date: 'February 2025',
  },
  'How is child custody decided in divorce?': {
    answer: `In India, child custody is decided based on the <strong>welfare of the child</strong> (paramount consideration), not merely parental preference.\n\n• Courts consider the child's age, health, education, and emotional ties\n• <strong>Hindu Marriage Act, 1955</strong> and <strong>Guardians and Wards Act, 1890</strong> govern most cases; personal laws apply for other communities\n• Mothers often get custody of infants and young children, but this is not automatic — the court examines facts\n• The other parent typically gets <strong>visitation rights</strong>\n• Older children's wishes may be considered where appropriate\n\nMediation and mutual consent arrangements are encouraged before contested litigation.`,
    law: 'Hindu Marriage Act, 1955 · Guardians and Wards Act, 1890',
    date: 'March 2025',
  },
  default: {
    answer: `Based on your question, here's what Indian law says:\n\nUnder the relevant provisions of Indian law, you have specific rights and remedies available to you. The applicable legislation depends on your specific situation and the state you're in.\n\n<strong>General steps to take:</strong>\n\n• Document all communications and evidence\n• Send a formal written notice to the other party\n• Approach the relevant authority or forum (consumer court, labour court, etc.)\n• Consult a local lawyer for case-specific advice\n\nFor a personalized analysis of your specific situation, consider booking a consultation with one of our verified lawyers.`,
    law: 'Based on Indian law · Multiple Acts applicable',
    date: 'March 2025',
  },
};

export function LegalQAPage() {
  const openAuth = useOpenAuth();
  const [activeCategory, setActiveCategory] = useState<LegalCategoryId>('consumer');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<null | (typeof mockAnswers)['default']>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [helpfulVote, setHelpfulVote] = useState<'up' | 'down' | null>(null);

  const askTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const popularQuestionsForCategory = useMemo(
    () => popularQuestions.filter((entry) => entry.categoryId === activeCategory),
    [activeCategory],
  );

  const selectCategory = (id: LegalCategoryId) => {
    if (id === activeCategory) return;
    setActiveCategory(id);
    setAnswer(null);
    setHelpfulVote(null);
    setLoading(false);
    if (askTimeoutRef.current !== null) {
      clearTimeout(askTimeoutRef.current);
      askTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (askTimeoutRef.current !== null) {
        clearTimeout(askTimeoutRef.current);
        askTimeoutRef.current = null;
      }
    };
  }, []);

  const handleAsk = (q?: string) => {
    const query = q || question;
    if (!query.trim()) return;
    if (askTimeoutRef.current !== null) {
      clearTimeout(askTimeoutRef.current);
      askTimeoutRef.current = null;
    }
    setLoading(true);
    setAnswer(null);
    askTimeoutRef.current = setTimeout(() => {
      askTimeoutRef.current = null;
      setAnswer(mockAnswers[query] ?? mockAnswers.default);
      setLoading(false);
      setHelpfulVote(null);
    }, 1500);
    if (q) setQuestion(q);
  };

  const formatAnswer = (text: string) => {
    const lines = text.split('\n');
    const formattedLines: ReactNode[] = [];
    const bulletBuffer: Array<{ content: string; index: number }> = [];

    const flushBulletBuffer = (keySeed: number) => {
      if (bulletBuffer.length === 0) return;
      formattedLines.push(
        <ul key={`answer-list-${keySeed}`} className="m-0 list-none space-y-1 p-0">
          {bulletBuffer.map(({ content, index }) => (
            <li
              key={`answer-bullet-${index}`}
              className="flex items-start gap-2 text-[#1C1917]"
              style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: 1.7 }}
            >
              <span className="mt-1 shrink-0 text-[#C2410C]">•</span>
              <span>{renderSafeInlineText(content, `answer-bullet-${index}`)}</span>
            </li>
          ))}
        </ul>,
      );
      bulletBuffer.length = 0;
    };

    lines.forEach((line, index) => {
      if (line.startsWith('• ')) {
        bulletBuffer.push({ content: line.replace('• ', ''), index });
        return;
      }

      flushBulletBuffer(index);

      if (line === '') {
        formattedLines.push(<br key={`answer-break-${index}`} />);
        return;
      }

      formattedLines.push(
        <p
          key={`answer-line-${index}`}
          className="text-[#1C1917]"
          style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: 1.7 }}
        >
          {renderSafeInlineText(line, `answer-line-${index}`)}
        </p>,
      );
    });

    flushBulletBuffer(lines.length);
    return formattedLines;
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="border-b border-[#E7E5E4] bg-white px-6 py-4">
        <div className="mx-auto max-w-[1200px]">
          <div
            className="flex items-center gap-2 text-sm text-[#78716C]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <span>Home</span>
            <span>/</span>
            <span className="text-[#C2410C]">Legal Q&A</span>
          </div>
          <h1
            className="mt-1 text-[#1C1917]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px' }}
          >
            Legal Q&A
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="shrink-0 lg:w-[280px]">
            <div className="overflow-hidden rounded-[20px] border border-[#E7E5E4] bg-white">
              <div className="border-b border-[#E7E5E4] px-5 py-4">
                <p
                  className="text-sm text-[#1C1917]"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                >
                  Browse by Category
                </p>
              </div>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.id)}
                  className="w-full px-5 py-3.5 text-left text-sm transition-all"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: activeCategory === cat.id ? 600 : 400,
                    color: activeCategory === cat.id ? '#C2410C' : '#1C1917',
                    background: activeCategory === cat.id ? '#FFF7ED' : 'white',
                    borderLeft:
                      activeCategory === cat.id ? '3px solid #C2410C' : '3px solid transparent',
                  }}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-1 space-y-6">
            <div className="rounded-[20px] border border-[#E7E5E4] bg-white p-6">
              <label
                className="mb-2 block text-[#1C1917]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15px' }}
              >
                Describe your situation or ask a legal question
              </label>

              <div className="mb-3 flex items-center gap-3">
                <div className="flex rounded-full border border-[#E7E5E4] bg-[#FAFAF9] p-0.5">
                  {(['en', 'hi'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className="rounded-full px-4 py-1 text-xs transition-all"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                        background: lang === l ? '#C2410C' : 'transparent',
                        color: lang === l ? 'white' : '#78716C',
                      }}
                      lang={l === 'hi' ? 'hi' : 'en'}
                    >
                      {l === 'en' ? 'English' : 'हिंदी'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78716C]"
                  />
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                    placeholder={
                      lang === 'en'
                        ? 'Describe your situation or ask a legal question…'
                        : 'अपनी स्थिति बताएं या कोई कानूनी सवाल पूछें…'
                    }
                    className="h-14 w-full rounded-[12px] border border-[#E7E5E4] bg-white pl-10 pr-4 text-sm text-[#1C1917] outline-none transition-all placeholder:text-[#78716C]"
                    style={{ fontFamily: 'var(--font-body)' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#C2410C';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#E7E5E4';
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAsk()}
                  disabled={!question.trim() || loading}
                  className="flex h-14 items-center gap-2 rounded-[12px] bg-[#C2410C] px-6 text-sm text-white transition-all hover:bg-[#9a3409] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                >
                  <Send size={15} />
                  Ask
                </button>
              </div>

              <div className="mt-4">
                <p
                  className="mb-2.5 text-xs text-[#78716C]"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                >
                  Popular questions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {popularQuestionsForCategory.map((entry) => (
                    <button
                      key={entry.text}
                      type="button"
                      onClick={() => handleAsk(entry.text)}
                      className="rounded-full bg-[#FED7AA] px-3 py-1 text-xs text-[#C2410C] transition-all hover:bg-[#C2410C] hover:text-white"
                      style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                    >
                      {entry.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading && (
              <div className="rounded-[20px] border border-[#E7E5E4] bg-white p-6">
                <div className="space-y-3">
                  {[100, 75, 85, 60].map((w, i) => (
                    <div
                      key={i}
                      className="h-4 animate-pulse rounded-full bg-[#E7E5E4]"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {answer && !loading && (
              <div className="overflow-hidden rounded-[24px] border border-[#E7E5E4] bg-white">
                <div className="border-b border-[#E7E5E4] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#FED7AA] bg-[#FFF7ED]">
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '12px',
                            color: '#C2410C',
                            fontWeight: 700,
                          }}
                        >
                          K
                        </span>
                      </div>
                      <span
                        className="text-sm text-[#1C1917]"
                        style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                      >
                        Jurisly Answer
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnswer(null)}
                      className="text-[#78716C] transition-colors hover:text-[#1C1917]"
                      aria-label="Dismiss answer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-2 leading-relaxed">{formatAnswer(answer.answer)}</div>

                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full border border-[#E7E5E4] bg-[#FAFAF9] px-3 py-1 text-xs text-[#78716C]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      📚 {answer.law}
                    </span>
                    <span
                      className="rounded-full border border-[#E7E5E4] bg-[#FAFAF9] px-3 py-1 text-xs text-[#78716C]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      🗓 Last updated {answer.date}
                    </span>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#E7E5E4] pt-5">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-sm text-[#78716C]"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        Was this helpful?
                      </span>
                      <button
                        type="button"
                        onClick={() => setHelpfulVote('up')}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                          helpfulVote === 'up'
                            ? 'border-[#15803D] bg-[#15803D] text-white'
                            : 'border-[#E7E5E4] text-[#78716C] hover:border-[#15803D] hover:text-[#15803D]'
                        }`}
                        aria-label="Helpful"
                      >
                        <ThumbsUp size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setHelpfulVote('down')}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                          helpfulVote === 'down'
                            ? 'border-[#DC2626] bg-[#DC2626] text-white'
                            : 'border-[#E7E5E4] text-[#78716C] hover:border-[#DC2626] hover:text-[#DC2626]'
                        }`}
                        aria-label="Not helpful"
                      >
                        <ThumbsDown size={15} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAuth('signup')}
                      className="flex items-center gap-2 rounded-[12px] bg-[#C2410C] px-4 py-2 text-sm text-white transition-all hover:bg-[#9a3409] active:scale-[0.97]"
                      style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                    >
                      Get personal advice <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="mx-6 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#FED7AA] bg-[#FFF7ED] p-4">
                  <div>
                    <p
                      className="text-sm text-[#1C1917]"
                      style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                    >
                      Want advice for your specific situation?
                    </p>
                    <p
                      className="mt-0.5 text-xs text-[#78716C]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Talk to a verified lawyer — starting ₹299
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAuth('signup')}
                    className="flex items-center gap-1.5 rounded-[12px] bg-[#C2410C] px-4 py-2 text-xs text-white transition-all hover:bg-[#9a3409]"
                    style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                  >
                    Talk to a lawyer <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
