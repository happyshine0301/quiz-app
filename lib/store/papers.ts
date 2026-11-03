import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../firebase/admin.ts";
import { contentHash, titleKey } from "../quiz/fingerprint.ts";
import type { PaperSummary, PublicQuiz, Quiz } from "../quiz/types.ts";

// Firestore "papers" 모음. 문서 하나가 교사가 올린 문제지 하나다.
// 정답·해설이 들어 있으므로 서버 밖으로는 필요한 부분만 내보낸다.
type PaperDoc = Quiz & {
  titleKey: string;
  contentHash: string;
  published: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type TeacherPaper = PaperSummary & {
  published: boolean;
  createdAt: string;
};

const papers = () => db().collection("papers");

function toTeacherPaper(id: string, data: PaperDoc): TeacherPaper {
  return {
    id,
    title: data.title,
    questionCount: data.questions.length,
    published: data.published,
    createdAt: data.createdAt.toDate().toISOString(),
  };
}

export async function listAllPapers(): Promise<TeacherPaper[]> {
  const snapshot = await papers().orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => toTeacherPaper(doc.id, doc.data() as PaperDoc));
}

export type CreatePaperResult =
  | { ok: true; paper: TeacherPaper }
  | { ok: false; duplicateOf: string; reason: "title" | "content" };

// AI 출제 때 겹치지 않는 제목을 만들도록 기존 제목만 넘긴다.
export async function listPaperTitles(): Promise<string[]> {
  const snapshot = await papers().select("title").get();
  return snapshot.docs.map((doc) => String(doc.get("title")));
}

// 제목이나 문항 내용이 이미 등록된 문제지와 같으면 저장하지 않는다(덮어쓰거나 제목을 바꾸지 않음).
// JSON 업로드는 비공개로 저장해 교사가 확인한 뒤 공개하고, AI 출제는 저장과 함께 공개한다.
export async function createPaper(
  quiz: Quiz,
  teacherEmail: string,
  options: { published?: boolean } = {},
): Promise<CreatePaperResult> {
  const key = titleKey(quiz.title);
  const hash = contentHash(quiz);

  return db().runTransaction(async (tx) => {
    const sameTitle = await tx.get(papers().where("titleKey", "==", key).limit(1));
    if (!sameTitle.empty) {
      const doc = sameTitle.docs[0].data() as PaperDoc;
      return { ok: false, duplicateOf: doc.title, reason: "title" } as const;
    }
    const sameContent = await tx.get(papers().where("contentHash", "==", hash).limit(1));
    if (!sameContent.empty) {
      const doc = sameContent.docs[0].data() as PaperDoc;
      return { ok: false, duplicateOf: doc.title, reason: "content" } as const;
    }

    const ref = papers().doc();
    const now = Timestamp.now();
    const data: PaperDoc = {
      title: quiz.title.trim(),
      questions: quiz.questions,
      titleKey: key,
      contentHash: hash,
      published: options.published ?? false,
      createdBy: teacherEmail,
      createdAt: now,
      updatedAt: now,
    };
    tx.create(ref, data);
    return { ok: true, paper: toTeacherPaper(ref.id, data) } as const;
  });
}

// 바꿀 문제지가 없으면 false
export async function setPublished(id: string, published: boolean): Promise<boolean> {
  const ref = papers().doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return false;
  await ref.update({ published, updatedAt: FieldValue.serverTimestamp() });
  return true;
}

// 문제지 원본(정답 포함). 서버 안에서 채점·결과표에만 쓴다.
export async function getPaper(
  id: string,
): Promise<(Quiz & { id: string; published: boolean }) | null> {
  const snapshot = await papers().doc(id).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data() as PaperDoc;
  return { id, title: data.title, questions: data.questions, published: data.published };
}

// 학생 목록: 공개된 문제지의 제목과 문항 수만
export async function listPublishedPapers(): Promise<PaperSummary[]> {
  // 색인을 따로 만들지 않도록 정렬은 받은 뒤에 한다(최근 등록 순).
  const snapshot = await papers().where("published", "==", true).get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, data: doc.data() as PaperDoc }))
    .sort((a, b) => b.data.createdAt.toMillis() - a.data.createdAt.toMillis())
    .map(({ id, data }) => ({
      id,
      title: data.title,
      questionCount: data.questions.length,
    }));
}

// 학생 풀이용: 공개된 문제지에서 정답·해설을 뺀 것. 공개되지 않았으면 null.
export async function getPublicQuiz(id: string): Promise<PublicQuiz | null> {
  const paper = await getPaper(id);
  if (!paper || !paper.published) return null;
  return {
    id,
    title: paper.title,
    questions: paper.questions.map(({ question, options }) => ({ question, options })),
  };
}
