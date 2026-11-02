import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { PaperEntry } from "./types.ts";
import { parseQuizFile } from "./validate.ts";

export const PAPERS_DIR = path.join(process.cwd(), "question-papers");

// 폴더 안의 .json 문제지를 파일 이름 순서로 읽는다.
// 열 수 없는 파일도 목록에 남겨, 화면에서 흐리게 보여줄 수 있게 한다.
// 홈 화면은 만들 때(next build) 한 번 읽어 고정되므로, turbopackIgnore로
// 서버 실행 파일에 프로젝트 전체가 딸려 들어가지 않게 한다.
export async function listQuestionPapers(
  dir: string = PAPERS_DIR,
): Promise<PaperEntry[]> {
  let names: string[];
  try {
    names = await readdir(/*turbopackIgnore: true*/ dir);
  } catch {
    return [];
  }

  const fileNames = names
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .sort((a, b) => a.localeCompare(b));

  return Promise.all(
    fileNames.map(async (fileName): Promise<PaperEntry> => {
      try {
        const text = await readFile(
          /*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ dir, fileName),
          "utf8",
        );
        return { fileName, ...parseQuizFile(text) };
      } catch {
        return {
          fileName,
          ok: false,
          errors: ["파일을 열 수 없습니다."],
        };
      }
    }),
  );
}
