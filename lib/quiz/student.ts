import { createHash } from "node:crypto";
import type { QuizResult } from "./types.ts";

export const MAX_NAME_LENGTH = 20;

// 앞뒤 공백을 지우고 중간 공백은 하나로 줄인다. 쓸 수 없는 이름이면 null.
export function cleanStudentName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const cleaned = name.trim().replace(/\s+/g, " ");
  if (cleaned === "" || cleaned.length > MAX_NAME_LENGTH) return null;
  return cleaned;
}

// 같은 문제지를 같은 이름으로 다시 풀면 같은 문서에 덮어써 최신 결과만 남긴다.
// 이름은 대소문자를 구분하지 않는다.
export function resultDocId(paperId: string, studentName: string): string {
  const nameHash = createHash("sha256")
    .update(studentName.toLowerCase())
    .digest("hex")
    .slice(0, 20);
  return `${paperId}_${nameHash}`;
}

// 답안이 문항 수만큼 있고 모두 1~4인지 확인한다. 아니면 null.
export function cleanAnswers(answers: unknown, total: number): number[] | null {
  if (!Array.isArray(answers) || answers.length !== total) return null;
  const ok = answers.every(
    (value) => typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 4,
  );
  return ok ? (answers as number[]) : null;
}

// 틀린 문항 번호(1부터)
export function wrongQuestionNumbers(result: QuizResult): number[] {
  return result.items.flatMap((item, index) => (item.isCorrect ? [] : [index + 1]));
}
