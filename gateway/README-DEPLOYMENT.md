# Gateway 배포 가이드

## 환경별 배포 구성

이 프로젝트는 개발환경(dev)과 프로덕션환경(prod)으로 구분된 배포 워크플로우를 사용합니다.

## 개발환경 (Development)

### 자동 배포 트리거

-   `main` 또는 `develop` 브랜치에 push 시 자동 배포
-   `gateway/` 디렉토리 변경 시에만 트리거

### 사용 파일

-   **Cloud Build**: `cloudbuild-dev.yaml`
-   **GitHub Actions**: `.github/workflows/deploy-dev.yml`

### 배포 특징

-   Docker 이미지: `gcr.io/{PROJECT_ID}/gateway-dev:{COMMIT_SHA}`
-   Kubernetes 리소스: `gateway-dev`
-   레플리카 수: 1개
-   Spring Profile: `dev`
-   테스트 스킵: `true`

## 프로덕션환경 (Production)

### 배포 트리거

1. **Release 발행 시**: GitHub에서 새 릴리스가 발행될 때 자동 배포
2. **수동 배포**: GitHub Actions에서 원하는 태그를 지정하여 수동 실행

### 사용 파일

-   **Cloud Build**: `cloudbuild-prod.yaml`
-   **GitHub Actions**: `.github/workflows/deploy-prod.yml`

### 배포 특징

-   Docker 이미지: `gcr.io/{PROJECT_ID}/gateway:{TAG_NAME}`, `gcr.io/{PROJECT_ID}/gateway:latest`
-   Kubernetes 리소스: `gateway-prod`
-   레플리카 수: 3개
-   Spring Profile: `prod`
-   테스트 실행: `true`
-   리소스 제한: CPU 500m, Memory 1Gi

## 배포 방법

### 1. 개발환경 배포

```bash
# main 또는 develop 브랜치에 푸시하면 자동 배포
git push origin main
```

### 2. 프로덕션환경 배포

#### 방법 1: GitHub Release 생성

1. GitHub에서 새로운 Release 생성
2. 태그 버전 지정 (예: v1.0.0)
3. Release 발행 시 자동으로 프로덕션 배포 시작

#### 방법 2: 수동 배포

1. GitHub Actions 탭으로 이동
2. "Deploy to Production" 워크플로우 선택
3. "Run workflow" 클릭
4. 배포할 태그 입력 후 실행

## 필요한 GitHub Secrets

다음 시크릿을 GitHub 저장소에 설정해야 합니다:

```
GCP_PROJECT_ID: Google Cloud Project ID
GCP_SA_KEY: Google Cloud Service Account Key (JSON)
```

## 환경별 Spring Profile

### 개발환경 (`dev`)

-   디버그 로깅 활성화
-   개발용 서비스 엔드포인트 사용

### 프로덕션환경 (`prod`)

-   최적화된 로깅 설정
-   프로덕션 서비스 엔드포인트 사용
-   향상된 보안 설정

## 주의사항

1. **프로덕션 배포**는 반드시 릴리스 태그를 통해서만 수행하세요.
2. **개발환경**은 모든 푸시에 대해 자동 배포되므로 주의하세요.
3. 기존 `cloudbuild.yaml` 파일은 더 이상 사용되지 않습니다.
