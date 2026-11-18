import { apiError, requireUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { createProductWorkbook } from "../../../../lib/product-excel";

export async function GET() {
  try {
    await requireUser(["PEMILIK"]);
    const products = await prisma.produk.findMany({
      where: { aktif: true },
      include: { kategori: true, satuan: true },
      orderBy: { namaProduk: "asc" },
    });
    const workbook = await createProductWorkbook(products);
    return new Response(workbook, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="produk.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
