import Link from "next/link";

// 첫 화면: 교사와 학생 중 하나를 고른다.
// 아직 로그인이 없으므로 누구나 두 버튼을 모두 누를 수 있다.
export default function Home() {
  return (
    <section className="card">
      <h1>문제풀이</h1>
      <p>어떻게 시작할지 고르세요.</p>
      <div className="role-list">
        <Link href="/teacher" className="role">
          <span className="paper-title">교사로 시작하기</span>
          <span className="paper-meta">
            문제를 등록하고 학생들의 풀이 결과를 확인합니다.
          </span>
        </Link>
        <Link href="/student" className="role">
          <span className="paper-title">학생으로 시작하기</span>
          <span className="paper-meta">이름을 입력하고 문제를 풉니다.</span>
        </Link>
      </div>
    </section>
  );
}
