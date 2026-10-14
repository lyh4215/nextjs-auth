import assert from "node:assert/strict";
import test from "node:test";
import { hasRole } from "../lib/roles";

test("anonymous users and users without roles are denied", () => {
  assert.equal(hasRole(null, "admin"), false);
  assert.equal(hasRole(undefined, "admin"), false);
  assert.equal(hasRole({ roles: [] }, "admin"), false);
});

test("any explicitly assigned role is recognized", () => {
  const user = { roles: [{ role: { key: "user" } }, { role: { key: "admin" } }] };
  assert.equal(hasRole(user, "user"), true);
  assert.equal(hasRole(user, "admin"), true);
  assert.equal(hasRole(user, "editor"), false);
});

test("roles are exact keys with no implicit inheritance or wildcard", () => {
  const user = { roles: [{ role: { key: "admin" } }] };
  for (const key of ["user", "Admin", " admin", "*", ""]) {
    assert.equal(hasRole(user, key), false);
  }
});

test("custom roles and removed assignments are reflected", () => {
  const user = { roles: [{ role: { key: "billing-manager" } }] };
  assert.equal(hasRole(user, "billing-manager"), true);
  user.roles = [];
  assert.equal(hasRole(user, "billing-manager"), false);
});
