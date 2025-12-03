# 배포 및 설치 가이드

> Oliveyoung Test Standard MCP 배포 및 사용 가이드

---

## 🔧 필수 의존성: Serena MCP 설치

**Test Standard MCP**는 코드 분석을 위해 **Serena MCP**를 사용합니다. 로컬 환경에서 처음 세팅할 때 Serena MCP 설치 여부를 확인해야 합니다.

### Serena MCP 설치 확인

```bash
# Serena MCP 설치 디렉토리 확인
ls -la ~/.serena/

# Serena 설정 파일 확인
cat ~/.serena/serena_config.yml
```

### Serena MCP가 없는 경우 (첫 설치)

#### 1. Serena MCP 저장소 클론

```bash
# 홈 디렉토리로 이동
cd ~

# Serena MCP 클론
git clone https://github.com/oraios/serena.git

# Serena 디렉토리로 이동
cd serena
```

#### 2. Serena MCP 설치

**Python 기반 설치 (권장):**

```bash
# Python 가상환경 생성 (선택)
python3 -m venv venv
source venv/bin/activate

# Serena 설치
pip install -e .

# 또는 requirements가 있다면
pip install -r requirements.txt
```

**또는 다른 설치 방법이 README에 명시되어 있다면 해당 방법을 따르세요.**

#### 3. Claude Desktop에 Serena MCP 등록

`~/Library/Application Support/Claude/claude_desktop_config.json` 파일에 Serena MCP 추가:

```json
{
  "mcpServers": {
    "serena": {
      "command": "python",
      "args": [
        "-m",
        "serena.mcp_server"
      ],
      "env": {
        "SERENA_CONFIG": "~/.serena/serena_config.yml"
      }
    }
  }
}
```

**주의:** 실제 Serena MCP의 실행 방식은 저장소의 README를 참고하세요. 위 설정은 일반적인 예시입니다.

#### 4. Serena 설정 파일 생성

```bash
# Serena 설정 디렉토리 생성
mkdir -p ~/.serena

# 프로젝트 등록 (oliveyoung-discovery)
# serena_config.yml 파일을 생성하거나 Serena CLI 사용
```

#### 5. Serena MCP 버전 확인

```bash
# Serena 버전 확인
serena --version
# 또는
python -m serena --version

# 예상 출력: Serena version: 0.1.4 (또는 최신 버전)
```

**권장 버전:** Serena MCP 0.1.4 이상

### Serena MCP가 이미 있는 경우 (스킵 가능)

이미 Serena MCP가 설치되어 있다면 이 단계를 건너뛰고 다음 단계로 진행하세요.

```bash
# 설치 확인
ls ~/.serena/
# serena_config.yml, language_servers/, logs/ 등이 보이면 이미 설치됨

# Claude Desktop 설정 확인
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | grep -A 5 "serena"
```

### Serena MCP 업데이트

Serena MCP가 이미 설치되어 있지만 버전이 오래된 경우:

```bash
# Serena 저장소로 이동
cd ~/serena  # 또는 설치된 경로

# 최신 버전으로 업데이트
git pull origin main

# 재설치
pip install -e . --upgrade

# Claude Desktop 재시작
```

### Serena MCP 설정 업데이트

기존 Claude Desktop 설정에 Serena MCP가 없는 경우 추가:

```json
{
  "mcpServers": {
    "serena": {
      "command": "python",
      "args": ["-m", "serena.mcp_server"],
      "env": {
        "SERENA_CONFIG": "~/.serena/serena_config.yml"
      }
    },
    "test-standard-mcp": {
      "command": "node",
      "args": ["/Users/yb/test-standard-mcp/index.js"]
    }
  }
}
```

### 설치 검증

```bash
# Claude Desktop 재시작 후 Claude Code에서
사용자: Serena MCP 도구를 사용할 수 있어?

Claude: 네! Serena MCP의 다음 도구들을 사용할 수 있습니다:
- find_symbol
- find_file
- get_symbols_overview
- search_for_pattern
- ...

# Test Standard MCP 도구도 확인
사용자: test-standard-mcp 도구도 사용할 수 있어?

Claude: 네! 다음 도구들을 사용할 수 있습니다:
- generate_unit_test
- generate_integration_test
- validate_test
- analyze_service
```

---

