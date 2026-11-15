import { apiError, getCurrentUser } from "../../../../lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Belum masuk." }, { status: 401 });
    return Response.json({ user });
  } catch (error) {
    return apiError(error);
  }
}
