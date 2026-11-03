import { Timestamp } from "firebase-admin/firestore";
import { db } from "../firebase/admin.ts";
import { resultDocId, wrongQuestionNumbers } from "../quiz/student.ts";
import type { ResultRow } from "../quiz/summary.ts";
import type { QuizResult } from "../quiz/types.ts";

// Firestore "results" 모음. 문제지 + 학생 이름마다 문서 하나(최신 완료 결과)만 둔다.
type ResultDoc = {
  paperId: string;
  studentName: string;
  answers: number[];
  score: number;
  correctCount: number;
  total: number;
  wrongQuestions: number[];
  submittedAt: Timestamp;
};

const results = () => db().collection("results");

export async function saveResult(
  paperId: string,
  studentName: string,
  answers: number[],
  result: QuizResult,
): Promise<void> {
  const data: ResultDoc = {
    paperId,
    studentName,
    answers,
    score: result.score,
    correctCount: result.correctCount,
    total: result.total,
    wrongQuestions: wrongQuestionNumbers(result),
    submittedAt: Timestamp.now(),
  };
  await results().doc(resultDocId(paperId, studentName)).set(data);
}

export async function listResults(paperId: string): Promise<ResultRow[]> {
  const snapshot = await results().where("paperId", "==", paperId).get();
  return snapshot.docs.map((doc) => {
    const data = doc.data() as ResultDoc;
    return {
      studentName: data.studentName,
      score: data.score,
      correctCount: data.correctCount,
      total: data.total,
      wrongQuestions: data.wrongQuestions,
      submittedAt: data.submittedAt.toDate().toISOString(),
    };
  });
}
