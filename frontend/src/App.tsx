import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import SignInPage from "./pages/SignIn";
import { Dashboard } from "./pages/Dashboard";
import UsersPage from "./pages/Users";
import BeltsPage from "./pages/Belts";
import AthletesListPage from "./pages/AthletesList";
import AthleteFormPage from "./pages/AthleteForm";

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  if (!role) return <Navigate to="/signin" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/signin" element={<SignInPage />} />
    <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
    <Route path="/users" element={<Protected><UsersPage /></Protected>} />
    <Route path="/belts" element={<Protected><BeltsPage /></Protected>} />
    <Route path="/athletes" element={<Protected><AthletesListPage /></Protected>} />
    <Route path="/athletes/new" element={<Protected><AthleteFormPage /></Protected>} />
    <Route path="/athletes/:id/edit" element={<Protected><AthleteFormPage /></Protected>} />
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
