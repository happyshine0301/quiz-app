"use client";

import { useState } from "react";
import PaperListScreen from "@/components/PaperListScreen";
import QuestionScreen from "@/components/QuestionScreen";
import ReadyScreen from "@/components/ReadyScreen";
import ResultScreen from "@/components/ResultScreen";
import { gradeQuiz } from "@/lib/quiz/score";
import type { PaperEntry, Quiz, QuizResult } from "@/lib/quiz/types";

// 화면 흐름: 문제지 목록 → 문항 확인 → 한 문제씩 풀이 → 결과
// 새로고침하면 처음(문제지 목록)부터 다시 시작한다.
type Stage =
  | { name: "list" }
  | { name: "ready"; quiz: Quiz }
  | { name: "solving"; quiz: Quiz }
  | { name: "result"; quiz: Quiz; result: QuizResult };

type Props = {
  papers: PaperEntry[];
};

export default function QuizApp({ papers }: Props) {
  const [stage, setStage] = useState<Stage>({ name: "list" });

  switch (stage.name) {
    case "list":
      return (
        <PaperListScreen
          papers={papers}
          onSelect={(quiz) => setStage({ name: "ready", quiz })}
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
          onSubmit={(answers) =>
            setStage({
              name: "result",
              quiz: stage.quiz,
              result: gradeQuiz(stage.quiz, answers),
            })
          }
        />
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
