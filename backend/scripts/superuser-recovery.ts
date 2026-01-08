/**
 * Superuser Password Recovery Script
 *
 * This script generates a secure password reset token for a SUPERADMIN user.
 * Use this when you (the superuser) have lost access to your account.
 *
 * Usage:
 *   npm run superuser-recovery <email>
 *
 * Example:
 *   npm run superuser-recovery admin@example.com
 *
 * SECURITY NOTE: This script should only be run by someone with direct server access.
 * The generated token will be printed to the console and can be used once to reset the password.
 */

import { AuthService } from "../src/services/auth.service.js";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("\n❌ Error: Email address required\n");
    console.log("Usage: npm run superuser-recovery <email>\n");
    console.log("Example: npm run superuser-recovery admin@example.com\n");
    process.exit(1);
  }

  const email = args[0];

  try {
    console.log(`\n🔍 Looking up user: ${email}...`);

    // Verify user exists and is SUPERADMIN
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, name: true }
    });

    if (!user) {
      console.error(`\n❌ Error: No user found with email: ${email}\n`);
      process.exit(1);
    }

    if (user.role !== "SUPERADMIN") {
      console.error(`\n❌ Error: User is not a SUPERADMIN (role: ${user.role})\n`);
      console.error("This recovery script can only be used for SUPERADMIN accounts.\n");
      process.exit(1);
    }

    console.log(`✅ Found SUPERADMIN user: ${user.name || "Unnamed"} (${user.email})\n`);
    console.log("🔐 Generating secure recovery token...\n");

    // Generate recovery token
    const token = await AuthService.generateSuperuserRecoveryToken(email);

    console.log("✅ Recovery token generated successfully!\n");
    console.log("⚠️  IMPORTANT SECURITY NOTES:");
    console.log("   - This token is valid for 30 minutes");
    console.log("   - It can only be used once");
    console.log("   - Do not share this token with anyone");
    console.log("   - The link above will reset your password\n");

  } catch (error: any) {
    console.error("\n❌ Error generating recovery token:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
