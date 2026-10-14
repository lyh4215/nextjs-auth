import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Demo accounts are for local development only.");
  const db = new PrismaClient();
  const password = randomBytes(18).toString("base64url");
  try {
    const passwordHash = await hashPassword(password);
    const accounts = [
      { email: "admin@example.test", displayName: "관리자 테스트", roles: ["user", "admin"] },
      { email: "user1@example.test", displayName: "김민준", roles: ["user"] },
      { email: "user2@example.test", displayName: "이서연", roles: ["user"] },
      { email: "user3@example.test", displayName: "박지호", roles: ["user"] },
    ];
    for (const account of accounts) {
      if (await db.user.findUnique({ where: { email: account.email } })) {
        console.log(`Skipped existing account: ${account.email}`);
        continue;
      }
      await db.user.create({
        data: {
          email: account.email,
          displayName: account.displayName,
          passwordHash,
          roles: { create: account.roles.map((key) => ({ role: { connect: { key } } })) },
        },
      });
      console.log(`Created: ${account.email}`);
    }
    console.log(`Password for accounts created in this run: ${password}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
