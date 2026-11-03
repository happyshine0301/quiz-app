// 교사로 허용할지 정하는 규칙. 화면과 무관하게 서버에서 쓴다.
// 허용 이메일은 하나이며, Google이 확인한 이메일만 인정한다.

export type TeacherClaims = {
  email?: string;
  email_verified?: boolean;
  firebase?: { sign_in_provider?: string };
};

export function isAllowedTeacher(
  claims: TeacherClaims,
  allowedEmail: string | undefined,
): boolean {
  const allowed = allowedEmail?.trim().toLowerCase();
  if (!allowed) return false;
  if (claims.firebase?.sign_in_provider !== "google.com") return false;
  if (claims.email_verified !== true) return false;
  return claims.email?.trim().toLowerCase() === allowed;
}
