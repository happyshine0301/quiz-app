// 문제 파일 한 문항의 모양. PRD.md "문제 파일" 참고.
export type Question = {
  question: string;
  /** 보기 4개 */
  options: string[];
  /** 정답 번호 1~4 (1이면 options의 첫 번째 보기) */
  correctAnswer: number;
  explanation: string;
};

// 문제지 한 개. question-papers 폴더의 JSON 파일 하나에 해당한다.
export type Quiz = {
  title: string;
  questions: Question[];
};

export type ParseResult =
  | { ok: true; quiz: Quiz }
  | { ok: false; errors: string[] };

// 문제지 목록의 한 줄. 열 수 없는 파일도 목록에 흐리게 보여주기 위해 함께 담는다.
export type PaperEntry = { fileName: string } & ParseResult;

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
