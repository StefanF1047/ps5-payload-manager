import React from 'react'
import { cn, isPS5 } from '../../utils/helpers'

const NavButton = ({ active, onClick, icon: _Icon, label, mobileLabel, className, sidebar, sidebarExpanded, isDonate, shortcut }) => {
  return (
    <div className="flex items-center flex-1 md:flex-none min-w-max">
      <button
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={cn(
          "flex items-center transition-all border border-transparent group relative outline-none",
          sidebar
            ? cn("pm-nav-item w-full p-4 mb-2 rounded-xl", sidebarExpanded ? "justify-start space-x-4" : "justify-center")
            : (isPS5 ? "flex-row space-x-3 px-6 py-3 rounded-xl" : "pm-nav-item flex-col md:flex-row md:space-x-3 px-2.5 md:px-6 py-2 md:py-3 rounded-xl flex-1 md:flex-none"),
          active
            ? (sidebar
              ? (isDonate ? "bg-red-600/90 text-white shadow-[0_0_22px_-6px_rgba(255,77,120,0.7)]" : "pm-nav-active")
              : (isDonate ? "text-red-500" : "text-ps-blue font-black"))
            : (isDonate ? "text-red-500/60" : "bg-transparent text-zinc-400 hover:text-white"),
          className
        )}
      >
        <_Icon className={cn(
          "w-6 h-6 shrink-0 group-hover:scale-110 transition-transform",
          active ? (sidebar ? "text-current" : (isDonate ? "text-red-500" : "text-ps-blue")) : (isDonate ? "text-red-500" : "")
        )} />
        <span className={cn(
          "tracking-normal transition-all duration-300 whitespace-nowrap overflow-hidden",
          sidebar
            ? (sidebarExpanded ? "opacity-100 flex-1 text-left font-medium text-sm" : "opacity-0 w-0")
            : (isPS5 ? "text-sm font-semibold" : "text-[10px] md:text-sm")
        )}>
          <span className={cn((isPS5 || sidebar) ? "inline" : "hidden md:inline")}>{label}</span>
          {!isPS5 && !sidebar && <span className={cn("inline md:hidden", active ? (isDonate ? "text-red-500" : "text-ps-blue") : "font-medium text-zinc-500")}>{mobileLabel}</span>}
        </span>
        {sidebar && sidebarExpanded && shortcut && (
          <span className="pm-kbd" data-key={shortcut} aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

export default NavButton
