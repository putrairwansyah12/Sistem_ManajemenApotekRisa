import bcrypt from "bcryptjs";
import { ApiError, apiError, jsonBody, requireUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { isValidPassword, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "../../../../lib/user-validation";

export async function PATCH(request, { params }) {
  try {
    const actor = await requireUser(["PEMILIK"]);
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) throw new ApiError("ID pengguna tidak valid.");

    const body = await jsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError("Format data pengguna tidak valid.");
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new ApiError("Pengguna tidak ditemukan.", 404);
    const isOwnerSelf = existing.role === "PEMILIK" && existing.id === actor.id;
    if (existing.role !== "KASIR" && !isOwnerSelf) throw new ApiError("Pemilik hanya dapat memperbarui profilnya sendiri.");
    if (isOwnerSelf && Object.keys(body).some((key) => !["nama", "password"].includes(key))) {
      throw new ApiError("Profil pemilik hanya dapat mengubah nama dan kata sandi.");
    }

    const data = {};
    if (body.nama !== undefined) {
      if (typeof body.nama !== "string" || !body.nama.trim() || body.nama.trim().length > 100) {
        throw new ApiError("Nama harus diisi (maksimal 100 karakter).");
      }
      data.nama = body.nama.trim();
    }
    if (body.username !== undefined) {
      if (typeof body.username !== "string" || !/^[a-zA-Z0-9._-]{3,50}$/.test(body.username.trim())) {
        throw new ApiError("Username harus terdiri dari 3–50 karakter: huruf, angka, titik, garis bawah, atau tanda hubung.");
      }
      data.username = body.username.trim();
    }
    if (body.password !== undefined) {
      if (!isValidPassword(body.password)) {
        throw new ApiError(`Kata sandi harus memiliki ${MIN_PASSWORD_LENGTH}–${MAX_PASSWORD_LENGTH} karakter.`);
      }
      data.passwordHash = await bcrypt.hash(body.password, 12);
    }
    if (body.aktif !== undefined) {
      if (typeof body.aktif !== "boolean") throw new ApiError("Status akun tidak valid.");
      data.aktif = body.aktif;
    }
    if (!Object.keys(data).length) throw new ApiError("Tidak ada perubahan yang dikirim.");

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, nama: true, username: true, role: true, aktif: true, dibuatPada: true },
    });
    return Response.json({ user });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireUser(["PEMILIK"]);
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) throw new ApiError("ID pengguna tidak valid.");

    const existing = await prisma.user.findUnique({
      where: { id },
      select: {
        role: true,
        _count: {
          select: {
            stockOpname: true,
            penerimaanBatch: true,
            transaksi: true,
            kalkulasiHarga: true,
            riwayatHarga: true,
            imporData: true,
          },
        },
      },
    });
    if (!existing) throw new ApiError("Pengguna tidak ditemukan.", 404);
    if (existing.role !== "KASIR") throw new ApiError("Menu ini hanya dapat menghapus akun kasir.");
    if (Object.values(existing._count).some((count) => count > 0)) {
      throw new ApiError("Akun memiliki riwayat aktivitas dan tidak dapat dihapus. Arsipkan akun sebagai gantinya.", 409);
    }

    await prisma.user.delete({ where: { id } });
    return Response.json({ deleted: true });
  } catch (error) {
    if (error?.code === "P2003") {
      return Response.json({ error: "Akun memiliki riwayat aktivitas dan tidak dapat dihapus. Arsipkan akun sebagai gantinya." }, { status: 409 });
    }
    return apiError(error);
  }
}