## 📦 NPM 배포

### 1. 사전 준비

#### NPM 계정 생성
```bash
npm adduser
# 또는
npm login
```

#### package.json 확인
```json
{
  "name": "@oliveyoung/test-standard-mcp",
  "version": "1.0.0",
  "description": "...",
  "main": "index.js",
  "bin": {
    "test-standard-mcp": "./index.js"
  }
}
```

### 2. 의존성 설치

```bash
cd ~/test-standard-mcp
npm install
```

MCP SDK가 정상적으로 설치되어야 합니다:
```bash
npm ls @modelcontextprotocol/sdk
```

### 3. 로컬 테스트

#### index.js 실행 권한 부여
```bash
chmod +x index.js
```

#### 로컬에서 직접 실행
```bash
node index.js
```

서버가 시작되면 다음과 같은 메시지가 표시됩니다:
```
Oliveyoung Test Standard MCP Server running on stdio
```

#### Claude Desktop에서 로컬 테스트

`~/Library/Application Support/Claude/claude_desktop_config.json` 파일 수정:

```json
{
  "mcpServers": {
    "test-standard-mcp-local": {
      "command": "node",
      "args": ["/Users/yb/test-standard-mcp/index.js"]
    }
  }
}
```

Claude Desktop 재시작 후, MCP 도구가 사용 가능한지 확인:
```
사용자: test-standard-mcp의 도구 목록을 보여줘

Claude: 다음 도구들이 사용 가능합니다:
- generate_unit_test
- generate_integration_test
- validate_test
- analyze_service
```

### 4. NPM 배포

#### 배포 전 체크리스트
- [ ] package.json 버전 업데이트
- [ ] README.md 완성
- [ ] 로컬 테스트 완료
- [ ] .gitignore 설정
- [ ] LICENSE 파일 존재

#### 배포 명령
```bash
cd ~/test-standard-mcp

# 배포
npm publish --access public
```

**주의:** `@oliveyoung` 스코프를 사용하려면 oliveyoung npm organization이 필요합니다.

개인 계정으로 배포하려면:
```bash
# package.json에서 name 변경
# "@oliveyoung/test-standard-mcp" → "@your-username/test-standard-mcp"

npm publish --access public
```

### 5. 배포 후 설치 테스트

```bash
# 전역 설치
npm install -g @oliveyoung/test-standard-mcp

# 설치 확인
which test-standard-mcp
# /usr/local/bin/test-standard-mcp

# 실행 테스트
test-standard-mcp
# Oliveyoung Test Standard MCP Server running on stdio
```

---

## 🔧 Claude Desktop 설정

### 전역 설치 후 설정

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "test-standard-mcp": {
      "command": "test-standard-mcp"
    }
  }
}
```

### 로컬 경로 설정 (개발 중)

```json
{
  "mcpServers": {
    "test-standard-mcp": {
      "command": "node",
      "args": ["/Users/yb/test-standard-mcp/index.js"]
    }
  }
}
```

### 설정 확인

1. Claude Desktop 완전 종료
2. 설정 파일 저장
3. Claude Desktop 재시작
4. 새 대화 시작
5. MCP 도구 사용 테스트

---

## 🧪 테스트 시나리오

### 시나리오 1: 서비스 분석

```bash
# Claude Code에서
사용자: oliveyoung-discovery 프로젝트의 CommonServiceImpl을 분석해줘

Claude: analyze_service 도구를 사용하겠습니다.

{
  "project_root": "/Users/yb/Documents/dev/oliveyoung-discovery",
  "service_path": "olive-domain/src/main/kotlin/com/oliveyoung/domain/service/common/CommonServiceImpl.kt"
}

[결과]
- 클래스명: CommonServiceImpl
- 메서드 수: 5개
- 의존성 수: 5개
```

### 시나리오 2: 테스트 생성

```bash
사용자: CommonServiceImpl의 테스트 코드를 생성하고 검증해줘

Claude: generate_unit_test 도구를 사용하겠습니다.

[진행 단계]
1. ✅ 서비스 분석 완료 (5개 메서드 발견)
2. ✅ 테스트 코드 생성 (10개 테스트 메서드)
3. ✅ 컴파일 검증 성공 (1회 재시도)
4. ✅ 테스트 실행 성공 (10개 통과)

