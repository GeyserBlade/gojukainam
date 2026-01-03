import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-dev-key";
const JWT_EXPIRES_IN = "7d";

export class AuthService {
  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new Error("Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid credentials");
    }

    return this.generateSessionToken(user);
  }

  static async requestMagicLink(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal user existence? Or maybe we strictly manage users so it's fine.
      // Instructions said "users registered by SUPER_ADMIN", so we can be strict.
      throw new Error("User not found");
    }

    // Create a random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Save to DB
    await prisma.magicLink.create({
      data: {
        email: user.email,
        token,
        expiresAt,
      },
    });

    // In a real app, send email. Here, return it to be logged or shown in dev.
    console.log(`[MagicLink] Login link for ${email}: http://localhost:5173/magic-login?token=${token}`);
    return token;
  }

  static async verifyMagicLink(token: string) {
    const link = await prisma.magicLink.findUnique({ where: { token } });
    
    if (!link) throw new Error("Invalid token");
    if (link.usedAt) throw new Error("Token already used");
    if (link.expiresAt < new Date()) throw new Error("Token expired");

    const user = await prisma.user.findUnique({ where: { email: link.email } });
    if (!user) throw new Error("User no longer exists");

    // Mark used
    await prisma.magicLink.update({
      where: { id: link.id },
      data: { usedAt: new Date() },
    });

    return this.generateSessionToken(user);
  }

  static generateSessionToken(user: { id: string; role: Role; clubId: string | null }) {
    return jwt.sign(
      { id: user.id, role: user.role, clubId: user.clubId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  static verifySessionToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as { id: string; role: Role; clubId: string | null };
    } catch (e) {
      return null;
    }
  }
  
  static async setPassword(userId: string, password: string) {
      const hash = await bcrypt.hash(password, 10);
      return prisma.user.update({
          where: { id: userId },
          data: { passwordHash: hash }
      });
  }
}
