import { StoreNotConfiguredError } from "../firebase/admin.ts";

// API 라우트에서 저장소 오류를 쉬운 안내 문장으로 바꿔 돌려준다.
export function storeErrorResponse(error: unknown): Response {
  if (error instanceof StoreNotConfiguredError) {
    return Response.json(
      { message: "서버 저장소 설정이 아직 끝나지 않았습니다. 선생님께 알려주세요." },
      { status: 503 },
    );
  }
  console.error(error);
  return Response.json(
    { message: "저장소에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." },
    { status: 503 },
  );
}
