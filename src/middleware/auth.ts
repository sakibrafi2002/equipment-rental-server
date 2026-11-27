import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getDB } from "../config/db";
import { Role } from "../types/auth";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwks) {
    const url = process.env.AUTH_JWKS_URL;
    if (!url) {
      throw new Error("AUTH_JWKS_URL is missing in the .env file");
    }
    jwks = createRemoteJWKSet(new URL(url));
  }
  return jwks;
}

export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized: token missing" });
    return;
  }

  const token = header.split(" ")[1];

  try {
    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer: process.env.AUTH_ISSUER,
      audience: process.env.AUTH_AUDIENCE,
    });

    const email = payload.email;
    if (typeof email !== "string") {
      res.status(401).json({ message: "Unauthorized: invalid token" });
      return;
    }

    // Read the role from the database so role changes apply immediately
    const user = await getDB().collection("user").findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Unauthorized: user not found" });
      return;
    }

    req.user = {
      id: String(payload.sub),
      email,
      role: user.role as Role,
    };
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized: invalid or expired token" });
  }
}

function requireRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden: you do not have access" });
      return;
    }
    next();
  };
}

export const verifyRenter = requireRoles("customer");
export const verifyOwner = requireRoles("owner");
export const verifyAdmin = requireRoles("admin");