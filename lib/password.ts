import {
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

const ALGORITHM = "scrypt";
const KEY_LENGTH = 64;
const DEFAULT_PARAMS = { N: 16_384, r: 8, p: 1 } as const;
const MAX_PASSWORD_BYTES = 1024;

function deriveKey(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

function validatePasswordSize(password: string) {
  if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    throw new Error("Password is too long");
  }
}

export async function hashPassword(password: string): Promise<string> {
  validatePasswordSize(password);
  const salt = randomBytes(16);
  const { N, r, p } = DEFAULT_PARAMS;
  const derivedKey = await deriveKey(password, salt, KEY_LENGTH, {
    N,
    r,
    p,
    maxmem: 32 * 1024 * 1024,
  });

  return [ALGORITHM, N, r, p, salt.toString("base64"), derivedKey.toString("base64")].join("$");
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    validatePasswordSize(password);
    const [algorithm, nValue, rValue, pValue, saltValue, hashValue, ...extra] = storedHash.split("$");
    if (algorithm !== ALGORITHM || extra.length > 0) return false;

    const N = Number(nValue);
    const r = Number(rValue);
    const p = Number(pValue);
    const salt = Buffer.from(saltValue, "base64");
    const expected = Buffer.from(hashValue, "base64");

    if (
      !Number.isInteger(N) ||
      !Number.isInteger(r) ||
      !Number.isInteger(p) ||
      N < 2 ||
      (N & (N - 1)) !== 0 ||
      r < 1 ||
      p < 1 ||
      salt.length < 16 ||
      expected.length !== KEY_LENGTH
    ) {
      return false;
    }

    const actual = await deriveKey(password, salt, expected.length, {
      N,
      r,
      p,
      maxmem: 32 * 1024 * 1024,
    });

    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
