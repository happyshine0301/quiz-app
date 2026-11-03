import { createRemoteJWKSet, jwtVerify } from "jose";
import type { TeacherClaims } from "../teacher/allow.ts";

// Firebase 로그인 토큰(ID 토큰)을 Firebase 문서의 "직접 확인" 방법대로 검사한다.
// firebase-admin/auth는 Vercel 실행 환경에서 불러오지 못해(jwks-rsa → jose ESM 오류) 쓰지 않는다.
const GOOGLE_KEYS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

export async function verifyIdToken(
  token: string,
  projectId: string,
): Promise<TeacherClaims & { sub: string }> {
  const { payload } = await jwtVerify(token, GOOGLE_KEYS, {
    algorithms: ["RS256"],
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.sub !== "string" || payload.sub === "") {
    throw new Error("토큰에 사용자 정보가 없습니다.");
  }
  if (typeof payload.auth_time !== "number" || payload.auth_time > now) {
    throw new Error("로그인 시각이 올바르지 않습니다.");
  }
  return payload as TeacherClaims & { sub: string };
}
