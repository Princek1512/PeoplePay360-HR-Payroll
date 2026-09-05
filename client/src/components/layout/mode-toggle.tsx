import React, { useState, useRef, useEffect } from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "../../context/ThemeContext"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-9"
        title="Toggle theme"
      >
        <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md z-50 animate-in fade-in-80 zoom-in-95">
          <button
            type="button"
            onClick={() => {
              setTheme("light")
              setIsOpen(false)
            }}
            className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground ${
              theme === "light" ? "bg-accent/80 font-semibold" : ""
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme("dark")
              setIsOpen(false)
            }}
            className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground ${
              theme === "dark" ? "bg-accent/80 font-semibold" : ""
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            <span>Dark</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme("system")
              setIsOpen(false)
            }}
            className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground ${
              theme === "system" ? "bg-accent/80 font-semibold" : ""
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>System</span>
          </button>
        </div>
      )}
    </div>
  )
}
