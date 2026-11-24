import React from 'react'

const Modal = ({ show, title, children, onClose, footer }) => {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-[rgba(10,23,48,0.35)]" onClick={onClose} />
      <div className="relative pm-modal pm-frame w-full max-w-xl p-6 md:p-10 rounded-ps-3xl">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <span className="w-1 h-5 md:h-7 bg-ps-blue shadow-[0_0_14px_rgba(124,58,237,0.8)]" />
          <h3 className="pm-mono text-lg md:text-2xl font-black text-white uppercase tracking-[0.16em]">{title}</h3>
        </div>
        <div className="text-zinc-300 mb-8 md:mb-10 text-base md:text-lg font-medium leading-relaxed">
          {children}
        </div>
        {footer && <div className="flex gap-3 md:gap-4">{footer}</div>}
      </div>
    </div>
  )
}

export default Modal
