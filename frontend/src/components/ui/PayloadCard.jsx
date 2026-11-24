import React from 'react';
import { cn, formatVersionTag } from '../../utils/helpers';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ArrowUpCircle } from 'lucide-react';
import PayloadName from './PayloadName';
import PayloadIcon from './PayloadIcon';

const PayloadCard = ({ payload, onClick, statusInfo, isUpdate: isUpdateProp, isInstalled: isInstalledProp }) => {
  const { t } = useTranslation();

  const isUpdate = statusInfo ? statusInfo.isUpdate : Boolean(isUpdateProp);
  const isInstalled = statusInfo ? statusInfo.isInstalled : Boolean(isInstalledProp);
  const alsoInstalledFrom = statusInfo?.alsoInstalledFrom;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group pm-frame flex items-start gap-4 sm:gap-5 p-4 sm:p-5 glass-card rounded-xl md:rounded-2xl transition-all text-left relative overflow-hidden focus:outline-none",
        isUpdate
          ? "border-ps-blue/30"
          : isInstalled
          ? "border-white/5"
          : "border-white/10"
      )}
    >
      {/* Icon on the left */}
      <div className="shrink-0 self-start">
        <PayloadIcon
          icon={payload.icon}
          name={payload.filename}
          className="w-16 h-16 sm:w-20 sm:h-20 text-2xl shadow-md"
        />
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0 flex flex-col justify-start">
        {/* Dynamic Header Row: Title on the left, Version on the right */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
          <PayloadName
            path={payload.filename}
            hideVersion={true}
            displayName={payload.name}
            className="text-base sm:text-lg text-white font-extrabold min-w-0 flex-1"
          />

          {payload?.version && (
            <span
              className="pm-chip pm-chip-muted shrink-0 max-w-[86px] truncate"
              title={payload.version}
            >
              {formatVersionTag(payload.version)}
            </span>
          )}
        </div>

        {/* Description (max 3 lines) */}
        <p className={cn(
          "text-xs sm:text-sm text-zinc-400 line-clamp-3 leading-relaxed mt-1 break-words",
          isUpdate ? "pr-20 sm:pr-24" : isInstalled ? "pr-7 sm:pr-8" : ""
        )}>
          {payload.description || t("storage_hub.no_description", "No description available")}
        </p>

        {/* Author & Also Installed hint */}
        <div className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-1 mt-2",
          isUpdate ? "pr-20 sm:pr-24" : isInstalled ? "pr-7 sm:pr-8" : ""
        )}>
          {payload.author && (
            <div className="text-[11px] text-zinc-500 font-medium truncate">
              {payload.author}
            </div>
          )}

          {alsoInstalledFrom && !isInstalled && !isUpdate && (
            <span className="text-[10px] sm:text-[11px] text-amber-400/90 font-medium truncate">
              {t("storage_hub.also_installed_hint", "Also installed from {{source}}", { source: alsoInstalledFrom })}
            </span>
          )}
        </div>
      </div>

      {/* Bottom-right Status Badge: Update badge or Installed checkmark */}
      {isUpdate ? (
        <div
          className="absolute bottom-3 right-3 sm:bottom-3.5 sm:right-3.5 flex items-center pointer-events-none z-10"
          title={t("storage_hub.update_badge", "Update")}
        >
          <span className="pm-chip pm-chip-green inline-flex items-center gap-1">
            <ArrowUpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{t("storage_hub.update_badge", "Update")}</span>
          </span>
        </div>
      ) : isInstalled ? (
        <div
          className="absolute bottom-3.5 right-3.5 sm:bottom-4 sm:right-4 flex items-center pointer-events-none z-10"
          title={t("storage_hub.installed_badge", "Installed")}
        >
          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 bg-[rgba(255,255,255,0.85)] rounded-full" />
        </div>
      ) : null}
    </button>
  );
};

export default PayloadCard;
