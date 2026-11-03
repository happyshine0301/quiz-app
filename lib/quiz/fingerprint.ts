import { createHash } from "node:crypto";
import type { Quiz } from "./types.ts";

// 중복 문제지 판단용. 제목이 같거나(띄어쓰기·대소문자 무시) 문항 내용이 완전히 같으면 중복이다.

export function titleKey(title: string): string {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

export function contentHash(quiz: Quiz): string {
  const questions = quiz.questions.map((q) => [
    q.question.trim(),
    q.options.map((option) => option.trim()),
    q.correctAnswer,
    q.explanation.trim(),
  ]);
  return createHash("sha256").update(JSON.stringify(questions)).digest("hex");
}
