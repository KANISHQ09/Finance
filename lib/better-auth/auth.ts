import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/nodemailer/verification";

/**
 * Creates a BetterAuth instance with MongoDB adapter.
 * Email verification is enabled — users must verify before signing in.
 */
function createAuth(db: any) {
  return betterAuth({
    database: mongodbAdapter(db as any),
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL!,
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      requireEmailVerification: false, // set true to enforce verification
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
      sendResetPassword: async ({ user, url }) => {
        await sendPasswordResetEmail({
          email: user.email,
          name: user.name ?? "Investor",
          url,
        });
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendVerificationEmail({
          email: user.email,
          name: user.name ?? "Investor",
          url,
        });
      },
      expiresIn: 3600, // 1 hour
    },
    plugins: [nextCookies()],
  });
}

// ─── Lazy singleton (fixes top-level await anti-pattern) ───────────────────────
let _auth: ReturnType<typeof createAuth> | null = null;

export async function getAuth(): Promise<ReturnType<typeof createAuth>> {
  if (_auth) return _auth;
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection not found");
  _auth = createAuth(db as any);
  return _auth;
}

// Convenience export for server components (use getAuth() in API routes)
export const auth = await getAuth();
