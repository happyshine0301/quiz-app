# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

교사가 문제지(JSON 업로드 또는 PDF로 AI 출제)를 등록·공개하고, 학생이 이름으로 들어와 공개된 문제지를 골라 4지선다 문제를 푼 뒤 점수·문항별 정오·해설을 확인하는 교육용 웹앱입니다. 요구사항의 기준 문서는 `PRD.md`입니다. "1일차 세부 결정 사항"과 "2일차 세부 결정 사항" 섹션에 사용자와 합의한 동작이 정리되어 있습니다.

- 초기 버전(커밋 `0c6981e`)은 학생이 JSON 파일을 직접 업로드하는 방식이었습니다. 현재는 폴더의 문제지 목록에서 고르는 방식이며, 학생 업로드 기능은 없습니다. 다시 넣지 않습니다.

- 기술: Next.js + TypeScript, Vercel 배포, PC·휴대폰 모두 지원
- 화면 언어: 한국어

## 현재 상태 (2026-11-03 기준)

- 1일차 앱(문제지 목록 방식)을 만들었고, 내 컴퓨터에서 실행해 확인했습니다.
- 2026-11-03 Vercel CLI로 정식 배포했습니다. 계정 `happyshine0301-6728`(Hobby, 무료), 프로젝트 `quiz-app`, 정식 주소 https://quiz-app-two-zeta-40.vercel.app (로그인 없이 열림). 배포마다 생기는 개별 주소는 Vercel 로그인 보호가 걸려 있어 다른 사람에게 주지 않습니다. 이 폴더는 `.vercel`로 프로젝트에 연결되어 있고, 다시 배포하려면 `vercel deploy --prod`를 씁니다(사용자가 요청할 때만).
- 컴퓨터 이름이 한글(`연수실1-11`)이라 Vercel CLI 로그인·인증 갱신이 "ByteString" 오류로 실패합니다. Vercel 명령 앞에 `$env:NODE_OPTIONS = '--require C:\Users\user\.vercel-fix\ascii-hostname.cjs'`를 붙입니다.
- `vercel link`는 `.env.local`(Vercel 토큰)을 만들고 `.gitignore`에 줄을 덧붙입니다. 이 앱은 그 토큰을 쓰지 않으므로 지우고 `.gitignore`는 되돌렸습니다.
- Vercel의 GitHub 연결은 Vercel 계정에 GitHub 로그인 연결이 없어 실패했고, 자동 배포는 연결되어 있지 않습니다.
- Git 저장소가 있습니다(브랜치 `main`). 이 폴더에만 커밋 작성자 이름 `happyshine`이 설정되어 있습니다. 사용자가 요청할 때만 커밋하고 GitHub에 올립니다.
- GitHub 원격 저장소: `origin` = https://github.com/happyshine0301/quiz-app (공개, 계정 `happyshine0301`). 공개 저장소라 문제지의 정답·해설과 커밋 이메일이 누구에게나 보입니다(사용자가 알고 선택함).
- GitHub CLI(`gh`, `C:\Program Files\GitHub CLI\gh.exe`)가 설치되어 있고 `happyshine0301`로 로그인되어 있습니다. 다시 로그인해야 하면 사용자의 터미널 탭이 "Press Enter" 단계에서 멈출 수 있으므로, Claude의 셸에서 `'' | gh auth login --hostname github.com --git-protocol https --web`을 백그라운드로 실행하고 나온 코드를 사용자에게 알려줍니다.
- GitHub 저장소에 Vercel 자동 배포 연결은 없습니다. 나중에 연결하면 `main`에 올릴 때마다 배포될 수 있으니, 올리기 전에 확인합니다.
- 개발 환경: Windows 11, PowerShell 5.1, Node.js v26.13.0, npm 11.20.0, Git 2.56.0. Next.js 16, React 19, TypeScript 7을 씁니다.
- 2026-11-03 2일차 기능을 정식 주소에 배포했습니다(커밋 전). Vercel 설정(Production)에 Firebase 4개, `TEACHER_EMAIL`, `AZURE_API_STYLE`·`AZURE_ENDPOINT`·`AZURE_DEPLOYMENT`, 비밀값 `AZURE_API_KEY`·`FIREBASE_SERVICE_ACCOUNT_KEY`(Sensitive)가 있습니다. Firebase 로그인 허용 도메인에 정식 주소를 추가했습니다.
- `firebase-admin/auth`는 Vercel에서 불러올 때 `jwks-rsa → jose` ESM 오류로 모든 API를 500으로 만들었습니다. 그래서 로그인 토큰은 `lib/firebase/token.ts`가 `jose`로 직접 확인하고, `firebase-admin/auth`는 쓰지 않습니다.
- 2026-11-03 2일차 기능 내용: 첫 화면에서 교사/학생 선택, 교사 Google 로그인(허용 계정 1개), Firestore 저장, 교사 JSON 업로드·공개/비공개·결과표·평균, 학생 이름 입장·서버 채점·저장, PDF → Azure AI 출제.
- Firebase 프로젝트 `quiz-app-happyshine`(무료 Spark, 계정 happyshine0301@gmail.com), 웹 앱 `quiz-app-web`, Firestore 서울(`asia-northeast3`). `firestore.rules`는 브라우저 직접 접근을 모두 막고, 모든 읽기·쓰기는 `app/api`의 서버가 Admin SDK로 합니다. Firebase 로그인 허용 도메인에 `localhost`를 직접 추가했습니다(Firebase 도구로 만든 프로젝트는 기본값에 없음). Vercel 주소는 아직 없습니다.
- 서버용 열쇠(서비스 계정)는 `C:\Users\user\.secrets\quiz-app-firebase-key.json`에 있고 `.env.local`의 `GOOGLE_APPLICATION_CREDENTIALS`가 가리킵니다. 내용은 읽거나 옮겨 적지 않습니다. 배포 서버에서는 `FIREBASE_SERVICE_ACCOUNT_KEY`(파일 내용)를 사용자가 Vercel 화면에 직접 넣습니다.
- Azure AI는 강사가 준 `openai-v1` 방식(`{AZURE_ENDPOINT}/openai/v1/chat/completions`, 헤더 `api-key`, `model`=배포명)입니다. 2026-11-03 로컬에서 실제 호출 1회 성공. `AZURE_API_KEY`는 사용자가 `.env.local`에 직접 넣었고, 읽거나 출력하지 않습니다.
- Claude 앱은 Windows 보호 상자 안에서 실행되어, Claude 셸에서 `AppData`에 설치한 프로그램(예: `npm i -g`)은 앱 전용 숨은 폴더에 들어갑니다. 다른 프로그램에서도 쓸 도구는 터미널 탭(`run_in_terminal`)에서 설치합니다. Firebase CLI는 그렇게 설치했습니다.
- 개발 서버가 켜진 상태에서 `npm run build`를 하면 개발 화면이 계속 새로고침됩니다. 빌드 전에 개발 서버를 멈추고, 빌드 뒤 다시 켭니다.
- 이 세션을 시작할 때 PATH에 Node가 없으면 명령 앞에 다음을 붙입니다: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`. PowerShell에서는 `npm` 대신 `npm.cmd`를 씁니다.

## 명령

- `npm.cmd run dev`: 개발 서버를 실행합니다(http://localhost:3000). 앱 안 브라우저 확인용 설정은 `.claude/launch.json`의 `quiz-app`에 있습니다.
- `npm.cmd run build`: 완성본을 만듭니다.
- `npm.cmd run typecheck`: `tsc --noEmit`을 실행합니다.
- `npm.cmd run test`: `lib/**/*.test.ts`를 Node 기본 테스트 기능으로 실행합니다. 파일 하나만 실행하려면 `node --test lib/quiz/score.test.ts`를 씁니다.
- 테스트는 Node가 `.ts`를 직접 실행하므로 `lib/` 안에서는 상대 경로에 `.ts` 확장자를 붙여 import합니다(`./types.ts`). `@/` 별칭은 Next.js 쪽(`app/`, `components/`)에서만 씁니다.

## 구조

- `question-papers/*.json`: 예시 문제지 파일입니다. 학생 목록에는 나오지 않고, 교사가 교사 화면에서 올리는 예시로 씁니다. `lib/quiz/papers.ts`(`listQuestionPapers`)는 지금 앱에서 쓰지 않지만 검사와 함께 남겨 두었습니다.
- `lib/quiz/`: 화면과 무관한 문제 데이터 규칙입니다. `validate.ts`의 `parseQuizFile`(JSON 검사, 쉬운 오류 목록), `score.ts`의 `gradeQuiz`(채점), `fingerprint.ts`(중복 판단: 제목이 같거나 문항 내용이 같으면 중복), `student.ts`(이름 정리, 결과 문서 ID, 답안 검사), `summary.ts`(결과표 정렬·평균).
- `lib/ai/`: PDF·AI 출제. `pdf.ts`(크기·형식 검사, `unpdf`로 본문 추출, 글자 수 검사), `azure.ts`(요청 만들기·1회 호출·오류 구분), `generated.ts`(AI 결과가 10문항 형식이고 제목이 중복되지 않는지 검사).
- `lib/firebase/`: `client.ts`(브라우저 로그인), `admin.ts`(서버 Admin SDK, 열쇠가 없으면 저장소 사용 시 `StoreNotConfiguredError`). `lib/store/`: Firestore `papers`·`results` 읽기·쓰기. `lib/teacher/`: `verifyTeacher`(로그인 토큰 + `TEACHER_EMAIL` 확인).
- `app/api/`: 학생용 `papers`(공개 목록), `papers/[id]`(정답·해설을 뺀 문제), `papers/[id]/submit`(서버 채점·저장). 교사용 `teacher/me`, `teacher/papers`(목록·등록), `teacher/papers/[id]`(공개 전환), `teacher/papers/[id]/results`, `teacher/generate`(PDF → AI 결과, 저장 안 함). 교사용은 모두 `verifyTeacher`를 먼저 부릅니다.
- 화면: `app/page.tsx`(교사/학생 선택), `app/student` → `StudentApp` → `NameEntryScreen` → `QuizApp`(list → ready → solving → submitting → result), `app/teacher` → `TeacherApp`(로그인) → `TeacherDashboard`(+ `AiGenerateSection`).
- `QuestionScreen`은 정답·해설을 받지도 그리지도 않습니다. 채점 전 확인은 화면 안 확인 상자로 합니다.

## 구현 범위 구분

- **1일차(완료, 배포됨):** 문제지 목록 표시·선택과 검사, 문항 확인, 한 문제씩 풀이, 전체 완료 후 채점, 결과(점수·정오·해설) 표시, 로컬 실행, Vercel 배포.
- **2일차(로컬에서 만듦, 배포 전):** 교사 Google 로그인, 학생 이름 기반 게스트 입장, Azure AI 문제 생성, 문제 저장·공개와 학생 문제 목록, Firestore 결과 저장, 교사의 학생별 점수·오답·평균 조회.
- 사용자가 요청하지 않은 기능(삭제, 재응시 제한, AI 결과 수정·재생성 등)은 미리 만들지 않습니다.

## 핵심 규칙 (PRD에서 빠뜨리기 쉬운 부분)

- 문제지 파일 형식: 최상위에 `title`(목록에 보이는 제목, `questions` 앞에 씀)과 `questions` 배열이 있습니다. 각 문항은 `question`, `options`(정확히 4개), `correctAnswer`(1~4, 1이면 첫 번째 보기), `explanation`으로 구성됩니다.
- 목록에는 파일 이름이 아니라 각 파일의 `title`을 보여줍니다. 제목을 코드에 고정해서 적지 않습니다.
- 제목이 없거나 잘못된 문항이 하나라도 있는 파일은 열 수 없습니다. 목록에 흐리게 표시하고 누를 수 없게 하며, 첫 번째 원인을 쉬운 말로 보여줍니다.
- 풀이 중에는 정답 여부·점수·해설을 화면에 그리지 않습니다. 2일차부터는 정답·해설이 제출 전에는 학생 브라우저로 아예 가지 않습니다(서버 채점).
- 점수 = 정답 수 ÷ 전체 문항 수 × 100. 소수 첫째 자리까지 반올림하고, 정답 수(예: 2/3)를 함께 표시합니다.
- 2일차 결정: 학생은 교사가 공개한 문제지만 봅니다. 같은 문제지를 같은 이름으로 다시 풀면 최신 결과로 덮어씁니다(재응시 제한 없음). 문제지 삭제는 없고 숨김(비공개)만 있습니다. JSON 업로드는 비공개로 저장, AI 출제는 저장과 함께 공개합니다. 중복이면 저장하지 않고 제목을 바꾸거나 덮어쓰지 않습니다.
- AI 출제 입력 기준(교안의 교육용 기준, 플랫폼 한도 아님): PDF 524,288바이트(512KiB) 이하, 공백 정리 후 본문 12,000자 이하, 글자 100자 미만이면 스캔 PDF로 봄. 넘으면 Azure를 부르지 않고 거부하며 잘라내지 않습니다. Azure는 요청당 1회만 부르고 자동 재시도하지 않습니다. 실제 시험 호출은 강사 허용 범위 안에서만 합니다.
- 문제지 파일의 문제·보기·정답·해설은 사용자 요청 없이 바꾸지 않습니다. 확인을 위해 `question-papers`에 임의의 문제지를 추가하지 않습니다. 여러 문제지 경우는 `papers.test.ts`가 운영체제 임시 폴더에서만 확인합니다.

## 작업 원칙

- `PRD.md`의 요구사항을 기준으로 작업합니다. 정해진 조건을 마음대로 바꾸거나, 요청하지 않은 기능을 추가하지 않습니다.
- 정해지지 않은 내용이나 선택이 필요한 사항은 먼저 질문합니다.
- 기존 파일 내용과 `PRD.md`가 서로 다르면 임의로 정하지 말고 사용자에게 알립니다.
- 앱을 만들기 전에 무엇을 어떤 순서로 만들지 짧게 설명하고 사용자의 확인을 받습니다.
- 수정 후에는 무엇이 바뀌었는지, 사용자가 어떻게 확인하면 되는지 알려줍니다.
- 실제로 실행·확인한 결과와 아직 확인하지 못한 부분을 구분해서 말합니다. 실행하거나 확인하지 않은 일을 완료했다고 말하지 않습니다.
- 앱 화면의 안내 문구와 오류 메시지도 일반인이 이해할 수 있는 쉬운 말로 씁니다.
- 사용자가 직접 브라우저를 조작하지 않아도 되도록 CLI, MCP, 플러그인 등을 최대한 활용합니다. 불가능하면 사용자가 할 방법을 친절히 안내합니다.
- 사용자의 컴퓨터를 직접 사용하지 않습니다. 즉, 사용자의 화면을 마우스·키보드로 대신 조작하지 않습니다. 이 폴더에서 파일을 만들고 명령을 실행하는 작업은 해도 됩니다.
- 완성한 앱을 확인할 때는 Claude 앱 안의 브라우저 창을 써도 됩니다(사용자 허락함).

## 사용자와 소통하는 방법

사용자는 개발을 모르는 일반인입니다.

- 새 세션을 시작하면 먼저 1일차 작업인지 2일차 작업인지 물어봅니다.
- 모든 설명은 쉬운 한국어로 하고, 개발 지식이 필요한 기술용어를 쓰지 않습니다.
- 사용자에게 필요한 것은 "무엇을 하면 되는지"와 "어떤 결과가 나오는지"입니다.
- 화면의 버튼 이름과 파일 이름은 그대로 알려주되, 설명은 쉬운 말로 합니다.
- 설치나 설정이 필요하면 다음 순서로 안내합니다.
  1. 어느 화면을 열어야 하는지
  2. 무엇을 누르거나 입력해야 하는지
  3. 제대로 됐는지 무엇을 보고 확인하는지
- 사용자가 입력할 내용은 그대로 복사해서 쓸 수 있게 제공합니다.
- 여러 가지를 한꺼번에 시키지 않고 하나씩 순서대로 안내합니다.
- 오류가 나면 원인과 해결 방법을 쉬운 말로 설명합니다.

## 배포

- 사용자가 따로 "배포해 달라"고 요청할 때만 배포합니다. 계획을 수락했거나 자동 모드여도, Vercel이 연결되어 있어도 배포 도구를 실행하거나 임시·공개 배포 주소를 만들지 않습니다.
- Vercel CLI로 배포하기로 잠정 결정했습니다(GitHub 저장소 불필요). 실제 배포 단계에서 사용자에게 다시 확인합니다.
- Vercel 계정 로그인은 사용자가 직접 해야 합니다. 비밀번호 등 로그인 정보를 대신 입력하지 않습니다.
