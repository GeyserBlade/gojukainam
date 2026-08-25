// The shared client, not a second one: Prisma 7 requires a driver adapter on
// every PrismaClient, and configuring that per script is six places to keep
// in step with one. src/lib/prisma.ts is the only constructor now.
import { prisma } from "../src/lib/prisma.js";
import bcrypt from "bcryptjs";


async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: tsx scripts/create-superuser.ts <email> <password>");
    process.exit(1);
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`User ${email} already exists. Updating password...`);
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hash, role: "SUPERADMIN" }
    });
    console.log(`✅ Password updated for ${email}`);
  } else {
    console.log(`Creating new SUPERADMIN user: ${email}`);
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        name: "Super Admin",
        role: "SUPERADMIN",
        passwordHash: hash
      }
    });
    console.log(`✅ SUPERADMIN created: ${email}`);
  }

  console.log(`\nYou can now sign in with:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
