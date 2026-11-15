import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "./prisma";

const COOKIE_NAME = "apotek_session";
const SESSION_SECONDS = 60 * 60 * 8;

export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new ApiError("AUTH_SECRET wajib diatur dan memiliki minimal 32 karakter.", 503);
  }
  return value;
}

function signature(payload) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSession(userId) {
  const payload = `${userId}.${Math.floor(Date.now() / 1000) + SESSION_SECONDS}`;
  return `${payload}.${signature(payload)}`;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, expires, suppliedSignature] = parts;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(expires) || Number(expires) <= Date.now() / 1000) return null;

  const payload = `${id}.${expires}`;
  const expected = Buffer.from(signature(payload));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;

  return prisma.user.findFirst({
    where: { id: Number(id), aktif: true },
    select: { id: true, nama: true, username: true, role: true },
  });
}

export async function requireUser(roles) {
  const user = await getCurrentUser();
  if (!user) throw new ApiError("Silakan masuk untuk melanjutkan.", 401);
  if (roles && !roles.includes(user.role)) throw new ApiError("Anda tidak memiliki izin untuk tindakan ini.", 403);
  return user;
}

export async function jsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new ApiError("Format JSON tidak valid.");
  }
}

export function apiError(error) {
  unstable_rethrow(error);
  if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
  if (error?.code === "P2002") return Response.json({ error: "Data sudah terdaftar." }, { status: 409 });
  if (error?.code === "P2003") return Response.json({ error: "Data terkait tidak ditemukan." }, { status: 400 });
  console.error("API error:", error);
  return Response.json({ error: "Terjadi kesalahan server. Silakan coba lagi." }, { status: 500 });
}

export { COOKIE_NAME };
