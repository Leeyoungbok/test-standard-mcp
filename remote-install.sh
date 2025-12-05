#!/bin/bash

# Test Standard MCP 원격 설치 스크립트
# Usage: curl -fsSL https://raw.githubusercontent.com/Leeyoungbok/test-standard-mcp/main/remote-install.sh | bash

set -e

echo "🚀 Test Standard MCP 원격 설치를 시작합니다..."
echo ""

# 설치 디렉토리
INSTALL_DIR="$HOME/.test-standard-mcp"
REPO_URL="https://github.com/Leeyoungbok/test-standard-mcp.git"
CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

# Node.js 확인
echo "🔍 Node.js 확인 중..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo "   다음 명령으로 설치하세요: brew install node"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18 이상이 필요합니다. (현재: $(node -v))"
    echo "   업그레이드: brew upgrade node"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# 기존 설치 확인
if [ -d "$INSTALL_DIR" ]; then
    echo "⚠️  기존 설치 발견: $INSTALL_DIR"
    echo "   기존 설치를 삭제하고 재설치합니다..."
    rm -rf "$INSTALL_DIR"
fi

# 저장소 클론
echo "📦 GitHub에서 클론 중..."
git clone "$REPO_URL" "$INSTALL_DIR"

# 설치 디렉토리로 이동
cd "$INSTALL_DIR"

# npm 의존성 설치
echo "📦 npm 의존성 설치 중..."
npm install

# 실행 권한 부여
chmod +x index.js

# MCP 클라이언트 설정
echo "⚙️  MCP 클라이언트 설정 중..."

if [ ! -f "$CONFIG_FILE" ]; then
    echo "⚠️  Claude Desktop 설정 파일을 찾을 수 없습니다."
    echo "   다른 MCP 클라이언트(Amazon Q, VS Code 등)를 사용하는 경우"
    echo "   해당 클라이언트의 설정 파일에 수동으로 추가하세요."
    echo ""
    echo "📝 설치 위치: $INSTALL_DIR"
    echo ""
    echo "수동 설정 방법 (Claude Desktop):"
    echo "1. 설정 파일 생성: $CONFIG_FILE"
    echo "2. 다음 내용 추가:"
    echo ""
    echo '{'
    echo '  "mcpServers": {'
    echo '    "test-standard-mcp": {'
    echo '      "command": "node",'
    echo "      \"args\": [\"$INSTALL_DIR/index.js\"]"
    echo '    }'
    echo '  }'
    echo '}'
    exit 0
fi

# 백업 생성
cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# jq 확인
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq가 설치되어 있지 않습니다."
    echo "   설치: brew install jq"
    echo ""
    echo "📝 수동으로 MCP 클라이언트 설정을 추가해주세요:"
    echo ""
    echo "파일: $CONFIG_FILE (Claude Desktop)"
    echo ""
    echo '"test-standard-mcp": {'
    echo '  "command": "node",'
    echo "  \"args\": [\"$INSTALL_DIR/index.js\"]"
    echo '}'
    exit 0
fi

# JSON 업데이트
echo "📝 MCP 클라이언트 설정 업데이트 중..."

# mcpServers 객체가 없으면 생성
if ! jq -e '.mcpServers' "$CONFIG_FILE" > /dev/null 2>&1; then
    jq '.mcpServers = {}' "$CONFIG_FILE" > "$CONFIG_FILE.tmp"
    mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
fi

# test-standard-mcp 추가/업데이트
jq --arg path "$INSTALL_DIR/index.js" \
   '.mcpServers["test-standard-mcp"] = {
      "command": "node",
      "args": [$path]
    }' "$CONFIG_FILE" > "$CONFIG_FILE.tmp"

mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"

echo ""
echo "✅ Test Standard MCP 설치 완료!"
echo ""
echo "📍 설치 위치: $INSTALL_DIR"
echo "📝 설정 파일: $CONFIG_FILE"
echo ""
echo "🔄 다음 단계:"
echo "1. MCP 클라이언트를 재시작하세요:"
echo "   - Claude Desktop: 완전히 종료 (Cmd+Q) 후 재실행"
echo "   - Amazon Q: IDE 재시작"
echo "   - VS Code: Reload Window (Cmd+Shift+P → Reload Window)"
echo ""
echo "2. 새 대화에서 다음과 같이 테스트하세요:"
echo '   사용자: "test-standard-mcp 도구를 사용할 수 있어?"'
echo ""
echo "📚 사용 가이드: https://github.com/Leeyoungbok/test-standard-mcp"
echo ""
echo "⚠️  참고: Serena MCP도 함께 설치되어 있어야 합니다."
echo "   Serena 설치: https://github.com/oraios/serena"
echo ""
