import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE_NAME = "jcscents-admin-session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type AdminCredentials = {
  username: string;
  password: string;
};

export function hasAdminCredentialsConfigured() {
  return Boolean(process.env.username && process.env.password);
}

export async function isAdminAuthenticated() {
  if (!hasAdminCredentialsConfigured()) {
    return false;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  return verifyAdminSession(session);
}

export async function createAdminSession() {
  const cookieStore = await cookies();
  const token = randomBytes(32).toString("hex");

  cookieStore.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: `${token}.${signAdminSessionToken(token)}`,
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
    priority: "high",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();

  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
}

export function validateAdminCredentials(username: string, password: string) {
  const credentials = getAdminCredentials();

  return (
    constantTimeEqual(username, credentials.username) &&
    constantTimeEqual(password, credentials.password)
  );
}

function verifyAdminSession(session: string | undefined) {
  if (!session) {
    return false;
  }

  const [token, signature, ...rest] = session.split(".");

  if (!token || !signature || rest.length > 0) {
    return false;
  }

  return constantTimeEqual(signature, signAdminSessionToken(token));
}

function signAdminSessionToken(token: string) {
  const credentials = getAdminCredentials();

  return createHmac("sha256", `${credentials.username}:${credentials.password}`)
    .update(token)
    .digest("base64url");
}

function getAdminCredentials(): AdminCredentials {
  const username = process.env.username;
  const password = process.env.password;

  if (!username || !password) {
    throw new Error("Admin username/password are not configured in the environment.");
  }

  return { username, password };
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
