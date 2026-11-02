"use client";

import { useEffect, useState } from "react";
import type { Question } from "@/lib/quiz/types";

type Props = {
  questions: Question[];
  onSubmit: (answers: (number | null)[]) => void;
};

// 한 화면에 한 문항만 보여준다. 정답·해설은 그리지 않는다.
export default function QuestionScreen({ questions, onSubmit }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    questions.map(() => null),
  );
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [index]);

  const current = questions[index];
  const selected = answers[index];
  const isLast = index === questions.length - 1;
  const total = questions.length;

  function choose(optionNumber: number) {
    setAnswers((prev) =>
      prev.map((value, i) => (i === index ? optionNumber : value)),
    );
  }

  return (
    <section className="card">
      <div className="progress">
        <span>
          {index + 1} / {total}
        </span>
        <div className="progress-bar" aria-hidden="true">
          <div style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
      </div>

      <h2 className="question">
        {index + 1}. {current.question}
      </h2>

      <fieldset className="options" disabled={confirming}>
        <legend className="visually-hidden">보기를 하나 고르세요</legend>
        {current.options.map((option, optionIndex) => {
          const optionNumber = optionIndex + 1;
          return (
            <label
              key={`${index}-${optionNumber}`}
              className={`option${selected === optionNumber ? " selected" : ""}`}
            >
              <input
                type="radio"
                name={`question-${index}`}
                checked={selected === optionNumber}
                onChange={() => choose(optionNumber)}
              />
              <span className="option-number">{optionNumber}</span>
              <span>{option}</span>
            </label>
          );
        })}
      </fieldset>

      {selected === null && (
        <p className="hint">보기를 하나 고르면 다음으로 넘어갈 수 있어요.</p>
      )}

      {confirming ? (
        <div className="notice confirm" role="alertdialog" aria-live="polite">
          <p>
            <strong>채점할까요?</strong> 채점하면 답을 바꿀 수 없습니다.
          </p>
          <div className="actions">
            <button
              type="button"
              className="button"
              onClick={() => setConfirming(false)}
            >
              답 다시 보기
            </button>
            <button
              type="button"
              className="button primary"
              onClick={() => onSubmit(answers)}
            >
              채점하기
            </button>
          </div>
        </div>
      ) : (
        <div className="actions">
          <button
            type="button"
            className="button"
            onClick={() => setIndex(index - 1)}
            disabled={index === 0}
          >
            이전
          </button>
          {isLast ? (
            <button
              type="button"
              className="button primary"
              onClick={() => setConfirming(true)}
              disabled={selected === null}
            >
              채점하기
            </button>
          ) : (
            <button
              type="button"
              className="button primary"
              onClick={() => setIndex(index + 1)}
              disabled={selected === null}
            >
              다음
            </button>
          )}
        </div>
      )}
    </section>
  );
}
