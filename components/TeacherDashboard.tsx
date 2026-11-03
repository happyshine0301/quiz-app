"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AiGenerateSection from "@/components/AiGenerateSection";
import type { ResultTable } from "@/lib/quiz/summary";
import type { ParseResult } from "@/lib/quiz/types";
import { parseQuizFile } from "@/lib/quiz/validate";
import type { TeacherPaper } from "@/lib/store/papers";

type Props = {
  getToken: () => Promise<string>;
};

type Upload =
  | { name: "none" }
  | { name: "picked"; fileName: string; text: string; parsed: ParseResult }
  | { name: "saving"; fileName: string; text: string; parsed: ParseResult };

type Notice = { kind: "ok" | "error"; text: string; details?: string[] } | null;

type Papers =
  | { name: "loading" }
  | { name: "failed"; message: string }
  | { name: "loaded"; papers: TeacherPaper[] };

type Results =
  | { name: "none" }
  | { name: "loading"; paperId: string }
  | { name: "failed"; paperId: string; message: string }
  | { name: "loaded"; paperId: string; title: string; table: ResultTable };

const MAX_SHOWN_ERRORS = 5;

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function readMessage(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    message?: string;
    errors?: string[];
  } | null;
  return { text: data?.message ?? fallback, details: data?.errors };
}

