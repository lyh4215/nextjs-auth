import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import { hasRole } from "../lib/roles";

test("role migration, assignments, revocation, and atomic registration", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "auth-roles-"));
  const db = new PrismaClient({ datasourceUrl: `file:${path.join(directory, "test.db")}` });
  const migrate = async (name: string) => {
    const sql = await readFile(path.join("prisma/migrations", name, "migration.sql"), "utf8");
    const statements = sql.replace(/--[^\n]*/g, "").split(";");
    for (const statement of statements.filter((part) => part.trim())) {
      await db.$executeRawUnsafe(statement);
    }
  };

  try {
    await migrate("20260813130100_init");
    const existing = await db.user.create({
      data: { email: "existing@example.com", passwordHash: "test-only" },
    });
    await migrate("20261014000000_add_roles");

    const readUser = () => db.user.findUniqueOrThrow({
      where: { id: existing.id },
      include: { roles: { include: { role: true } } },
    });
    assert.equal(hasRole(await readUser(), "user"), true);
    assert.equal(hasRole(await readUser(), "admin"), false);

    const admin = await db.role.findUniqueOrThrow({ where: { key: "admin" } });
    await db.userRole.create({ data: { userId: existing.id, roleId: admin.id } });
    assert.equal(hasRole(await readUser(), "admin"), true);
    assert.equal(hasRole(await readUser(), "user"), true);
    await assert.rejects(
      db.userRole.create({ data: { userId: existing.id, roleId: admin.id } }),
      { code: "P2002" },
    );
    await assert.rejects(
      db.role.create({ data: { key: "admin", name: "Duplicate" } }),
      { code: "P2002" },
    );

    await db.userRole.delete({
      where: { userId_roleId: { userId: existing.id, roleId: admin.id } },
    });
    assert.equal(hasRole(await readUser(), "admin"), false);

    const registered = await db.user.create({
      data: {
        email: "new@example.com",
        passwordHash: "test-only",
        roles: { create: { role: { connect: { key: "user" } } } },
      },
      include: { roles: { include: { role: true } } },
    });
    assert.equal(hasRole(registered, "user"), true);
    assert.equal(hasRole(registered, "admin"), false);

    await assert.rejects(db.user.create({
      data: {
        email: "failed@example.com",
        passwordHash: "test-only",
        roles: { create: { role: { connect: { key: "missing-role" } } } },
      },
    }));
    assert.equal(await db.user.count({ where: { email: "failed@example.com" } }), 0);

    await db.user.delete({ where: { id: registered.id } });
    assert.equal(await db.userRole.count({ where: { userId: registered.id } }), 0);
    await db.role.delete({ where: { key: "user" } });
    assert.equal((await readUser()).roles.length, 0);
  } finally {
    await db.$disconnect();
    await rm(directory, { recursive: true, force: true });
  }
});
