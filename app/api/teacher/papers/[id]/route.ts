import { storeErrorResponse } from "@/lib/store/http";
import { setPublished } from "@/lib/store/papers";
import { verifyTeacher } from "@/lib/teacher/verify";

// 문제지 공개 / 비공개 바꾸기. 허용된 교사만 쓸 수 있다.
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const check = await verifyTeacher(request);
  if (!check.ok) {
    return Response.json({ message: check.message }, { status: check.status });
  }

  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  const published = (body as { published?: unknown } | null)?.published;
  if (typeof published !== "boolean") {
    return Response.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  try {
    const found = await setPublished(id, published);
    if (!found) {
      return Response.json({ message: "문제지를 찾을 수 없습니다." }, { status: 404 });
    }
    return Response.json({ id, published });
  } catch (error) {
    return storeErrorResponse(error);
  }
}
