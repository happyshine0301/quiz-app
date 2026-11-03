"use client";

import { useState } from "react";
import NameEntryScreen from "@/components/NameEntryScreen";
import QuizApp from "@/components/QuizApp";

// 학생 화면: 이름 입력 → 문제풀이(공개된 문제지 목록부터).
// 이름은 브라우저에 저장하지 않으므로 새로고침하면 이름부터 다시 입력한다.
export default function StudentApp() {
  const [studentName, setStudentName] = useState<string | null>(null);

  if (studentName === null) {
    return <NameEntryScreen onEnter={setStudentName} />;
  }
  return <QuizApp studentName={studentName} />;
}
