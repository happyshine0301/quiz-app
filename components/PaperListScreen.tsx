import type { PaperEntry, Quiz } from "@/lib/quiz/types";

type Props = {
  papers: PaperEntry[];
  onSelect: (quiz: Quiz) => void;
};

export default function PaperListScreen({ papers, onSelect }: Props) {
  return (
    <section className="card">
      <h1>문제풀이</h1>
      {papers.length === 0 ? (
        <p>아직 준비된 문제지가 없습니다. 선생님께 알려주세요.</p>
      ) : (
        <>
          <p>풀고 싶은 문제지를 고르세요.</p>
          <ul className="paper-list">
            {papers.map((paper) =>
              paper.ok ? (
                <li key={paper.fileName}>
                  <button
                    type="button"
                    className="paper"
                    onClick={() => onSelect(paper.quiz)}
                  >
                    <span className="paper-title">{paper.quiz.title}</span>
                    <span className="paper-meta">
                      {paper.quiz.questions.length}문항
                    </span>
                  </button>
                </li>
              ) : (
                <li key={paper.fileName}>
                  <div className="paper broken" aria-disabled="true">
                    <span className="paper-title">{paper.fileName}</span>
                    <span className="paper-meta">
                      이 문제지는 열 수 없어요. 선생님께 알려주세요.
                    </span>
                    <span className="paper-reason">{paper.errors[0]}</span>
                  </div>
                </li>
              ),
            )}
          </ul>
        </>
      )}
    </section>
  );
}
