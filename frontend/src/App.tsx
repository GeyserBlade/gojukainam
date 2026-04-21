import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./components/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PageSpinner } from "./components/UIState";

const SignInPage = lazy(() => import("./pages/SignIn"));
const MagicLoginPage = lazy(() => import("./pages/MagicLogin"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPassword"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const UsersPage = lazy(() => import("./pages/Users"));
const BeltsPage = lazy(() => import("./pages/Belts"));
const AthletesListPage = lazy(() => import("./pages/AthletesList"));
const AthleteFormPage = lazy(() => import("./pages/AthleteForm"));
const ClubsPage = lazy(() => import("./pages/Clubs"));
const AthleteImportPage = lazy(() => import("./pages/AthleteImport"));
const AthleteExtractPage = lazy(() => import("./pages/AthleteExtract"));
const EventManagementPage = lazy(() => import("./pages/EventManagement"));
const EventsPage = lazy(() => import("./pages/Events"));
const EntriesViewPage = lazy(() => import("./pages/EntriesView"));

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, loading } = useAuth();
  if (loading) return <PageSpinner label="Checking session" />;
  if (!role) return <Navigate to="/signin" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => (
  <Suspense fallback={<PageSpinner />}>
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/magic-login" element={<MagicLoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/users" element={<Protected><UsersPage /></Protected>} />
      <Route path="/clubs" element={<Protected><ClubsPage /></Protected>} />
      <Route path="/belts" element={<Protected><BeltsPage /></Protected>} />
      <Route path="/athletes" element={<Protected><AthletesListPage /></Protected>} />
      <Route path="/athletes/new" element={<Protected><AthleteFormPage /></Protected>} />
      <Route path="/athletes/:id/edit" element={<Protected><AthleteFormPage /></Protected>} />
      <Route path="/athletes/import" element={<Protected><AthleteImportPage /></Protected>} />
      <Route path="/athletes/extract" element={<Protected><AthleteExtractPage /></Protected>} />
      <Route path="/events/manage" element={<Protected><EventsPage /></Protected>} />
      <Route path="/events" element={<Protected><EventManagementPage /></Protected>} />
      <Route path="/entries/view" element={<Protected><EntriesViewPage /></Protected>} />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  </Suspense>
);

const App: React.FC = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
