# Gateway API 적용 가이드

## 📋 **필수 사전 조건**

1. **Gateway API CRDs 설치** (GKE에서는 자동 지원)

```bash
# Gateway API가 설치되어 있는지 확인
kubectl get crd gateways.gateway.networking.k8s.io
```

2. **ArgoCD 네임스페이스 및 서비스 확인**

```bash
# ArgoCD 네임스페이스 확인
kubectl get namespace argocd

# ArgoCD 서비스 확인
kubectl get service -n argocd argocd-server
```

## 🚀 **Gateway API 리소스 적용**

### 1. Gateway 생성

```bash
kubectl apply -f kubernetes/gateway.yaml
```

### 2. HTTPRoute 적용

```bash
# 메인 도메인 라우팅
kubectl apply -f kubernetes/httproute-main.yaml

# ArgoCD 라우팅 (ArgoCD가 설치되어 있는 경우)
kubectl apply -f kubernetes/httproute-argo.yaml
```

## 🔧 **다른 서비스 추가 방법**

### 예시: Jenkins를 jenkins.process-gpt.io로 연결

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
    name: jenkins-httproute
    namespace: default
spec:
    parentRefs:
        - name: process-gpt-gateway
          namespace: default
    hostnames:
        - 'jenkins.process-gpt.io'
    rules:
        - matches:
              - path:
                    type: PathPrefix
                    value: /
          backendRefs:
              - name: jenkins-service
                namespace: jenkins # Jenkins가 설치된 네임스페이스
                port: 8080
                weight: 100
---
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
    name: allow-gateway-to-jenkins
    namespace: jenkins
spec:
    from:
        - group: gateway.networking.k8s.io
          kind: HTTPRoute
          namespace: default
    to:
        - group: ''
          kind: Service
          name: jenkins-service
```

## 📊 **확인 방법**

```bash
# Gateway 상태 확인
kubectl get gateway

# HTTPRoute 상태 확인
kubectl get httproute

# ReferenceGrant 확인
kubectl get referencegrant -A

# Gateway 세부 정보
kubectl describe gateway process-gpt-gateway

# HTTPRoute 세부 정보
kubectl describe httproute argo-httproute
```

## 🔄 **Ingress에서 Gateway API로 마이그레이션**

1. **기존 Ingress 백업**

```bash
kubectl get ingress process-gpt-ingress -o yaml > ingress-backup.yaml
```

2. **Gateway API 적용 후 테스트**

```bash
# DNS 전파 확인
nslookup argo.process-gpt.io

# 연결 테스트
curl -I https://argo.process-gpt.io
```

3. **문제없이 작동하면 기존 Ingress 삭제** (선택사항)

```bash
kubectl delete ingress process-gpt-ingress
```

## ⚠️ **주의사항**

-   **네임스페이스**: 각 서비스가 실제로 존재하는 네임스페이스로 수정 필요
-   **서비스명**: 실제 서비스명으로 변경 필요
-   **포트**: 각 서비스의 정확한 포트 번호 확인 필요
-   **ReferenceGrant**: 다른 네임스페이스의 서비스에 접근할 때 반드시 필요
