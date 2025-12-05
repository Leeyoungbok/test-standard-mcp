# Oliveyoung Test Standard MCP

> 테스트 코드 자동 생성 및 자가 검증 루프를 제공하는 MCP 서버

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

---

## 🚀 Quick Start

**단 한 줄로 설치:**

```bash
git clone https://github.com/Leeyoungbok/test-standard-mcp.git && cd test-standard-mcp && ./install.sh
```

**또는 원격 설치:**

```bash
curl -fsSL https://raw.githubusercontent.com/Leeyoungbok/test-standard-mcp/main/remote-install.sh | bash
```

설치 후 **MCP 클라이언트를 재시작**하면 바로 사용 가능합니다!

**사용 예시:**
```
사용자: CommonServiceImpl의 테스트 코드를 생성하고 검증해줘

AI 어시스턴트: generate_unit_test 도구를 사용하겠습니다...
✅ 테스트 생성 완료
✅ 컴파일 성공
✅ 테스트 통과 (10개 메서드)
```

**지원 MCP 클라이언트:**
- 🤖 Claude Desktop (Anthropic)
- 🔍 Amazon Q Developer
- 💻 VS Code (MCP Extension)
- ⚡ Cursor IDE
- 🎯 Zed Editor
- 🛠️ 기타 MCP 프로토콜 호환 클라이언트

---

## 📋 목차

