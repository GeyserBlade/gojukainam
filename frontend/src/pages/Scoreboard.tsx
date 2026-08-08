import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { Button } from "@/components/ui/button"
import { getDraw, setBoutScore, setBoutWinner, type DrawBout } from "@/lib/draws"
import type { Side } from "@/lib/scoreboard"
import { BoutScoreboard, type BoutScoreboardSaveResult } from "@/components/scoreboard/BoutScoreboard"

export default function ScoreboardPage() {
  const { drawId, boutId } = useParams<{ drawId: string; boutId: string }>()
  const navigate = useNavigate()
  const { canManageEvent } = useAuth()
  const toast = useToast()
  const apiError = useApiErrorToast()
  const [saving, setSaving] = useState(false)

  const { data: draw } = useQuery({
    queryKey: ["draw", drawId],
    queryFn: () => getDraw(drawId!),
    enabled: !!drawId,
  })

  // Scored off the draw's own event, not the hub selection: this page is opened
  // by drawId from the Run tab, so a coordinator must be judged against the
  // event that draw belongs to. Mirrors requireEventManager on the score routes.
  const canManage = canManageEvent(draw?.eventId)
  const bout: DrawBout | undefined = useMemo(
    () => draw?.bouts.find((b) => b.id === boutId),
    [draw, boutId],
  )

  // -- guards -----------------------------------------------------------------
  // The permission check needs the draw's eventId, so it waits for the load
  // rather than flashing a denial at a coordinator on the first render.
  if (!draw) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white/70">
        Loading bout…
      </div>
    )
  }
  if (!canManage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <p>Only admins and this event's coordinators can operate the scoreboard.</p>
      </div>
    )
  }
  if (!bout) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950 text-white">
        <p>Bout not found in this draw.</p>
        <Button variant="secondary" onClick={() => navigate("/draws")}>
          <ArrowLeft className="h-4 w-4" /> Back to draws
        </Button>
      </div>
    )
  }
  if (!bout.aka || !bout.ao) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950 text-white">
        <p>Both fighters must be known before this bout can be scored.</p>
        <Button variant="secondary" onClick={() => navigate("/draws")}>
          <ArrowLeft className="h-4 w-4" /> Back to draws
        </Button>
      </div>
    )
  }

  const aka = bout.aka
  const ao = bout.ao

  const handleSaveResult = async (result: BoutScoreboardSaveResult) => {
    setSaving(true)
    try {
      await setBoutScore(drawId!, boutId!, {
        winnerEntryId: result.winnerSide === "aka" ? aka.entryId : ao.entryId,
        outcome: result.outcome,
        akaScore: result.akaScore,
        aoScore: result.aoScore,
        postTime: result.postTime,
        scoreJson: result.scoreJson,
      })
      toast.success("Result saved")
      navigate("/draws")
    } catch (e) {
      apiError(e, "Could not save the result")
      throw e
    } finally {
      setSaving(false)
    }
  }

  const handleSaveWinnerOnly = async (side: Side) => {
    setSaving(true)
    try {
      await setBoutWinner(drawId!, boutId!, side === "aka" ? aka.entryId : ao.entryId)
      toast.success("Winner saved")
      navigate("/draws")
    } catch (e) {
      apiError(e, "Could not save the winner")
      throw e
    } finally {
      setSaving(false)
    }
  }

  return (
    <BoutScoreboard
      aka={{ name: aka.name, clubName: aka.clubName }}
      ao={{ name: ao.name, clubName: ao.clubName }}
      categoryLabel={`${draw.division.name}${draw.weightClass ? ` · ${draw.weightClass.name}` : ""}`}
      roundLabel={bout.phase === "REPECHAGE" ? "Repechage" : `Round ${bout.round}`}
      backLabel="Draws"
      onBack={() => navigate("/draws")}
      persistKey={boutId ?? null}
      saving={saving}
      onSaveResult={handleSaveResult}
      onSaveWinnerOnly={handleSaveWinnerOnly}
    />
  )
}
