import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { ApiError, apiError, createSession, jsonBody, sessionCookieOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(request) {
  try {
    const body = await jsonBody(request);
    if (typeof body.username !== "string" || typeof body.password !== "string") {
      throw new ApiError("Username dan password wajib diisi.");
    }

    const username = body.username.trim();
    if (!username || username.length > 50 || body.password.length > 200) {
      throw new ApiError("Username atau password tidak valid.", 401);
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user?.aktif || !(await bcrypt.compare(body.password, user.passwordHash))) {
      throw new ApiError("Username atau password salah.", 401);
    }

    const response = NextResponse.json({
      user: { id: user.id, nama: user.nama, username: user.username, role: user.role },
    });
    response.cookies.set("apotek_session", createSession(user.id), sessionCookieOptions());
    return response;
  } catch (error) {
    return apiError(error);
  }
}
