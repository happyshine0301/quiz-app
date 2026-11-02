// 문제 파일 한 문항의 모양. PRD.md "문제 파일" 참고.
export type Question = {
  question: string;
  /** 보기 4개 */
  options: string[];
  /** 정답 번호 1~4 (1이면 options의 첫 번째 보기) */
  correctAnswer: number;
  explanation: string;
};

export type Quiz = {
  questions: Question[];
};

export type ParseResult =
  | { ok: true; quiz: Quiz }
  | { ok: false; errors: string[] };

export type QuestionResult = Question & {
  /** 이용자가 고른 보기 번호 1~4, 고르지 않았으면 null */
  selected: number | null;
  isCorrect: boolean;
};

export type QuizResult = {
  total: number;
  correctCount: number;
  /** 100점 만점, 소수 첫째 자리까지 반올림 */
  score: number;
  items: QuestionResult[];
};
