#!/bin/sh

# .env 파일의 내용을 환경 변수로 설정
if [ -f /opt/www/.env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' /opt/www/.env | xargs)

  echo "Environment variables:"
  echo "VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
  echo "VITE_SUPABASE_KEY: $VITE_SUPABASE_KEY"
  echo "VITE_UPSTAGE_API_KEY: $VITE_UPSTAGE_API_KEY" # 보안을 위해 일부만 표시
else
  echo "Warning: .env file not found at /opt/www/.env"
fi

# HTML 파일에 환경 변수를 설정하는 스크립트 추가
if [ -f /opt/www/index.html ]; then
  echo "Injecting environment variables into index.html..."
  sed -i '/<head>/a \
  <script>\
  window._env_ = {\
    VITE_SUPABASE_URL: "'$VITE_SUPABASE_URL'",\
    VITE_SUPABASE_KEY: "'$VITE_SUPABASE_KEY'",\
    VITE_KEYCLOAK_URL: "'$VITE_KEYCLOAK_URL'",\
    VITE_KEYCLOAK_REALM: "'$VITE_KEYCLOAK_REALM'",\
    VITE_KEYCLOAK_CLIENT_ID: "'$VITE_KEYCLOAK_CLIENT_ID'",\
    VITE_UPSTAGE_API_KEY: "'$VITE_UPSTAGE_API_KEY'",\
  };\
  </script>' /opt/www/index.html
else
  echo "Warning: index.html file not found at /opt/www/index.html"
fi

# HTTP 서버 실행
exec http-server /opt/www -p 8080 -d false --push-state