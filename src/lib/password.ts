// Node-only (bcryptjs uses process.nextTick/setImmediate, unsupported on
// Edge). Never import this from middleware.ts or anything it pulls in --
// only from route handlers/Server Components running the nodejs runtime.
import bcrypt from "bcryptjs";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