// 교사 화면 본문: 문제지 올리기 → 등록 → 공개/비공개 → 학생 결과표
// 모든 요청에 로그인 토큰을 붙이고, 서버가 허용된 교사인지 다시 확인한다.
export default function TeacherDashboard({ getToken }: Props) {
  const [upload, setUpload] = useState<Upload>({ name: "none" });
  const [uploadNotice, setUploadNotice] = useState<Notice>(null);
  const [papers, setPapers] = useState<Papers>({ name: "loading" });
  const [listNotice, setListNotice] = useState<Notice>(null);
  const [changingId, setChangingId] = useState<string | null>(null);
  const [results, setResults] = useState<Results>({ name: "none" });
  const fileInput = useRef<HTMLInputElement>(null);

  const teacherFetch = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const token = await getToken();
      // 파일(FormData)은 브라우저가 형식을 정하므로 JSON일 때만 형식을 붙인다.
      const json = typeof init.body === "string";
      return fetch(url, {
        ...init,
        headers: {
          ...init.headers,
          Authorization: `Bearer ${token}`,
          ...(json ? { "Content-Type": "application/json" } : {}),
        },
      });
    },
    [getToken],
  );

  const loadPapers = useCallback(async () => {
    try {
      const response = await teacherFetch("/api/teacher/papers");
      if (!response.ok) {
        const { text } = await readMessage(response, "문제지 목록을 불러오지 못했습니다.");
        setPapers({ name: "failed", message: text });
        return;
      }
      const data: { papers: TeacherPaper[] } = await response.json();
      setPapers({ name: "loaded", papers: data.papers });
    } catch {
      setPapers({ name: "failed", message: "인터넷 연결을 확인해 주세요." });
    }
  }, [teacherFetch]);

  useEffect(() => {
    // 화면이 열릴 때 등록된 문제지 목록을 한 번 받아온다.
    loadPapers();
  }, [loadPapers]);

  async function handleFile(file: File | undefined) {
    setUploadNotice(null);
    if (!file) {
      setUpload({ name: "none" });
      return;
    }
    const text = await file.text();
    setUpload({ name: "picked", fileName: file.name, text, parsed: parseQuizFile(text) });
  }

  function clearUpload() {
    setUpload({ name: "none" });
    if (fileInput.current) fileInput.current.value = "";
  }

  async function savePaper() {
    if (upload.name !== "picked") return;
    setUpload({ ...upload, name: "saving" });
    try {
      const response = await teacherFetch("/api/teacher/papers", {
        method: "POST",
        body: JSON.stringify({ text: upload.text }),
      });
      if (!response.ok) {
        setUploadNotice({
          kind: "error",
          ...(await readMessage(response, "문제지를 등록하지 못했습니다.")),
        });
        setUpload({ ...upload, name: "picked" });
        return;
      }
      const data: { paper: TeacherPaper } = await response.json();
      setUploadNotice({
        kind: "ok",
        text: `"${data.paper.title}" 문제지를 등록했습니다. 아직 학생에게는 보이지 않습니다. 아래 목록에서 "공개하기"를 눌러 주세요.`,
      });
      clearUpload();
      await loadPapers();
    } catch {
      setUploadNotice({ kind: "error", text: "인터넷 연결을 확인한 뒤 다시 눌러 주세요." });
      setUpload({ ...upload, name: "picked" });
    }
  }

  async function togglePublished(paper: TeacherPaper) {
    setListNotice(null);
    setChangingId(paper.id);
    try {
      const response = await teacherFetch(
        `/api/teacher/papers/${encodeURIComponent(paper.id)}`,
        { method: "PATCH", body: JSON.stringify({ published: !paper.published }) },
      );
      if (!response.ok) {
        setListNotice({
          kind: "error",
          ...(await readMessage(response, "공개 상태를 바꾸지 못했습니다.")),
        });
      } else {
        setListNotice({
          kind: "ok",
          text: paper.published
            ? `"${paper.title}"을(를) 비공개로 바꿨습니다. 이제 학생 목록에 보이지 않습니다.`
            : `"${paper.title}"을(를) 공개했습니다. 이제 학생 목록에 보입니다.`,
        });
        await loadPapers();
      }
    } catch {
      setListNotice({ kind: "error", text: "인터넷 연결을 확인한 뒤 다시 눌러 주세요." });
    } finally {
      setChangingId(null);
    }
  }

  async function showResults(paperId: string) {
    setResults({ name: "loading", paperId });
    try {
      const response = await teacherFetch(
        `/api/teacher/papers/${encodeURIComponent(paperId)}/results`,
      );
      if (!response.ok) {
        const { text } = await readMessage(response, "결과를 불러오지 못했습니다.");
        setResults({ name: "failed", paperId, message: text });
        return;
      }
      const data: ResultTable & { title: string } = await response.json();
      setResults({
        name: "loaded",
        paperId,
        title: data.title,
        table: { rows: data.rows, average: data.average },
      });
    } catch {
      setResults({ name: "failed", paperId, message: "인터넷 연결을 확인해 주세요." });
    }
  }

  const picked = upload.name === "none" ? null : upload;

  return (
    <>
      <AiGenerateSection teacherFetch={teacherFetch} onSaved={loadPapers} />

      <section className="panel">
        <h2>문제지 등록</h2>
        <p className="hint">
          JSON 문제 파일을 고르면 내용을 먼저 보여줍니다. 확인한 뒤 등록하면
          비공개로 저장되고, 공개해야 학생에게 보입니다.
        </p>
        <label htmlFor="paper-file" className="field-label">
          문제 파일(.json)
        </label>
        <input
          id="paper-file"
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="file-input"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        {picked && !picked.parsed.ok && (
          <div className="notice denied" role="alert">
            <p>
              <strong>이 파일은 등록할 수 없습니다.</strong> 아래 내용을 고친 뒤
              다시 골라 주세요.
            </p>
            <ul className="error-list">
              {picked.parsed.errors.slice(0, MAX_SHOWN_ERRORS).map((error) => (
                <li key={error}>{error}</li>
              ))}
              {picked.parsed.errors.length > MAX_SHOWN_ERRORS && (
                <li>그 밖에 {picked.parsed.errors.length - MAX_SHOWN_ERRORS}개가 더 있습니다.</li>
              )}
            </ul>
          </div>
        )}

        {picked && picked.parsed.ok && (
          <div className="preview">
            <dl className="summary">
              <dt>파일</dt>
              <dd>{picked.fileName}</dd>
              <dt>제목</dt>
              <dd>{picked.parsed.quiz.title}</dd>
              <dt>문항 수</dt>
              <dd>총 {picked.parsed.quiz.questions.length}문항</dd>
            </dl>
            <details>
              <summary>문항 내용 확인하기</summary>
              <ol className="preview-list">
                {picked.parsed.quiz.questions.map((q, index) => (
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
            </details>
            <div className="actions">
              <button
                type="button"
                className="button"
                onClick={clearUpload}
                disabled={upload.name === "saving"}
              >
                취소
              </button>
              <button
                type="button"
                className="button primary"
                onClick={savePaper}
                disabled={upload.name === "saving"}
              >
                {upload.name === "saving" ? "등록하는 중..." : "이 내용으로 등록하기"}
              </button>
            </div>
          </div>
        )}

        {uploadNotice && (
          <div
            className={`notice ${uploadNotice.kind === "ok" ? "success" : "denied"}`}
            role={uploadNotice.kind === "ok" ? "status" : "alert"}
          >
            <p>{uploadNotice.text}</p>
            {uploadNotice.details && (
              <ul className="error-list">
                {uploadNotice.details.slice(0, MAX_SHOWN_ERRORS).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>등록된 문제지</h2>
        {papers.name === "loading" && <p>불러오는 중입니다.</p>}
        {papers.name === "failed" && (
          <>
            <p className="field-error" role="alert">
              {papers.message}
            </p>
            <button type="button" className="button" onClick={loadPapers}>
              다시 불러오기
            </button>
          </>
        )}
        {papers.name === "loaded" &&
          (papers.papers.length === 0 ? (
            <p>아직 등록된 문제지가 없습니다.</p>
          ) : (
            <ul className="paper-list">
              {papers.papers.map((paper) => (
                <li key={paper.id}>
                  <div className="paper teacher-paper">
                    <div className="teacher-paper-info">
                      <span className="paper-title">{paper.title}</span>
                      <span className="paper-meta">
                        {paper.questionCount}문항 ·{" "}
                        <span className={paper.published ? "badge public" : "badge"}>
                          {paper.published ? "공개 중" : "비공개"}
                        </span>
                      </span>
                    </div>
                    <div className="teacher-paper-actions">
                      <button
                        type="button"
                        className="button small"
                        onClick={() => togglePublished(paper)}
                        disabled={changingId !== null}
                      >
                        {changingId === paper.id
                          ? "바꾸는 중..."
                          : paper.published
                            ? "비공개로 바꾸기"
                            : "공개하기"}
                      </button>
                      <button
                        type="button"
                        className="button small"
                        onClick={() => showResults(paper.id)}
                      >
                        결과 보기
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ))}
        {listNotice && (
          <div
            className={`notice ${listNotice.kind === "ok" ? "success" : "denied"}`}
            role={listNotice.kind === "ok" ? "status" : "alert"}
          >
            <p>{listNotice.text}</p>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>학생 풀이 결과</h2>
        {results.name === "none" && (
          <p className="hint">
            위 목록에서 "결과 보기"를 누르면 그 문제지의 결과표가 나옵니다. 같은
            이름으로 여러 번 풀었으면 가장 최근 결과만 보입니다.
          </p>
        )}
        {results.name === "loading" && <p>결과를 불러오는 중입니다.</p>}
        {results.name === "failed" && (
          <p className="field-error" role="alert">
            {results.message}
          </p>
        )}
        {results.name === "loaded" && (
          <>
            <p className="results-title">
              <strong>{results.title}</strong>
              <button
                type="button"
                className="button small"
                onClick={() => showResults(results.paperId)}
              >
                새로고침
              </button>
            </p>
            {results.table.rows.length === 0 ? (
              <p>아직 이 문제지를 푼 학생이 없습니다.</p>
            ) : (
              <>
                <p className="average">
                  평균 <strong>{results.table.average}점</strong> (
                  {results.table.rows.length}명)
                </p>
                <div className="table-wrap">
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th scope="col">학생 이름</th>
                        <th scope="col">점수</th>
                        <th scope="col">틀린 문제</th>
                        <th scope="col">제출 시각</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.table.rows.map((row) => (
                        <tr key={row.studentName}>
                          <td>{row.studentName}</td>
                          <td>
                            {row.score}점 ({row.correctCount}/{row.total})
                          </td>
                          <td>
                            {row.wrongQuestions.length === 0
                              ? "없음"
                              : `${row.wrongQuestions.join(", ")}번`}
                          </td>
                          <td>{formatTime(row.submittedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </>
  );
}
