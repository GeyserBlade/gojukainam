import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"

import { listEvents, type Event } from "@/lib/events"

const STORAGE_KEY = "selectedEventId"

interface SelectedEventValue {
  eventId: string
  setEventId: (id: string) => void
  events: Event[]
  event: Event | undefined
  loading: boolean
}

const SelectedEventContext = createContext<SelectedEventValue | null>(null)

export const useSelectedEvent = () => {
  const ctx = useContext(SelectedEventContext)
  if (!ctx) throw new Error("useSelectedEvent must be used within <SelectedEventProvider>")
  return ctx
}

export function SelectedEventProvider({ children }: { children: ReactNode }) {
  const [eventId, setEventIdState] = useState<string>(() => localStorage.getItem(STORAGE_KEY) || "")

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => listEvents(),
  })

  const setEventId = (id: string) => {
    setEventIdState(id)
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  }

  // Resolve a default once events load and nothing valid is selected.
  useEffect(() => {
    if (isLoading || events.length === 0) return
    if (eventId && events.some((e) => e.id === eventId)) return
    const preferred = events.find((e) => e.status === "ACTIVE" || e.status === "CLOSED") ?? events[0]
    setEventId(preferred.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, isLoading])

  const value = useMemo<SelectedEventValue>(
    () => ({
      eventId,
      setEventId,
      events,
      event: events.find((e) => e.id === eventId),
      loading: isLoading,
    }),
    [eventId, events, isLoading],
  )

  return <SelectedEventContext.Provider value={value}>{children}</SelectedEventContext.Provider>
}
