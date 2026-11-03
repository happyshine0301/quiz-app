import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkPdfBytes,
  checkTextLength,
  describePdfError,
  MAX_PDF_BYTES,
  MAX_TEXT_CHARS,
  normalizeText,
  readPdfText,
} from "./pdf.ts";

const LINES_PER_PAGE = 60;

// 글자가 들어 있는 간단한 표준 PDF를 만든다(쪽마다 영문 줄 최대 60개, 쪽 안에 들어가는 길이).
function makeTextPdf(lines: string[]): Uint8Array {
  const escape = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`);
  const pages: string[][] = [];
  for (let i = 0; i < Math.max(lines.length, 1); i += LINES_PER_PAGE) {
    pages.push(lines.slice(i, i + LINES_PER_PAGE));
  }
  // 1: 목차, 2: 쪽 목록, 3: 글꼴, 그다음 쪽마다 (쪽, 내용) 2개
  const pageIds = pages.map((_, i) => 4 + i * 2);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  pages.forEach((pageLines, i) => {
    const stream = pageLines.length
      ? `BT /F1 8 Tf 12 TL 30 770 Td ${pageLines.map((l) => `(${escape(l)}) Tj T*`).join(" ")} ET`
      : "";
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 800] /Contents ${pageIds[i] + 1} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`,
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    );
  });
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(out.length);
    out += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

const sentence = "Computers store data as bits that are either zero or one.";

test("빈 파일, 512KiB 초과, PDF가 아닌 파일은 읽기 전에 거부한다", () => {
  assert.equal(checkPdfBytes(new Uint8Array(0))?.code, "empty_file");

  const atLimit = new Uint8Array(MAX_PDF_BYTES);
  atLimit.set(new TextEncoder().encode("%PDF-1.4"));
  assert.equal(checkPdfBytes(atLimit), null);

  const overLimit = new Uint8Array(MAX_PDF_BYTES + 1);
  overLimit.set(new TextEncoder().encode("%PDF-1.4"));
  assert.equal(checkPdfBytes(overLimit)?.code, "too_large");

  assert.equal(checkPdfBytes(new TextEncoder().encode("hello"))?.code, "not_pdf");
});

test("공백을 정리하고, 12,000자 경계와 글자 없는 본문을 구분한다", () => {
  assert.equal(normalizeText("  a \t b\r\n\n\n c  "), "a b\n\nc");
  assert.equal(checkTextLength("가".repeat(MAX_TEXT_CHARS)), null);
  assert.equal(checkTextLength("가".repeat(MAX_TEXT_CHARS + 1))?.code, "too_long");
  assert.equal(checkTextLength("가 ".repeat(50))?.code, "no_text");
});

test("암호 PDF와 손상 PDF 오류를 구분한다", () => {
  assert.equal(describePdfError({ name: "PasswordException" }).code, "encrypted");
  assert.equal(describePdfError({ name: "InvalidPDFException" }).code, "damaged");
  assert.equal(describePdfError(new Error("x")).code, "damaged");
});

test("글자가 있는 표준 PDF의 본문을 읽는다", async () => {
  const result = await readPdfText(makeTextPdf([sentence, sentence, sentence]));
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.match(result.text, /Computers store data/);
    assert.equal(result.pages, 1);
  }
});

test("글자가 없는 PDF는 스캔·사진 PDF로 보고 거부한다", async () => {
  const result = await readPdfText(makeTextPdf([]));
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.failure.code, "no_text");
});

test("본문이 12,000자를 넘으면 자르지 않고 거부한다", async () => {
  // 번호를 붙인 줄 220개(약 13,000자, 4쪽)
  const lines = Array.from({ length: 220 }, (_, i) => `${i + 1}. ${sentence}`);
  const result = await readPdfText(makeTextPdf(lines));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.failure.code, "too_long");
    assert.match(result.failure.message, /12,000자/);
  }
});

test("여러 쪽 PDF에서 12,000자 이하 본문은 그대로 모두 읽는다", async () => {
  const lines = Array.from({ length: 150 }, (_, i) => `${i + 1}. ${sentence}`); // 약 9,000자, 3쪽
  const result = await readPdfText(makeTextPdf(lines));
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.pages, 3);
    assert.match(result.text, /^1\. Computers/);
    assert.match(result.text, /150\. Computers store data as bits that are either zero or one\.$/);
  }
});

test("머리글만 PDF이고 내용이 깨진 파일은 손상으로 거부한다", async () => {
  const result = await readPdfText(new TextEncoder().encode("%PDF-1.4\n이것은 깨진 파일"));
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.failure.code, "damaged");
});
