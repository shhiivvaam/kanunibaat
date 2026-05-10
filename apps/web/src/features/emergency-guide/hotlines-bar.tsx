export function HotlinesBar() {
  return (
    <aside
      className="rounded-2xl border border-[#E7E5E4] bg-[#FFF7ED] px-4 py-3 text-center text-sm text-[#44403C] shadow-sm"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <span className="font-semibold text-[#1C1917]">Emergency numbers (India):</span>{' '}
      <a href="tel:100" className="font-semibold text-[#C2410C] hover:underline">
        Police 100
      </a>
      {' · '}
      <a href="tel:1091" className="font-semibold text-[#C2410C] hover:underline">
        Women helpline 1091
      </a>
      {' · '}
      <a href="tel:15100" className="font-semibold text-[#C2410C] hover:underline">
        Legal Aid 15100
      </a>
    </aside>
  );
}
