import { gradeQuiz } from "@/lib/quiz/score";
import { cleanAnswers, cleanStudentName } from "@/lib/quiz/student";
import { storeErrorResponse } from "@/lib/store/http";
import { getPaper } from "@/lib/store/papers";
import { saveResult } from "@/lib/store/results";

// 학생 최종 제출: 서버가 채점하고 결과를 저장한 뒤, 이 학생의 채점 결과(정답·해설 포함)만 돌려준다.
// 같은 문제지를 같은 이름으로 다시 내면 최신 결과로 덮어쓴다.
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    studentName?: unknown;
    answers?: unknown;
  } | null;

  const studentName = cleanStudentName(body?.studentName);
  if (!studentName) {
    return Response.json({ message: "이름을 다시 입력해 주세요." }, { status: 400 });
  }

  try {
    const paper = await getPaper(id);
    if (!paper || !paper.published) {
      return Response.json(
        { message: "이 문제지는 지금 풀 수 없습니다." },
        { status: 404 },
      );
    }

    const answers = cleanAnswers(body?.answers, paper.questions.length);
    if (!answers) {
      return Response.json(
        { message: "모든 문제에 답을 고른 뒤 제출해 주세요." },
        { status: 400 },
      );
    }

    const result = gradeQuiz(paper, answers);
    await saveResult(id, studentName, answers, result);
    return Response.json({ result });
  } catch (error) {
    return storeErrorResponse(error);
  }
}
