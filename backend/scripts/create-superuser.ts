import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
