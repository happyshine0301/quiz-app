import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// 서버에서만 쓰는 Firebase 연결.
// 서버용 열쇠(서비스 계정)는 코드에 넣지 않고 다음 중 하나로 받는다.
// - 내 컴퓨터: .env.local의 GOOGLE_APPLICATION_CREDENTIALS = 앱 폴더 밖 열쇠 파일 경로
// - 배포 서버: FIREBASE_SERVICE_ACCOUNT_KEY = 열쇠 파일 내용(서비스 설정 화면에 직접 입력)
function adminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (keyJson) {
    return initializeApp({ credential: cert(JSON.parse(keyJson)), projectId });
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({ credential: applicationDefault(), projectId });
  }
  return initializeApp({ projectId });
}

export function hasStoreCredentials(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}

export function db() {
  if (!hasStoreCredentials()) {
    throw new StoreNotConfiguredError();
  }
  return getFirestore(adminApp());
}

export class StoreNotConfiguredError extends Error {
  constructor() {
    super("서버용 Firebase 열쇠가 설정되지 않았습니다.");
  }
}
