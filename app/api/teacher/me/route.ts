import { verifyTeacher } from "@/lib/teacher/verify";

// 로그인한 계정이 허용된 교사인지 확인만 한다.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const check = await verifyTeacher(request);
  if (!check.ok) {
    return Response.json({ message: check.message }, { status: check.status });
  }
  return Response.json({ email: check.email });
}
