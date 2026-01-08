import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "geyserrb@gmail.com";
  const testPassword = process.argv[3];

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log(`❌ User ${email} not found in database`);
    return;
  }

  console.log(`✅ User found: ${email}`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Has password: ${!!user.passwordHash}`);

  if (user.passwordHash) {
    console.log(`   Password hash: ${user.passwordHash.substring(0, 20)}...`);

    if (testPassword) {
      const match = await bcrypt.compare(testPassword, user.passwordHash);
      console.log(`\n🔐 Testing password: ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
    } else {
      console.log(`\n💡 Usage: npm run check-user ${email} <password-to-test>`);
    }
  } else {
    console.log(`\n⚠️  No password hash set for this user!`);
    console.log(`   Run: npm run create-superuser ${email} <password>`);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
