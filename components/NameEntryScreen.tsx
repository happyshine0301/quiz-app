"use client";

import { useState } from "react";

type Props = {
  onEnter: (name: string) => void;
};

export default function NameEntryScreen({ onEnter }: Props) {
  const [name, setName] = useState("");
  const [showError, setShowError] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === "") {
      setShowError(true);
      return;
    }
    onEnter(trimmed);
  }

  return (
    <section className="card">
      <h1>학생으로 시작하기</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="student-name" className="field-label">
          이름
        </label>
        <input
          id="student-name"
          className="text-input"
          type="text"
          autoComplete="name"
          maxLength={20}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setShowError(false);
          }}
          aria-invalid={showError}
          aria-describedby={showError ? "student-name-error" : undefined}
        />
        {showError && (
          <p id="student-name-error" className="field-error" role="alert">
            이름을 입력해 주세요.
          </p>
        )}
        <div className="actions">
          <button type="submit" className="button primary">
            들어가기
          </button>
        </div>
      </form>
    </section>
  );
}