테스트 파일이 생성되었습니다:
olive-domain/src/test/kotlin/com/oliveyoung/domain/service/common/CommonServiceImplTest.kt
```

### 시나리오 3: 테스트 검증

```bash
사용자: DisplayCornerServiceTest를 검증해줘

Claude: validate_test 도구를 사용하겠습니다.

[진행 단계]
1. ✅ 컴파일 검증 (2회 재시도 후 성공)
   - 타입 불일치 2건 자동 수정
2. ✅ 테스트 실행 (1회 재시도 후 성공)
   - Mock 필드 누락 3건 자동 수정

모든 테스트가 통과했습니다!
```

---

## 🐛 트러블슈팅

### 문제 1: MCP 도구가 보이지 않음

**증상:** Claude Desktop에서 MCP 도구를 사용할 수 없음

**해결 방법:**
1. Claude Desktop 완전 종료 (Cmd+Q)
2. 설정 파일 경로 확인:
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```
3. JSON 문법 오류 확인 (쉼표, 괄호 등)
4. Claude Desktop 재시작

### 문제 2: index.js 실행 권한 없음

**증상:** `Permission denied`

**해결 방법:**
```bash
chmod +x ~/test-standard-mcp/index.js
```

### 문제 3: MCP SDK 설치 오류

**증상:** `Cannot find module '@modelcontextprotocol/sdk'`

**해결 방법:**
```bash
cd ~/test-standard-mcp
npm install @modelcontextprotocol/sdk
```

### 문제 4: Gradle 명령어 실패

**증상:** `JAVA_HOME is not set`

**해결 방법:**
index.js의 Gradle 명령어에서 JAVA_HOME이 하드코딩되어 있습니다:
```javascript
JAVA_HOME=/usr/local/opt/openjdk@11/libexec/openjdk.jdk/Contents/Home
```

사용자 환경에 맞게 수정:
```bash
# JAVA_HOME 확인
echo $JAVA_HOME

# 또는
/usr/libexec/java_home -v 11
```

### 문제 5: 컴파일 에러 자동 수정 안됨

**증상:** 컴파일 에러가 계속 발생

**원인:** 현재 간단한 타입 불일치만 자동 수정 가능

**해결 방법:**
1. 에러 메시지 확인
2. 수동으로 테스트 코드 수정
3. `validate_test` 도구로 재검증

---

## 🔄 버전 업데이트

### 버전 번호 규칙 (Semantic Versioning)

- **MAJOR (1.x.x)**: 하위 호환성이 깨지는 변경
- **MINOR (x.1.x)**: 하위 호환성을 유지하는 기능 추가
- **PATCH (x.x.1)**: 하위 호환성을 유지하는 버그 수정

### 업데이트 프로세스

1. **코드 변경**
   ```bash
   # 기능 추가, 버그 수정 등
   ```

2. **버전 업데이트**
   ```bash
   npm version patch  # 1.0.0 → 1.0.1
   # 또는
   npm version minor  # 1.0.0 → 1.1.0
   # 또는
   npm version major  # 1.0.0 → 2.0.0
   ```

3. **CHANGELOG 작성**
   ```markdown
   ## [1.0.1] - 2025-12-03
   ### Fixed
   - 타입 불일치 자동 수정 로직 개선
   - Mock 필드 누락 감지 정확도 향상
   ```

4. **배포**
   ```bash
   npm publish
   ```

5. **사용자 업데이트 안내**
   ```bash
   npm update -g @oliveyoung/test-standard-mcp
   ```

---

## 📊 사용 통계 (선택)

배포 후 다운로드 수 확인:

```bash
npm info @oliveyoung/test-standard-mcp
```

---

## 🤝 기여자 가이드

### 로컬 개발 환경

1. **저장소 클론**
   ```bash
   git clone https://github.com/oliveyoung/test-standard-mcp.git
   cd test-standard-mcp
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **개발 브랜치 생성**
   ```bash
   git checkout -b feature/new-feature
   ```

4. **로컬 테스트**
   ```bash
   node index.js
   ```

5. **Pull Request 생성**
   - 테스트 완료
   - README 업데이트 (필요시)
   - CHANGELOG 작성

---

## 📝 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

**작성일**: 2025-12-03
**버전**: 1.0.0
**담당자**: Oliveyoung Test Team
