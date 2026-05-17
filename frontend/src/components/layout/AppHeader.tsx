import { Link, useLocation, useNavigate } from "react-router-dom"
import { LogOut, User2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { visibleNavItems } from "@/components/layout/nav-config"
import { MobileNav } from "@/components/layout/MobileNav"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

interface AppHeaderProps {
  /** Optional page title shown next to the brand on small screens. */
  title?: string
}

export function AppHeader({ title }: AppHeaderProps) {
  const { role, user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const items = visibleNavItems(role).slice(0, 5)

  const handleLogout = async () => {
    await logout()
    navigate("/signin", { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:px-4">
        <MobileNav />

        <Link
          to="/dashboard"
          className="flex items-center gap-2 font-display text-xl sm:text-2xl tracking-wider leading-none"
        >
          <span className="hidden sm:inline">GOJU KAI</span>
          <span className="text-primary">NAMIBIA</span>
        </Link>

        {title && (
          <>
            <Separator orientation="vertical" className="!h-6 mx-2 hidden md:block" />
            <span className="hidden md:inline text-sm text-muted-foreground font-medium">
              {title}
            </span>
          </>
        )}

        <nav className="ml-4 hidden md:flex items-center gap-0.5">
          {items.map((item) => {
            const isActive =
              location.pathname === item.to ||
              location.pathname.startsWith(item.to + "/")
            return (
              <Button
                key={item.to}
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9",
                  isActive && "bg-accent text-accent-foreground",
                )}
              >
                <Link to={item.to}>{item.label}</Link>
              </Button>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Account menu"
              >
                <User2 />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate">
                    {user?.email ?? "Signed in"}
                  </span>
                  {role && (
                    <span className="text-xs text-muted-foreground">{role}</span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
