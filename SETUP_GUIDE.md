# Test Standard MCP 설치 가이드

이 문서는 Test Standard MCP를 다양한 MCP 클라이언트에서 사용하기 위한 상세 설치 가이드입니다.

## 목차

- [사전 준비](#사전-준비)
- [Git 클론 설치](#git-클론-설치)
- [MCP 클라이언트별 설정](#mcp-클라이언트별-설정)
  - [Claude Desktop](#claude-desktop)
  - [Kiro CLI (AWS)](#kiro-cli-aws)
  - [VS Code](#vs-code)
- [설치 확인](#설치-확인)
- [문제 해결](#문제-해결)

---

## 사전 준비

### 1. Node.js 설치 확인

```bash
node --version
# v18.0.0 이상 필요
```

Node.js가 설치되어 있지 않다면:

```bash
# macOS (Homebrew)
brew install node

# 또는 nvm 사용
nvm install 18
nvm use 18
```

### 2. Serena MCP 설치 (권장)

정확한 코드 분석을 위해 Serena MCP 설치를 권장합니다.

```bash
# Serena MCP 클론
git clone https://github.com/oraios/serena.git
cd serena

# Python 패키지 설치
pip install -e .
```

자세한 내용은 [DEPLOYMENT.md](./DEPLOYMENT.md#필수-의존성-serena-mcp-설치)를 참고하세요.

---

## Git 클론 설치

### 1. 저장소 클론

```bash
# 원하는 디렉토리로 이동
cd ~/Documents/dev/

# 저장소 클론
git clone https://github.com/Leeyoungbok/test-standard-mcp.git
cd test-standard-mcp
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 설치 확인

```bash
# MCP 서버 실행 테스트
node index.js
# Ctrl+C로 종료
```

---

## MCP 클라이언트별 설정

### Claude Desktop

#### 1. 설정 파일 위치

```bash
# macOS
~/Library/Application Support/Claude/claude_desktop_config.json

# Windows
%APPDATA%\Claude\claude_desktop_config.json

# Linux
~/.config/Claude/claude_desktop_config.json
```

#### 2. 설정 파일 편집

```bash
# macOS
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

다음 내용을 추가:

```json
{
  "mcpServers": {
    "test-standard-mcp": {
      "command": "node",
      "args": ["~/path/to/test-standard-mcp/index.js"]
    }
  }
}
```

**주의**: `~/path/to/test-standard-mcp`를 실제 클론한 경로로 변경하세요.
예: `~/Documents/dev/test-standard-mcp/index.js`

#### 3. Claude Desktop 재시작

Claude Desktop을 완전히 종료하고 다시 시작합니다.

#### 4. 확인

Claude Desktop에서 다음과 같이 요청:

```
test-standard-mcp 도구가 사용 가능한지 확인해줘
```

---

### Kiro CLI (AWS)

#### 1. 설정 파일 위치

```bash
~/.kiro/settings/mcp.json
```

#### 2. 설정 파일 편집

```bash
# 파일 열기
open ~/.kiro/settings/mcp.json
# 또는
nano ~/.kiro/settings/mcp.json
```

기존 내용에 `test-standard-mcp` 추가:

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": ["--from", "serena-agent", "serena-mcp-server"],
      "env": {},
      "timeout": 120000,
      "disabled": false,
      "disabledTools": []
    },
    "test-standard-mcp": {
      "command": "node",
      "args": ["~/Documents/dev/test-standard-mcp/index.js"],
      "env": {},
      "timeout": 120000,
      "disabled": false,
      "disabledTools": []
    }
  }
}
```

**주의**: 
- `~/Documents/dev/test-standard-mcp`를 실제 클론한 경로로 변경하세요
- 기존 `mcpServers` 내용을 유지하면서 추가하세요

#### 3. Kiro CLI 재시작

```bash
# 현재 세션 종료
/quit

# Kiro CLI 재시작
kiro-cli chat
```

#### 4. 확인

Kiro CLI에서 다음과 같이 요청:

```
test-standard-mcp 도구를 사용해서 사용 가능한 도구 목록을 보여줘
```

---

### VS Code

#### 1. MCP 확장 설치

VS Code Marketplace에서 "Model Context Protocol" 확장을 설치합니다.

#### 2. 설정 파일 편집

VS Code 설정 (`settings.json`)에 추가:

```json
{
  "mcp.servers": {
    "test-standard-mcp": {
      "command": "node",
      "args": ["~/Documents/dev/test-standard-mcp/index.js"]
    }
  }
}
```

#### 3. VS Code 재시작

VS Code를 재시작하여 MCP 서버를 활성화합니다.

---

## 설치 확인

### 도구 목록 확인

MCP 클라이언트에서 다음과 같이 요청:

```
test-standard-mcp에서 사용 가능한 도구를 알려줘
```

**예상 응답:**

```
다음 도구들을 사용할 수 있습니다:

1. generate_unit_test - 단위 테스트 생성
2. generate_integration_test - 통합 테스트 생성
3. validate_test - 테스트 검증 및 수정
4. analyze_service - 서비스 코드 분석
```

### 간단한 테스트

```
oliveyoung-discovery 프로젝트의 CommonServiceImpl을 분석해줘
```

정상적으로 분석 결과가 나오면 설치가 완료된 것입니다.

---

## 문제 해결

### 1. "command not found: node"

**원인**: Node.js가 설치되지 않았거나 PATH에 없음

**해결**:
```bash
# Node.js 설치 확인
which node

# 설치되지 않은 경우
brew install node
```

### 2. "Cannot find module '@modelcontextprotocol/sdk'"

**원인**: npm 의존성이 설치되지 않음

**해결**:
```bash
cd /Users/yb/Documents/dev/test-standard-mcp
npm install
```

### 3. MCP 서버가 연결되지 않음

**원인**: 설정 파일의 경로가 잘못됨

**해결**:
```bash
# 실제 경로 확인
cd ~/Documents/dev/test-standard-mcp
pwd

# 설정 파일에서 ~ 기준 상대 경로 사용
# 예: ~/Documents/dev/test-standard-mcp/index.js
```

### 4. "Permission denied"

**원인**: index.js 실행 권한 없음

**해결**:
```bash
chmod +x ~/Documents/dev/test-standard-mcp/index.js
```

### 5. Kiro CLI에서 도구가 보이지 않음

**원인**: 설정 파일 형식 오류 또는 재시작 필요

**해결**:
```bash
# 설정 파일 검증
cat ~/.kiro/settings/mcp.json | jq .

# JSON 형식 오류가 있다면 수정 후 재시작
/quit
kiro-cli chat
```

### 6. Serena MCP 없이 사용 가능한가?

**답변**: 네, 가능합니다. 하지만 정확도가 낮아질 수 있습니다.

- **Serena MCP 있음**: 100% 정확한 타입 분석
- **Serena MCP 없음**: 정규식 기반 분석 (약 80% 정확도)

Serena MCP 없이 사용하려면 설정에서 제외하고 Test Standard MCP만 추가하세요.

---

## 추가 리소스

- [README.md](./README.md) - 전체 문서
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 배포 가이드
- [TEST_STANDARDS.md](./standards/TEST_STANDARDS.md) - 테스트 표준
- [GitHub Issues](https://github.com/Leeyoungbok/test-standard-mcp/issues) - 문제 보고

---

**마지막 업데이트**: 2025-12-03
