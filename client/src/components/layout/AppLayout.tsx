import React from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { ModeToggle } from "./mode-toggle"
import { 
  Users, 
  FileText, 
  Clock, 
  Calendar, 
  CreditCard,
  LayoutDashboard,
  Shield,
  LogOut,
  CalendarDays,
  ReceiptText,
  SlidersHorizontal
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useAttendance } from "../../context/AttendanceContext"
import { AttendanceWidget } from "../shared/AttendanceWidget"

export function AppLayout() {
  const location = useLocation()
  const { user, logout, hasRole, can } = useAuth()
  const { isCheckedIn, toggleWidget } = useAttendance()

  const isManagerOrAdmin = user?.roles?.some((r) =>
    ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'].includes(r)
  );

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: can("dashboard", "read") },
    { name: "Employees", href: "/employees", icon: Users, show: isManagerOrAdmin && can("employees", "read") },
    { name: "Contracts", href: "/contracts", icon: FileText, show: can("contracts", "read") },
    { name: "Schedules", href: "/schedules", icon: CalendarDays, show: can("schedules", "read") },
    { name: "Attendance", href: "/attendance", icon: Clock, show: can("attendance", "read") },
    { name: "Time Off", href: "/timeoff", icon: Calendar, show: can("timeoff", "read") },
    { name: "Payruns", href: "/payruns", icon: CreditCard, show: can("payruns", "read") },
    { name: "Payslips", href: "/payslips", icon: ReceiptText, show: can("payslips", "read") },
    { name: "Salary Config", href: "/salary-config", icon: SlidersHorizontal, show: can("salaryStructures", "read") },
  ]

  if (hasRole("Admin")) {
    navItems.push({ name: "User Management", href: "/users", icon: Shield, show: true })
  }

  const activeItem = navItems.find(
    (i) => location.pathname === i.href || (location.pathname.startsWith(i.href) && i.href !== "/dashboard")
  )

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <h1 className="font-serif text-xl font-bold tracking-tight text-foreground">
              PeoplePay<span className="text-primary opacity-80">360</span>
            </h1>
          </Link>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.filter((i) => i.show !== false).map((item) => {
            const isActive =
              location.pathname === item.href ||
              (location.pathname.startsWith(item.href) && item.href !== "/dashboard")
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer status */}
        <div className="p-4 border-t border-border bg-card text-xs text-muted-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot" />
          <span className="font-medium">System Online</span>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4 md:hidden">
            <h1 className="font-serif text-lg font-bold text-foreground">PeoplePay360</h1>
          </div>
          <div className="hidden md:block">
            <h2 className="font-serif font-medium text-lg text-foreground">
              {activeItem?.name || "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            {/* Quick Attendance Widget Trigger */}
            <button
              type="button"
              onClick={toggleWidget}
              title="Toggle Live Clock"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm"
            >
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Punch Clock</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isCheckedIn ? "bg-emerald-500 live-dot" : "bg-muted-foreground/40"
                }`}
              />
            </button>

            {/* Theme Mode Toggle */}
            <ModeToggle />

            {/* User Avatar & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              {user?.employee?.avatarUrl ? (
                <img
                  src={user.employee.avatarUrl}
                  alt={user.employee.name}
                  className="h-8 w-8 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center">
                  <span className="text-xs font-medium uppercase text-foreground">
                    {user?.roles?.[0]?.substring(0, 2) || "U"}
                  </span>
                </div>
              )}

              <div className="hidden lg:block text-left mr-1">
                <div className="text-xs font-medium text-foreground leading-tight truncate max-w-[130px]">
                  {user?.employee?.name || user?.email}
                </div>
                <div className="text-[10px] text-muted-foreground capitalize">
                  {user?.roles?.[0] || "User"}
                </div>
              </div>

              <button
                onClick={() => logout()}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive hover:text-destructive-foreground rounded-md transition-colors border border-transparent hover:border-destructive"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating Live Punch Clock Widget */}
      <AttendanceWidget />
    </div>
  )
}

export { AppLayout as Layout }

