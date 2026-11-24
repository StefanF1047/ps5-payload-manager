import React from 'react'
import { Heart } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import { isPS5 } from '../../utils/helpers'

const DonateView = () => {
  const { t } = useTranslation()
  const donateUrl = 'https://github.com/itsPLK/ps5-payload-manager/blob/main/DONATE.md';
  return (
    <div className="flex flex-col xl:flex-row items-center justify-center min-h-[60vh] animate-fade-in max-w-6xl mx-auto py-10 xl:py-20 gap-12 xl:gap-24">
      {/* Left Column */}
      <div className="flex flex-col items-center text-center space-y-8 md:space-y-10 flex-1 px-4">
        <div className="relative p-8 md:p-10 rounded-ps-3xl bg-red-600/10 border border-red-600/25 text-red-500 shadow-[0_0_60px_-24px_rgba(255,77,120,0.8)] inline-flex">
          <span className="absolute inset-2 rounded-ps-2xl border border-red-500/15" />
          <Heart className="relative w-16 h-16 md:w-20 md:h-20 fill-current animate-pulse" />
        </div>
        <div className="space-y-4 md:space-y-6">
          <h3 className="pm-heading text-4xl md:text-5xl">
            {t("donate.title_1", "Support")} <span className="text-red-500">{t("donate.title_2", "Project")}</span>
          </h3>
          <p className="text-lg md:text-xl text-zinc-400 font-medium leading-relaxed">
            {t("donate.description", "If you'd like to support my work or just say thanks, you can buy me a coffee. It's much appreciated!")}
          </p>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex items-center justify-center flex-1 px-4">
        {isPS5 ? (
          <div className="pm-qr p-6 md:p-8 rounded-ps-xl shadow-[0_0_60px_-18px_rgba(225,29,72,0.45)]">
            <QRCodeSVG value={donateUrl} size={isPS5 ? 280 : 180} level="H" />
          </div>
        ) : (
          <a
            href={donateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-10 md:px-14 py-6 md:py-7 bg-red-600 text-white text-lg md:text-2xl font-black uppercase tracking-[0.1em] rounded-lg hover:bg-red-500 transition-colors transform active:scale-95 shadow-[0_0_50px_-16px_rgba(255,77,120,0.9)] text-center block"
          >
            {t("donate.view_options_btn", "View Donation Options")}
          </a>
        )}
      </div>
    </div>
  )
}

export default DonateView
