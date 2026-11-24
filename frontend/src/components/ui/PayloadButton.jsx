import React from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Globe, Star, ChevronLeft, ChevronRight, CheckCircle2, Trash2 } from 'lucide-react'
import PayloadName from './PayloadName'
import PayloadIcon from './PayloadIcon'
import { cn, formatSourceTag } from '../../utils/helpers'

const PayloadButton = ({
  path = '',
  itemKey,
  onClick,
  onDelete,
  isLoading,
  sourceName,
  version,
  icon,
  showIcon = true,
  author,
  displayName,
  isFavorite,
  isLaunched,
  isEditMode,
  isManageMode,
  onMoveFavorite,
  canMoveLeft,
  canMoveRight,
}) => {
  const { t } = useTranslation()
  const safePath = typeof path === 'string' ? path : ''
  const isUsb = Boolean(safePath && safePath.startsWith('/mnt/usb'))
  const iconName = safePath ? safePath.split('/').pop() : (displayName || 'Payload')
  // Kept for potential re-enable of the BIN/ELF chip below.
  const fileKind = /\.bin$/i.test(safePath) ? 'BIN' : 'ELF'

  const handleClick = (e) => {
    if (isManageMode) {
      if (!isUsb) {
        if (onDelete) onDelete()
        else if (onClick) onClick(e)
      }
    } else if (onClick) {
      onClick(e)
    }
  }

  const handleMove = (e, direction) => {
    e.stopPropagation()
    if (!onMoveFavorite) return
    if (onMoveFavorite.length === 1) {
      onMoveFavorite(direction)
    } else {
      onMoveFavorite(itemKey || safePath, direction)
    }
  }

  return (
    <div
      className={cn(
        "group glass-card pm-tile rounded-ps-xl flex flex-col justify-center border transition-all text-left relative min-h-[72px]",
        isManageMode ? "pm-tile-danger border-red-500/25" : "border-white/5",
        isManageMode && isUsb && "opacity-50 grayscale cursor-not-allowed"
      )}
    >
      <button
        onClick={handleClick}
        disabled={isLoading || (isManageMode && isUsb)}
        title={isManageMode && !isUsb ? t("app.dashboard.removePayload", "Remove Payload") : undefined}
        className="w-full flex-1 pl-4 pr-3 py-2.5 text-left relative z-10 rounded-ps-xl focus:outline-none focus:ring-2 focus:ring-ps-blue"
      >
      <div className="flex items-center justify-between w-full z-10 my-auto">
        <div className="flex flex-1 items-center gap-3.5 min-w-0 min-h-[44px] pr-2">
          {showIcon && <PayloadIcon icon={icon} name={iconName} className="w-11 h-11 text-xl shrink-0" />}
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <PayloadName path={safePath} version={version} hideVersion={true} displayName={displayName} className="text-white text-lg md:text-xl leading-snug" stacked={false} />
            <div className="flex items-center gap-2 mt-0.5">
              {version && <span className="pm-chip pm-chip-muted px-1.5 py-0.5 max-w-[110px] truncate">{version}</span>}
              {author && (
                <div className="text-[10px] text-zinc-500 font-medium truncate leading-none">
                  {author}
                </div>
              )}
            </div>
            {sourceName && !isUsb && (
              <div className="flex items-center mt-0.5">
                <span className="pm-chip pm-chip-muted max-w-full normal-case tracking-normal" title={sourceName}>
                  <Globe className="w-3 h-3 shrink-0 opacity-70" />
                  <span className="truncate">{formatSourceTag(sourceName)}</span>
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* BIN/ELF chip intentionally hidden — kept commented for easy re-enable. */}
          {/* <span className="pm-chip pm-chip-muted hidden sm:!inline-flex">{fileKind}</span> */}
          {isEditMode && (
            <div
              className={cn(
                "p-1 rounded-lg transition-all",
                isFavorite ? "text-yellow-400 opacity-100" : "text-zinc-600 opacity-50"
              )}
            >
              <Star className={cn("w-5 h-5", isFavorite && "fill-yellow-400")} />
            </div>
          )}
          {isManageMode && !isUsb && (
            <div
              className="p-1.5 rounded-lg text-red-500 transition-all opacity-50 group-hover:opacity-100"
            >
              <Trash2 className="w-5 h-5" />
            </div>
          )}
          {isLoading && <Loader2 className="w-6 h-6 animate-spin text-ps-blue" />}
        </div>
      </div>
      {isUsb && (
        <div className="pm-mono mt-1.5 text-[9px] text-zinc-500 truncate opacity-70 group-hover:opacity-100 transition-opacity z-10 select-none">
          {safePath}
        </div>
      )}
      </button>

      {/*
        "Launched" sticker — rendered as an absolutely-positioned badge
        OUTSIDE the button's flex layout, so it never steals horizontal
        space from the payload name. No tooltip; purely a status marker.
      */}
      {isLaunched && !isEditMode && !isManageMode && !isLoading && (
        <div
          className="absolute top-1.5 right-1.5 z-20 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white shadow-[0_2px_10px_rgba(16,185,129,0.55)] pointer-events-none"
          aria-label={t("app.dashboard.launched_tooltip", "Launched recently")}
        >
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )}

      {(isEditMode && isFavorite) && (
        <div className="absolute bottom-2 right-3 flex items-center gap-2 z-20">
          <button
            onClick={(e) => { if (canMoveLeft) handleMove(e, -1); }}
            aria-label={t("app.dashboard.move_left", "Move Left")}
            disabled={!canMoveLeft}
            className="pm-icon-btn p-1.5 rounded-lg disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { if (canMoveRight) handleMove(e, 1); }}
            aria-label={t("app.dashboard.move_right", "Move Right")}
            disabled={!canMoveRight}
            className="pm-icon-btn p-1.5 rounded-lg disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default PayloadButton