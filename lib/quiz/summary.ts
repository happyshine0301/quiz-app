// 교사 결과표. 저장소에는 이름별 최신 결과만 남으므로, 받은 결과를 그대로 평균 낸다.

export type ResultRow = {
  studentName: string;
  score: number;
  correctCount: number;
  total: number;
  wrongQuestions: number[];
  /** 제출 시각(ISO 문자열) */
  submittedAt: string;
};

export type ResultTable = {
  rows: ResultRow[];
  /** 소수 첫째 자리까지 반올림, 결과가 없으면 null */
  average: number | null;
};

export function summarizeResults(rows: ResultRow[]): ResultTable {
  const sorted = [...rows].sort((a, b) =>
    a.studentName.localeCompare(b.studentName, "ko"),
  );
  if (sorted.length === 0) return { rows: sorted, average: null };
  const sum = sorted.reduce((total, row) => total + row.score, 0);
  return {
    rows: sorted,
    average: Math.round((sum / sorted.length) * 10) / 10,
  };
}
