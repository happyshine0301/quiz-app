"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import TeacherDashboard from "@/components/TeacherDashboard";
import { firebaseAuth } from "@/lib/firebase/client";

// 로그인 확인 중 → 로그인 전 → 서버 확인 중 → 허용됨 / 허용 안 됨
type State =
  | { name: "loading" }
  | { name: "signedOut"; message?: string }
  | { name: "checking" }
  | { name: "denied"; email: string }
  | { name: "allowed"; email: string };

// 서버에 로그인 토큰을 보내 허용된 교사인지 확인한다.
async function loadTeacherData(user: User): Promise<State> {
  const token = await user.getIdToken();
  const response = await fetch("/api/teacher/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 403) {
    return { name: "denied", email: user.email ?? "" };
  }
  if (!response.ok) {
    return {
      name: "signedOut",
      message: "로그인을 확인하지 못했습니다. 다시 로그인해 주세요.",
    };
  }
  const data: { email: string } = await response.json();
  return { name: "allowed", email: data.email };
}

export default function TeacherApp() {
  const [state, setState] = useState<State>({ name: "loading" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth(), async (user) => {
      if (!user) {
        setState((prev) =>
          prev.name === "denied" || prev.name === "signedOut"
            ? prev
            : { name: "signedOut" },
        );
        return;
      }
      setState({ name: "checking" });
      try {
        const next = await loadTeacherData(user);
        // 허용되지 않은 계정은 로그인 상태로 남기지 않는다.
        if (next.name !== "allowed") await signOut(firebaseAuth());
        setState(next);
      } catch {
        await signOut(firebaseAuth());
        setState({
          name: "signedOut",
          message: "인터넷 연결을 확인한 뒤 다시 로그인해 주세요.",
        });
      }
    });
  }, []);

  async function handleSignIn() {
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(firebaseAuth(), provider);
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (
        code !== "auth/popup-closed-by-user" &&
        code !== "auth/cancelled-popup-request"
      ) {
        setState({
          name: "signedOut",
          message:
            code === "auth/popup-blocked"
              ? "로그인 창이 막혔습니다. 브라우저에서 팝업을 허용한 뒤 다시 눌러 주세요."
              : code === "auth/unauthorized-domain"
                ? "이 주소에서는 아직 로그인이 허용되지 않았습니다. Firebase 로그인 허용 도메인에 이 주소를 추가해야 합니다."
                : "로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        });
      }
    } finally {
      setBusy(false);
    }
  }

  // 교사용 서버 요청에 붙일 로그인 토큰(만료되면 Firebase가 새로 받아 준다)
  async function getToken(): Promise<string> {
    const user = firebaseAuth().currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");
    return user.getIdToken();
  }

  async function handleSignOut() {
    setBusy(true);
    await signOut(firebaseAuth());
    setState({ name: "signedOut", message: "로그아웃했습니다." });
    setBusy(false);
  }

  const backLink = (
    <Link href="/" className="button">
      첫 화면으로
    </Link>
  );

  if (state.name === "loading" || state.name === "checking") {
    return (
      <section className="card">
        <h1>교사 화면</h1>
        <p>
          {state.name === "loading"
            ? "잠시만 기다려 주세요."
            : "교사 계정인지 확인하고 있습니다."}
        </p>
      </section>
    );
  }

  if (state.name === "signedOut" || state.name === "denied") {
    return (
      <section className="card">
        <h1>교사 화면</h1>
        {state.name === "denied" ? (
          <div className="notice denied" role="alert">
            <p>
              <strong>허용되지 않은 계정입니다.</strong>
            </p>
            <p>
              {state.email
                ? `${state.email} 계정은 교사 화면에 들어갈 수 없습니다. `
                : ""}
              교사로 등록된 Google 계정으로 다시 로그인해 주세요.
            </p>
          </div>
        ) : (
          <>
            <p>교사 화면은 등록된 교사 Google 계정으로 로그인해야 볼 수 있습니다.</p>
            {state.message && (
              <p className="field-error" role="alert">
                {state.message}
              </p>
            )}
          </>
        )}
        <div className="actions">
          {backLink}
          <button
            type="button"
            className="button primary"
            onClick={handleSignIn}
            disabled={busy}
          >
            Google로 로그인
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h1>교사 화면</h1>
      <div className="signed-in">
        <span>{state.email}로 로그인했습니다.</span>
        <button
          type="button"
          className="button"
          onClick={handleSignOut}
          disabled={busy}
        >
          로그아웃
        </button>
      </div>
      <p>문제지를 등록·공개하고 학생들의 풀이 결과를 확인하는 곳입니다.</p>

      <TeacherDashboard getToken={getToken} />

      <div className="actions">{backLink}</div>
    </section>
  );
}
