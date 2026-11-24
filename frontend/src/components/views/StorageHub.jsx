import React, { useState, useEffect, useMemo, useLayoutEffect, useRef, useCallback } from 'react'
import { CloudDownload, Upload, Package, Database, RefreshCw, Loader2, AlertTriangle, HardDrive, Usb, ChevronDown, Globe, Search, ArrowUpDown, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { cn, isPS5, isIOS } from '../../utils/helpers'
import { getPayloadStatus, resolveSourceDisplayName, isRepositoryPayloadVisible } from '../../utils/payloadStatus'
import { slug } from '../../utils/versions'
import { formatSyncTime } from '../../utils/syncTime'
import PayloadName from '../ui/PayloadName'
import Modal from '../ui/Modal'
import { useRepository } from '../../contexts/RepositoryContext'
import PayloadCard from '../ui/PayloadCard'
import PayloadDetailPanel from '../ui/PayloadDetailPanel'

const StorageHub = ({
  items = [],
  self = null,
  payloads = [],
  onInstall,
  onDelete,
  onUpload,
  onImportFromUsb,
  config,
  ip,
  scrollTarget,
  onClearScrollTarget,
  selectedPayload: selectedPayloadProp,
  onSelectPayload,
  onClosePayload,
  conflictPrompt: externalConflictPrompt,
  setConflictPrompt: externalSetConflictPrompt,
  externalLinkUrl,
  setExternalLinkUrl,
  installingPayloadId = null,
}) => {
  const { t, i18n } = useTranslation()
  const multiSources = config?.MULTI_SOURCES_ENABLED === true

  const { sources, repoData, loading, error, fetchRemote } = useRepository()

  const [expandedSource, setExpandedSource] = useState(null) // id of expanded catalog
  const [search, setSearch] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchInputRef = useRef(null)
  const [sortMode, setSortMode] = useState(() => {
    return localStorage.getItem('repoSortMode') || 'name'
  })

  const [localConflictPrompt, setLocalConflictPrompt] = useState(null)
  const conflictPrompt = externalConflictPrompt !== undefined ? externalConflictPrompt : localConflictPrompt
  const setConflictPrompt = externalSetConflictPrompt || setLocalConflictPrompt

  const [localSelectedPayload, setLocalSelectedPayload] = useState(null)
  const selectedPayload = selectedPayloadProp !== undefined ? selectedPayloadProp : localSelectedPayload
  const setSelectedPayload = onSelectPayload || setLocalSelectedPayload
  const [savedScroll, setSavedScroll] = useState(0)

  const handlePayloadSelect = (payloadData) => {
    const mainEl = document.querySelector('main')
    if (mainEl) setSavedScroll(mainEl.scrollTop)
    if (onSelectPayload) {
      onSelectPayload(payloadData)
    } else {
      setSelectedPayload(payloadData)
    }
  }

  const handleCloseDetail = useCallback(() => {
    if (onClosePayload) {
      onClosePayload()
    } else {
      setSelectedPayload(null)
    }
  }, [onClosePayload, setSelectedPayload])

  const handleSortChange = (mode) => {
    setSortMode(mode)
    localStorage.setItem('repoSortMode', mode)
  }

  useEffect(() => {
    if (scrollTarget) {
      const timer = setTimeout(() => {
        const element = document.getElementById(scrollTarget)
        if (element) element.scrollIntoView({ behavior: 'smooth' })
        if (onClearScrollTarget) onClearScrollTarget()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [scrollTarget, onClearScrollTarget])

  /* ---- Source-grouped data with statusInfo ---- */
  const enrichedSources = useMemo(() => {
    return (sources || []).map((src) => {
      const rawPayloads = src.payloads || []
      const filteredPayloads = rawPayloads.filter((p) => isRepositoryPayloadVisible(p, src.url))
      const enrichedPayloads = filteredPayloads.map((p) => {
        const statusInfo = getPayloadStatus({
          payload: p,
          srcUrl: src.url,
          items,
          self,
          sources,
          multiSources,
        })
        return {
          ...p,
          statusInfo,
          isInstalled: statusInfo.isInstalled,
          isUpdate: statusInfo.isUpdate,
        }
      })

      return {
        ...src,
        payloads: enrichedPayloads,
      }
    })
  }, [sources, items, multiSources, self])

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const resolvedPayloadData = useMemo(() => {
    if (!selectedPayload) return null

    const targetPayload =
      selectedPayload.payload ||
      (typeof selectedPayload === 'object' && (selectedPayload.name || selectedPayload.id || selectedPayload.filename)
        ? selectedPayload
        : null)

    const targetIdentifier =
      selectedPayload.payload?.id ||
      selectedPayload.id ||
      selectedPayload.payload?.filename ||
      selectedPayload.filename ||
      (typeof selectedPayload === 'string' ? selectedPayload : null)

    const targetSrcId = selectedPayload.srcId || null
    const targetSrcUrl = selectedPayload.srcUrl || null

    // Check candidate sources from enrichedSources first so that fresh status is always picked up
    const candidateSources = targetSrcId
      ? [
          enrichedSources.find((s) => s.id === targetSrcId),
          ...enrichedSources.filter((s) => s.id !== targetSrcId),
        ].filter(Boolean)
      : (targetSrcUrl
          ? [
              enrichedSources.find((s) => s.url === targetSrcUrl),
              ...enrichedSources.filter((s) => s.url !== targetSrcUrl),
            ].filter(Boolean)
          : enrichedSources)

    for (const src of candidateSources) {
      const match = src.payloads?.find(
        (candidate) =>
          (targetIdentifier && candidate.id === targetIdentifier) ||
          (targetIdentifier && candidate.filename === targetIdentifier) ||
          (targetIdentifier && candidate.filename?.toLowerCase() === targetIdentifier.toLowerCase()) ||
          (targetPayload && (candidate.id === targetPayload.id || candidate.filename === targetPayload.filename))
      )
      if (match) {
        return {
          payload: match,
          srcId: src.id,
          srcUrl: src.url,
          statusInfo: match.statusInfo,
          isInstalled: match.isInstalled,
          isUpdate: match.isUpdate,
        }
      }
    }

    if (targetPayload && (targetPayload.name || targetPayload.id || targetPayload.filename)) {
      const srcUrl =
        targetSrcUrl ||
        (targetSrcId ? enrichedSources.find((s) => s.id === targetSrcId)?.url : enrichedSources[0]?.url) ||
        ''
      const statusInfo = getPayloadStatus({
        payload: targetPayload,
        srcUrl,
        items,
        self,
        sources,
        multiSources,
      })
      return {
        ...selectedPayload,
        payload: targetPayload,
        srcId: targetSrcId || enrichedSources[0]?.id || '',
        srcUrl,
        statusInfo,
        isInstalled: statusInfo.isInstalled,
        isUpdate: statusInfo.isUpdate,
      }
    }

    return null
  }, [selectedPayload, enrichedSources, items, sources, multiSources, self])

  const currentDetailId =
    resolvedPayloadData?.payload?.id ||
    (resolvedPayloadData?.payload
      ? slug(resolvedPayloadData.payload.name || resolvedPayloadData.payload.filename)
      : null)
  const isDetailInstalling = Boolean(installingPayloadId && currentDetailId === installingPayloadId)

  useLayoutEffect(() => {
    const mainEl = document.querySelector('main')
    if (!mainEl) return

    if (resolvedPayloadData) {
      mainEl.scrollTop = 0
    } else {
      mainEl.scrollTop = savedScroll
    }
  }, [resolvedPayloadData, savedScroll])

  useEffect(() => {
    if (selectedPayload && !resolvedPayloadData && !loading && repoData) {
      handleCloseDetail()
    }
  }, [selectedPayload, resolvedPayloadData, loading, repoData, handleCloseDetail])

  const handleInstallClick = (payload, srcId, srcUrl, statusInfo) => {
    // If there is an install conflict across repositories
    if (statusInfo?.hasConflict && statusInfo?.conflictSlot) {
      const srcObj = enrichedSources.find((s) => s.id === srcId || s.url === srcUrl)
      setConflictPrompt({
        payload,
        srcId,
        srcUrl,
        conflictSlot: statusInfo.conflictSlot,
        thisSourceName: srcObj?.name || 'this repository',
      })
      return
    }

    onInstall(payload, srcId, srcUrl)
  }

  if (selectedPayload && !resolvedPayloadData && (loading || !repoData)) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-ps-blue animate-spin" />
        <p className="text-zinc-400 font-medium">{t("storage_hub.loading", "Loading repository...")}</p>
      </div>
    )
  }

  if (resolvedPayloadData) {
    return (
      <div className="w-full min-w-0 max-w-full">
        <PayloadDetailPanel
          payload={resolvedPayloadData.payload}
          srcId={resolvedPayloadData.srcId}
          srcUrl={resolvedPayloadData.srcUrl}
          statusInfo={resolvedPayloadData.statusInfo}
          isInstalled={resolvedPayloadData.isInstalled}
          isUpdate={resolvedPayloadData.isUpdate}
          isInstalling={isDetailInstalling}
          onDelete={onDelete}
          externalLinkUrl={externalLinkUrl}
          setExternalLinkUrl={setExternalLinkUrl}
          onClose={handleCloseDetail}
          onInstall={(p, sid, surl, sInfo) => {
            handleInstallClick(p, sid, surl, sInfo || resolvedPayloadData.statusInfo)
          }}
        />

        {/* Conflict Modal */}
        <Modal
          show={Boolean(conflictPrompt)}
          title={t("storage_hub.conflict_title", "Payload Conflict")}
          onClose={() => setConflictPrompt(null)}
          footer={
            <div className="flex flex-col sm:flex-row w-full gap-3">
              <button
                type="button"
                onClick={() => setConflictPrompt(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-sm transition-all"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const cp = conflictPrompt
                  setConflictPrompt(null)
                  onInstall(cp.payload, cp.srcId, cp.srcUrl, {
                    mode: 'replace',
                    replaceSlot: cp.conflictSlot.slot,
                  })
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black uppercase text-sm transition-all shadow-lg"
              >
                {t("storage_hub.conflict_replace", "Replace")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const cp = conflictPrompt
                  setConflictPrompt(null)
                  onInstall(cp.payload, cp.srcId, cp.srcUrl, {
                    mode: 'keep_both',
                  })
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-ps-blue hover:bg-ps-blue/80 text-white font-black uppercase text-sm transition-all shadow-lg"
              >
                {t("storage_hub.conflict_keep_both", "Keep both")}
              </button>
            </div>
          }
        >
          <p>
            {conflictPrompt &&
              t(
                "storage_hub.conflict_message",
                "\"{{name}}\" is already installed from {{otherSource}} ({{version}}). Install from {{thisSource}} too?",
                {
                  name: conflictPrompt.payload.name || conflictPrompt.payload.id,
                  otherSource: resolveSourceDisplayName(conflictPrompt.conflictSlot, sources),
                  version: conflictPrompt.conflictSlot.version || "",
                  thisSource: conflictPrompt.thisSourceName,
                }
              )}
          </p>
        </Modal>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      {/* Conflict Modal */}
      <Modal
        show={Boolean(conflictPrompt)}
        title={t("storage_hub.conflict_title", "Payload Conflict")}
        onClose={() => setConflictPrompt(null)}
        footer={
          <div className="flex flex-col sm:flex-row w-full gap-3">
            <button
              type="button"
              onClick={() => setConflictPrompt(null)}
              className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-sm transition-all"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="button"
              onClick={() => {
                const cp = conflictPrompt
                setConflictPrompt(null)
                onInstall(cp.payload, cp.srcId, cp.srcUrl, {
                  mode: 'replace',
                  replaceSlot: cp.conflictSlot.slot,
                })
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black uppercase text-sm transition-all shadow-lg"
            >
              {t("storage_hub.conflict_replace", "Replace")}
            </button>
            <button
              type="button"
              onClick={() => {
                const cp = conflictPrompt
                setConflictPrompt(null)
                onInstall(cp.payload, cp.srcId, cp.srcUrl, {
                  mode: 'keep_both',
                })
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-ps-blue hover:bg-ps-blue/80 text-white font-black uppercase text-sm transition-all shadow-lg"
            >
              {t("storage_hub.conflict_keep_both", "Keep both")}
            </button>
          </div>
        }
      >
        <p>
          {conflictPrompt &&
            t(
              "storage_hub.conflict_message",
              "\"{{name}}\" is already installed from {{otherSource}} ({{version}}). Install from {{thisSource}} too?",
              {
                name: conflictPrompt.payload.name || conflictPrompt.payload.id,
                otherSource: resolveSourceDisplayName(conflictPrompt.conflictSlot, sources),
                version: conflictPrompt.conflictSlot.version || "",
                thisSource: conflictPrompt.thisSourceName,
              }
            )}
        </p>
      </Modal>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="pm-eyebrow mb-2">Repository Uplink</p>
          <h2 className="pm-heading text-3xl sm:text-4xl">
            {t("storage_hub.title_1", "Get")} <span className="pm-heading-accent">{t("storage_hub.title_2", "Payloads")}</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0 max-w-full">
          {isSearchOpen ? (
            <div className="flex items-center bg-[rgba(255,255,255,0.72)] border border-[rgba(124,58,237,0.22)] rounded-md px-3 py-1.5 sm:px-4 sm:py-2 focus-within:border-ps-blue/70 transition-all w-full sm:w-64 md:w-80 max-w-full">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-ps-blue mr-2 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t("storage_hub.search_placeholder", "Search payloads by name or description...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pm-mono bg-transparent border-none outline-none text-white w-full text-[11px] sm:text-xs font-medium placeholder:text-zinc-600 min-w-0 tracking-normal"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsSearchOpen(false)
                    setSearch('')
                  }
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="p-1 hover:text-[#0a1730] text-zinc-500 shrink-0"
                  title={t("app.buttons.clear", "Clear")}
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false)
                  setSearch('')
                }}
                className="p-1 hover:text-[#0a1730] text-zinc-500 ml-1 shrink-0"
                title={t("app.buttons.close", "Close")}
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className={cn(
                "pm-icon-btn p-3 rounded-lg",
                search ? "pm-icon-btn-active" : ""
              )}
              title={t("storage_hub.search_placeholder", "Search payloads by name or description...")}
            >
              <Search className="w-6 h-6" />
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              className={cn(
                "pm-icon-btn p-3 rounded-lg",
                sortMode !== 'name' ? "pm-icon-btn-active" : ""
              )}
              title={`${t("storage_hub.sort_by", "Sort by:")} ${
                sortMode === 'category'
                  ? t("storage_hub.sort_category", "Category")
                  : sortMode === 'update_time'
                  ? t("storage_hub.sort_time", "Update Time")
                  : t("storage_hub.sort_name", "Name")
              }`}
            >
              <ArrowUpDown className="w-6 h-6" />
            </button>
            <select
              value={sortMode}
              onChange={(e) => handleSortChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title={t("storage_hub.sort_by", "Sort by:")}
            >
              <option value="name" className="pm-option">{t("storage_hub.sort_name", "Name")}</option>
              <option value="category" className="pm-option">{t("storage_hub.sort_category", "Category")}</option>
              <option value="update_time" className="pm-option">{t("storage_hub.sort_time", "Update Time")}</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => fetchRemote(true)}
            disabled={loading}
            className="pm-icon-btn p-3 rounded-lg disabled:opacity-50"
            title={t("storage_hub.refresh", "Refresh Repository")}
          >
            <RefreshCw className={cn("w-6 h-6", loading && "animate-spin text-ps-blue")} />
          </button>

          {!isPS5 && (
            <label
              className="pm-icon-btn p-3 rounded-lg cursor-pointer"
              title={t("storage_hub.upload_btn", "Upload ELF Payload")}
            >
              <Upload className="w-6 h-6" />
              <input type="file" className="hidden" onChange={onUpload} accept={isIOS ? undefined : ".elf,.bin"} />
            </label>
          )}
        </div>
      </div>

      {/* Cloud Repository Section */}
      <section id="cloud-repository" className="space-y-6 -mx-3 sm:-mx-6 md:-mx-10 lg:-mx-11">
        {loading && !repoData ? (
          <div className="py-24 pm-panel pm-frame rounded-ps-3xl flex flex-col items-center justify-center space-y-6">
            <Loader2 className="w-14 h-14 text-ps-blue animate-spin" />
            <p className="label-caps">{t("storage_hub.syncing", "Syncing with Repository...")}</p>
          </div>
        ) : error ? (
          <div className="py-20 pm-panel pm-panel-danger pm-frame rounded-ps-3xl flex flex-col items-center justify-center space-y-6 border-red-500/30">
            <AlertTriangle className="w-14 h-14 text-red-400 opacity-80" />
            <div className="text-center">
              <p className="pm-mono text-lg font-bold text-white uppercase tracking-[0.14em]">{t("storage_hub.repo_unavailable", "Repository Unavailable")}</p>
              <p className="text-zinc-500 mt-1">{t("storage_hub.repo_unavailable_desc", "Check your internet connection and try again.")}</p>
            </div>
            <button onClick={() => fetchRemote(true)} className="px-8 py-3 pm-chip pm-chip-red hover:brightness-125 transition-all font-bold">{t("storage_hub.retry_btn", "Retry Connection")}</button>
          </div>
        ) : enrichedSources.length > 0 ? (
          /* ===== REPOSITORY CATALOGS ===== */
          <div className="space-y-4">
            {enrichedSources.map((src) => {
              let availablePayloads = [...src.payloads]

              if (search.trim() !== '') {
                const q = search.toLowerCase()
                availablePayloads = availablePayloads.filter(
                  (p) =>
                    (p.name && p.name.toLowerCase().includes(q)) ||
                    (p.id && p.id.toLowerCase().includes(q)) ||
                    (p.filename && p.filename.toLowerCase().includes(q)) ||
                    (p.description && p.description.toLowerCase().includes(q))
                )
              }

              // Auto-expand if there's only 1 source, otherwise respect state or active search
              const isExpanded =
                enrichedSources.length === 1 || expandedSource === src.id || search.trim() !== ''

              let hasMultipleCategories = false
              let groupedPayloads = {}
              let categories = []

              if (sortMode === 'category' && search.trim() === '') {
                groupedPayloads = availablePayloads.reduce((acc, p) => {
                  const catName = p.category ? t(`category.${p.category}`, p.category) : t("storage_hub.uncategorized", "Uncategorized")
                  if (!acc[catName]) acc[catName] = []
                  acc[catName].push(p)
                  return acc
                }, {})
                categories = Object.keys(groupedPayloads).sort()
                hasMultipleCategories = categories.length > 1
              } else {
                availablePayloads.sort((a, b) => {
                  if (sortMode === 'update_time') {
                    const dateA = a.last_update || ''
                    const dateB = b.last_update || ''
                    return dateB.localeCompare(dateA)
                  } else if (sortMode === 'name') {
                    const nameA = a.name || a.filename || ''
                    const nameB = b.name || b.filename || ''
                    return nameA.localeCompare(nameB)
                  }
                  return 0
                })
              }

              return (
                <div
                  key={src.id}
                  className={cn(
                    multiSources
                      ? "pm-panel pm-frame rounded-ps-3xl overflow-hidden"
                      : "flex flex-col space-y-4"
                  )}
                >
                  {!multiSources && src.last_update > 0 && (
                    <p className="px-3 sm:px-4 text-xs uppercase tracking-widest text-zinc-500">
                      {t("storage_hub.last_sync", "Last Sync: {{date}}", {
                        date: formatSyncTime(src.last_update, i18n.resolvedLanguage, isPS5),
                      })}
                    </p>
                  )}

                  {multiSources && (
                    <button
                      onClick={() => setExpandedSource(isExpanded ? null : src.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 md:px-6 md:py-5 hover:bg-[rgba(124,58,237,0.05)] transition-colors"
                    >
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="p-2.5 bg-[rgba(124,58,237,0.08)] border border-[rgba(124,58,237,0.25)] rounded-lg shrink-0">
                          <Globe className="w-5 h-5 text-ps-blue" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="font-bold text-white text-base md:text-lg truncate">{src.name}</p>
                          {src.error && (
                            <p className="text-xs text-red-400 flex items-center space-x-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{t("storage_hub.fetch_failed", "Fetch failed")}</span>
                            </p>
                          )}
                          {src.last_update > 0 && (
                            <p className="pm-mono text-[9px] text-zinc-500 uppercase tracking-[0.2em] mt-1">
                              {t("storage_hub.updated_at", "Updated {{date}}", {
                                date: formatSyncTime(src.last_update, i18n.resolvedLanguage, isPS5),
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 shrink-0">
                        <span className="pm-chip pm-chip-muted">
                          {t("storage_hub.payload_count", "{{count}} payloads", { count: availablePayloads.length })}
                        </span>
                        {enrichedSources.length > 1 && (
                          <ChevronDown
                            className={cn(
                              "w-5 h-5 text-zinc-500 transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        )}
                      </div>
                    </button>
                  )}

                  {isExpanded && (
                    <div className={cn(multiSources ? "border-t border-[rgba(124,58,237,0.1)] p-3 sm:p-4 md:p-4.5" : "")}>
                      {src.payloads.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-zinc-600">
                          <p className="pm-mono text-xs font-bold uppercase tracking-[0.24em]">
                            {t("storage_hub.source_empty", "Source is empty")}
                          </p>
                        </div>
                      ) : hasMultipleCategories ? (
                        categories.map((cat) => (
                          <div key={cat} className="space-y-4 mb-8 last:mb-0">
                            <h4 className="pm-eyebrow px-2">{cat}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5">
                              {groupedPayloads[cat].map((p) => (
                                <PayloadCard
                                  key={p.id || p.filename}
                                  payload={p}
                                  statusInfo={p.statusInfo}
                                  isUpdate={p.isUpdate}
                                  isInstalled={p.isInstalled}
                                  onClick={() =>
                                    handlePayloadSelect({
                                      payload: p,
                                      srcId: src.id,
                                      srcUrl: src.url,
                                      statusInfo: p.statusInfo,
                                      isInstalled: p.isInstalled,
                                      isUpdate: p.isUpdate,
                                    })
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5">
                          {availablePayloads.map((p) => (
                            <PayloadCard
                              key={p.id || p.filename}
                              payload={p}
                              statusInfo={p.statusInfo}
                              isUpdate={p.isUpdate}
                              isInstalled={p.isInstalled}
                              onClick={() =>
                                handlePayloadSelect({
                                  payload: p,
                                  srcId: src.id,
                                  srcUrl: src.url,
                                  statusInfo: p.statusInfo,
                                  isInstalled: p.isInstalled,
                                  isUpdate: p.isUpdate,
                                })
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-20 pm-panel pm-frame rounded-ps-3xl flex flex-col items-center justify-center space-y-4">
            <CloudDownload className="w-14 h-14 text-ps-blue/25" />
            <p className="pm-mono text-zinc-500 font-bold uppercase tracking-[0.24em] text-xs">
              {t("storage_hub.repo_empty", "Repository is empty")}
            </p>
          </div>
        )}
      </section>

      {/* USB Storage Section */}
      <section id="usb-storage" className="space-y-6 -mx-3 sm:-mx-6 md:-mx-10 lg:-mx-11">
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6">
          <h3 className="label-caps !text-ps-blue !opacity-100 flex items-center space-x-4 text-lg">
            <HardDrive className="w-6 h-6" />
            <span>{t("storage_hub.usb_storage_title", "USB Storage")}</span>
          </h3>
          <span className="pm-chip">
            {t("storage_hub.files_count", "{{count}} File", {
              count: payloads.filter((p) => p.includes('/mnt/usb')).length,
            })}
          </span>
        </div>

        <div className={cn("grid gap-4", isPS5 ? "grid-cols-2" : "grid-cols-1 lg:grid-cols-2")}>
          {payloads.filter((p) => p.includes('/mnt/usb')).length === 0 ? (
            <div className="col-span-full py-20 pm-panel pm-frame rounded-ps-3xl flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <HardDrive className="w-14 h-14 text-ps-blue/20" />
                {!config?.SCAN_USB_PAYLOADS && (
                  <div className="absolute -top-1 -right-1 bg-amber-500/20 rounded-full p-1 border border-amber-500/50">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                )}
              </div>
              <div className="text-center space-y-2 px-6">
                <p className="pm-mono text-zinc-500 font-bold uppercase tracking-[0.24em] text-xs">
                  {t("storage_hub.no_usb_payloads", "No USB Payloads Found")}
                </p>
                {!config?.SCAN_USB_PAYLOADS && (
                  <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
                    {t("storage_hub.usb_scan_disabled_1", "Extended USB scanning is currently disabled.")} <br />
                    <span
                      dangerouslySetInnerHTML={{
                        __html: t(
                          "storage_hub.usb_scan_disabled_2",
                          "Enable <strong>\"Scan USB Payloads\"</strong> in settings to search for payloads on connected drives."
                        ),
                      }}
                    />
                  </p>
                )}
              </div>
            </div>
          ) : (
            payloads
              .filter((p) => p.includes('/mnt/usb'))
              .map((path) => {
                return (
                  <div
                    key={path}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 glass-card pm-tile rounded-ps-2xl gap-3 sm:gap-4"
                  >
                    <div className="flex items-center space-x-4 md:space-x-6 min-w-0 w-full sm:w-auto">
                      <div className="p-3 md:p-4 bg-[rgba(124,58,237,0.06)] border border-[rgba(124,58,237,0.18)] rounded-lg transition-colors shrink-0">
                        <Usb className="w-6 h-6 md:w-8 md:h-8 text-ps-blue" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <PayloadName path={path} className="text-lg md:text-xl text-white" stacked hideIcon={true} />
                        <p className="pm-mono text-[9px] text-zinc-600 uppercase opacity-70 truncate tracking-normal">
                          {path}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => onImportFromUsb(path)}
                        className="flex items-center justify-center space-x-2 md:space-x-3 px-4 md:px-6 py-3 md:py-4 bg-[rgba(124,58,237,0.08)] hover:bg-ps-blue text-ps-blue hover:text-white rounded-lg font-bold text-xs md:text-sm uppercase tracking-[0.1em] transition-colors border border-[rgba(124,58,237,0.3)] group/btn w-full sm:w-auto"
                      >
                        <Database className="w-4 h-4 md:w-5 md:h-5 transition-colors" />
                        <span>{t("storage_hub.move_internal_btn", "Move to Internal")}</span>
                      </button>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </section>

      {/* Footer Info for PS5 */}
      {isPS5 && (
        <div
          className={cn(
            "pm-panel pm-frame p-6 md:p-10 rounded-ps-3xl flex items-center gap-8 md:gap-12 mt-12 md:mt-16",
            isPS5 ? "flex-row" : "flex-col md:flex-row"
          )}
        >
          <div className="flex flex-col items-center space-y-4 md:space-y-6 shrink-0">
            <div className="pm-qr p-4 md:p-6 rounded-xl">
              <QRCodeSVG value={`http://${ip}:8084`} size={isPS5 ? 160 : 120} level="M" />
            </div>
            <code className="pm-mono text-ps-blue text-sm md:text-base font-bold tracking-[0.14em]">
              {ip}:8084
            </code>
          </div>
          <div className="flex-1 space-y-3 md:space-y-4 text-center md:text-left">
            <h4 className="pm-mono !opacity-100 text-lg md:text-2xl tracking-[0.2em] uppercase flex items-center justify-center md:justify-start space-x-3 md:space-x-4">
              <div className="w-1 md:w-1.5 h-6 md:h-8 bg-ps-blue shadow-[0_0_14px_rgba(124,58,237,0.8)]" />
              <span>{t("storage_hub.remote_management_title", "Remote Management")}</span>
            </h4>
            <p className="text-base md:text-xl text-zinc-400 leading-relaxed font-medium max-w-3xl">
              {t(
                "storage_hub.remote_management_desc",
                "Access this dashboard from your computer or phone to manage and upload payloads directly from your local network."
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default StorageHub