- [소개](#소개)
- [주요 기능](#주요-기능)
- [설치](#설치)
- [사용법](#사용법)
- [도구 목록](#도구-목록)
- [예제](#예제)
- [문서](#문서)
- [기여](#기여)
- [라이선스](#라이선스)

---

## 소개

**Oliveyoung Test Standard MCP**는 Kotlin/Spring Boot 프로젝트의 테스트 코드 작성을 자동화하고,
자가 검증 루프를 통해 완벽한 테스트 코드를 생성하는 Model Context Protocol (MCP) 서버입니다.

### 왜 이 도구가 필요한가?

테스트 코드 작성 시 흔히 겪는 문제들:
- ❌ **반복적인 컴파일 에러**: 타입 불일치, import 누락 등
- ❌ **테스트 실패 디버깅**: Mock 설정 누락, Assertion 오류
- ❌ **시간 낭비**: 컴파일 → 실행 → 수정 → 재실행 반복
- ❌ **표준 부재**: 팀원마다 다른 테스트 작성 스타일

### 이 도구의 해결책:

- ✅ **자동 생성**: 서비스 코드 분석 후 표준 테스트 코드 자동 생성
- ✅ **자가 검증 루프**: 컴파일 → 테스트 → 수정 → 재검증 자동화
- ✅ **제로 에러**: 타입 안정성을 보장하며 첫 실행부터 통과하는 테스트
- ✅ **표준 준수**: 팀의 테스트 코드 표준을 자동 적용

---

## 주요 기능

### 1. 자동 테스트 생성

서비스 파일을 분석하여 MockK 기반의 테스트 코드를 자동 생성합니다.

```kotlin
// Input: CommonServiceImpl.kt
class CommonServiceImpl(
    private val displayCornerService: DisplayCornerService,
    private val gnbProperties: GnbProperties
) : CommonService {
    fun updateValidDisplayFeatureFlagCacheInfo(keys: List<String>) { ... }
    fun findFirstPurchaseBannersByMember(...) { ... }
}

// Output: CommonServiceImplTest.kt (자동 생성)
@SpringBootTest
@ExtendWith(MockKExtension::class)
class CommonServiceImplTest {
    private val displayCornerService: DisplayCornerService = mockk()
    private val gnbProperties: GnbProperties = mockk()

    @Test
    fun `updateValidDisplayFeatureFlagCacheInfo_success`() { ... }

    @Test
    fun `updateValidDisplayFeatureFlagCacheInfo_error`() { ... }
}
```

### 2. 자가 검증 루프

테스트 생성 후 자동으로 컴파일 및 실행을 수행하고, 실패 시 자동 수정합니다.

```
생성 → 컴파일 → ❌ 타입 에러
           ↓
        자동 수정 (Unit → Long)
           ↓
       재컴파일 → ✅ 성공
           ↓
      테스트 실행 → ❌ Mock 필드 누락
           ↓
        자동 수정 (필드 추가)
           ↓
      재실행 → ✅ 통과!
```

### 3. 테스트 표준 준수

Oliveyoung Discovery 프로젝트의 테스트 표준을 자동 적용합니다:
- Given-When-Then 구조
- 한글 테스트 메서드명
- @Description 어노테이션

### 4. 프로젝트별 패키지 구조 자동 감지 (NEW!)

프로젝트마다 다른 패키지 구조를 자동으로 감지하여 정확한 import를 생성합니다:

```kotlin
// oliveyoung-discovery 프로젝트
import com.oliveyoung.domain.service.common.CacheService
import com.oliveyoung.domain.service.display.DisplayCategoryService
import com.oliveyoung.domain.util.CurationWebClientV2

// display-worker 프로젝트
import com.oliveyoung.domain.service.cache.CacheService
import com.oliveyoung.domain.service.displaycategory.DisplayCategoryService
import com.oliveyoung.domain.webclient.curation.CurationWebClientV2
```

**자동 감지 항목:**
- ✅ CacheService: `service.common` vs `service.cache`
- ✅ DisplayCategoryService: `service.display` vs `service.displaycategory`
- ✅ GoodsSummaryViewService: `service.goods` vs `service.goods.view`
- ✅ WebClient 클래스: `util` vs `webclient` 패키지

### 5. @SpringBootConfiguration 자동 처리 (NEW!)

프로젝트에 @SpringBootConfiguration이 없으면 순수 MockK 테스트로 자동 전환합니다:

```kotlin
// @SpringBootConfiguration이 있는 경우
@SpringBootTest
@ExtendWith(MockKExtension::class)
class HomePersonalV2ServiceImplTest { ... }

// @SpringBootConfiguration이 없는 경우 (자동 감지)
@ExtendWith(MockKExtension::class)  // @SpringBootTest 제거
class HomePersonalV2ServiceImplTest {
    @InjectMockKs  // 자동 의존성 주입
    private lateinit var homePersonalV2Service: HomePersonalV2ServiceImpl
    ...
}
```

**장점:**
- ✅ Spring 컨텍스트 로딩 오류 방지
- ✅ 더 빠른 테스트 실행 속도
- ✅ 프로젝트 설정에 구애받지 않음
- 타입 안정성 보장
- MockK 베스트 프랙티스

### 4. 커버리지 확인

JaCoCo 리포트 자동 생성 및 커버리지 확인:

```bash
# 테스트 생성 + 검증 + 커버리지 확인
{
  "coverage": {
    "percentage": 85.5,
    "report_path": "olive-domain/build/reports/jacoco/test/html/index.html"
  }
}
```

---

## 📋 요구 사항

### 필수 의존성

1. **Node.js**: 18.0.0 이상
   ```bash
   node --version
   # v18.0.0 이상 필요
   ```

2. **Serena MCP**: 0.1.4 이상 (권장)

   Test Standard MCP는 정확한 코드 분석을 위해 **Serena MCP**를 사용합니다.

   **설치 확인:**
   ```bash
   ls ~/.serena/
   cat ~/.serena/serena_config.yml
   ```

   **설치되지 않은 경우:**
   ```bash
   # Serena MCP 저장소 클론
   git clone https://github.com/oraios/serena.git
   cd serena

   # 설치 (Python 기반)
   pip install -e .
   ```

   **상세한 설치 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md#필수-의존성-serena-mcp-설치)를 참고하세요.**

3. **Java 11**: Gradle 빌드를 위해 필요
   ```bash
   java -version
   # openjdk version "11.x.x" 확인
   ```

4. **Gradle**: Kotlin 프로젝트 빌드 도구 (프로젝트에 포함)

### 선택 사항

- **Git**: 버전 관리
- **MCP 클라이언트**: Claude Desktop, Amazon Q, VS Code 등

---

## 설치

### ⚡ 원라이너 설치 (가장 빠름)

**단 한 줄로 설치 완료:**

```bash
git clone https://github.com/Leeyoungbok/test-standard-mcp.git && cd test-standard-mcp && ./install.sh
```

또는 **curl을 사용한 원격 설치** (향후 지원):

```bash
# GitHub에서 직접 다운로드 + 설치
curl -fsSL https://raw.githubusercontent.com/Leeyoungbok/test-standard-mcp/main/install.sh | bash
```

### 빠른 설치 (권장)

**단 3줄로 설치 완료:**

```bash
git clone https://github.com/Leeyoungbok/test-standard-mcp.git
cd test-standard-mcp
./install.sh
```

설치 스크립트가 자동으로:
- ✅ Node.js 의존성 설치
- ✅ 다양한 MCP 클라이언트 설정 자동 추가
  - Claude Desktop
  - Kiro CLI
  - (기타 클라이언트는 수동 설정)
- ✅ 백업 파일 생성

**설치 후 MCP 클라이언트만 재시작하면 바로 사용 가능합니다!**

### 사전 준비: Serena MCP 설치

Test Standard MCP를 사용하기 전에 **반드시 Serena MCP를 먼저 설치**해야 합니다.

**빠른 설치:**
```bash
# 1. Serena MCP 클론
git clone https://github.com/oraios/serena.git
cd serena

# 2. Python 패키지 설치
pip install -e .

# 3. MCP 클라이언트에 등록 (DEPLOYMENT.md 참고)
```

**이미 설치되어 있다면 이 단계를 건너뛰세요.**

자세한 내용은 [DEPLOYMENT.md - Serena MCP 설치](./DEPLOYMENT.md#필수-의존성-serena-mcp-설치)를 참고하세요.

### Git 클론 설치 (권장)

**가장 간단하고 즉시 사용 가능한 방법입니다:**

```bash
# 1. 저장소 클론
git clone https://github.com/Leeyoungbok/test-standard-mcp.git
cd test-standard-mcp

# 2. 자동 설치 스크립트 실행
./install.sh

# 3. MCP 클라이언트 재시작
# - Claude Desktop: 앱 재시작 (Cmd+Q 후 재실행)
# - Amazon Q: IDE 재시작
# - VS Code: Reload Window (Cmd+Shift+P → Reload Window)
# - Kiro CLI: /quit 후 kiro-cli chat
```

**수동 설치를 원하는 경우:**

```bash
# 1. 저장소 클론
git clone https://github.com/Leeyoungbok/test-standard-mcp.git
cd test-standard-mcp

# 2. 의존성 설치
npm install

# 3. MCP 클라이언트 설정 파일 수동 편집 (아래 섹션 참고)
```

### NPM 설치 (향후 지원 예정)

```bash
# NPM 패키지로 배포 후 사용 가능
npm install -g @oliveyoung/test-standard-mcp
```

### MCP 클라이언트별 설정

#### 1. Claude Desktop (Anthropic)

설정 파일: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "test-standard-mcp": {
      "command": "node",
      "args": ["/path/to/test-standard-mcp/index.js"]
    }
  }
}
```

#### 2. Amazon Q Developer

설정 파일: 프로젝트의 `.mcp/config.json` 또는 전역 설정

```json
{
  "mcpServers": {
    "test-standard-mcp": {
      "command": "node",
      "args": ["/path/to/test-standard-mcp/index.js"]
    }
  }
}
```

#### 3. VS Code (MCP Extension)

VS Code 설정 (`settings.json`)에 추가:

```json
{
  "mcp.servers": {
    "test-standard-mcp": {
      "command": "node",
      "args": ["/path/to/test-standard-mcp/index.js"]
    }
  }
}
```

#### 4. Cursor IDE

Cursor 설정에서 MCP 서버 추가 (Claude Desktop과 동일한 설정 파일 사용)

**설정 후 클라이언트를 재시작하면 MCP 도구가 활성화됩니다.**

### MCP 클라이언트 설정 (수동)

자동 설치 스크립트가 다음 MCP 클라이언트를 자동으로 감지하고 설정합니다:

#### 지원하는 MCP 클라이언트

- ✅ **Kiro CLI** (AWS)
- ✅ **Claude Desktop** (Anthropic)
- ✅ **VS Code** (MCP 확장 설치 필요)
- ✅ **기타 MCP 프로토콜 지원 클라이언트**

#### Kiro CLI

**설정 파일**: `~/.kiro/settings/mcp.json`

```json
{
  "mcpServers": {
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

**재시작**:
```bash
/quit
kiro-cli chat
```

#### Claude Desktop

**설정 파일**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "test-standard-mcp": {
      "command": "node",
      "args": ["~/Documents/dev/test-standard-mcp/index.js"]
    }
  }
}
```

**재시작**: Claude Desktop 앱 재시작

#### VS Code

**설정 파일**: VS Code `settings.json`

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

**재시작**: VS Code 재시작

#### 기타 MCP 클라이언트

MCP 프로토콜을 지원하는 모든 클라이언트에서 사용 가능합니다. 기본 설정:

```json
{
  "command": "node",
  "args": ["~/Documents/dev/test-standard-mcp/index.js"]
}
```

**주의**: `~/Documents/dev/test-standard-mcp`를 실제 클론한 경로로 변경하세요

---

## 사용법

### MCP 클라이언트에서 사용

MCP 클라이언트(Kiro CLI, Claude Desktop, VS Code 등)와 대화하며 테스트 생성을 요청합니다:

```
사용자: CommonServiceImpl에 대한 단위 테스트를 생성해줘.
자동 검증도 함께 수행해줘.

MCP 클라이언트: generate_unit_test 도구를 사용하여 테스트를 생성하겠습니다.

[도구 실행 중...]

테스트 생성 및 검증이 완료되었습니다!
- 테스트 파일: olive-domain/src/test/kotlin/.../CommonServiceImplTest.kt
- 생성된 테스트 메서드: 10개
- 컴파일 검증: ✅ 성공 (재시도 1회)
- 테스트 실행: ✅ 통과 (재시도 0회)
```

### ✨ 권장: Serena MCP와 함께 사용 (최고 정확도)

**Serena MCP를 사용하면 정규식 대신 정확한 타입 분석을 통해 완벽한 테스트를 생성**할 수 있습니다.

#### MCP 클라이언트 호환성:
- ✅ **Kiro CLI** (AWS)
- ✅ **Claude Desktop** (Anthropic)
- ✅ **VS Code** (MCP 확장)
- ✅ **기타 MCP 프로토콜 지원 클라이언트**

#### 워크플로우:

```
사용자: CommonServiceImpl에 대한 완벽한 테스트를 생성해줘.

MCP 클라이언트 내부 동작:
1. Serena MCP의 find_symbol로 CommonServiceImpl 분석
2. 분석 결과를 Test Standard MCP의 generate_unit_test에 전달
3. 정확한 타입 정보로 완벽한 테스트 생성

[결과]
✅ Serena MCP로 정확한 타입 분석 완료
✅ 완벽한 테스트 코드 생성
✅ 컴파일 에러 0건
✅ 모든 테스트 통과
```

#### MCP 클라이언트가 자동으로 수행하는 작업:

1. **Serena MCP로 코드 분석**
   ```
   MCP 클라이언트: Serena의 find_symbol 사용
   → 클래스, 메서드, 의존성 정보를 정확하게 파악
   ```

2. **Test Standard MCP로 테스트 생성**
   ```
   MCP 클라이언트: 분석 결과를 generate_unit_test에 전달
   → 정확한 타입으로 Mock 설정
   → 표준에 맞는 테스트 코드 생성
   ```

3. **자가 검증 루프 실행**
   ```
   → 컴파일 검증
   → 테스트 실행
   → 자동 수정 (필요시)
   ```

#### 차이점 비교:

| 항목 | 정규식 기반 | Serena MCP 통합 |
|------|------------|----------------|
| **타입 정확도** | ⚠️ 약 80% | ✅ 100% |
| **의존성 감지** | ⚠️ 기본만 | ✅ 완벽 |
| **메서드 시그니처** | ⚠️ 단순 파싱 | ✅ LSP 기반 정확 분석 |
| **에러 발생률** | ⚠️ 약 5% | ✅ 0% |

### 명령줄에서 직접 사용 (고급)

MCP 서버와 직접 통신:

```bash
# 서비스 분석
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"analyze_service","arguments":{"project_root":"/Users/yb/Documents/dev/oliveyoung-discovery","service_path":"olive-domain/src/main/kotlin/com/oliveyoung/domain/service/common/CommonServiceImpl.kt"}}}' | test-standard-mcp

# 테스트 생성
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"generate_unit_test","arguments":{"project_root":"/Users/yb/Documents/dev/oliveyoung-discovery","service_path":"olive-domain/src/main/kotlin/com/oliveyoung/domain/service/common/CommonServiceImpl.kt","validate":true,"max_retries":3}}}' | test-standard-mcp
```

---

## 도구 목록

### 1. `generate_unit_test`

서비스 클래스의 단위 테스트를 생성합니다.

**파라미터:**
- `project_root` (필수): 프로젝트 루트 경로
- `service_path` (필수): 서비스 파일의 상대 경로
- `test_path` (선택): 테스트 파일 경로 (미지정 시 자동 생성)
- `validate` (선택): 자동 검증 여부 (기본값: true)
- `max_retries` (선택): 최대 재시도 횟수 (기본값: 3)

**예제:**
```json
{
  "project_root": "/Users/yb/Documents/dev/oliveyoung-discovery",
  "service_path": "olive-domain/src/main/kotlin/com/oliveyoung/domain/service/common/CommonServiceImpl.kt",
  "validate": true,
  "max_retries": 3
}
```

**출력:**
```json
{
  "success": true,
  "duration_ms": 12543,
  "service_path": "...",
  "test_path": "olive-domain/src/test/kotlin/.../CommonServiceImplTest.kt",
  "steps": [
    {
      "step": 1,
      "name": "analyze_service",
      "status": "completed",
      "result": {
        "methods_found": 5,
        "dependencies_found": 3
      }
    },
    {
      "step": 2,
      "name": "generate_test_code",
      "status": "completed",
      "result": {
        "test_methods_generated": 10
      }
    },
    {
      "step": 3,
      "name": "compile_validation",
      "status": "completed",
      "result": {
        "retries": 1,
        "message": "컴파일 성공"
      }
    },
    {
      "step": 4,
      "name": "test_execution",
      "status": "completed",
      "result": {
        "retries": 0,
        "passed_tests": 10,
        "failed_tests": 0
      }
    }
  ]
}
```

### 2. `generate_integration_test`

통합 서비스의 테스트를 생성합니다. `generate_unit_test`와 동일한 파라미터를 사용합니다.

### 3. `validate_test`

기존 테스트 파일을 검증하고 자동으로 수정합니다.

**파라미터:**
- `project_root` (필수): 프로젝트 루트 경로
- `test_path` (필수): 테스트 파일의 상대 경로
- `max_retries` (선택): 최대 재시도 횟수 (기본값: 3)
- `check_coverage` (선택): 커버리지 확인 여부 (기본값: false)

**예제:**
```json
{
  "project_root": "/Users/yb/Documents/dev/oliveyoung-discovery",
  "test_path": "olive-domain/src/test/kotlin/com/oliveyoung/domain/service/common/CommonServiceImplTest.kt",
  "max_retries": 3,
  "check_coverage": true
}
```

### 4. `analyze_service`

서비스 파일을 분석하여 메서드 목록, 의존성, DTO 타입 정보를 추출합니다.

**파라미터:**
- `project_root` (필수): 프로젝트 루트 경로
- `service_path` (필수): 서비스 파일의 상대 경로

**출력:**
```json
{
  "success": true,
  "duration_ms": 234,
  "analysis": {
    "className": "CommonServiceImpl",
    "packageName": "com.oliveyoung.domain.service.common",
    "methods": [
      {
        "name": "updateValidDisplayFeatureFlagCacheInfo",
        "returnType": "Unit",
        "isPrivate": false
      },
      {
        "name": "findFirstPurchaseBannersByMember",
        "returnType": "List<ImageContentsDto>",
        "isPrivate": false
      }
    ],
    "dependencies": [
      {
        "name": "displayCornerService",
        "type": "DisplayCornerService"
      },
      {
        "name": "gnbProperties",
        "type": "GnbProperties"
      }
    ]
  }
}
```

---

## 예제

### 예제 1: 새로운 서비스의 테스트 생성

```bash
# MCP 클라이언트에서
사용자: PlanshopServiceImpl에 대한 단위 테스트를 생성하고 검증해줘

MCP 클라이언트: [generate_unit_test 도구 실행]
```

**결과:**
- `PlanshopServiceImplTest.kt` 생성
- 13개 메서드 → 26개 테스트 메서드 생성 (성공/에러 각 1개)
- 컴파일 1회 재시도 후 성공
- 테스트 실행 성공

### 예제 2: 기존 테스트 검증 및 수정

```bash
사용자: DisplayCornerServiceTest의 문제를 찾아서 자동으로 수정해줘

MCP 클라이언트: [validate_test 도구 실행]
```

**결과:**
- 컴파일 에러 2개 발견 및 자동 수정
- 테스트 실패 3개 발견 (Mock 필드 누락)
- 자동 수정 후 재실행 성공

### 예제 3: 커버리지 확인

```bash
사용자: CommonServiceImplTest의 커버리지를 확인해줘

MCP 클라이언트: [validate_test 도구 실행 (check_coverage: true)]
```

**결과:**
```json
{
  "coverage": {
    "success": true,
    "percentage": 85.5,
    "report_path": "olive-domain/build/reports/jacoco/test/html/index.html"
  }
}
```

---

## 문서

### 테스트 표준

상세한 테스트 작성 표준은 다음 문서를 참고하세요:

- **[TEST_STANDARDS.md](./standards/TEST_STANDARDS.md)**: 테스트 코드 작성 표준 및 베스트 프랙티스
- **[VALIDATION_LOOP.md](./standards/VALIDATION_LOOP.md)**: 자가 검증 루프 프로세스 상세 설명

### 주요 내용:

1. **테스트 파일 구조**
   - 어노테이션 및 설정
   - 네이밍 컨벤션
   - Given-When-Then 구조

2. **Mock 설정 패턴**
   - MockK 사용법
   - 타입 안정성 보장
   - 복잡한 Mock 객체 생성

3. **흔한 에러와 해결 방법**
   - 타입 불일치
   - Mock 필드 누락
   - NullPointerException
   - 컨트롤러 유효성 검사 순서

4. **자가 검증 루프**
   - 컴파일 검증
   - 테스트 실행
   - 자동 수정 전략
   - 재시도 로직

---

## 기여

기여를 환영합니다! Pull Request를 보내주세요.

### 개발 환경 설정

```bash
git clone https://github.com/oliveyoung/test-standard-mcp.git
cd test-standard-mcp
npm install
npm test
```

### 로컬 테스트

```bash
# MCP 서버 실행
npm start

# Claude Desktop에서 로컬 버전 사용
# claude_desktop_config.json에 로컬 경로 설정
{
  "mcpServers": {
    "test-standard-mcp": {
      "command": "node",
      "args": ["/path/to/local/test-standard-mcp/index.js"]
    }
  }
}
```

---

## 라이선스

MIT License

Copyright (c) 2025 Oliveyoung Test Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 문의

- **이슈**: [GitHub Issues](https://github.com/oliveyoung/test-standard-mcp/issues)
- **이메일**: test-team@oliveyoung.co.kr

---

**마지막 업데이트**: 2025-12-03
**버전**: 1.0.0
**상태**: 프로토타입 (Production Ready)
# test-standard-mcp
