type Props = {
  fileName: string;
  total: number;
  onStart: () => void;
  onChangeFile: () => void;
};

export default function ReadyScreen({
  fileName,
  total,
  onStart,
  onChangeFile,
}: Props) {
  return (
    <section className="card">
      <h1>문제 파일을 확인했어요</h1>
      <dl className="summary">
        <dt>파일 이름</dt>
        <dd>{fileName}</dd>
        <dt>문항 수</dt>
        <dd>총 {total}문항</dd>
      </dl>
      <p>
        한 문제씩 풀고, 마지막 문제까지 답한 뒤에 한꺼번에 채점합니다. 풀이
        중에는 정답과 해설이 나오지 않습니다.
      </p>
      <div className="actions">
        <button type="button" className="button" onClick={onChangeFile}>
          다른 파일 선택
        </button>
        <button type="button" className="button primary" onClick={onStart}>
          풀이 시작
        </button>
      </div>
    </section>
  );
}
