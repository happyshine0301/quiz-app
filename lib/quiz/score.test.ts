import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateScore, gradeQuiz } from "./score.ts";
import type { Quiz } from "./types.ts";

test("점수는 소수 첫째 자리까지 반올림한다", () => {
  assert.equal(calculateScore(2, 3), 66.7);
  assert.equal(calculateScore(1, 3), 33.3);
  assert.equal(calculateScore(7, 10), 70);
  assert.equal(calculateScore(10, 10), 100);
  assert.equal(calculateScore(0, 4), 0);
});

test("파일에 있는 정답으로 문항별 정오를 매긴다", () => {
  const quiz: Quiz = {
    questions: [1, 2, 3].map((correctAnswer) => ({
      question: `문제 ${correctAnswer}`,
      options: ["가", "나", "다", "라"],
      correctAnswer,
      explanation: "해설",
    })),
  };
  const result = gradeQuiz(quiz, [1, 4, 3]);
  assert.equal(result.total, 3);
  assert.equal(result.correctCount, 2);
  assert.equal(result.score, 66.7);
  assert.deepEqual(
    result.items.map((item) => [item.selected, item.isCorrect]),
    [
      [1, true],
      [4, false],
      [3, true],
    ],
  );
});
