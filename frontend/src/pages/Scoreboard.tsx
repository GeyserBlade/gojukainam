import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useToast, useApiErrorToast } from "@/components/Toast"
import { Button } from "@/components/ui/button"
import {
  finalBronzeMedalists,
  getDraw,
  isFinalBout,
  setBoutScore,
  setBoutWinner,
  startBout,
  type DrawBout,
} from "@/lib/draws"
import type { Side } from "@/lib/scoreboard"
import { BoutScoreboard, type BoutScoreboardSaveResult } from "@/components/scoreboard/BoutScoreboard"

export default function ScoreboardPage() {
  const { drawId, boutId } = useParams<{ drawId: string; boutId: string }>()
  const navigate = useNavigate()
  const { canManageEvent, role } = useAuth()
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
  //
  // A tatami operator is allowed too, and the draw fetch above is what proves
  // it: `requireDrawViewer` only returns a bracket to an operator whose mat is
  // running some part of it, so reaching this line with a draw in hand already
  // means they belong here. The per-bout check still happens server-side on
  // save — a single bout moved to another mat is refused there.
  const canManage = canManageEvent(draw?.eventId) || role === "TATAMI_OPERATOR"

  // An operator has no access to the draws list, so sending them there after a
  // save left them staring at a permission error. Their board is the mat.
  const isOperator = role === "TATAMI_OPERATOR"
  const backTo = isOperator ? "/mat" : "/draws"
  const backLabel = isOperator ? "My tatami" : "Draws"
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
        <p>Only admins, this event's coordinators, and this tatami's operator can use the scoreboard.</p>
      </div>
    )
  }
  if (!bout) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950 text-white">
        <p>Bout not found in this draw.</p>
        <Button variant="secondary" onClick={() => navigate(backTo)}>
          <ArrowLeft className="h-4 w-4" /> Back to {backLabel.toLowerCase()}
        </Button>
      </div>
    )
  }
  if (!bout.aka || !bout.ao) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950 text-white">
        <p>Both fighters must be known before this bout can be scored.</p>
        <Button variant="secondary" onClick={() => navigate(backTo)}>
          <ArrowLeft className="h-4 w-4" /> Back to {backLabel.toLowerCase()}
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
      navigate(backTo)
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
      navigate(backTo)
    } catch (e) {
      apiError(e, "Could not save the winner")
      throw e
    } finally {
      setSaving(false)
    }
  }

  const handleBoutStarted = () => {
    // Best-effort status ping for other viewers of the draw — never blocks
    // or surfaces an error; scoring itself doesn't depend on this succeeding.
    void startBout(drawId!, boutId!).catch(() => {})
  }

  // Podium only when this bout is the final AND both bronze bouts are
  // already decided elsewhere in the bracket — see lib/draws.ts.
  const bronze = isFinalBout(draw, bout) ? finalBronzeMedalists(draw) : null

  return (
    <BoutScoreboard
      aka={{ name: aka.name, clubName: aka.clubName }}
      ao={{ name: ao.name, clubName: ao.clubName }}
      categoryLabel={`${draw.division.name}${draw.weightClass ? ` · ${draw.weightClass.name}` : ""}`}
      roundLabel={bout.phase === "REPECHAGE" ? "Repechage" : `Round ${bout.round}`}
      backLabel={backLabel}
      onBack={() => navigate(backTo)}
      persistKey={boutId ?? null}
      saving={saving}
      onSaveResult={handleSaveResult}
      onSaveWinnerOnly={handleSaveWinnerOnly}
      onBoutStarted={handleBoutStarted}
      finalBronzeMedalists={bronze}
    />
  )
}
