type Props = { title: string; address: string; href: string };

export default function LocationMapPreview({ title, address, href }: Props) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      aria-label={`Открыть карту: ${title}, ${address}`}
      className="group relative block h-48 overflow-hidden border-y border-[#ead7d1] bg-[#f3eee7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8d443e] md:h-52">
      <svg viewBox="0 0 600 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="absolute inset-0 h-full w-full">
        <path d="M0 0h160v75H0zm435 145h165v95H435zM210 15h95v65h-95zM30 150h120v70H30z" fill="#dce4d5" />
        <path d="M-30 120 640 65M180-30l90 300M430-30l-90 300M-20 210l650-50" fill="none" stroke="#fffdf9" strokeWidth="20" />
        <path d="M-30 120 640 65M180-30l90 300M430-30l-90 300M-20 210l650-50" fill="none" stroke="#e4d9cd" strokeWidth="2" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#8d443e] text-white shadow-md transition-transform group-hover:-translate-y-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="h-7 w-7"><path d="M12 21s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></svg>
        </span>
        <span className="rounded-full bg-white/95 px-4 py-1.5 text-sm font-medium text-[#332725] shadow-sm">{title} · открыть карту ↗</span>
      </div>
      <span className="absolute bottom-2 right-3 text-xs text-[#756b65]">Схематичное превью</span>
    </a>
  );
}
