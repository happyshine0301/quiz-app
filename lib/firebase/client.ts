import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// 브라우저에서 쓰는 Firebase 연결. 설정값은 .env.local의 NEXT_PUBLIC_FIREBASE_* 에서 읽는다.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function firebaseAuth() {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}
