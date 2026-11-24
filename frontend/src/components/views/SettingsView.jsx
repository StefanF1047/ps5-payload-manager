import React, { useState } from 'react'
import { Terminal, ChevronRight, Globe, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/helpers'
import { LANGUAGE_NAMES } from '../../utils/localeSupport'

const FOLLOW_BROWSER_LANGUAGE = '__auto__'

const isFollowingBrowserLanguage = () => {
  try {
    return !localStorage.getItem('i18nextLng')
  } catch {
    return true
  }
}

const SettingRow = ({ title, description, children, icon: Icon, vertical }) => (
  <div className={cn(
    "pm-panel pm-frame p-5 md:p-7 rounded-ps-2xl transition-all group h-full",
    vertical ? "flex flex-col space-y-4" : "grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 md:flex md:items-center md:justify-between md:gap-6"
  )}>
    <div className="flex items-start md:items-center space-x-4 md:space-x-5 min-w-0 col-span-1">
      {Icon && (
        <div className="p-3 md:p-4 bg-[rgba(124,58,237,0.06)] border border-[rgba(124,58,237,0.18)] rounded-lg shrink-0">
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-ps-blue" />
        </div>
      )}
      <div className="space-y-1 min-w-0">
        <p className="font-bold text-white uppercase text-sm md:text-base tracking-[0.08em] leading-tight">{title}</p>
        <p className={cn("text-sm text-zinc-500 max-w-md leading-relaxed", vertical ? "block mt-2" : "hidden md:!block")}>{description}</p>
      </div>
    </div>
    <div className={cn("shrink-0", vertical ? "w-full pt-2" : "col-start-2 row-start-1 md:ml-8 self-center md:self-auto")}>
      {children}
    </div>
    {!vertical && (
      <p className="md:hidden col-span-2 text-xs text-zinc-500 leading-relaxed">
        {description}
      </p>
    )}
  </div>
)

const SettingsView = ({ config, onSaveConfig, setShowLogs, onNavigate, onClearCache }) => {
  const { t, i18n } = useTranslation()
  const showDashboardIcons = config.SHOW_DASHBOARD_ICONS !== false
  const autoOpen = config.AUTO_BROWSER_OPEN !== false
  const killDiscPlayer = config.KILL_DISC_PLAYER_ON_STARTUP !== false
  const autoInstall = config.AUTO_INSTALL_APP !== false
  const autoloadReturn = config.AUTOLOAD_RETURN_TO_DASHBOARD === true
  const autoloadDelay = config.AUTOLOAD_DELAY ?? 5
  const multiSources = config.MULTI_SOURCES_ENABLED === true
  const [followBrowserLanguage, setFollowBrowserLanguage] = useState(isFollowingBrowserLanguage)

  const [clearingCache, setClearingCache] = useState(false)
  const [cacheMessage, setCacheMessage] = useState('')
  const handleClearCache = async () => {
    if (clearingCache) return
    setClearingCache(true)
    setCacheMessage('')
    try {
      await onClearCache()
      setCacheMessage(t('settings.cache_cleared', 'Repository cache cleared.'))
    } catch {
      setCacheMessage(t('settings.cache_failed', 'Could not clear repository cache.'))
    } finally { setClearingCache(false) }
  }

  const getLanguageDisplayName = lang => LANGUAGE_NAMES[lang] || lang;

  const currentLang = i18n.resolvedLanguage || i18n.language || 'en';
  const selectedLanguage = followBrowserLanguage ? FOLLOW_BROWSER_LANGUAGE : currentLang;

  const handleLanguageChange = async (event) => {
    const language = event.target.value;
    const followBrowser = language === FOLLOW_BROWSER_LANGUAGE;
    setFollowBrowserLanguage(followBrowser);
    try {
      if (followBrowser) {
        localStorage.removeItem('i18nextLng');
      } else {
        localStorage.setItem('i18nextLng', language);
      }
    } catch {
      // Continue with an in-memory language change if storage is unavailable.
    }
    await i18n.changeLanguage(followBrowser ? undefined : language);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-20">
      <div className="space-y-4">
        <p className="pm-eyebrow">System Configuration</p>
        <h2 className="pm-heading text-4xl">
          {t("settings.title", "Settings")}
        </h2>
      </div>

      {/* Startup Settings */}
      <section className="space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SettingRow
            title={t("settings.language_title", "Language")}
            description={t("settings.language_desc", "Change the display language of the application.")}
            icon={Languages}
            vertical
          >
            <div className="flex flex-col items-start space-y-2 w-full">
              <div className="relative w-full bg-[rgba(255,255,255,0.72)] border border-[rgba(124,58,237,0.2)] text-white rounded-lg px-4 py-3 font-bold tracking-[0.06em] hover:border-[rgba(124,58,237,0.5)] transition-all overflow-hidden flex items-center justify-between">
                <span>
                  {followBrowserLanguage
                    ? t("settings.language_system_default", "System Default")
                    : getLanguageDisplayName(currentLang)}
                </span>
                <ChevronRight className="w-5 h-5 text-zinc-500 rotate-90" />
                <select
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  <option value={FOLLOW_BROWSER_LANGUAGE} className="pm-option">
                    {t("settings.language_system_default", "System Default")}
                  </option>
                  {Object.keys(i18n.store.data).map(lang => (
                    <option key={lang} value={lang} className="pm-option">{getLanguageDisplayName(lang)}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed text-left w-full mt-1">
                {t("settings.language_disclaimer", "Translations are community-driven and may contain errors.")}
              </p>
            </div>
          </SettingRow>

          <SettingRow
            title={t("settings.dashboard_icons_title", "Dashboard Payload Icons")}
            description={t("settings.dashboard_icons_desc", "Show payload icons on the dashboard. Hiding them leaves more space for text.")}
          >
            <button
              type="button"
              role="switch"
              aria-checked={showDashboardIcons}
              aria-label={t("settings.dashboard_icons_title", "Dashboard Payload Icons")}
              onClick={() => onSaveConfig({ SHOW_DASHBOARD_ICONS: !showDashboardIcons })}
              className={cn(
                "pm-switch w-14 h-7 md:w-20 md:h-10 rounded-full relative p-1 md:p-1.5",
                showDashboardIcons ? "pm-switch-on" : ""
              )}
            >
              <div className={cn(
                "pm-switch-knob w-5 h-5 md:w-7 md:h-7 rounded-full transition-all",
                showDashboardIcons ? "translate-x-7 md:translate-x-10" : "translate-x-0"
              )} />
            </button>
          </SettingRow>

          <SettingRow
            title={t("settings.auto_open_title", "Auto-open Browser")}
            description={t("settings.auto_open_desc", "Automatically launch the browser when Payload Manager payload is executed.")}
          >
            <button
              onClick={() => onSaveConfig({ AUTO_BROWSER_OPEN: !autoOpen })}
              className={cn(
                "pm-switch w-14 h-7 md:w-20 md:h-10 rounded-full relative p-1 md:p-1.5",
                autoOpen ? "pm-switch-on" : ""
              )}
            >
              <div className={cn(
                "pm-switch-knob w-5 h-5 md:w-7 md:h-7 rounded-full transition-all",
                autoOpen ? "translate-x-7 md:translate-x-10" : "translate-x-0"
              )} />
            </button>
          </SettingRow>

          <SettingRow
            title={t("settings.auto_install_title", "Auto-install App Launcher")}
            description={t("settings.auto_install_desc", "Automatically install the Payload Manager app to the PS5 home screen.")}
          >
            <button
              onClick={() => onSaveConfig({ AUTO_INSTALL_APP: !autoInstall })}
              className={cn(
                "pm-switch w-14 h-7 md:w-20 md:h-10 rounded-full relative p-1 md:p-1.5",
                autoInstall ? "pm-switch-on" : ""
              )}
            >
              <div className={cn(
                "pm-switch-knob w-5 h-5 md:w-7 md:h-7 rounded-full transition-all",
                autoInstall ? "translate-x-7 md:translate-x-10" : "translate-x-0"
              )} />
            </button>
          </SettingRow>

          <SettingRow
            title={t("settings.kill_disc_title", "Kill Disc Player")}
            description={t("settings.kill_disc_desc", "Automatically terminate the Disc Player application on startup (for BD-JB users).")}
          >
            <button
              onClick={() => onSaveConfig({ KILL_DISC_PLAYER_ON_STARTUP: !killDiscPlayer })}
              className={cn(
                "pm-switch w-14 h-7 md:w-20 md:h-10 rounded-full relative p-1 md:p-1.5",
                killDiscPlayer ? "pm-switch-on" : ""
              )}
            >
              <div className={cn(
                "pm-switch-knob w-5 h-5 md:w-7 md:h-7 rounded-full transition-all",
                killDiscPlayer ? "translate-x-7 md:translate-x-10" : "translate-x-0"
              )} />
            </button>
          </SettingRow>

          <SettingRow
            title={t("settings.scan_usb_title", "Scan USB Payloads")}
            description={t("settings.scan_usb_desc", "Enable scanning for .elf and .bin files in the root directory of USB drives (/mnt/usb0-7).")}
          >
            <button
              onClick={() => onSaveConfig({ SCAN_USB_PAYLOADS: !config.SCAN_USB_PAYLOADS })}
              className={cn(
                "pm-switch w-14 h-7 md:w-20 md:h-10 rounded-full relative p-1 md:p-1.5",
                config.SCAN_USB_PAYLOADS ? "pm-switch-on" : ""
              )}
            >
              <div className={cn(
                "pm-switch-knob w-5 h-5 md:w-7 md:h-7 rounded-full transition-all",
                config.SCAN_USB_PAYLOADS ? "translate-x-7 md:translate-x-10" : "translate-x-0"
              )} />
            </button>
          </SettingRow>

          <SettingRow
            title={t("settings.autoload_return_title", "Return After Autoload")}
            description={t("settings.autoload_return_desc", "Automatically return to the dashboard 3 seconds after all payloads load successfully.")}
          >
            <button
              type="button"
              role="switch"
              aria-checked={autoloadReturn}
              aria-label={t("settings.autoload_return_title", "Return After Autoload")}
              onClick={() => onSaveConfig({ AUTOLOAD_RETURN_TO_DASHBOARD: !autoloadReturn })}
              className={cn(
                "pm-switch w-14 h-7 md:w-20 md:h-10 rounded-full relative p-1 md:p-1.5",
                autoloadReturn ? "pm-switch-on" : ""
              )}
            >
              <div className={cn(
                "pm-switch-knob w-5 h-5 md:w-7 md:h-7 rounded-full transition-all",
                autoloadReturn ? "translate-x-7 md:translate-x-10" : "translate-x-0"
              )} />
            </button>
          </SettingRow>

          <div className="pm-panel pm-frame flex flex-col justify-between p-6 md:p-7 rounded-ps-2xl space-y-8 h-full">
            <div className="flex justify-between items-center gap-4">
              <div className="space-y-1">
                <p className="font-bold text-white uppercase text-sm md:text-base tracking-[0.08em]">{t("settings.autoload_delay_title", "Autoload Delay")}</p>
                <p className="text-sm text-zinc-500">{t("settings.autoload_delay_desc", "Wait time before the autoload sequence begins.")}</p>
              </div>
              <span className="pm-mono text-ps-blue font-black text-3xl md:text-4xl tracking-tight">{autoloadDelay}s</span>
            </div>

            <div className="grid grid-cols-4 gap-2 md:gap-3">
              {[1, 3, 5, 10].map(s => (
                <button
                  key={s}
                  onClick={() => onSaveConfig({ AUTOLOAD_DELAY: s })}
                  className={cn(
                    "py-4 md:py-5 rounded-lg font-black text-lg md:text-xl transition-colors border uppercase",
                    autoloadDelay === s
                      ? "bg-ps-blue border-ps-blue text-white"
                      : "bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10 hover:text-ps-text"
                  )}
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Source */}
      <section className="space-y-8">
        <h3 className="pm-mono !text-ps-blue !opacity-100 flex items-center space-x-4 text-lg md:text-xl tracking-[0.24em] uppercase">
          <Globe className="w-6 h-6" />
          <span>{t("settings.sources_title", "Payload Sources")}</span>
        </h3>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SettingRow
            title={t("settings.multi_sources_title", "Multiple Payload Sources")}
            description={t("settings.multi_sources_desc", "Enable third-party payload repositories. Payloads from multiple sources are grouped by catalog in the Manage tab.")}
            icon={Globe}
          >
            <button
              onClick={() => onSaveConfig({ MULTI_SOURCES_ENABLED: !multiSources })}
              className={cn(
                "pm-switch w-14 h-7 md:w-20 md:h-10 rounded-full relative p-1 md:p-1.5",
                multiSources ? "pm-switch-on" : ""
              )}
            >
              <div className={cn(
                "pm-switch-knob w-5 h-5 md:w-7 md:h-7 rounded-full transition-all",
                multiSources ? "translate-x-7 md:translate-x-10" : "translate-x-0"
              )} />
            </button>
          </SettingRow>

          <SettingRow
            title={t('settings.cache_title', 'Repository Cache')}
            description={t('settings.cache_desc', 'Clear downloaded catalogs and icons, then fetch fresh copies. Installed payloads and your settings are preserved.')}
            icon={Globe}
            vertical
          >
            <button onClick={handleClearCache} disabled={clearingCache}
              className="px-5 py-3 rounded-lg bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.3)] hover:bg-[rgba(124,58,237,0.2)] disabled:opacity-50 font-bold uppercase tracking-[0.1em] text-sm text-ps-blue transition-colors">
              {clearingCache ? t('settings.cache_clearing', 'Clearing…') : t('settings.cache_clear', 'Clear Cache')}
            </button>
            {cacheMessage && <p role="status" className="mt-3 text-sm text-zinc-400">{cacheMessage}</p>}
          </SettingRow>

          {multiSources && (
            <button
              onClick={() => onNavigate('sources')}
              className="group w-full text-left grid grid-cols-[1fr_auto] md:flex md:items-center md:justify-between pm-panel pm-tile p-5 md:p-7 rounded-ps-2xl transition-all gap-x-4 gap-y-3 md:gap-6"
            >
              <div className="flex items-start md:items-center space-x-4 md:space-x-5 min-w-0 col-span-1">
                <div className="p-3 md:p-4 bg-[rgba(124,58,237,0.06)] border border-[rgba(124,58,237,0.18)] rounded-lg shrink-0">
                  <Globe className="w-5 h-5 md:w-6 md:h-6 text-ps-blue" />
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="font-bold text-white uppercase text-sm md:text-base tracking-[0.08em] leading-tight">{t("settings.manage_sources_title", "Manage Sources")}</p>
                  <p className="hidden md:!block text-sm text-zinc-500 max-w-md leading-relaxed">{t("settings.manage_sources_desc", "Add, remove, or reorder your payload repositories.")}</p>
                </div>
              </div>
              <div className="shrink-0 col-start-2 row-start-1 md:ml-8 self-center md:self-auto">
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-zinc-700 group-hover:text-ps-blue group-hover:translate-x-2 transition-all" />
              </div>
              <p className="md:hidden col-span-2 text-xs text-zinc-500 leading-relaxed">
                {t("settings.manage_sources_desc", "Add, remove, or reorder your payload repositories.")}
              </p>
            </button>
          )}
        </div>
      </section>

      {/* Diagnostics */}
      <section className="space-y-8">
        <h3 className="pm-mono !text-ps-blue !opacity-100 flex items-center space-x-4 text-lg md:text-xl tracking-[0.24em] uppercase">
          <Terminal className="w-6 h-6" />
          <span>{t("settings.diagnostics_title", "Diagnostics")}</span>
        </h3>

        <button
          onClick={() => setShowLogs(true)}
          className="group w-full text-left grid grid-cols-[1fr_auto] md:flex md:items-center md:justify-between pm-panel pm-tile p-5 md:p-7 rounded-ps-2xl transition-all gap-x-4 gap-y-3 md:gap-6"
        >
          <div className="flex items-start md:items-center space-x-4 md:space-x-5 min-w-0 col-span-1">
            <div className="p-3 md:p-4 bg-[rgba(124,58,237,0.06)] border border-[rgba(124,58,237,0.18)] rounded-lg shrink-0">
              <Terminal className="w-5 h-5 md:w-6 md:h-6 text-ps-blue" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="font-bold text-white uppercase text-sm md:text-base tracking-[0.08em] leading-tight">{t("settings.log_viewer_title", "Open Log Viewer")}</p>
              <p className="hidden md:!block text-sm text-zinc-500 max-w-md leading-relaxed">{t("settings.log_viewer_desc", "Access real-time debug output from the Payload Manager daemon.")}</p>
            </div>
          </div>
          <div className="shrink-0 col-start-2 row-start-1 md:ml-8 self-center md:self-auto">
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-zinc-700 group-hover:text-ps-blue group-hover:translate-x-2 transition-all" />
          </div>
          <p className="md:hidden col-span-2 text-xs text-zinc-500 leading-relaxed">
            {t("settings.log_viewer_desc", "Access real-time debug output from the Payload Manager daemon.")}
          </p>
        </button>
      </section>


    </div>
  )
}

export default SettingsView
