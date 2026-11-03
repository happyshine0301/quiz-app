import { storeErrorResponse } from "@/lib/store/http";
import { listPublishedPapers } from "@/lib/store/papers";

// 학생 문제지 목록: 공개된 문제지의 제목과 문항 수만 보낸다.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ papers: await listPublishedPapers() });
  } catch (error) {
    return storeErrorResponse(error);
  }
}
