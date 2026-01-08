import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import SignInPage from "./pages/SignIn";
import MagicLoginPage from "./pages/MagicLogin";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import { Dashboard } from "./pages/Dashboard";
import UsersPage from "./pages/Users";
import BeltsPage from "./pages/Belts";
import AthletesListPage from "./pages/AthletesList";
import AthleteFormPage from "./pages/AthleteForm";
import ClubsPage from "./pages/Clubs";
import AthleteImportPage from "./pages/AthleteImport";
import AthleteExtractPage from "./pages/AthleteExtract";
import EventManagementPage from "./pages/EventManagement";
import EventsPage from "./pages/Events";
import EntriesViewPage from "./pages/EntriesView";

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-500">Loading...</div>;
  if (!role) return <Navigate to="/signin" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => (
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
);

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
