import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "../lib/password";

test("scrypt hashes verify the original password", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.match(hash, /^scrypt\$16384\$8\$1\$/);
  assert.equal(await verifyPassword("correct horse battery staple", hash), true);
  assert.equal(await verifyPassword("wrong password", hash), false);
});

test("random salts produce different hashes", async () => {
  const first = await hashPassword("same password");
  const second = await hashPassword("same password");
  assert.notEqual(first, second);
});

test("malformed hashes fail closed", async () => {
  assert.equal(await verifyPassword("password", "not-a-valid-hash"), false);
  assert.equal(await verifyPassword("password", "scrypt$3$8$1$bad$bad"), false);
});
