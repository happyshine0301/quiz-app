import type { Quiz, QuizResult } from "./types.ts";

// 정답 수 ÷ 전체 문항 수 × 100, 소수 첫째 자리까지 반올림
export function calculateScore(correctCount: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correctCount / total) * 1000) / 10;
}

// answers[i]는 i번째 문항에서 고른 보기 번호(1~4), 고르지 않았으면 null
export function gradeQuiz(quiz: Quiz, answers: (number | null)[]): QuizResult {
  const items = quiz.questions.map((q, index) => {
    const selected = answers[index] ?? null;
    return { ...q, selected, isCorrect: selected === q.correctAnswer };
  });
  const correctCount = items.filter((item) => item.isCorrect).length;
  return {
    total: items.length,
    correctCount,
    score: calculateScore(correctCount, items.length),
    items,
  };
}
