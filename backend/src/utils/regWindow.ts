// Registration-window enforcement for entry create/submit.
//
// Registration is OPEN only when the event is ACTIVE and the current time is
// within [regOpen, regClose]. Admins (ADMIN/SUPERADMIN) bypass the window so
// organizers can still add or correct entries late (walk-ins, fixes). Clubs are
// held to the window.

export interface RegEvent {
  status: string;
  regOpen: Date;
  regClose: Date;
}

export interface RegState {
  open: boolean;
  /** Human-readable reason shown to the club when closed; null when open. */
  message: string | null;
}

const fmt = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);

/** Whether registration is currently open for this event. */
export function registrationState(event: RegEvent, now: Date = new Date()): RegState {
  if (event.status === "DRAFT")
    return { open: false, message: "Registration hasn't opened yet — the event is still being set up." };
  if (event.status === "CLOSED" || event.status === "ARCHIVED")
    return { open: false, message: "Registration is closed for this event." };

  // ACTIVE — gate on the date window.
  if (now < event.regOpen)
    return { open: false, message: `Registration opens on ${fmt(event.regOpen)}.` };
  if (now > event.regClose)
    return { open: false, message: `Registration closed on ${fmt(event.regClose)}.` };

  return { open: true, message: null };
}

const isPrivileged = (role: string) => role === "ADMIN" || role === "SUPERADMIN";

/**
 * Throw 409 when a non-admin tries to add/submit entries outside the
 * registration window. Admins pass through unconditionally.
 */
export function assertRegistrationOpen(event: RegEvent, user: { role: string }): void {
  if (isPrivileged(user.role)) return;
  const state = registrationState(event);
  if (!state.open) throw { status: 409, message: state.message };
}
