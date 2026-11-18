import bcrypt from "bcryptjs";
import { ApiError, apiError, jsonBody, requireUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { isValidPassword, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "../../../lib/user-validation";

export async function GET() {
  try {
    await requireUser(["PEMILIK"]);
    const users = await prisma.user.findMany({
      select: { id: true, nama: true, username: true, role: true, aktif: true, dibuatPada: true },
      orderBy: { dibuatPada: "desc" },
    });
    return Response.json({ users });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request) {
  try {
    await requireUser(["PEMILIK"]);
    const body = await jsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError("Format data pengguna tidak valid.");
    const nama = typeof body.nama === "string" ? body.nama.trim() : "";
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!nama || nama.length > 100 || !/^[a-zA-Z0-9._-]{3,50}$/.test(username)) {
      throw new ApiError("Nama atau username tidak valid.");
    }
    if (!isValidPassword(password)) {
      throw new ApiError(`Kata sandi harus memiliki ${MIN_PASSWORD_LENGTH}–${MAX_PASSWORD_LENGTH} karakter.`);
    }
    if (body.role !== "KASIR") throw new ApiError("Menu ini hanya dapat membuat akun kasir.");

    const user = await prisma.user.create({
      data: { nama, username, passwordHash: await bcrypt.hash(password, 12), role: "KASIR" },
      select: { id: true, nama: true, username: true, role: true, aktif: true, dibuatPada: true },
    });
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
