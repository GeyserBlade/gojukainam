import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import SignInPage from "./pages/SignIn";
import { Dashboard } from "./pages/Dashboard";

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  if (!role) return <Navigate to="/signin" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/signin" element={<SignInPage />} />
    <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
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

