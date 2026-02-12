# process-gpt-gs

Process-GPT **프론트엔드** 프로젝트입니다. 아래 문서는 전체 Process-GPT 서비스(프론트엔드·백엔드·Supabase 등)를 띄우는 방법을 안내합니다.

> **참고:** 프론트엔드만으로는 동작하지 않습니다.

---

## Docker Compose로 전체 스택 실행

Docker Compose는 이 프로젝트의 **모든 마이크로서비스와 Supabase 서비스들을 한 번에 실행**합니다.

### 1. 사전 준비

- **Docker** & **Docker Compose v2** (`docker compose` 명령 사용)
- 이 저장소 클론

```bash
git clone https://github.com/uengine-oss/process-gpt-gs.git
cd process-gpt-gs
```

### 2. 환경 변수 설정

#### 2-1. Docker Compose용 환경 변수 (`docker-compose/.env`)

`docker-compose` 디렉터리 내 예시 파일을 복사한 후 필요한 값들을 수정합니다.

```bash
cd docker-compose
cp .env.example .env
```

이때, **반드시 실제 값으로 채워야 하는 항목들**은 다음과 같습니다.

- **SMTP 설정**
  - `SMTP_ADMIN_EMAIL`
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_SENDER_NAME`
- **OpenAI 설정**
  - `OPENAI_API_KEY`

그 외에도:

- `API_EXTERNAL_URL`
- `SITE_URL`
- `SUPABASE_PUBLIC_URL`
- `POSTGRES_PASSWORD`, `JWT_SECRET` 등 보안 관련 키

를 실제 환경에 맞게 변경해야 합니다.

#### 2-2. (선택) 기타 로컬 개발용 환경 변수

루트 디렉터리의 `.env.example`는 **로컬 개발(개별 실행)** 시 사용되는 프론트엔드 환경변수 예시입니다.  
자세한 사용 방법은 아래의 **로컬 개발 환경 셋업** 섹션을 참고하세요.

### 3. 서비스 구성 (`docker-compose/docker-compose.yaml`)

다음과 같은 서비스들이 하나의 스택으로 함께 동작합니다.

- **프론트엔드 및 코어 서비스**
  - `frontend`: Vue 3 기반 Process-GPT 프론트엔드 (`ghcr.io/uengine-oss/process-gpt-gs`)
  - `completion`: 핵심 Completion 백엔드 (`ghcr.io/uengine-oss/process-gpt-completion`)
  - `polling-service`: Completion, Memento 등과 연동되는 폴링 서비스
  - `memento`: 문서 기반 RAG 서비스 (`ghcr.io/uengine-oss/process-gpt-memento`)
- **에이전트 / 부가 서비스**
  - `crewai-action`: `ghcr.io/uengine-oss/crewai-action:latest`
  - `crewai-deep-research`: `ghcr.io/uengine-oss/crewai-deep-research:latest`
  - `fcm-service`: `ghcr.io/uengine-oss/fcm-service:latest`
- **Gateway / Proxy**
  - `nginx`: 프론트엔드, completion, memento, (추후 `fcm-service`) 를 라우팅하는 Nginx
- **Supabase 스택**
  - `studio`: Supabase Studio (웹 콘솔)
  - `kong`: API Gateway
  - `auth`: 인증 서비스 (GoTrue)
  - `rest`: PostgREST
  - `realtime`: Realtime 서버
  - `storage` + `imgproxy`: 스토리지 및 이미지 프록시
  - `meta`: Postgres Meta
  - `functions`: Edge Functions 런타임
  - `analytics`: Logflare 기반 분석 서비스
  - `db`: Supabase Postgres 데이터베이스

모든 서비스는 `.env`에서 요구하는 환경 변수(예: `OPENAI_API_KEY`, Supabase 관련 키, SMTP 설정 등)를 올바르게 지정해야 정상적으로 동작합니다.

### 4. Docker Compose 실행 / 중지

#### 전체 스택 시작

```bash
cd docker-compose
docker compose up -d
```

#### 전체 스택 중지

```bash
docker compose down
```

#### 로그 확인 (예시)

```bash
docker compose logs -f frontend
docker compose logs -f completion
docker compose logs -f db
```

### 5. 주요 접근 경로 예시

아래 포트/URL은 `.env` 설정에 따라 달라질 수 있습니다.

- **프론트엔드 / 게이트웨이 (Nginx)**: `http://localhost:8088`
- **Completion 서비스**: `http://localhost:8000`
- **Memento 서비스**: `http://localhost:8005`
- **Supabase Studio**: `http://localhost:54323` (예: 54323)
- **Kong (공개 API)**: `http://localhost:${KONG_HTTP_PORT}` (예: 54321)

