"use client";

import { useState } from "react";
import PaperListScreen from "@/components/PaperListScreen";
import QuestionScreen from "@/components/QuestionScreen";
import ReadyScreen from "@/components/ReadyScreen";
import ResultScreen from "@/components/ResultScreen";
import type { PaperSummary, PublicQuiz, QuizResult } from "@/lib/quiz/types";

// 화면 흐름: 문제지 목록 → 문항 확인 → 한 문제씩 풀이 → 제출(서버 채점·저장) → 결과
// 풀이 중에는 정답·해설이 없는 문제지만 가지고 있고, 결과는 제출 후 서버에서 받는다.
// 새로고침하면 처음(이름 입력)부터 다시 시작한다.
type Stage =
  | { name: "list" }
  | { name: "loading"; paper: PaperSummary }
  | { name: "ready"; quiz: PublicQuiz }
  | { name: "solving"; quiz: PublicQuiz }
  | { name: "submitting"; quiz: PublicQuiz; answers: number[] }
  | { name: "submitFailed"; quiz: PublicQuiz; answers: number[]; message: string }
  | { name: "result"; quiz: PublicQuiz; result: QuizResult };

type Props = {
  studentName: string;
};

async function readMessage(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { message?: string } | null;
  return data?.message ?? fallback;
}

export default function QuizApp({ studentName }: Props) {
  const [stage, setStage] = useState<Stage>({ name: "list" });
  const [listError, setListError] = useState<string | null>(null);

  async function openPaper(paper: PaperSummary) {
    setListError(null);
    setStage({ name: "loading", paper });
    try {
      const response = await fetch(`/api/papers/${encodeURIComponent(paper.id)}`);
      if (!response.ok) {
        setListError(await readMessage(response, "문제지를 열지 못했습니다."));
        setStage({ name: "list" });
        return;
      }
      const data: { quiz: PublicQuiz } = await response.json();
      setStage({ name: "ready", quiz: data.quiz });
    } catch {
      setListError("인터넷 연결을 확인한 뒤 다시 골라 주세요.");
      setStage({ name: "list" });
    }
  }

  async function submit(quiz: PublicQuiz, answers: number[]) {
    setStage({ name: "submitting", quiz, answers });
    const failed = (message: string) =>
      setStage({ name: "submitFailed", quiz, answers, message });
    try {
      const response = await fetch(
        `/api/papers/${encodeURIComponent(quiz.id)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentName, answers }),
        },
      );
      if (!response.ok) {
        failed(await readMessage(response, "결과를 저장하지 못했습니다."));
        return;
      }
      const data: { result: QuizResult } = await response.json();
      setStage({ name: "result", quiz, result: data.result });
    } catch {
      failed("인터넷 연결이 끊겨 결과를 저장하지 못했습니다.");
    }
  }

  switch (stage.name) {
    case "list":
    case "loading":
      return (
        <PaperListScreen
          studentName={studentName}
          loadingPaperId={stage.name === "loading" ? stage.paper.id : null}
          error={listError}
          onSelect={openPaper}
        />
      );
    case "ready":
      return (
        <ReadyScreen
          title={stage.quiz.title}
          total={stage.quiz.questions.length}
          onStart={() => setStage({ name: "solving", quiz: stage.quiz })}
          onBack={() => setStage({ name: "list" })}
        />
      );
    case "solving":
      return (
        <QuestionScreen
          questions={stage.quiz.questions}
          onSubmit={(answers) => submit(stage.quiz, answers as number[])}
        />
      );
    case "submitting":
      return (
        <section className="card">
          <h1>채점하고 있습니다</h1>
          <p>답안을 채점하고 결과를 저장하는 중입니다. 잠시만 기다려 주세요.</p>
        </section>
      );
    case "submitFailed":
      return (
        <section className="card">
          <h1>결과를 저장하지 못했습니다</h1>
          <div className="notice denied" role="alert">
            <p>{stage.message}</p>
            <p>고른 답은 그대로 남아 있습니다. 아래 버튼을 눌러 다시 제출해 주세요.</p>
          </div>
          <div className="actions">
            <button
              type="button"
              className="button"
              onClick={() => setStage({ name: "list" })}
            >
              문제지 목록으로
            </button>
            <button
              type="button"
              className="button primary"
              onClick={() => submit(stage.quiz, stage.answers)}
            >
              다시 제출하기
            </button>
          </div>
        </section>
      );
    case "result":
      return (
        <ResultScreen
          result={stage.result}
          onRetry={() => setStage({ name: "solving", quiz: stage.quiz })}
          onBack={() => setStage({ name: "list" })}
        />
      );
  }
}
