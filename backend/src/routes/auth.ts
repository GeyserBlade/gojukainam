import { Router } from "express";
import { AuthService } from "../services/auth.service.js";

export const router = Router();

const COOKIE_NAME = "auth_token";
const IS_PROD = process.env.NODE_ENV === "production";

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const token = await AuthService.login(email, password);

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "lax", // or 'strict' if frontend is same origin
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

router.post("/magic-link", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const token = await AuthService.requestMagicLink(email);
    
    // In dev, we return the token/link for convenience
    if (!IS_PROD) {
      return res.json({ success: true, message: "Magic link sent (check console)", devToken: token });
    }
    
    res.json({ success: true, message: "If that email exists, we sent a link." });
  } catch (error: any) {
    // Avoid leaking user existence in prod errors ideally, but for now:
    res.status(400).json({ error: error.message });
  }
});

router.post("/magic-login", async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token required" });

    const sessionToken = await AuthService.verifyMagicLink(token);

    res.cookie(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ success: true });
});

router.get("/me", async (req, res) => {
  // This route is technically unprotected by the global middleware because 
  // we mounted auth routes BEFORE middleware in server.ts.
  // So we need to manually check cookie or use a specific middleware.
  // Actually, let's reuse the logic or better, move this route to be protected?
  // But wait, the frontend needs to call this to *check* if logged in.
  // So it should read the cookie.
  
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ user: null });
  }

  const payload = AuthService.verifySessionToken(token);
  if (!payload) {
    res.clearCookie(COOKIE_NAME);
    return res.status(401).json({ user: null });
  }

  res.json({ user: payload });
});
