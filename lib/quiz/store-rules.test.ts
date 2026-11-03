import assert from "node:assert/strict";
import { test } from "node:test";
import { contentHash, titleKey } from "./fingerprint.ts";
import { gradeQuiz } from "./score.ts";
import {
  cleanAnswers,
  cleanStudentName,
  resultDocId,
  wrongQuestionNumbers,
} from "./student.ts";
import { summarizeResults, type ResultRow } from "./summary.ts";
import type { Quiz } from "./types.ts";

const quiz: Quiz = {
  title: "시험용 문제지",
  questions: [1, 2, 3].map((correctAnswer) => ({
    question: `문제 ${correctAnswer}`,
    options: ["가", "나", "다", "라"],
    correctAnswer,
    explanation: "해설",
  })),
};

test("제목은 띄어쓰기·대소문자를 무시하고 같으면 중복으로 본다", () => {
  assert.equal(titleKey("  중학교   정보 Quiz "), titleKey("중학교 정보 quiz"));
  assert.notEqual(titleKey("정보 1"), titleKey("정보 2"));
});

test("문항 내용이 같으면 제목이 달라도 같은 내용으로 본다", () => {
  assert.equal(contentHash(quiz), contentHash({ ...quiz, title: "다른 제목" }));
  const changed = structuredClone(quiz);
  changed.questions[0].correctAnswer = 2;
  assert.notEqual(contentHash(quiz), contentHash(changed));
});

test("학생 이름은 공백을 정리하고, 비었거나 너무 길면 받지 않는다", () => {
  assert.equal(cleanStudentName("  홍  길동 "), "홍 길동");
  assert.equal(cleanStudentName("   "), null);
  assert.equal(cleanStudentName("가".repeat(21)), null);
  assert.equal(cleanStudentName(3), null);
});

test("같은 문제지·같은 이름(대소문자 무시)은 같은 결과 문서에 저장한다", () => {
  assert.equal(resultDocId("p1", "Kim"), resultDocId("p1", "kim"));
  assert.notEqual(resultDocId("p1", "kim"), resultDocId("p2", "kim"));
  assert.notEqual(resultDocId("p1", "kim"), resultDocId("p1", "lee"));
  assert.doesNotMatch(resultDocId("p1", "a/b"), /\//);
});

test("답안은 문항 수만큼, 모두 1~4여야 한다", () => {
  assert.deepEqual(cleanAnswers([1, 4, 2], 3), [1, 4, 2]);
  assert.equal(cleanAnswers([1, 4], 3), null);
  assert.equal(cleanAnswers([1, 5, 2], 3), null);
  assert.equal(cleanAnswers([1, null, 2], 3), null);
  assert.equal(cleanAnswers("1,2,3", 3), null);
});

test("틀린 문항 번호를 1부터 센다", () => {
  assert.deepEqual(wrongQuestionNumbers(gradeQuiz(quiz, [1, 4, 1])), [2, 3]);
});

test("결과표는 이름순으로 정렬하고 평균을 소수 첫째 자리까지 낸다", () => {
  const row = (studentName: string, score: number): ResultRow => ({
    studentName,
    score,
    correctCount: 0,
    total: 3,
    wrongQuestions: [],
    submittedAt: "2026-11-03T00:00:00.000Z",
  });
  const table = summarizeResults([row("홍길동", 66.7), row("김철수", 100), row("이영희", 33.3)]);
  assert.deepEqual(
    table.rows.map((r) => r.studentName),
    ["김철수", "이영희", "홍길동"],
  );
  assert.equal(table.average, 66.7);
  assert.equal(summarizeResults([]).average, null);
});
