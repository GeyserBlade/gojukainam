import { Router } from "express";
import { requireRoles } from "../utils/auth.js";
import { UserService } from "../services/user.service.js";
import { AuthService } from "../services/auth.service.js";
import { getParam } from "../utils/params.js";

export const router = Router();

// List users (restricted to ADMIN/SUPERADMIN)
router.get("/", requireRoles("ADMIN", "SUPERADMIN"), async (_req, res, next) => {
  try {
    const users = await UserService.getAll();
    res.json(users);
  } catch (err) { next(err); }
});

// Get single user
router.get("/:id", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const id = getParam(req.params.id);
    const user = await UserService.getById(id);
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);
  } catch (err) { next(err); }
});

// Create user
router.post("/", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const requester = req.user!; // ensured by requireRoles
    const created = await UserService.create(req.body, requester.role);
    res.status(201).json(created);
  } catch (err: any) { 
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err); 
  }
});

// Update user
router.put("/:id", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const id = getParam(req.params.id);
    const requester = req.user!; // ensured by requireRoles
    const updated = await UserService.update(id, req.body, requester.role);
    res.json(updated);
  } catch (err: any) { 
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err); 
  }
});

// Delete user
router.delete("/:id", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const id = getParam(req.params.id);
    await UserService.delete(id);
    res.status(204).send();
  } catch (err: any) {
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// Admin: Set password for a user (creates or resets password)
router.post("/:id/set-password", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const id = getParam(req.params.id);
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password required" });
    }

    // Verify user exists
    const user = await UserService.getById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Set the password
    await AuthService.setPassword(id, password);

    res.json({ success: true, message: "Password set successfully" });
  } catch (err: any) {
    const status = err.status || 400;
    res.status(status).json({ error: err.message || "Failed to set password" });
  }
});

// Admin: Request password reset for a user (generates reset token)
router.post("/:id/reset-password", requireRoles("ADMIN", "SUPERADMIN"), async (req, res, next) => {
  try {
    const id = getParam(req.params.id);

    // Get user
    const user = await UserService.getById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Request password reset for this user
    const result = await AuthService.requestPasswordReset(user.email);

    res.json(result);
  } catch (err: any) {
    next(err);
  }
});

