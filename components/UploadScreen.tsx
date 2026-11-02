"use client";

import { useState } from "react";
import { parseQuizFile } from "@/lib/quiz/validate";
import type { Quiz } from "@/lib/quiz/types";

const MAX_SHOWN_ERRORS = 10;

type Props = {
  onLoaded: (fileName: string, quiz: Quiz) => void;
};

export default function UploadScreen({ onLoaded }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    // 같은 파일을 고친 뒤 다시 골라도 반응하도록 선택을 비운다.
    input.value = "";
    if (!file) return;

    setFileName(file.name);
    let text: string;
    try {
      text = await file.text();
    } catch {
      setErrors(["파일을 열 수 없습니다. 다른 파일을 선택해 주세요."]);
      return;
    }

    const result = parseQuizFile(text);
    if (result.ok) {
      onLoaded(file.name, result.quiz);
    } else {
      setErrors(result.errors);
    }
  }

  const hidden = errors.length - MAX_SHOWN_ERRORS;

  return (
    <section className="card">
      <h1>문제풀이</h1>
      <p>선생님께 받은 문제 파일(.json)을 선택하세요.</p>

      <label className="button primary file-button">
        문제 파일 선택
        <input
          type="file"
          accept=".json,application/json"
          onChange={handleChange}
        />
      </label>

      {errors.length > 0 && (
        <div className="notice error" role="alert">
          <p>
            <strong>{fileName}</strong> 파일을 사용할 수 없습니다. 아래 내용을
            고친 뒤 다시 선택해 주세요.
          </p>
          <ul>
            {errors.slice(0, MAX_SHOWN_ERRORS).map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          {hidden > 0 && <p>그 밖에 고칠 곳이 {hidden}군데 더 있습니다.</p>}
        </div>
      )}

      <details className="format-help">
        <summary>문제 파일은 이렇게 만들어요</summary>
        <ul>
          <li>
            파일 안의 <code>questions</code> 목록에 문항을 넣습니다.
          </li>
          <li>
            문항마다 문제(<code>question</code>), 보기 4개(
            <code>options</code>), 정답 번호 1~4(<code>correctAnswer</code>),
            해설(<code>explanation</code>)이 있어야 합니다.
          </li>
          <li>정답 번호가 1이면 첫 번째 보기가 정답입니다.</li>
        </ul>
        <pre>{`{
  "questions": [
    {
      "question": "문제 내용",
      "options": ["보기1", "보기2", "보기3", "보기4"],
      "correctAnswer": 1,
      "explanation": "해설"
    }
  ]
}`}</pre>
      </details>
    </section>
  );
}
