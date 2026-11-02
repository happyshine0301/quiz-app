import QuizApp from "@/components/QuizApp";
import { listQuestionPapers } from "@/lib/quiz/papers";

// question-papers 폴더의 문제지를 읽어 화면에 넘긴다.
// 완성본(next build)에서는 만들 때 한 번 읽으므로, 문제지를 바꾸면 다시 만들어야 한다.
export default async function Home() {
  const papers = await listQuestionPapers();
  return <QuizApp papers={papers} />;
}
