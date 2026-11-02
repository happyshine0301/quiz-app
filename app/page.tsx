"use client";

import { useState } from "react";
import QuestionScreen from "@/components/QuestionScreen";
import ReadyScreen from "@/components/ReadyScreen";
import ResultScreen from "@/components/ResultScreen";
import UploadScreen from "@/components/UploadScreen";
import { gradeQuiz } from "@/lib/quiz/score";
import type { Quiz, QuizResult } from "@/lib/quiz/types";

// 화면 흐름: 파일 올리기 → 문항 확인 → 한 문제씩 풀이 → 결과
// 새로고침하면 처음(파일 올리기)부터 다시 시작한다.
type Stage =
  | { name: "upload" }
  | { name: "ready"; fileName: string; quiz: Quiz }
  | { name: "solving"; fileName: string; quiz: Quiz }
  | { name: "result"; fileName: string; quiz: Quiz; result: QuizResult };

export default function Home() {
  const [stage, setStage] = useState<Stage>({ name: "upload" });

  switch (stage.name) {
    case "upload":
      return (
        <UploadScreen
          onLoaded={(fileName, quiz) =>
            setStage({ name: "ready", fileName, quiz })
          }
        />
      );
    case "ready":
      return (
        <ReadyScreen
          fileName={stage.fileName}
          total={stage.quiz.questions.length}
          onStart={() => setStage({ ...stage, name: "solving" })}
          onChangeFile={() => setStage({ name: "upload" })}
        />
      );
    case "solving":
      return (
        <QuestionScreen
          questions={stage.quiz.questions}
          onSubmit={(answers) =>
            setStage({
              name: "result",
              fileName: stage.fileName,
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
          onRetry={() =>
            setStage({
              name: "solving",
              fileName: stage.fileName,
              quiz: stage.quiz,
            })
          }
          onNewFile={() => setStage({ name: "upload" })}
        />
      );
  }
}
