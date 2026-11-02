import type { ParseResult, Question } from "./types.ts";

const OPTION_COUNT = 4;

function isFilledString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// 문항 하나를 검사하고, 문제가 있으면 쉬운 말로 된 안내 문장을 돌려준다.
function checkQuestion(item: unknown, number: number): string[] {
  const label = `${number}번 문항`;
  if (!isRecord(item)) {
    return [`${label}: 문항의 형식이 올바르지 않습니다.`];
  }

  const errors: string[] = [];

  if (!isFilledString(item.question)) {
    errors.push(`${label}: 문제 내용(question)이 비어 있습니다.`);
  }

  const options = item.options;
  if (!Array.isArray(options)) {
    errors.push(`${label}: 보기(options)가 없습니다.`);
  } else if (options.length !== OPTION_COUNT) {
    errors.push(
      `${label}: 보기가 ${OPTION_COUNT}개가 아닙니다. (지금 ${options.length}개)`,
    );
  } else {
    options.forEach((option, index) => {
      if (!isFilledString(option)) {
        errors.push(`${label}: ${index + 1}번 보기가 비어 있습니다.`);
      }
    });
  }

  const answer = item.correctAnswer;
  if (
    typeof answer !== "number" ||
    !Number.isInteger(answer) ||
    answer < 1 ||
    answer > OPTION_COUNT
  ) {
    errors.push(
      `${label}: 정답 번호(correctAnswer)는 1, 2, 3, 4 중 하나여야 합니다.`,
    );
  }

  if (!isFilledString(item.explanation)) {
    errors.push(`${label}: 해설(explanation)이 비어 있습니다.`);
  }

  return errors;
}

// 업로드한 파일의 글자 내용을 읽어 문제 목록으로 바꾼다.
// 잘못된 문항이 하나라도 있으면 파일 전체를 받지 않는다.
export function parseQuizFile(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return {
      ok: false,
      errors: [
        "파일 내용을 읽을 수 없습니다. 올바른 JSON 문제 파일인지 확인해 주세요.",
      ],
    };
  }

  if (!isRecord(data) || !Array.isArray(data.questions)) {
    return {
      ok: false,
      errors: ["파일에 문제 목록(questions)이 없습니다."],
    };
  }

  if (data.questions.length === 0) {
    return { ok: false, errors: ["파일에 문제가 하나도 없습니다."] };
  }

  const errors = data.questions.flatMap((item, index) =>
    checkQuestion(item, index + 1),
  );
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const questions: Question[] = data.questions.map((item) => {
    const q = item as Question;
    return {
      question: q.question,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    };
  });
  return { ok: true, quiz: { questions } };
}
