import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { Role } from "@prisma/client";
import { validatePassword } from "../utils/password.js";

const JWT_EXPIRES_IN = "7d";

// Fail hard if JWT_SECRET is missing or too weak — prevents silent fallback to a known value
const _rawJwtSecret = process.env.JWT_SECRET;
if (!_rawJwtSecret || _rawJwtSecret.length < 32) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("FATAL: JWT_SECRET must be set to at least 32 characters in production");
  }
  console.warn("[SECURITY] JWT_SECRET is missing or too short — using dev fallback. NEVER deploy this way.");
}
const JWT_SECRET = _rawJwtSecret ?? "dev-fallback-NOT-for-production-use-change-me!!";

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

  static async requestMagicLink(email: string): Promise<string | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return null silently — never reveal whether an email is registered
      return null;
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

    // TODO: send token via email in production (e.g. Resend, SendGrid)
    // NEVER log raw tokens in production — they are equivalent to passwords
    if (process.env.NODE_ENV !== "production") {
      console.log(`[MagicLink] Login link for ${email}: http://localhost:5173/magic-login?token=${token}`);
    }
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
    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.valid) {
      throw { status: 400, message: validation.errors.join(", ") };
    }

    const hash = await bcrypt.hash(password, 10);
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash }
    });
  }

  /**
   * Request a password reset - generates a token and sends email
   */
  static async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists for security
      return { success: true, message: "If an account exists, a password reset link has been sent" };
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save to DB
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // TODO: send token via email in production (e.g. Resend, SendGrid)
    // NEVER log raw tokens in production — they are equivalent to passwords
    if (process.env.NODE_ENV !== "production") {
      console.log(`[PasswordReset] Reset link for ${email}: http://localhost:5173/reset-password?token=${token}`);
    }

    return {
      success: true,
      message: "If an account exists, a password reset link has been sent",
      devToken: process.env.NODE_ENV === "development" ? token : undefined
    };
  }

  /**
   * Verify password reset token and set new password
   */
  static async resetPassword(token: string, newPassword: string) {
    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      throw { status: 400, message: validation.errors.join(", ") };
    }

    const resetRecord = await prisma.passwordReset.findUnique({ where: { token } });

    if (!resetRecord) {
      throw { status: 400, message: "Invalid or expired reset token" };
    }

    if (resetRecord.usedAt) {
      throw { status: 400, message: "Reset token has already been used" };
    }

    if (resetRecord.expiresAt < new Date()) {
      throw { status: 400, message: "Reset token has expired" };
    }

    // Hash new password
    const hash = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: hash }
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() }
      })
    ]);

    const user = await prisma.user.findUnique({ where: { id: resetRecord.userId } });
    if (!user) throw { status: 404, message: "User not found" };

    return this.generateSessionToken(user);
  }

  /**
   * Change password for logged-in user (requires old password)
   */
  static async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.passwordHash) {
      throw { status: 400, message: "No password set for this account" };
    }

    // Verify old password
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) {
      throw { status: 400, message: "Current password is incorrect" };
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      throw { status: 400, message: validation.errors.join(", ") };
    }

    // Hash and save new password
    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash }
    });

    return { success: true, message: "Password changed successfully" };
  }

  /**
   * Generate superuser recovery token (special secure mechanism)
   * This should be called manually via a secure admin script/console
   */
  static async generateSuperuserRecoveryToken(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.role !== "SUPERADMIN") {
      throw { status: 403, message: "Not authorized" };
    }

    // Generate a longer, more secure token for superuser
    const token = crypto.randomBytes(48).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    console.log(`\n========================================`);
    console.log(`SUPERUSER RECOVERY TOKEN`);
    console.log(`========================================`);
    console.log(`Email: ${email}`);
    console.log(`Token: ${token}`);
    console.log(`Expires: ${expiresAt.toISOString()}`);
    console.log(`Link: http://localhost:5173/reset-password?token=${token}`);
    console.log(`========================================\n`);

    return token;
  }
}
