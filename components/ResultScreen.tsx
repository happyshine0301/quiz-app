"use client";

import { useEffect } from "react";
import type { QuizResult } from "@/lib/quiz/types";

type Props = {
  result: QuizResult;
  onRetry: () => void;
  onBack: () => void;
};

export default function ResultScreen({ result, onRetry, onBack }: Props) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="card">
      <h1>채점 결과</h1>
      <div className="score">
        <strong>{result.score}점</strong>
        <span>
          {result.total}문항 중 {result.correctCount}문항 정답
        </span>
      </div>

      <ol className="result-list">
        {result.items.map((item, index) => (
          <li
            key={index}
            className={`result-item ${item.isCorrect ? "correct" : "wrong"}`}
          >
            <div className="result-head">
              <span className="mark" aria-hidden="true">
                {item.isCorrect ? "O" : "X"}
              </span>
              <span className="visually-hidden">
                {item.isCorrect ? "정답" : "오답"}
              </span>
              <h2>
                {index + 1}. {item.question}
              </h2>
            </div>
            <dl>
              <dt>내가 고른 답</dt>
              <dd>
                {item.selected === null
                  ? "고르지 않음"
                  : `${item.selected}. ${item.options[item.selected - 1]}`}
              </dd>
              <dt>정답</dt>
              <dd>
                {item.correctAnswer}. {item.options[item.correctAnswer - 1]}
              </dd>
              <dt>해설</dt>
              <dd>{item.explanation}</dd>
            </dl>
          </li>
        ))}
      </ol>

      <div className="actions">
        <button type="button" className="button" onClick={onBack}>
          다른 문제지 고르기
        </button>
        <button type="button" className="button primary" onClick={onRetry}>
          다시 풀기
        </button>
      </div>
    </section>
  );
}
