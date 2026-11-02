import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { listQuestionPapers } from "./papers.ts";

const question = {
  question: "문제",
  options: ["가", "나", "다", "라"],
  correctAnswer: 1,
  explanation: "해설",
};

test("question-papers 폴더의 문제지를 모두 제목과 함께 읽는다", async () => {
  const papers = await listQuestionPapers();
  for (const paper of papers) {
    assert.equal(paper.ok, true, `${paper.fileName}을(를) 열 수 없습니다`);
  }
  const sample = papers.find((p) => p.fileName === "sample-questions.json");
  assert.ok(sample?.ok);
  assert.equal(sample.quiz.title, "중학교 정보과목");
  assert.equal(sample.quiz.questions.length, 10);
});

// 여러 문제지가 있는 경우는 프로젝트 밖 임시 폴더에서만 확인하고 바로 지운다.
test("여러 문제지를 파일 이름 순서로 읽고, 잘못된 파일도 목록에 남긴다", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "question-papers-"));
  try {
    await writeFile(
      path.join(dir, "b.json"),
      JSON.stringify({ title: "두 번째", questions: [question, question] }),
    );
    await writeFile(
      path.join(dir, "a.json"),
      JSON.stringify({ title: "첫 번째", questions: [question] }),
    );
    await writeFile(path.join(dir, "c-broken.json"), "{ 깨진 파일");
    await writeFile(path.join(dir, "memo.txt"), "문제지가 아닌 파일");

    const papers = await listQuestionPapers(dir);
    assert.deepEqual(
      papers.map((p) => [
        p.fileName,
        p.ok ? p.quiz.title : null,
        p.ok ? p.quiz.questions.length : null,
      ]),
      [
        ["a.json", "첫 번째", 1],
        ["b.json", "두 번째", 2],
        ["c-broken.json", null, null],
      ],
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("폴더가 없으면 빈 목록을 돌려준다", async () => {
  const papers = await listQuestionPapers(
    path.join(tmpdir(), "question-papers-does-not-exist"),
  );
  assert.deepEqual(papers, []);
});
