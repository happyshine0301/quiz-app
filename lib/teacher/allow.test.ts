import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedTeacher } from "./allow.ts";

const google = { sign_in_provider: "google.com" };

test("허용 이메일과 같은 Google 계정만 받는다", () => {
  assert.equal(
    isAllowedTeacher(
      { email: "Teacher@Example.com", email_verified: true, firebase: google },
      "teacher@example.com",
    ),
    true,
  );
  assert.equal(
    isAllowedTeacher(
      { email: "other@example.com", email_verified: true, firebase: google },
      "teacher@example.com",
    ),
    false,
  );
});

test("확인되지 않은 이메일이나 Google이 아닌 로그인은 받지 않는다", () => {
  assert.equal(
    isAllowedTeacher(
      { email: "teacher@example.com", email_verified: false, firebase: google },
      "teacher@example.com",
    ),
    false,
  );
  assert.equal(
    isAllowedTeacher(
      {
        email: "teacher@example.com",
        email_verified: true,
        firebase: { sign_in_provider: "password" },
      },
      "teacher@example.com",
    ),
    false,
  );
});

test("허용 이메일이 설정되지 않으면 아무도 받지 않는다", () => {
  assert.equal(
    isAllowedTeacher(
      { email: "teacher@example.com", email_verified: true, firebase: google },
      undefined,
    ),
    false,
  );
  assert.equal(
    isAllowedTeacher({ email: "", email_verified: true, firebase: google }, " "),
    false,
  );
});
