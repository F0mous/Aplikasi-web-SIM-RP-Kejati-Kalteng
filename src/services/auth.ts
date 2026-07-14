function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const pairs = hex.match(/.{1,2}/g) ?? [];
  return new Uint8Array(pairs.map((pair) => Number.parseInt(pair, 16)));
}

async function deriveHash(password: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: hexToBytes(saltHex),
      iterations: 120_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  return bytesToHex(new Uint8Array(bits));
}

export async function createPasswordRecord(
  password: string,
): Promise<{ salt: string; passwordHash: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bytesToHex(salt);
  return {
    salt: saltHex,
    passwordHash: await deriveHash(password, saltHex),
  };
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const actualHash = await deriveHash(password, salt);
  return actualHash === expectedHash;
}
