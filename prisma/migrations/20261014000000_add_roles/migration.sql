CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT
);

CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    PRIMARY KEY ("userId", "roleId"),
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- Required application roles are installed in every environment by migration.
INSERT INTO "Role" ("id", "key", "name") VALUES
    ('role_user', 'user', '사용자'),
    ('role_admin', 'admin', '관리자');

-- Existing users retain ordinary access; administrators are assigned explicitly.
INSERT INTO "UserRole" ("userId", "roleId")
SELECT "id", 'role_user' FROM "User";
