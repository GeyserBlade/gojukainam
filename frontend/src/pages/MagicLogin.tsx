import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function MagicLoginPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { verifyMagicLink } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No token provided");
      return;
    }

    verifyMagicLink(token)
      .then(() => {
        nav("/dashboard");
      })
      .catch((err) => {
        console.error(err);
        setError("Invalid or expired token");
      });
  }, [token, verifyMagicLink, nav]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div>
            <h1 className="text-xl text-red-500 mb-2">Login Failed</h1>
            <p className="text-gray-400">{error}</p>
            <button onClick={() => nav("/signin")} className="mt-4 text-cyan-400 hover:underline">Back to Sign In</button>
          </div>
        ) : (
          <p className="animate-pulse">Verifying magic link...</p>
        )}
      </div>
    </div>
  );
}