> **필수:** 서비스를 띄운 뒤 **반드시** [Supabase 초기 설정 (DB + 스토리지)](#supabase-초기-설정-db--스토리지)을 진행해야 합니다. 이 단계를 건너뛰면 서비스를 정상적으로 이용할 수 없습니다.

---

## 로컬 개발 환경 셋업 (Supabase CLI + 개별 서비스 실행)

Docker Compose 대신, **Supabase CLI로 데이터베이스를 실행**하고 각 마이크로서비스를 **별도의 프로세스로 개별 실행**하며 개발할 수 있습니다.

### 1. 사전 준비

다음 도구들이 필요합니다.

- **Node.js**: 16 이상 (Vue 3 + Vite)
- **Java**: 8 이상 (Spring Boot Gateway 등 Java 기반 서비스에 필요할 수 있음)
- **Maven**: Java 기반 서비스 빌드/실행에 필요
- **Python**: 마이크로서비스별 요구 버전 (각 레포지토리 README 참고)
- **Supabase CLI**: 로컬 Supabase 개발용
- **Docker**: Supabase CLI 내부에서 Docker를 사용

### 2. 프론트엔드 로컬 개발용 환경 변수 (`.env`)

루트 디렉터리의 `.env.example` 파일을 복사해서 프론트엔드 개발용 환경 변수를 설정합니다.

```bash
cp .env.example .env
```

`.env` 파일에는 다음 키들이 포함되며, 로컬 Supabase 또는 다른 백엔드 URL/키로 채워야 합니다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`
- `SECRET_KEY`

### 3. Supabase (로컬) 시작

이 프로젝트의 `supabase/` 디렉터리를 사용하여 Supabase를 띄웁니다.

```bash
supabase start
```

기본적으로 Supabase Studio는 `http://localhost:54323` 에서 접근 가능합니다.  

> **필수:** Supabase를 띄운 뒤 **반드시** [Supabase 초기 설정 (DB + 스토리지)](#supabase-초기-설정-db--스토리지)을 진행해야 합니다. 이 단계를 건너뛰면 서비스를 정상적으로 이용할 수 없습니다.

### 4. 프론트엔드 실행 (Vue 3)

```bash
npm install
npm run dev
```

기본적으로 `http://localhost:5173` (또는 Vite가 출력하는 포트)에서 접근할 수 있습니다.

### 5. Gateway / 기타 백엔드 서비스 실행

이 저장소 혹은 관련 저장소에 포함된 Java 기반 Gateway가 있다면, 예시는 다음과 같습니다.

```bash
cd gateway
mvn spring-boot:run
```

Gateway는 보통 `http://localhost:8088`에서 동작하도록 구성됩니다.

### 6. 기타 마이크로서비스 실행

아래 마이크로서비스들은 **별도의 레포지토리**에 존재하며, 각 레포지토리의 README를 참고하여 로컬에서 실행할 수 있습니다.

#### 필수 서비스

- **[process-gpt-completion](https://github.com/uengine-oss/process-gpt-completion)**  
  - 시스템 동작을 위해 **반드시 실행**되어야 하는 핵심 백엔드 서비스입니다.
  - `polling-service`는 이 레포지토리 내부 디렉터리에 포함되어 있습니다.

#### 함께 사용하는 기타 서비스

다음 서비스들은 Docker Compose 스택에 포함된 구성요소이며, 소스는 별도 레포지토리에 있습니다. 필요 시 로컬 개발용으로 직접 실행할 수 있습니다.

- **[process-gpt-memento](https://github.com/uengine-oss/process-gpt-memento)**: 문서 기반 RAG 서비스
- **[process-gpt-crewai-action](https://github.com/uengine-oss/process-gpt-crewai-action)**: 액션 실행용 CrewAI 기반 에이전트
- **[process-gpt-crewai-deep-research](https://github.com/uengine-oss/process-gpt-crewai-deep-research)**: 심층 리서치용 CrewAI 기반 에이전트

각 서비스는 자신의 레포지토리에서 클론 후, README에 안내된 방식(Python venv, Docker, 기타 CLI 등)에 따라 로컬에서 개별 실행할 수 있습니다.

---

## Supabase 초기 설정 (DB + 스토리지)

> **이 설정을 완료하지 않으면 서비스를 정상적으로 이용할 수 없습니다.** Docker Compose 또는 로컬 Supabase를 띄운 뒤, 반드시 아래 절차를 진행하세요.

**Supabase SQL**로 초기 테이블·함수·트리거를 셋업하고 **Storage 공개 버킷**을 생성합니다. (두 실행 경로 모두 동일한 절차입니다.)

### 초기 SQL 실행

1. Supabase Studio 접속 (예: Docker는 `http://localhost:${STUDIO_PORT}`, 로컬 CLI는 `http://localhost:54323`) → **SQL Editor** 이동.
2. 아래 **순서대로** SQL 실행:
   - **먼저** `docker-compose/volumes/db/init.sql` 전체 내용을 붙여 넣고 실행.
   - **이어서** `docker-compose/volumes/db/vecs.sql` 전체 내용을 붙여 넣고 실행.

### Storage 공개 버킷 생성

SQL 실행이 끝난 뒤, Supabase Studio **Storage** 메뉴에서 아래 **3개의 공개(public) 버킷**을 생성합니다.

| 버킷 이름     | 용도 |
|---------------|------|
| `files`       | 업로드한 파일 저장 |
| `task-image`  | crewai-deep-research 서비스를 통해 생성된 이미지 저장 |
| `chat-images`| 채팅에서 입력한 이미지 저장 |

---

## Supabase 스크립트 관련 참고

### Supabase 초기 스크립트 (Supabase CLI 사용)

Supabase CLI 및 Docker 설치 후, 다음 명령으로 로컬 Supabase 환경을 빠르게 시작할 수 있습니다.

```bash
supabase start
```

자세한 내용은 공식 문서를 참고하세요:  
`https://supabase.com/docs/guides/cli/getting-started`

### (옵션) Supabase 오리지널 Docker 환경 직접 실행

보다 복잡한 방법으로, Supabase 공식 저장소의 Docker 환경을 직접 띄우는 방법입니다.

```sh
# Supabase 공식 코드 받기
git clone --depth 1 https://github.com/supabase/supabase

# docker 폴더로 이동
cd supabase/docker

# 예시 env 복사
cp .env.example .env

# 이미지 풀
docker compose pull

# 서비스 시작 (백그라운드)
docker compose up -d
```

---

## 참고: 단일 Docker 컨테이너 실행 (이전 방식)

과거에는 다음과 같이 단일 컨테이너로 Process-GPT를 실행하는 방식도 사용했습니다.  
지금은 **Docker Compose를 통해 전체 스택을 올리는 것을 권장**합니다.

```bash
# 해당 PW 값은 Supabase ANON_KEY 등을 참고해서 설정합니다.
docker run -p 8080:8080 -e DB_URL=http://localhost:8000 -e DB_PW=<YOUR_ANON_KEY> ghcr.io/uengine-oss/process-gpt-gs:latest
```

환경과 운영 전략에 맞게, **Docker Compose 전체 스택** 또는 **로컬 개발 환경(Supabase CLI + 개별 서비스)** 중 하나를 선택해서 사용하시면 됩니다.
