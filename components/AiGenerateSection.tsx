"use client";

import { useRef, useState } from "react";
import type { Quiz } from "@/lib/quiz/types";

// 교안의 교육용 입력 기준. 서버도 같은 기준으로 다시 검사한다.
const MAX_PDF_BYTES = 524_288;

type Props = {
  teacherFetch: (url: string, init?: RequestInit) => Promise<Response>;
  onSaved: () => Promise<void> | void;
};

type Problem = { message: string; details?: string[] };

// PDF 고르기 → 생성 중 → 결과 확인(저장/취소) → 저장 중
type Stage =
  | { name: "pick"; problem?: Problem; saved?: string }
  | { name: "generating" }
  | { name: "preview"; quiz: Quiz; problem?: Problem; blocked?: boolean }
  | { name: "saving"; quiz: Quiz };

async function readProblem(response: Response, fallback: string): Promise<Problem> {
  const data = (await response.json().catch(() => null)) as {
    message?: string;
    details?: string[];
    errors?: string[];
  } | null;
  return { message: data?.message ?? fallback, details: data?.details ?? data?.errors };
}

function ProblemBox({ problem }: { problem: Problem }) {
  return (
    <div className="notice denied" role="alert">
      <p>{problem.message}</p>
      {problem.details && problem.details.length > 0 && (
        <ul className="error-list">
          {problem.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AiGenerateSection({ teacherFetch, onSaved }: Props) {
  const [stage, setStage] = useState<Stage>({ name: "pick" });
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // 버튼을 빠르게 두 번 눌러도 요청이 한 번만 가게 한다.
  const running = useRef(false);

  function pickFile(picked: File | undefined) {
    setFile(picked ?? null);
    if (picked && picked.size > MAX_PDF_BYTES) {
      setStage({
        name: "pick",
        problem: {
          message: `PDF 파일이 512KB를 넘습니다(지금 ${Math.ceil(picked.size / 1024)}KB). 더 작은 파일로 나눠 올려 주세요.`,
        },
      });
      return;
    }
    setStage({ name: "pick" });
  }

  function backToPick(extra: Omit<Extract<Stage, { name: "pick" }>, "name"> = {}) {
    setStage({ name: "pick", ...extra });
  }

  async function generate() {
    if (!file || running.current || file.size > MAX_PDF_BYTES) return;
    running.current = true;
    setStage({ name: "generating" });
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await teacherFetch("/api/teacher/generate", {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        backToPick({ problem: await readProblem(response, "문제를 만들지 못했습니다. 잠시 뒤 다시 눌러 주세요.") });
        return;
      }
      const data: { quiz: Quiz } = await response.json();
      setStage({ name: "preview", quiz: data.quiz });
    } catch {
      backToPick({ problem: { message: "인터넷 연결을 확인한 뒤 다시 눌러 주세요." } });
    } finally {
      running.current = false;
    }
  }

  function cancel() {
    // 생성 결과는 저장하지 않고 버린다.
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
    backToPick();
  }

  async function save(quiz: Quiz) {
    if (running.current) return;
    running.current = true;
    setStage({ name: "saving", quiz });
    try {
      const response = await teacherFetch("/api/teacher/papers", {
        method: "POST",
        body: JSON.stringify({ text: JSON.stringify(quiz), publish: true, requireTen: true }),
      });
      if (!response.ok) {
        // 중복이면 다시 저장해도 같으므로 저장 버튼을 막는다. 제목을 바꾸거나 덮어쓰지 않는다.
        setStage({
          name: "preview",
          quiz,
          problem: await readProblem(response, "저장하지 못했습니다."),
          blocked: response.status === 409 || response.status === 400,
        });
        return;
      }
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      backToPick({ saved: `"${quiz.title}" 문제지를 저장하고 학생에게 공개했습니다.` });
      await onSaved();
    } catch {
      setStage({ name: "preview", quiz, problem: { message: "인터넷 연결을 확인한 뒤 다시 눌러 주세요." } });
    } finally {
      running.current = false;
    }
  }

  const busy = stage.name === "generating" || stage.name === "saving";
  const showPicker = stage.name === "pick" || stage.name === "generating";

  return (
    <section className="panel">
      <h2>PDF로 AI 문제 만들기</h2>
      <p className="hint">
        글자를 선택·복사할 수 있는 PDF 학습자료(512KB 이하, 본문 12,000자 이하)를
        올리면 AI가 제목과 4지선다 10문항을 만듭니다. 스캔·사진 PDF는 지원하지
        않습니다.
      </p>

      {/* 실패 후에도 고른 파일이 그대로 보이도록, 결과 확인 중에는 숨기기만 한다. */}
      <div hidden={!showPicker}>
          <label htmlFor="ai-pdf-file" className="field-label">
            학습자료 PDF
          </label>
          <input
            id="ai-pdf-file"
            ref={fileInput}
            type="file"
            accept=".pdf,application/pdf"
            className="file-input"
            disabled={busy}
            onChange={(event) => pickFile(event.target.files?.[0])}
          />
          {stage.name === "pick" && stage.problem && <ProblemBox problem={stage.problem} />}
          {stage.name === "pick" && stage.saved && (
            <div className="notice success" role="status">
              <p>{stage.saved}</p>
            </div>
          )}
          {stage.name === "generating" && (
            <div className="notice confirm" role="status" aria-live="polite">
              <p>
                <strong>AI가 문제를 만드는 중입니다.</strong> 1~2분쯤 걸릴 수
                있습니다. 이 화면을 닫지 말고 기다려 주세요.
              </p>
            </div>
          )}
          <div className="actions">
            <button
              type="button"
              className="button primary"
              onClick={generate}
              disabled={!file || busy || file.size > MAX_PDF_BYTES}
            >
              {stage.name === "generating" ? "만드는 중..." : "AI로 문제 만들기"}
            </button>
          </div>
      </div>

      {(stage.name === "preview" || stage.name === "saving") && (
        <div className="preview">
          <div className="notice confirm">
            <p>
              <strong>AI가 만든 내용입니다.</strong> 제목, 문제, 정답, 해설이 PDF
              학습자료와 맞는지 직접 확인한 뒤 저장해 주세요. 저장하면 바로 학생
              목록에 공개됩니다.
            </p>
          </div>
          <dl className="summary">
            <dt>제목</dt>
            <dd>{stage.quiz.title}</dd>
            <dt>문항 수</dt>
            <dd>총 {stage.quiz.questions.length}문항</dd>
          </dl>
          <ol className="preview-list">
            {stage.quiz.questions.map((q, index) => (
              <li key={index}>
                <p className="preview-question">{q.question}</p>
                <ol className="preview-options">
                  {q.options.map((option, optionIndex) => (
                    <li
                      key={optionIndex}
                      className={optionIndex + 1 === q.correctAnswer ? "answer" : undefined}
                    >
                      {option}
                      {optionIndex + 1 === q.correctAnswer && " (정답)"}
                    </li>
                  ))}
                </ol>
                <p className="hint">해설: {q.explanation}</p>
              </li>
            ))}
          </ol>
          {stage.name === "preview" && stage.problem && <ProblemBox problem={stage.problem} />}
          <div className="actions">
            <button type="button" className="button" onClick={cancel} disabled={busy}>
              취소
            </button>
            <button
              type="button"
              className="button primary"
              onClick={() => save(stage.quiz)}
              disabled={busy || (stage.name === "preview" && stage.blocked)}
            >
              {stage.name === "saving" ? "저장하는 중..." : "저장하고 공개하기"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
