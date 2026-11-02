import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseQuizFile } from "./validate.ts";

const validQuestion = {
  question: "1 + 1은?",
  options: ["1", "2", "3", "4"],
  correctAnswer: 2,
  explanation: "1 더하기 1은 2입니다.",
};

function parse(data: unknown) {
  return parseQuizFile(JSON.stringify(data));
}

test("예시 파일 sample-questions.json을 10문항으로 읽는다", () => {
  const text = readFileSync(
    new URL("../../sample-questions.json", import.meta.url),
    "utf8",
  );
  const result = parseQuizFile(text);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.quiz.questions.length, 10);
});

test("JSON 형식이 깨진 파일은 받지 않는다", () => {
  const result = parseQuizFile("{ questions: [");
  assert.equal(result.ok, false);
});

test("questions 배열이 없거나 비어 있으면 받지 않는다", () => {
  assert.deepEqual(parse({}), {
    ok: false,
    errors: ["파일에 문제 목록(questions)이 없습니다."],
  });
  assert.deepEqual(parse({ questions: [] }), {
    ok: false,
    errors: ["파일에 문제가 하나도 없습니다."],
  });
});

test("보기가 4개가 아니면 몇 번 문항인지 알려준다", () => {
  const result = parse({
    questions: [validQuestion, { ...validQuestion, options: ["a", "b", "c"] }],
  });
  assert.deepEqual(result, {
    ok: false,
    errors: ["2번 문항: 보기가 4개가 아닙니다. (지금 3개)"],
  });
});

test("정답 번호가 1~4 정수가 아니면 받지 않는다", () => {
  for (const correctAnswer of [0, 5, 2.5, "2", null]) {
    const result = parse({ questions: [{ ...validQuestion, correctAnswer }] });
    assert.equal(result.ok, false, `correctAnswer=${correctAnswer}`);
  }
});

test("빈 문제·보기·해설을 찾아낸다", () => {
  const result = parse({
    questions: [
      { ...validQuestion, question: " ", options: ["1", "", "3", "4"] },
      { question: "해설 없음", options: ["1", "2", "3", "4"], correctAnswer: 1 },
    ],
  });
  assert.deepEqual(result, {
    ok: false,
    errors: [
      "1번 문항: 문제 내용(question)이 비어 있습니다.",
      "1번 문항: 2번 보기가 비어 있습니다.",
      "2번 문항: 해설(explanation)이 비어 있습니다.",
    ],
  });
});
