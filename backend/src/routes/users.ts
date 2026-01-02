import { Router } from "express";
import { requireRoles } from "../utils/auth.js";
import { UserService } from "../services/user.service.js";

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
    const { id } = req.params;
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
    const { id } = req.params;
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
    const { id } = req.params;
    await UserService.delete(id);
    res.status(204).send();
  } catch (err: any) { 
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err); 
  }
});

