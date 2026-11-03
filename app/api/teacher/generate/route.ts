import { FORMAT_FAILURE_MESSAGE, readAzureConfig, requestQuiz } from "@/lib/ai/azure";
import { checkGeneratedQuiz } from "@/lib/ai/generated";
import { MAX_PDF_BYTES, readPdfText } from "@/lib/ai/pdf";
import { storeErrorResponse } from "@/lib/store/http";
import { listPaperTitles } from "@/lib/store/papers";
import { verifyTeacher } from "@/lib/teacher/verify";

// PDF 학습자료로 AI 문제지를 만든다. 저장하지 않고 결과만 돌려준다(저장은 교사가 확인 후 따로).
// PDF와 본문은 이 요청 안에서만 쓰고 어디에도 보관하지 않는다.
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// 파일 1개를 담은 양식(multipart)의 머리 부분 여유
const FORM_OVERHEAD_BYTES = 16 * 1024;

function fail(status: number, code: string, message: string, details?: string[]) {
  return Response.json({ code, message, details }, { status });
}

export async function POST(request: Request) {
  const check = await verifyTeacher(request);
  if (!check.ok) {
    return Response.json({ message: check.message }, { status: check.status });
  }

  const config = readAzureConfig(process.env);
  if (!config) {
    return fail(503, "not_configured", "AI 연결 설정이 아직 없습니다. 서버 설정의 AZURE 값 4개를 확인해 주세요.");
  }

  // 본문을 읽기 전에 요청 크기부터 확인한다.
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_PDF_BYTES + FORM_OVERHEAD_BYTES) {
    return fail(413, "too_large", "PDF 파일이 512KB를 넘습니다. 더 작은 파일로 나눠 올려 주세요.");
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return fail(400, "no_file", "PDF 파일을 골라 주세요.");
  }

  const pdf = await readPdfText(new Uint8Array(await file.arrayBuffer()));
  if (!pdf.ok) {
    return fail(422, pdf.failure.code, pdf.failure.message);
  }

  let existingTitles: string[];
  try {
    existingTitles = await listPaperTitles();
  } catch (error) {
    return storeErrorResponse(error);
  }

  const answer = await requestQuiz(config, pdf.text, existingTitles);
  if (!answer.ok) {
    const status = answer.failure.code === "rate_limit" ? 429 : answer.failure.code === "timeout" ? 504 : 502;
    return fail(status, answer.failure.code, answer.failure.message);
  }

  const generated = checkGeneratedQuiz(answer.content, existingTitles);
  if (!generated.ok) {
    console.error("AI 결과 형식 오류", generated.reasons);
    return fail(502, "format", FORMAT_FAILURE_MESSAGE, generated.reasons.slice(0, 5));
  }

  return Response.json({ quiz: generated.quiz, chars: pdf.chars, pages: pdf.pages });
}
