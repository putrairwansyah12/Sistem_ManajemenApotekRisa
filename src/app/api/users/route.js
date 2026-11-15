import bcrypt from "bcryptjs";
import { ApiError, apiError, jsonBody, requireUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

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
    const nama = typeof body.nama === "string" ? body.nama.trim() : "";
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role;

    if (!nama || nama.length > 100 || !/^[a-zA-Z0-9._-]{3,50}$/.test(username)) {
      throw new ApiError("Nama atau username tidak valid.");
    }
    if (password.length < 12 || password.length > 200) throw new ApiError("Kata sandi harus memiliki 12–200 karakter.");
    if (!["PEMILIK", "KASIR"].includes(role)) throw new ApiError("Peran pengguna tidak valid.");

    const user = await prisma.user.create({
      data: { nama, username, passwordHash: await bcrypt.hash(password, 12), role },
      select: { id: true, nama: true, username: true, role: true, aktif: true, dibuatPada: true },
    });
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
