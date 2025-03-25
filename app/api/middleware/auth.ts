//app/api/middleware/auth.ts

import jwt from "jsonwebtoken";

export function verifyToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
}