import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SelectedEventProvider } from "./contexts/SelectedEventContext";
import { EventHubLayout } from "./components/layout/EventHubLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./components/Toast";
import { ConfirmProvider } from "./components/ConfirmDialog";
import { TooltipProvider } from "./components/ui/tooltip";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PageSpinner } from "./components/UIState";

const SignInPage = lazy(() => import("./pages/SignIn"));
const MagicLoginPage = lazy(() => import("./pages/MagicLogin"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPassword"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const UsersPage = lazy(() => import("./pages/Users"));
const BeltsPage = lazy(() => import("./pages/Belts"));
const KatasPage = lazy(() => import("./pages/Katas"));
const AthletesListPage = lazy(() => import("./pages/AthletesList"));
const AthleteFormPage = lazy(() => import("./pages/AthleteForm"));
const ClubsPage = lazy(() => import("./pages/Clubs"));
const AthleteImportPage = lazy(() => import("./pages/AthleteImport"));
const AthleteExtractPage = lazy(() => import("./pages/AthleteExtract"));
const EventManagementPage = lazy(() => import("./pages/EventManagement"));
const EventsPage = lazy(() => import("./pages/Events"));
const EntriesViewPage = lazy(() => import("./pages/EntriesView"));
const EntrySheetPage = lazy(() => import("./pages/EntrySheet"));
const EventEntryListPage = lazy(() => import("./pages/EventEntryList"));
const PlanPrintPage = lazy(() => import("./pages/PlanPrint"));
const CallupPrintPage = lazy(() => import("./pages/CallupPrint"));
const DrawsPage = lazy(() => import("./pages/Draws"));
const RunPage = lazy(() => import("./pages/Run"));
const MatOperatorPage = lazy(() => import("./pages/MatOperator"));
const ResultsPage = lazy(() => import("./pages/Results"));
const HubOverviewPage = lazy(() => import("./pages/hub/Overview"));
const HubSetupPage = lazy(() => import("./pages/hub/Setup"));
const HubEstimatorPage = lazy(() => import("./pages/hub/Estimator"));
const HubPlanPage = lazy(() => import("./pages/hub/Plan"));
const HubPracticePage = lazy(() => import("./pages/hub/Practice"));
const ScoreboardPage = lazy(() => import("./pages/Scoreboard"));
const KataScoreboardPage = lazy(() => import("./pages/KataScoreboard"));
const ScoreboardDisplayPage = lazy(() => import("./pages/ScoreboardDisplay"));
const PublicBoardPage = lazy(() => import("./pages/PublicBoard"));


const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, loading } = useAuth();
  if (loading) return <PageSpinner label="Checking session" />;
  if (!role) return <Navigate to="/signin" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => (
  <Suspense fallback={<PageSpinner />}>
    <Routes>
      {/* Public read-only spectator board (no auth) */}
      <Route path="/board/:token" element={<PublicBoardPage />} />

      <Route path="/signin" element={<SignInPage />} />
      <Route path="/magic-login" element={<MagicLoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      {/* A tatami operator's only screen. */}
      <Route path="/mat" element={<Protected><MatOperatorPage /></Protected>} />
      <Route path="/users" element={<Protected><UsersPage /></Protected>} />
      <Route path="/clubs" element={<Protected><ClubsPage /></Protected>} />
      <Route path="/belts" element={<Protected><BeltsPage /></Protected>} />
      <Route path="/katas" element={<Protected><KatasPage /></Protected>} />
      <Route path="/athletes" element={<Protected><AthletesListPage /></Protected>} />
      <Route path="/athletes/new" element={<Protected><AthleteFormPage /></Protected>} />
      <Route path="/athletes/:id/edit" element={<Protected><AthleteFormPage /></Protected>} />
      <Route path="/athletes/import" element={<Protected><AthleteImportPage /></Protected>} />
      <Route path="/athletes/extract" element={<Protected><AthleteExtractPage /></Protected>} />
      <Route path="/events/manage" element={<Protected><EventsPage /></Protected>} />

      {/* Event Hub — one selected event, worked through in-context tabs */}
      <Route path="/hub" element={<Protected><EventHubLayout /></Protected>}>
        <Route index element={<HubOverviewPage />} />
        <Route path="setup" element={<HubSetupPage />} />
        <Route path="entries" element={<EventManagementPage />} />
        <Route path="review" element={<EntriesViewPage />} />
        <Route path="draws" element={<DrawsPage />} />
        <Route path="estimator" element={<HubEstimatorPage />} />
        <Route path="plan" element={<HubPlanPage />} />
        <Route path="practice" element={<HubPracticePage />} />
        <Route path="run" element={<RunPage />} />
        <Route path="results" element={<ResultsPage />} />
      </Route>

      {/* A club's entry-confirmation sheet — a printable document, so it sits
          outside the hub's chrome rather than inside a tab. */}
      <Route
        path="/entry-sheet/:eventId/:clubId"
        element={<Protected><EntrySheetPage /></Protected>}
      />

      {/* The whole event's entry list, every club — the same document for the
          organizer. Admin/coordinator only, enforced by the API. */}
      <Route
        path="/entry-list/:eventId"
        element={<Protected><EventEntryListPage /></Protected>}
      />

      {/* The printable one-page running-order schedule — same reasoning as
          the entry sheet above: a document, not a tab, so it sits outside
          the hub's chrome. Admin/coordinator only, enforced in-page (same
          gate as the Plan tab's own management controls). */}
      <Route
        path="/plan/print/:eventId"
        element={<Protected><PlanPrintPage /></Protected>}
      />

      {/* Call-up sheets — one printable page per division, for the tatami
          coordinator gathering athletes ahead of a category. Same
          outside-the-hub reasoning as the schedule above. The mat route is
          registered first only for readability; react-router already ranks
          the literal "mat" segment over the single-division route's dynamic
          :drawId regardless of order. */}
      <Route
        path="/callup/print/:eventId/mat/:matNumber"
        element={<Protected><CallupPrintPage /></Protected>}
      />
      <Route
        path="/callup/print/:eventId/:drawId"
        element={<Protected><CallupPrintPage /></Protected>}
      />

      {/* Legacy paths → hub tabs */}
      <Route path="/events" element={<Navigate to="/hub/entries" replace />} />
      <Route path="/entries/view" element={<Navigate to="/hub/review" replace />} />
      <Route path="/draws" element={<Navigate to="/hub/draws" replace />} />
      <Route path="/run" element={<Navigate to="/hub/run" replace />} />
      <Route path="/results" element={<Navigate to="/hub/results" replace />} />

      <Route path="/scoreboard/display" element={<Protected><ScoreboardDisplayPage /></Protected>} />
      <Route path="/scoreboard/:drawId/:boutId" element={<Protected><ScoreboardPage /></Protected>} />
      {/* Kata is judged by flags, not points — its own board, same projector. */}
      <Route path="/kata/:drawId/:boutId" element={<Protected><KataScoreboardPage /></Protected>} />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  </Suspense>
);

const App: React.FC = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <TooltipProvider delayDuration={150}>
        <BrowserRouter>
          <AuthProvider>
            <SelectedEventProvider>
              <ConfirmProvider>
                <ToastProvider>
                  <AppRoutes />
                </ToastProvider>
              </ConfirmProvider>
            </SelectedEventProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
