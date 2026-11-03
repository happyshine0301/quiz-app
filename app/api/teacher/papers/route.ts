import { checkQuizShape } from "@/lib/ai/generated";
import { parseQuizFile } from "@/lib/quiz/validate";
import { storeErrorResponse } from "@/lib/store/http";
import { createPaper, listAllPapers } from "@/lib/store/papers";
import { verifyTeacher } from "@/lib/teacher/verify";

// 교사용 문제지 목록 조회와 새 문제지 등록. 모두 허용된 교사만 쓸 수 있다.
export const dynamic = "force-dynamic";

const MAX_FILE_LENGTH = 1_000_000;

export async function GET(request: Request) {
  const check = await verifyTeacher(request);
  if (!check.ok) {
    return Response.json({ message: check.message }, { status: check.status });
  }
  try {
    return Response.json({ papers: await listAllPapers() });
  } catch (error) {
    return storeErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const check = await verifyTeacher(request);
  if (!check.ok) {
    return Response.json({ message: check.message }, { status: check.status });
  }

  // publish·requireTen은 AI 출제 결과를 저장할 때 쓴다(10문항 확인 후 바로 공개).
  const body = (await request.json().catch(() => null)) as {
    text?: unknown;
    publish?: unknown;
    requireTen?: unknown;
  } | null;
  const text = body?.text;
  if (typeof text !== "string" || text.length > MAX_FILE_LENGTH) {
    return Response.json(
      { message: "파일을 읽지 못했습니다. 1MB보다 작은 JSON 문제 파일을 골라 주세요." },
      { status: 400 },
    );
  }

  // 화면에서 이미 검사했더라도 서버에서 다시 검사한다.
  const parsed = parseQuizFile(text);
  if (!parsed.ok) {
    return Response.json(
      { message: "문제 파일에 고쳐야 할 부분이 있습니다.", errors: parsed.errors },
      { status: 400 },
    );
  }

  if (body?.requireTen === true) {
    const shape = checkQuizShape(parsed.quiz);
    if (shape.length > 0) {
      return Response.json(
        { message: "문제지 형식이 맞지 않아 저장할 수 없습니다.", errors: shape },
        { status: 400 },
      );
    }
  }

  try {
    const created = await createPaper(parsed.quiz, check.email, {
      published: body?.publish === true,
    });
    if (!created.ok) {
      const message =
        created.reason === "title"
          ? `이미 같은 제목의 문제지가 등록되어 있습니다: "${created.duplicateOf}"`
          : `문제 내용이 이미 등록된 문제지 "${created.duplicateOf}"와 같습니다.`;
      return Response.json({ message, duplicate: true }, { status: 409 });
    }
    return Response.json({ paper: created.paper }, { status: 201 });
  } catch (error) {
    return storeErrorResponse(error);
  }
}
