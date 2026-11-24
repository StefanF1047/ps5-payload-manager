import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const LogViewer = ({ logs }) => {
  const { t } = useTranslation()
  const scrollRef = useRef(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [readLogs, setReadLogs] = useState(logs)
  const hasNewLogs = logs !== readLogs

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const atBottom = scrollHeight - scrollTop - clientHeight < 100
    if (atBottom || isAtBottom) setReadLogs(logs)
    setIsAtBottom(atBottom)
  }

  useEffect(() => {
    if (isAtBottom) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' })
    }
  }, [logs, isAtBottom])

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    setIsAtBottom(true)
    setReadLogs(logs)
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col relative group h-full bg-[rgba(255,255,255,0.55)]">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-8 font-mono text-sm md:text-base space-y-1.5 custom-scrollbar scroll-smooth overscroll-contain"
      >
        {logs.map((log, i) => (
          <div key={`${i}-${log}`} className="pm-log-line flex space-x-4 opacity-100 px-3 py-0.5">
            <span className="pm-log-index select-none font-bold shrink-0 w-10 text-right pr-2 text-[10px] md:text-xs">{i + 1}</span>
            <span className="text-ps-blue/80 font-bold shrink-0">»</span>
            <span className="pm-mono text-zinc-200 break-all leading-relaxed tracking-normal text-[11px] md:text-sm">{log}</span>
          </div>
        ))}
        <div className="h-20" /> {/* Bottom spacing for the button */}
      </div>

      {!isAtBottom && hasNewLogs && (
        <button
          onClick={scrollToBottom}
          className="pm-mono absolute bottom-10 inset-x-0 mx-auto w-max px-6 md:px-8 py-3 md:py-4 bg-ps-blue text-white rounded-lg font-black uppercase tracking-[0.2em] text-[10px] md:text-[11px] z-50 flex items-center space-x-3 border border-ps-blue shadow-[0_0_44px_-10px_rgba(124,58,237,0.9)] hover:bg-[#db2777] transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
          <span>{t("logs.new_activity_btn", "New Activity Below")}</span>
        </button>
      )}
    </div>
  )
}

export default LogViewer
