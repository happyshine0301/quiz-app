import { verifyIdToken } from "../firebase/token.ts";
import { isAllowedTeacher } from "./allow.ts";

// 교사 기능을 쓰는 서버 코드는 모두 이 함수로 먼저 확인한다.
// 로그인 토큰 확인에는 프로젝트 ID만 필요하다.
export type TeacherCheck =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 403; message: string };

export async function verifyTeacher(request: Request): Promise<TeacherCheck> {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    return { ok: false, status: 401, message: "로그인이 필요합니다." };
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  let claims;
  try {
    if (!projectId) throw new Error("프로젝트 ID가 설정되지 않았습니다.");
    claims = await verifyIdToken(match[1], projectId);
  } catch {
    return {
      ok: false,
      status: 401,
      message: "로그인 정보가 맞지 않거나 시간이 지났습니다. 다시 로그인해 주세요.",
    };
  }

  if (!isAllowedTeacher(claims, process.env.TEACHER_EMAIL)) {
    return { ok: false, status: 403, message: "허용되지 않은 계정입니다." };
  }
  return { ok: true, email: claims.email ?? "" };
}
