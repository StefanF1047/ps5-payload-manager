import React, { useEffect, useRef } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '../../utils/helpers'

const Toast = ({ message, type = 'success', onClose }) => {
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])
  useEffect(() => {
    const timer = setTimeout(() => closeRef.current(), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div role={type === 'success' ? 'status' : 'alert'} className={cn(
      "relative shrink-0 flex items-center space-x-4 p-4 md:p-5 rounded-xl shadow-2xl animate-in slide-in-from-right duration-300 pointer-events-auto",
      type === 'success' ? "pm-toast text-emerald-300" : "pm-toast pm-toast-error text-red-300"
    )}>
      <span className={cn(
        "absolute left-0 top-0 bottom-0 w-1",
        type === 'success' ? "bg-emerald-400/80" : "bg-red-400/80"
      )} />
      {type === 'success' ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 shrink-0" /> : <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 shrink-0" />}
      <span className="pm-mono min-w-0 break-words font-bold uppercase text-xs md:text-sm tracking-[0.12em]">{message}</span>
    </div>
  )
}

export default Toast
