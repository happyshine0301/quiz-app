import { titleKey } from "../quiz/fingerprint.ts";
import type { Quiz } from "../quiz/types.ts";
import { parseQuizFile } from "../quiz/validate.ts";
import { QUESTION_COUNT } from "./azure.ts";

// AI가 만든 문제지가 저장할 수 있는 형식인지 검사한다.
// 형식 검사일 뿐, 내용이 학습자료와 맞는지는 교사가 확인한다.
export type GeneratedCheck =
  | { ok: true; quiz: Quiz }
  | { ok: false; reasons: string[] };

export function checkQuizShape(quiz: Quiz): string[] {
  if (quiz.questions.length !== QUESTION_COUNT) {
    return [`문항이 ${QUESTION_COUNT}개가 아닙니다. (지금 ${quiz.questions.length}개)`];
  }
  return [];
}

export function findDuplicateTitle(title: string, existingTitles: string[]): string | null {
  const key = titleKey(title);
  return existingTitles.find((existing) => titleKey(existing) === key) ?? null;
}

export function checkGeneratedQuiz(content: string, existingTitles: string[]): GeneratedCheck {
  const parsed = parseQuizFile(content);
  if (!parsed.ok) return { ok: false, reasons: parsed.errors };

  const shape = checkQuizShape(parsed.quiz);
  if (shape.length > 0) return { ok: false, reasons: shape };

  const duplicate = findDuplicateTitle(parsed.quiz.title, existingTitles);
  if (duplicate) {
    return {
      ok: false,
      reasons: [`AI가 만든 제목이 이미 있는 문제지 "${duplicate}"와 같습니다.`],
    };
  }
  return { ok: true, quiz: { ...parsed.quiz, title: parsed.quiz.title.trim() } };
}
