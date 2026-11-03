import assert from "node:assert/strict";
import { test } from "node:test";
import { checkGeneratedQuiz } from "./generated.ts";

function quizJson(overrides: { title?: string; count?: number; patch?: object } = {}) {
  const questions = Array.from({ length: overrides.count ?? 10 }, (_, i) => ({
    question: `문제 ${i + 1}`,
    options: ["가", "나", "다", "라"],
    correctAnswer: 2,
    explanation: "해설",
    ...overrides.patch,
  }));
  return JSON.stringify({ title: overrides.title ?? "컴퓨터의 구성", questions });
}

test("제목과 10문항이 올바르면 통과한다", () => {
  const result = checkGeneratedQuiz(quizJson(), ["중학교 정보과목"]);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.quiz.questions.length, 10);
});

test("문항이 10개가 아니면 저장할 수 없다", () => {
  assert.equal(checkGeneratedQuiz(quizJson({ count: 9 }), []).ok, false);
  assert.equal(checkGeneratedQuiz(quizJson({ count: 11 }), []).ok, false);
});

test("보기 수, 정답 번호, 해설, 제목이 잘못되면 저장할 수 없다", () => {
  assert.equal(checkGeneratedQuiz(quizJson({ patch: { options: ["가", "나", "다"] } }), []).ok, false);
  assert.equal(checkGeneratedQuiz(quizJson({ patch: { correctAnswer: 5 } }), []).ok, false);
  assert.equal(checkGeneratedQuiz(quizJson({ patch: { explanation: " " } }), []).ok, false);
  assert.equal(checkGeneratedQuiz(quizJson({ title: "" }), []).ok, false);
});

test("JSON이 아니면 저장할 수 없다", () => {
  assert.equal(checkGeneratedQuiz("문제를 만들었습니다!", []).ok, false);
});

test("기존 문제지와 제목이 같으면(띄어쓰기·대소문자 무시) 저장할 수 없다", () => {
  const result = checkGeneratedQuiz(quizJson({ title: " 중학교  정보과목 " }), ["중학교 정보과목"]);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reasons[0], /이미 있는 문제지/);
});
