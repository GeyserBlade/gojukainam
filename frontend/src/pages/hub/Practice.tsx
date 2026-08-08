// Standalone practice / ad-hoc bout scoreboard — a blank AKA vs AO bout for
// practice, exhibition, or teaching scenarios. Reuses the exact same
// scoring/timer/awarding-window engine as the real match Scoreboard (see
// components/scoreboard/BoutScoreboard.tsx); the only differences are no
// draw/bout data source, no persistence (persistKey={null} — state is
// purely in-memory and disappears on refresh/nav), no save calls, and
// editable AKA/AO display names for demo purposes.

import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BoutScoreboard } from "@/components/scoreboard/BoutScoreboard"

export default function PracticeScoreboardPage() {
  const navigate = useNavigate()
  const [akaName, setAkaName] = useState("AKA")
  const [aoName, setAoName] = useState("AO")

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3 rounded-md border bg-muted/30 px-4 py-3">
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">AKA name</Label>
          <Input
            className="w-44"
            value={akaName}
            onChange={(e) => setAkaName(e.target.value)}
            placeholder="AKA"
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">AO name</Label>
          <Input
            className="w-44"
            value={aoName}
            onChange={(e) => setAoName(e.target.value)}
            placeholder="AO"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Practice bout — nothing here is saved. Refreshing or leaving this tab resets it.
        </p>
      </div>
      <div className="overflow-hidden rounded-md">
        <BoutScoreboard
          aka={{ name: akaName.trim() || "AKA", clubName: "" }}
          ao={{ name: aoName.trim() || "AO", clubName: "" }}
          categoryLabel="Practice bout"
          roundLabel=""
          backLabel="Hub"
          onBack={() => navigate("/hub")}
          persistKey={null}
          allowDrawDeclaration
        />
      </div>
    </div>
  )
}
