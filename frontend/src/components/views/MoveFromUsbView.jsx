import { apiFetch, mutationFetch } from '../../utils/mutationRequest'
import React, { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, HardDrive, Cpu, AlertTriangle, CheckCircle2, Loader2, Info, Usb } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const MoveFromUsbView = ({ path, onBack, onComplete, addToast }) => {
  const { t } = useTranslation()
  const [status, setStatus] = useState('loading') // loading, confirm, exists_same, exists_different, processing, error, success
  const [details, setDetails] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const checkPayload = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await apiFetch(`/usb_move_check?path=${encodeURIComponent(path)}`)
      const data = await res.json()
      if (data.error) {
        setErrorMsg(data.error)
        setStatus('error')
      } else {
        setDetails(data)
        if (data.status === 'exists_same' || data.status === 'exists_different' || data.folder_exists || data.existing) {
          setStatus('exists_different')
        } else {
          setStatus('confirm')
        }
      }
    } catch {
      setErrorMsg(t("move_usb.conn_failed", "Failed to connect to backend"))
      setStatus('error')
    }
  }, [path, t])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkPayload()
  }, [checkPayload])

  const performMove = async (mode = 'new', keepOriginal = false) => {
    setStatus('processing')
    try {
      const modeParam = (mode === true || mode === 'replace') ? 'replace' : (mode === 'keep_both' ? 'keep_both' : 'new')
      const res = await mutationFetch(`/usb_move_perform?path=${encodeURIComponent(path)}&mode=${encodeURIComponent(modeParam)}&keep_original=${keepOriginal}`)
      const data = await res.json()
      if (data.error) {
        setErrorMsg(data.error)
        setStatus('error')
      } else {
        setStatus('success')
        addToast(data.warning || (keepOriginal ? t("move_usb.copied", "Payload copied to internal memory") : t("move_usb.moved", "Payload moved to internal memory")))
        setTimeout(() => {
          onComplete()
        }, 2000)
      }
    } catch {
      setErrorMsg(t("move_usb.op_failed", "Operation failed"))
      setStatus('error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
      <button onClick={onBack} className="pm-mono flex items-center space-x-3 text-zinc-500 hover:text-ps-text transition-colors group uppercase tracking-[0.14em] text-[10px] md:text-xs font-bold">
        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
        <span>{t("move_usb.back_btn", "Back to Management")}</span>
      </button>

      <div className="space-y-4">
        <p className="pm-eyebrow">Import Protocol</p>
        <h2 className="pm-heading text-3xl md:text-4xl">
          {t("move_usb.title_1", "Import")} <span className="pm-heading-accent">{t("move_usb.title_2", "to Internal")}</span>
        </h2>
        <p className="text-zinc-500 max-w-2xl">{t("move_usb.description", "Import the selected payload from your USB drive to the PS5's internal data storage.")}</p>
      </div>

      <div className="pm-panel pm-frame p-6 md:p-10 rounded-ps-3xl space-y-8 md:space-y-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8 text-center sm:text-left">
          <div className="p-4 md:p-6 bg-ps-blue/20 rounded-3xl border border-ps-blue/30 shrink-0">
            <Usb className="w-8 h-8 md:w-10 md:h-10 text-ps-blue" />
          </div>
          <div className="space-y-1 md:space-y-2 min-w-0 flex-1">
            <p className="label-caps !text-ps-blue">{t("move_usb.source_path_label", "Source Path")}</p>
            <p className="text-xl md:text-2xl font-black text-white tracking-tight truncate w-full pm-mono normal-case">{path}</p>
          </div>
        </div>

        <div className="h-px bg-white/5" />

        {status === 'loading' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-6">
            <Loader2 className="w-12 h-12 text-ps-blue animate-spin" />
            <p className="pm-mono text-[10px] tracking-[0.3em] uppercase text-zinc-500 animate-pulse">{t("move_usb.checking_storage", "Checking internal storage...")}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-6">
            <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
            <div className="space-y-2">
              <p className="text-lg font-bold text-white">{t("move_usb.error_title", "Something went wrong")}</p>
              <p className="text-red-400/80 leading-relaxed">{errorMsg}</p>
              <button onClick={checkPayload} className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg font-bold text-xs uppercase tracking-[0.1em]">{t("move_usb.retry_btn", "Retry")}</button>
            </div>
          </div>
        )}

        {status === 'exists_same' && (
          <div className="space-y-6 md:space-y-8">
            <div className="p-6 md:p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
              <div className="space-y-2">
                <p className="text-lg font-bold text-white">{t("move_usb.same_exists_title", "Identical file already exists")}</p>
                <p className="text-sm md:text-lg text-emerald-400/80 leading-relaxed">
                  {t("move_usb.same_exists_desc", "A payload with the same name and content (SHA256: {{sha}}...) is already in your internal library. No action is needed.", { sha: details?.sha256?.substring(0, 12) })}
                </p>
              </div>
            </div>
            <button onClick={onBack} className="w-full py-4 md:py-6 rounded-lg bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-[0.12em] text-base md:text-lg transition-colors border border-white/10">{t("move_usb.return_btn", "Return to Storage Hub")}</button>
          </div>
        )}

        {status === 'exists_different' && (
          <div className="space-y-6 md:space-y-8">
            <div className="p-6 md:p-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
              <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
              <div className="space-y-2">
                <p className="text-lg font-bold text-white">{t("move_usb.prev_version_title", "Previous version detected")}</p>
                <p className="text-sm md:text-lg text-amber-400/80 leading-relaxed">
                  {t("move_usb.prev_version_desc", "A version of <1>{{name}}</1> already exists in internal storage. Importing this will replace the current installation. Do you want to proceed?", { components: { 1: <strong /> }, name: details?.folder_name || details?.filename })}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => performMove('replace', true)} className="flex-1 py-3.5 md:py-4 rounded-lg bg-amber-600/80 hover:bg-amber-600 text-[#1a0f02] font-black uppercase tracking-[0.08em] text-xs transition-colors">
                  {t("move_usb.replace_copy_btn", "Replace & Copy")}
                </button>
                <button onClick={() => performMove('replace', false)} className="flex-1 py-3.5 md:py-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#1a0f02] font-black uppercase tracking-[0.08em] text-xs transition-colors">
                  {t("move_usb.replace_move_btn", "Replace & Move")}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => performMove('keep_both', true)} className="flex-1 py-3.5 md:py-4 rounded-lg bg-ps-blue/20 border border-ps-blue/40 hover:bg-ps-blue/30 text-ps-blue font-black uppercase tracking-[0.08em] text-xs transition-colors">
                  {t("move_usb.keep_both_copy_btn", "Keep both & Copy")}
                </button>
                <button onClick={() => performMove('keep_both', false)} className="pm-btn-primary flex-1 py-3.5 md:py-4 rounded-lg font-black uppercase tracking-[0.08em] text-xs">
                  {t("move_usb.keep_both_move_btn", "Keep both & Move")}
                </button>
              </div>
              <button onClick={onBack} className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-[0.1em] text-xs transition-colors border border-white/10">
                {t("move_usb.cancel_btn", "Cancel")}
              </button>
            </div>
          </div>
        )}

        {status === 'confirm' && (
          <div className="space-y-6 md:space-y-8">
            <div className="p-6 md:p-8 bg-ps-blue/5 border border-ps-blue/10 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
              <Info className="w-8 h-8 text-ps-blue shrink-0" />
              <div className="space-y-2">
                <p className="text-lg font-bold text-white">{t("move_usb.ready_title", "Ready to Import")}</p>
                <p className="text-sm md:text-lg text-zinc-400 leading-relaxed">
                  {t("move_usb.ready_desc", "The payload will be imported to internal storage. You can either copy it and keep the original on the USB, or move it and delete the original.")}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => performMove(false, true)} className="flex-1 py-4 md:py-6 rounded-lg bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-[0.1em] text-base md:text-lg transition-colors border border-white/20">{t("move_usb.copy_btn", "Copy to Internal")}</button>
              <button onClick={() => performMove(false, false)} className="pm-btn-primary flex-1 py-4 md:py-6 rounded-lg font-black uppercase tracking-[0.1em] text-base md:text-lg">{t("move_usb.move_btn", "Move to Internal")}</button>
            </div>
          </div>
        )}

        {status === 'processing' && (
          <div className="py-20 flex flex-col items-center justify-center space-y-8 text-center">
            <div className="ps5-robust-spinner" />
            <div className="space-y-2">
              <p className="pm-mono text-xl md:text-2xl font-black text-white uppercase tracking-[0.16em] animate-pulse">{t("move_usb.importing", "Importing Payload...")}</p>
              <p className="text-zinc-500">{t("move_usb.copying_desc", "Copying data and verifying integrity.")}</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="py-20 flex flex-col items-center justify-center space-y-8 text-center">
            <div className="relative w-24 h-24 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_50px_-14px_rgba(5,150,105,0.45)]">
              <span className="absolute inset-2 rounded-full border border-emerald-400/20" />
              <CheckCircle2 className="relative w-12 h-12 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <p className="pm-mono text-2xl md:text-3xl font-black text-white uppercase tracking-[0.16em]">{t("move_usb.success_title", "Success!")}</p>
              <p className="text-zinc-500">{t("move_usb.success_desc", "The payload has been safely imported to internal storage.")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MoveFromUsbView
