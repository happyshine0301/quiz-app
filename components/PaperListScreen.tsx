"use client";

import { useEffect, useState } from "react";
import type { PaperSummary } from "@/lib/quiz/types";

type Props = {
  studentName: string;
  /** 문제를 받아오는 중인 문제지 */
  loadingPaperId: string | null;
  error: string | null;
  onSelect: (paper: PaperSummary) => void;
};

type ListState =
  | { name: "loading" }
  | { name: "failed"; message: string }
  | { name: "loaded"; papers: PaperSummary[] };

// 선생님이 공개한 문제지 목록을 서버에서 받아 보여준다.
export default function PaperListScreen({
  studentName,
  loadingPaperId,
  error,
  onSelect,
}: Props) {
  const [list, setList] = useState<ListState>({ name: "loading" });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/papers");
        const data = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) {
          setList({
            name: "failed",
            message: data?.message ?? "문제지 목록을 불러오지 못했습니다.",
          });
          return;
        }
        setList({ name: "loaded", papers: data.papers });
      } catch {
        if (!cancelled) {
          setList({
            name: "failed",
            message: "인터넷 연결을 확인한 뒤 다시 시도해 주세요.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  return (
    <section className="card">
      <h1>문제풀이</h1>
      <p className="greeting">{studentName} 학생, 반가워요.</p>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {list.name === "loading" && <p>문제지 목록을 불러오는 중입니다.</p>}
      {list.name === "failed" && (
        <>
          <p className="field-error" role="alert">
            {list.message}
          </p>
          <div className="actions">
            <button
              type="button"
              className="button"
              onClick={() => {
                setList({ name: "loading" });
                setReloadCount((count) => count + 1);
              }}
            >
              다시 불러오기
            </button>
          </div>
        </>
      )}
      {list.name === "loaded" &&
        (list.papers.length === 0 ? (
          <p>아직 공개된 문제지가 없습니다. 선생님께 알려주세요.</p>
        ) : (
          <>
            <p>풀고 싶은 문제지를 고르세요.</p>
            <ul className="paper-list">
              {list.papers.map((paper) => (
                <li key={paper.id}>
                  <button
                    type="button"
                    className="paper"
                    onClick={() => onSelect(paper)}
                    disabled={loadingPaperId !== null}
                  >
                    <span className="paper-title">{paper.title}</span>
                    <span className="paper-meta">
                      {loadingPaperId === paper.id
                        ? "문제지를 여는 중입니다."
                        : `${paper.questionCount}문항`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ))}
    </section>
  );
}
