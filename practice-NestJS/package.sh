#!/bin/bash

# 🚨 긴급 보안 문제 해결 스크립트
# malicious 패키지 제거 및 안전한 버전으로 교체

echo "🚨 긴급: 보안 취약점 해결을 시작합니다..."

# 1. 모든 의존성 완전 제거
echo "🧹 위험한 패키지 완전 제거 중..."
rm -rf node_modules
rm -f package-lock.json

# 2. npm 캐시 완전 정리 (오염된 캐시 제거)
echo "🗑️  npm 캐시 완전 정리 중..."
npm cache clean --force
npm cache verify

# 3. 위험한 패키지 명시적 제거
echo "⚠️  위험한 패키지 제거 중..."
npm uninstall eslint-config-prettier eslint-plugin-prettier

# 4. 안전한 버전으로 재설치
echo "🔒 안전한 버전으로 재설치 중..."

# ESLint 및 Prettier 관련 패키지를 안전한 버전으로 설치
npm install --save-dev \
  eslint@^8.42.0 \
  eslint-config-prettier@^8.10.0 \
  eslint-plugin-prettier@^4.2.1 \
  prettier@^3.0.0 \
  @typescript-eslint/eslint-plugin@^6.0.0 \
  @typescript-eslint/parser@^6.0.0

# 5. 나머지 의존성 설치
echo "📦 나머지 의존성 설치 중..."
npm install

# 6. 보안 감사 실행
echo "🔍 보안 감사 실행 중..."
npm audit

# 7. 취약점 자동 수정 시도
echo "🔧 자동 보안 수정 시도 중..."
npm audit fix

# 8. 설치된 패키지 버전 확인
echo "📋 설치된 패키지 버전 확인..."
echo "eslint-config-prettier: $(npm list eslint-config-prettier --depth=0 2>/dev/null | grep eslint-config-prettier || echo 'Not installed')"
echo "eslint-plugin-prettier: $(npm list eslint-plugin-prettier --depth=0 2>/dev/null | grep eslint-plugin-prettier || echo 'Not installed')"

# 9. 최종 보안 검사
echo "🛡️  최종 보안 검사 중..."
if npm audit --audit-level high; then
    echo "✅ 고위험 보안 문제 없음"
else
    echo "⚠️  여전히 보안 문제가 있을 수 있습니다."
    echo "수동으로 'npm audit' 결과를 확인하세요."
fi

# 10. TypeScript 컴파일 확인
echo "🔍 TypeScript 컴파일 확인 중..."
if npx tsc --noEmit; then
    echo "✅ TypeScript 컴파일 성공!"
else
    echo "❌ TypeScript 컴파일 에러"
fi

echo ""
echo "🎉 보안 문제 해결 완료!"
echo ""
echo "⚠️  중요 사항:"
echo "1. 앞으로 패키지 설치 시 항상 'npm audit' 실행"
echo "2. 정기적으로 'npm audit' 및 'npm outdated' 확인"
echo "3. 의심스러운 패키지는 설치 전 검증"
echo ""
echo "📋 권장 보안 명령어:"
echo "- npm audit                    # 보안 취약점 확인"
echo "- npm audit fix               # 자동 보안 수정"
echo "- npm outdated                # 업데이트 가능한 패키지 확인"
echo "- npm ls --audit-level high   # 고위험 패키지만 확인"