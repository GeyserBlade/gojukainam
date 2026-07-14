import {
  CalendarDays,
  ClipboardCheck,
  Eye,
  ListChecks,
  Medal,
  Play,
  Shield,
  Swords,
  Upload,
  UserCog,
  Users,
  Users2,
} from "lucide-react"

import type { Role } from "@/contexts/AuthContext"

export type NavItem = {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  /** Roles that can see this item. Empty/undefined = all authenticated. */
  roles?: Role[]
  /** Accent token: defaults to primary. Used for the icon tile background. */
  accent?: "primary" | "belt-blue" | "belt-green" | "belt-orange" | "flag-blue" | "flag-green"
}

const MANAGE_ROLES: Role[] = ["SUPERADMIN", "ADMIN", "CLUB_MANAGER"]

export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: ClipboardCheck },
  { to: "/athletes", label: "Athletes", icon: Users, roles: MANAGE_ROLES },
  { to: "/events", label: "Entry Management", icon: ListChecks, roles: MANAGE_ROLES, accent: "belt-green" },
  { to: "/events/manage", label: "Event Admin", icon: CalendarDays, roles: MANAGE_ROLES, accent: "belt-orange" },
  { to: "/entries/view", label: "All Entries", icon: Eye, roles: MANAGE_ROLES, accent: "flag-blue" },
  { to: "/draws", label: "Draws & Results", icon: Swords, accent: "primary" },
  { to: "/run", label: "Run Sheet", icon: Play, accent: "belt-orange" },
  { to: "/athletes/extract", label: "Athlete Extract", icon: Upload, roles: MANAGE_ROLES },
  { to: "/athletes/import", label: "Import Athletes", icon: Upload, roles: ["SUPERADMIN"] },
  { to: "/users", label: "Users", icon: UserCog, roles: MANAGE_ROLES, accent: "belt-blue" },
  { to: "/clubs", label: "Clubs", icon: Shield, roles: MANAGE_ROLES, accent: "flag-green" },
  { to: "/belts", label: "Belts", icon: Medal, roles: MANAGE_ROLES, accent: "belt-orange" },
]

export function visibleNavItems(role: Role | undefined): NavItem[] {
  if (!role) return []
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role))
}

export const RoleIcon = Users2
