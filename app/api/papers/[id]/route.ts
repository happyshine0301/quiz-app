import { storeErrorResponse } from "@/lib/store/http";
import { getPublicQuiz } from "@/lib/store/papers";

// 학생 풀이용 문제지. 정답·해설은 빼고 보낸다. 공개되지 않은 문제지는 없는 것으로 답한다.
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const quiz = await getPublicQuiz(id);
    if (!quiz) {
      return Response.json(
        { message: "이 문제지는 지금 풀 수 없습니다." },
        { status: 404 },
      );
    }
    return Response.json({ quiz });
  } catch (error) {
    return storeErrorResponse(error);
  }
}
