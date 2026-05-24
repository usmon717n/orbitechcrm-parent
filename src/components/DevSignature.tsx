interface DevSignatureProps {
  compact?: boolean
  placement?: 'inline' | 'bottom-right'
  tone?: 'light' | 'dark'
}

export default function DevSignature({
  compact = false,
  placement = 'inline',
  tone = 'light',
}: DevSignatureProps) {
  const useCompact = compact || placement !== 'inline'
  const isDark = tone === 'dark'

  const content = useCompact ? (
    <a
      href="https://t.me/umaraliyew7"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] transition-colors ${
        isDark
          ? 'bg-white/10 border border-white/20 text-white/70 hover:text-sky-200 hover:border-sky-300/40'
          : 'bg-white/90 border border-gray-200 text-gray-500 hover:text-[#2AABEE] hover:border-[#2AABEE]/30 shadow-sm'
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={isDark ? 'text-sky-300' : 'text-[#2AABEE]'}
      >
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
      <span className="font-medium">Developer</span>
    </a>
  ) : (
    <div className="flex flex-col items-center gap-1 py-6 mt-4">
      <a
        href="https://t.me/umaraliyew7"
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 transition-colors group ${
          isDark ? 'text-white/55 hover:text-sky-200' : 'text-gray-400 hover:text-[#2AABEE]'
        }`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`group-hover:scale-110 transition-transform ${isDark ? 'text-sky-300' : 'text-[#2AABEE]'}`}
        >
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        <span className="text-xs font-medium">Developer</span>
      </a>
    </div>
  )

  if (placement === 'bottom-right') {
    // Mobile bottom navigation bilan ustma-ust tushmasligi uchun bottom offset katta.
    return (
      <div className="!fixed !right-6 !bottom-24 lg:!bottom-6 z-40">
        {content}
      </div>
    )
  }

  return content
}
