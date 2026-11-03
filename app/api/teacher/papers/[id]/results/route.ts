import { summarizeResults } from "@/lib/quiz/summary";
import { storeErrorResponse } from "@/lib/store/http";
import { getPaper } from "@/lib/store/papers";
import { listResults } from "@/lib/store/results";
import { verifyTeacher } from "@/lib/teacher/verify";

// 문제지별 학생 결과표와 평균. 허용된 교사만 볼 수 있다.
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const check = await verifyTeacher(request);
  if (!check.ok) {
    return Response.json({ message: check.message }, { status: check.status });
  }

  const { id } = await params;
  try {
    const paper = await getPaper(id);
    if (!paper) {
      return Response.json({ message: "문제지를 찾을 수 없습니다." }, { status: 404 });
    }
    const table = summarizeResults(await listResults(id));
    return Response.json({ title: paper.title, ...table });
  } catch (error) {
    return storeErrorResponse(error);
  }
}
