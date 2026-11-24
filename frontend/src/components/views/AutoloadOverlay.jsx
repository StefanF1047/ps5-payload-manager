import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle2, AlertTriangle, Loader2, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn, parsePayloadName } from '../../utils/helpers'
import { useRepository } from '../../contexts/RepositoryContext'
import PayloadName from '../ui/PayloadName'
import PayloadIcon from '../ui/PayloadIcon'
import { autoloadPhase, autoloadSequenceItems, autoloadDisplay, autoloadDelayDisplay } from '../../utils/autoloadProgress'

function useRemainingTime(sampleMs, key, running) {
  const [clock, setClock] = useState({ key, ms: sampleMs })
  if (clock.key !== key) setClock({ key, ms: sampleMs })
  const remaining = clock.key === key ? Math.min(clock.ms, sampleMs) : sampleMs
  useEffect(() => {
    if (!running) return
    let previous = performance.now(), frame, active = true
    const animate = time => {
      if (!active) return
      const delta = Math.max(0, time - previous)
      previous = time
      setClock(value => ({ key, ms: Math.max(0, Math.min(value.ms, sampleMs) - delta) }))
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => { active = false; cancelAnimationFrame(frame) }
  }, [sampleMs, key, running])
  return remaining
}

const AutoloadOverlay = ({ status, items = [], itemsLoading = false, onCancel, onFinish, isPS5, autoReturn = false }) => {
  const { t } = useTranslation()
  const repository = useRepository()
  const metadataLoading = itemsLoading || repository?.repoData === null || repository?.loading
  const phase = autoloadPhase(status)
  const isCountdown = phase === 'waiting' || phase === 'countdown'
  const isExecuting = phase === 'executing'
  const isDone = phase === 'done'
  const entries = autoloadSequenceItems(status)
  const { entry_index: entryIndex, current, done: completed, list } = status
  const listRef = useRef(null)
  const { total, done, progress, delayMs, remainingMs } = autoloadDisplay(status, entries.filter(entry => !entry.isDelay).length)
  const displayedMs = useRemainingTime(remainingMs, phase, phase === 'countdown')
  const entryDelay = autoloadDelayDisplay(status)
  const delayRemaining = useRemainingTime(entryDelay.remainingMs, `${phase}:${status.entry_index}`, isExecuting && status.current === 'DELAY')
  const delayProgress = entryDelay.durationMs ? Math.max(0, Math.min(1, 1 - delayRemaining / entryDelay.durationMs)) : 1
  const ringProgress = isCountdown ? (delayMs ? displayedMs / delayMs : 0) : progress
  const hasIssues = status.failed > 0 || status.skipped > 0

  useEffect(() => {
    if (!autoReturn || !isDone || hasIssues) return
    const timer = setTimeout(onFinish, 3000)
    return () => clearTimeout(timer)
  }, [autoReturn, isDone, hasIssues, onFinish])

  useEffect(() => {
    const scroller = listRef.current
    if (!scroller || (phase !== 'executing' && phase !== 'done')) return
    const processedRows = scroller.querySelectorAll('[data-processed="true"]')
    const row = phase === 'done' ? scroller.lastElementChild
      : scroller.querySelector('[data-active="true"]')
        || (Number.isInteger(entryIndex) && entryIndex >= 0 ? scroller.querySelector(`[data-sequence-index="${entryIndex}"]`) : null)
        || processedRows[processedRows.length - 1]
    if (!row) return
    const containerRect = scroller.getBoundingClientRect(), rowRect = row.getBoundingClientRect()
    scroller.scrollTop += rowRect.top - containerRect.top - (scroller.clientHeight - rowRect.height) / 2
  }, [entryIndex, current, completed, phase, list, metadataLoading, items])

  const metadata = token => {
    const item = items.find(item => item.slot === token || item.path === token || item.filename === token)
    const filename = item?.filename || token
    const parsed = parsePayloadName(item?.filename || token.replace(/^repo\/(.+)@[a-f0-9]{8}$/i, '$1'))
    const repo = item?.source_url && item?.id
      ? repository?.getRepoEntry(item.source_url, item.id) || repository?.findRepoEntryById(item.id)
      : repository?.findRepoEntryByFilename(filename)
    return {
      name: repo?.name || item?.name || parsed.displayName,
      version: item?.version || repo?.version || parsed.version,
      author: repo?.author || item?.author,
      icon: repo?.icon,
      filename,
    }
  }

  return (
    <div className="fixed inset-0 pm-overlay-bg z-[9999] px-5 md:px-10 py-2 overflow-y-auto custom-scrollbar">
      <div className="mx-auto w-full max-w-[1400px] min-h-full flex flex-col justify-center">
        <div className={cn('grid grid-cols-1 gap-8 items-center lg:grid-cols-2', isPS5 ? 'grid-cols-[minmax(0,2fr)_minmax(0,3fr)]' : 'md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')}>
          <div className="flex flex-col items-center space-y-6 md:space-y-8 w-full min-w-0 max-w-[560px] justify-self-center">
            <div className="text-center space-y-2">
              <p className="pm-mono text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-ps-blue">Autoload Protocol</p>
              <h2 className="pm-heading text-2xl md:text-4xl">
                {isDone ? `${t('autoload_overlay.done_title_1', 'Autoload')} ${t('autoload_overlay.done_title_2', 'Done')}`
                  : isExecuting ? t('autoload_overlay.executing', 'Executing') : t('autoload_overlay.autoloading', 'Autoloading')}
              </h2>
              <p className="pm-mono text-[10px] md:text-xs text-zinc-500 uppercase tracking-[0.18em]">
                {isDone ? (!hasIssues ? t('autoload_overlay.all_loaded', 'All payloads loaded') : null)
                  : isCountdown ? t('autoload_overlay.waiting', 'Waiting for manual abort...') : t('autoload_overlay.loading', 'Loading Payloads...')}
              </p>
            </div>
            {isDone ? (
              <div className={cn('relative w-40 h-40 md:w-64 md:h-64 rounded-full flex items-center justify-center border', hasIssues ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400')}>
                <span className={cn('absolute inset-3 rounded-full border', hasIssues ? 'border-amber-500/20' : 'border-emerald-500/20')} />
                <span className={cn('absolute inset-6 rounded-full border border-dashed opacity-40', hasIssues ? 'border-amber-500/40' : 'border-emerald-500/40')} />
                {hasIssues ? <AlertTriangle className="relative w-20 h-20 md:w-32 md:h-32" /> : <CheckCircle2 className="relative w-20 h-20 md:w-32 md:h-32" />}
              </div>
            ) : (
              <div className="relative h-44 w-44 md:h-64 md:w-64 lg:h-80 lg:w-80 flex items-center justify-center">
                <span className="absolute inset-2 rounded-full border border-dashed border-[rgba(var(--pm-accent-rgb),0.18)]" />
                <svg viewBox="0 0 224 224" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
                  <defs>
                    <linearGradient id="pm-ring-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" style={{ stopColor: 'var(--pm-accent-text-solid)' }} />
                      <stop offset="55%" style={{ stopColor: 'var(--pm-accent-solid)' }} />
                      <stop offset="100%" style={{ stopColor: 'var(--pm-accent-2-solid)' }} />
                    </linearGradient>
                  </defs>
                  <circle cx="112" cy="112" r="100" fill="none" stroke="currentColor" strokeWidth="6" className="text-[rgba(var(--pm-accent-rgb),0.12)]" />
                  <circle cx="112" cy="112" r="100" fill="none" stroke="url(#pm-ring-grad)" strokeWidth="9" strokeOpacity="0.18" strokeDasharray="628"
                    strokeDashoffset={628 - 628 * ringProgress} />
                  <circle cx="112" cy="112" r="100" fill="none" stroke="url(#pm-ring-grad)" strokeWidth="5" strokeLinecap="round" strokeDasharray="628"
                    strokeDashoffset={628 - 628 * ringProgress} />
                </svg>
                <span className={cn('pm-mono relative font-bold text-white tabular-nums leading-none', isCountdown ? 'text-7xl md:text-8xl lg:text-9xl' : 'text-5xl md:text-7xl lg:text-8xl')}>
                  {isCountdown ? Math.ceil(displayedMs / 1000) : `${Math.round(progress * 100)}%`}
                </span>
              </div>
            )}
            {isDone && hasIssues && (
              <div className="flex flex-wrap justify-center gap-2 md:gap-3 text-xs md:text-sm">
                <span className="pm-chip pm-chip-green">{t('autoload_overlay.success', 'Success')}: {status.successful || 0}</span>
                {status.failed > 0 && <span className="pm-chip pm-chip-red">{t('autoload_overlay.failed', 'Failed')}: {status.failed}</span>}
                {status.skipped > 0 && <span className="pm-chip pm-chip-muted">{t('autoload_overlay.skipped', 'Skipped')}: {status.skipped}</span>}
              </div>
            )}
            <button onClick={isDone ? onFinish : onCancel} autoFocus={!isDone}
              className={cn('w-full py-4 md:py-5 px-4 rounded-lg text-base md:text-lg font-black uppercase tracking-[0.12em] border transition-colors', isDone ? 'pm-btn-primary border-transparent' : 'bg-white/5 border-[rgba(var(--pm-accent-rgb),0.25)] text-white hover:bg-red-600 hover:border-red-600')}>
              {isDone ? t('autoload_overlay.return_btn', 'Return to Dashboard') : t('autoload_overlay.abort_btn', 'Abort Autoload')}
            </button>
          </div>

          <div className="min-w-0 w-full pm-panel pm-frame px-4 md:px-5 py-3 rounded-ps-3xl border border-[rgba(var(--pm-accent-rgb),0.18)]">
            <div className="flex items-center justify-between mb-4 space-x-3">
              <h3 className="pm-mono text-base md:text-lg font-bold text-white uppercase tracking-[0.16em]">{t('autoload_overlay.payload_list', 'Payload List')}</h3>
              <span className="pm-chip pm-chip-muted tabular-nums">{done} / {total}</span>
            </div>
            <div ref={listRef} className={cn('space-y-2.5 overflow-y-auto custom-scrollbar pr-1', isPS5 ? 'h-[calc(100vh-88px)]' : 'h-[360px] md:h-[calc(100vh-88px)]')}>
              {entries.map(entry => {
                const { token, index, isDelay, active, processed, failed, skipped } = entry
                const outcomeLabel = failed ? t('autoload_overlay.failed', 'Failed') : skipped ? t('autoload_overlay.skipped', 'Skipped') : null
                if (isDelay) {
                  const fill = processed ? 1 : active ? delayProgress : 0
                  return <div key={`${index}:${token}`} data-active={active} data-processed={processed} data-sequence-index={index} data-delay-index={index}
                    className={cn('relative px-3 py-2.5 min-h-[44px] rounded-lg border overflow-hidden', active ? 'border-ps-blue/40 bg-ps-blue/5' : 'border-white/5 bg-white/[0.02]')}>
                    <div data-delay-fill className={cn('absolute inset-y-0 left-0 pointer-events-none', processed ? 'bg-emerald-500/10' : 'bg-ps-blue/20')} style={{ width: `${fill * 100}%` }} />
                    <div className="relative flex items-center justify-between space-x-3 text-sm">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className="pm-mono text-zinc-600 text-[10px] tabular-nums">{index + 1}</span>
                        <Zap className={cn('w-4 h-4 shrink-0', active ? 'text-ps-blue' : 'text-zinc-500')} />
                        <span className={cn('font-medium truncate', active ? 'text-white' : 'text-zinc-400')}>{t('autoload.delay_item', 'Delay ({{seconds}}s)', { seconds: entry.durationMs / 1000 })}</span>
                      </div>
                      {active ? <span className="text-ps-blue tabular-nums shrink-0">{(Math.ceil(delayRemaining / 100) / 10).toFixed(1)}s</span>
                        : processed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : null}
                    </div>
                  </div>
                }
                const meta = metadata(token)
                return <div key={`${index}:${token}`} data-active={active} data-processed={processed} data-sequence-index={index} data-payload-index={index}
                  className={cn('relative pl-4 pr-3 py-2.5 rounded-ps-xl border border-l-2 min-h-[72px] md:min-h-[88px] flex items-center justify-between space-x-3',
                    active ? 'bg-ps-blue/10 border-ps-blue/60' : failed ? 'bg-red-500/10 border-red-500/40' : skipped ? 'bg-white/[0.02] border-white/10' : processed ? 'bg-emerald-500/15 border-emerald-500/40' : 'bg-white/[0.025] border-white/5')}>
                  <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      {metadataLoading && !meta.icon
                        ? <div data-icon-pending className="w-11 h-11 md:w-16 md:h-16 rounded-2xl border border-white/10 bg-white/5" />
                        : <PayloadIcon icon={meta.icon} name={meta.filename.split('/').pop()} className="w-11 h-11 md:w-16 md:h-16 text-xl" />}
                      <span className={cn('pm-mono absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full border border-[var(--pm-surface)] flex items-center justify-center text-[10px] font-bold text-white', processed && !failed && !skipped ? 'bg-emerald-400' : 'bg-ps-blue')}>{index + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <PayloadName path={meta.filename} displayName={meta.name} version={meta.version}
                        className="text-white text-xl md:text-3xl leading-snug" versionClassName="text-xs md:text-sm px-2 py-1" />
                      {meta.author && <div className="text-xs md:text-sm text-zinc-500 truncate mt-1">{meta.author}</div>}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end space-y-1">
                    {active ? <Loader2 className="w-5 h-5 animate-spin text-ps-blue" /> : failed || skipped ? <AlertTriangle className={cn('w-5 h-5', failed ? 'text-red-400' : 'text-zinc-400')} />
                      : processed ? <CheckCircle2 className="w-7 h-7 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-white/10" />}
                    {processed && outcomeLabel && <span className={cn('text-[10px] md:text-xs font-medium', failed ? 'text-red-400' : 'text-zinc-400')}>{outcomeLabel}</span>}
                  </div>
                </div>
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AutoloadOverlay
