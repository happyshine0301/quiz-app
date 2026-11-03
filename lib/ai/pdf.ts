import { extractText, getDocumentProxy } from "unpdf";

// 교안의 교육용 입력 기준(플랫폼 공통 한도가 아님). 넘으면 AI를 부르지 않고 거부한다. 잘라내지 않는다.
export const MAX_PDF_BYTES = 524_288; // 512KiB
export const MAX_TEXT_CHARS = 12_000;
// 공백을 정리한 본문이 이보다 짧으면 글자가 거의 없는 PDF(스캔·사진)로 본다.
export const MIN_TEXT_CHARS = 100;

export type PdfFailure = {
  code:
    | "empty_file"
    | "too_large"
    | "not_pdf"
    | "encrypted"
    | "damaged"
    | "no_text"
    | "too_long";
  message: string;
};

export type PdfText =
  | { ok: true; text: string; chars: number; pages: number }
  | { ok: false; failure: PdfFailure };

const KIB = 1024;

// 파일 내용을 읽기 전에 할 수 있는 검사: 빈 파일, 크기, PDF 머리글
export function checkPdfBytes(bytes: Uint8Array): PdfFailure | null {
  if (bytes.length === 0) {
    return { code: "empty_file", message: "빈 파일입니다. 내용이 있는 PDF를 골라 주세요." };
  }
  if (bytes.length > MAX_PDF_BYTES) {
    return {
      code: "too_large",
      message: `PDF 파일이 512KB를 넘습니다(지금 ${Math.ceil(bytes.length / KIB)}KB). 더 작은 파일로 나눠 올려 주세요.`,
    };
  }
  // PDF 머리글(%PDF-)은 보통 맨 앞, 늦어도 처음 1KB 안에 있다.
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, KIB));
  if (!head.includes("%PDF-")) {
    return { code: "not_pdf", message: "PDF 파일이 아닙니다. PDF 파일을 골라 주세요." };
  }
  return null;
}

// 공백을 정리한다: 줄 안의 연속 공백은 하나로, 빈 줄이 여러 개면 하나로.
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
}

// 공백 정리 후 글자 수(공백·줄바꿈 포함)로 본문 길이를 판단한다.
export function checkTextLength(text: string): PdfFailure | null {
  const visible = text.replace(/\s/g, "").length;
  if (visible < MIN_TEXT_CHARS) {
    return {
      code: "no_text",
      message:
        "PDF에서 읽을 수 있는 글자가 거의 없습니다. 스캔하거나 사진으로 만든 PDF는 지원하지 않습니다. 글자를 선택·복사할 수 있는 PDF를 골라 주세요.",
    };
  }
  if (text.length > MAX_TEXT_CHARS) {
    return {
      code: "too_long",
      message: `PDF 본문이 ${MAX_TEXT_CHARS.toLocaleString("ko-KR")}자를 넘습니다(지금 ${text.length.toLocaleString("ko-KR")}자). 자료를 나눠서 올려 주세요.`,
    };
  }
  return null;
}

// pdf.js 오류 이름으로 암호·손상 PDF를 구분한다.
export function describePdfError(error: unknown): PdfFailure {
  const name = (error as { name?: string } | null)?.name;
  if (name === "PasswordException") {
    return {
      code: "encrypted",
      message: "암호가 걸린 PDF는 읽을 수 없습니다. 암호를 푼 PDF를 올려 주세요.",
    };
  }
  return {
    code: "damaged",
    message: "PDF 파일이 손상되었거나 읽을 수 없는 형식입니다. 다른 PDF를 골라 주세요.",
  };
}

export async function readPdfText(bytes: Uint8Array): Promise<PdfText> {
  const precheck = checkPdfBytes(bytes);
  if (precheck) return { ok: false, failure: precheck };

  let raw: string;
  let pages: number;
  try {
    // pdf.js가 받은 버퍼를 넘겨받아 쓰므로 복사본을 준다.
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const extracted = await extractText(pdf, { mergePages: true });
    raw = extracted.text;
    pages = extracted.totalPages;
  } catch (error) {
    return { ok: false, failure: describePdfError(error) };
  }

  const text = normalizeText(raw);
  const lengthProblem = checkTextLength(text);
  if (lengthProblem) return { ok: false, failure: lengthProblem };
  return { ok: true, text, chars: text.length, pages };
}
