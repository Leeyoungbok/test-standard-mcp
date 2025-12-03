# 테스트 자가 검증 루프 프로세스

> 테스트 코드 생성부터 검증까지 자동화된 워크플로우

---

## 개요

테스트 코드 작성 시, 컴파일 → 실행 → 실패 → 수정 → 재검증의 반복적인 과정을 자동화하여
완벽한 테스트 코드를 생성합니다.

### 목표

1. **제로 에러 테스트 생성**: 한 번에 컴파일되고 통과하는 테스트 작성
2. **빠른 피드백**: 즉각적인 에러 감지 및 수정
3. **지속적 개선**: 검증 결과를 바탕으로 테스트 품질 향상
4. **자동 재시도**: 실패 시 자동으로 원인 분석 및 수정

---

## 자가 검증 루프 플로우

```
┌─────────────────────────────────────────────────────┐
│  Step 1: 소스 코드 분석                               │
│  - 서비스/컨트롤러 메서드 파악                         │
│  - 의존성 및 타입 확인                                │
│  - DTO 구조 분석                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Step 2: 테스트 코드 생성                             │
│  - 템플릿 기반 코드 생성                              │
│  - Given-When-Then 구조 적용                         │
│  - Mock 설정 자동 생성                               │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Step 3: 컴파일 검증                                 │
│  - Kotlin 컴파일 실행                                │
│  - 타입 에러 감지                                    │
│  - Import 누락 확인                                  │
└──────────────────┬──────────────────────────────────┘
                   │
           ┌───────┴───────┐
           │               │
        성공              실패
           │               │
           │               ▼
           │      ┌─────────────────────┐
           │      │  에러 분석 및 수정    │
           │      │  - 타입 불일치 수정   │
           │      │  - Import 추가       │
           │      │  - Mock 설정 보완    │
           │      └─────────┬───────────┘
           │                │
           │                │ (최대 3회 재시도)
           │                │
           │      ┌─────────┴───────────┐
           │      │   재컴파일           │
           │      └─────────┬───────────┘
           │                │
           └────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Step 4: 테스트 실행                                 │
│  - Gradle test 실행                                 │
│  - 각 테스트 케이스 결과 수집                         │
│  - 실패 원인 분석                                    │
└──────────────────┬──────────────────────────────────┘
                   │
           ┌───────┴───────┐
           │               │
        통과              실패
           │               │
           │               ▼
           │      ┌─────────────────────┐
           │      │  실패 원인 분석       │
           │      │  - Mock 누락 확인    │
           │      │  - Assertion 검토    │
           │      │  - NPE 원인 파악     │
           │      └─────────┬───────────┘
           │                │
           │                │ (최대 3회 재시도)
           │                │
           │      ┌─────────┴───────────┐
           │      │   테스트 수정        │
           │      └─────────┬───────────┘
           │                │
           │      ┌─────────┴───────────┐
           │      │   재실행            │
           │      └─────────┬───────────┘
           │                │
           └────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Step 5: 커버리지 확인 (선택)                         │
│  - JaCoCo 리포트 생성                                │
│  - 커버리지 비율 확인                                │
│  - 미테스트 영역 파악                                │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Step 6: 최종 검증 완료                              │
│  - 테스트 파일 저장                                  │
│  - 검증 리포트 생성                                  │
│  - 다음 테스트로 이동                                │
└─────────────────────────────────────────────────────┘
```

---

## 각 단계별 상세 프로세스

### Step 1: 소스 코드 분석

**목적:** 테스트 대상 코드의 구조와 타입을 정확히 파악

```javascript
async function analyzeSourceCode(servicePath) {
    // 1. 서비스 파일 읽기
    const serviceCode = await readFile(servicePath);

    // 2. 메서드 추출 (세레나 MCP의 get_symbols_overview 활용)
    const methods = await serena.getSymbolsOverview(servicePath);

    // 3. 각 메서드의 시그니처 분석
    const methodSignatures = methods.map(method => ({
        name: method.name,
        returnType: extractReturnType(method),
        parameters: extractParameters(method),
        isPrivate: method.visibility === 'private'
    }));

    // 4. 의존성 분석 (생성자 파라미터)
    const dependencies = extractDependencies(serviceCode);

    // 5. DTO 타입 확인
    const dtoTypes = await analyzeDTOTypes(dependencies);

    return {
        className: extractClassName(serviceCode),
        methods: methodSignatures,
        dependencies: dependencies,
        dtoTypes: dtoTypes
    };
}
```

**중요 체크 포인트:**
- ✅ 메서드 반환 타입 (Unit, Long, String, List<T> 등)
- ✅ DTO 필드 타입 (Boolean vs String, Int vs Long)
- ✅ Nullable 여부 (?, !!)
- ✅ 의존성 목록

### Step 2: 테스트 코드 생성

**목적:** 표준 템플릿을 기반으로 초기 테스트 코드 생성

```javascript
async function generateTestCode(analysis) {
    // 1. 템플릿 로드
    const template = loadTemplate('service_test_template.kt');

    // 2. 클래스명 및 의존성 주입
    let testCode = template
        .replace('{{ServiceName}}', analysis.className)
        .replace('{{Dependencies}}', generateDependencyMocks(analysis.dependencies));

    // 3. 각 메서드에 대한 테스트 생성
    for (const method of analysis.methods) {
        if (method.isPrivate) continue; // private 메서드는 스킵

        // 성공 케이스
        const successTest = generateSuccessTest(method, analysis);
        testCode += successTest;

        // 실패 케이스
        const errorTest = generateErrorTest(method, analysis);
        testCode += errorTest;
    }

    return testCode;
}

function generateSuccessTest(method, analysis) {
    // Given 섹션 생성
    const givenSection = generateGivenSection(method, analysis);

    // When 섹션 생성
    const whenSection = `val result = serviceImpl.${method.name}(${method.parameters.map(p => p.name).join(', ')})`;

    // Then 섹션 생성 (반환 타입에 따라)
    const thenSection = generateThenSection(method.returnType);

    return `
    @Test
    @Description("${method.name} - 정상 케이스")
    fun \`${method.name}_success\`() {
        // Given
        ${givenSection}

        // When
        ${whenSection}

        // Then
        ${thenSection}
    }
    `;
}
```

**생성 원칙:**
- ✅ Given-When-Then 구조 준수
- ✅ 타입 안정성 보장 (실제 타입 기반 Mock 생성)
- ✅ 한글 설명 포함
- ✅ @Description 어노테이션 추가

### Step 3: 컴파일 검증

**목적:** 타입 에러, import 누락 등 컴파일 에러 감지 및 수정

```javascript
async function validateCompilation(testFilePath, maxRetries = 3) {
    let retryCount = 0;

    while (retryCount < maxRetries) {
        // 1. 컴파일 실행
        const compileResult = await runGradleCompile(testFilePath);

        if (compileResult.success) {
            return { success: true, code: testFilePath };
        }

        // 2. 에러 분석
        const errors = parseCompilationErrors(compileResult.output);

        // 3. 자동 수정 시도
        let testCode = await readFile(testFilePath);
        let modified = false;

        for (const error of errors) {
            if (error.type === 'TYPE_MISMATCH') {
                testCode = fixTypeMismatch(testCode, error);
                modified = true;
            } else if (error.type === 'UNRESOLVED_REFERENCE') {
                testCode = addMissingImport(testCode, error);
                modified = true;
            } else if (error.type === 'MOCK_SETUP_ERROR') {
                testCode = fixMockSetup(testCode, error);
                modified = true;
            }
        }

        if (modified) {
            await writeFile(testFilePath, testCode);
            retryCount++;
        } else {
            // 자동 수정 불가능한 에러
            return {
                success: false,
                errors: errors,
                message: '자동 수정 불가능한 컴파일 에러 발생'
            };
        }
    }

    return {
        success: false,
        message: `최대 재시도 횟수(${maxRetries}) 초과`
    };
}

function fixTypeMismatch(code, error) {
    // 예: "Type mismatch: inferred type is Unit but Long was expected"
    if (error.message.includes('Unit but Long')) {
        // 해당 라인 찾아서 returns Unit → returns 1L로 수정
        const lineToFix = code.split('\n')[error.line - 1];
        const fixed = lineToFix.replace('returns Unit', 'returns 1L');
        return replaceLineInCode(code, error.line, fixed);
    }

    if (error.message.includes('String but Boolean')) {
        // "Y" → true로 수정
        const lineToFix = code.split('\n')[error.line - 1];
        const fixed = lineToFix.replace('"Y"', 'true').replace('"N"', 'false');
        return replaceLineInCode(code, error.line, fixed);
    }

    return code;
}
```

**자동 수정 가능한 에러 유형:**
- ✅ 타입 불일치 (Unit → Long, String → Boolean 등)
- ✅ import 누락
- ✅ Mock 반환 타입 오류
- ✅ nullable 처리 누락

**자동 수정 불가능 (사용자 확인 필요):**
- ❌ 로직 에러
- ❌ 비즈니스 규칙 관련 에러
- ❌ 복잡한 타입 추론 실패

### Step 4: 테스트 실행

**목적:** 실제 테스트 실행 및 실패 원인 분석

```javascript
async function runAndValidateTests(testFilePath, maxRetries = 3) {
    let retryCount = 0;

    while (retryCount < maxRetries) {
        // 1. 테스트 실행
        const testResult = await runGradleTest(testFilePath);

        if (testResult.allPassed) {
            return {
                success: true,
                passedTests: testResult.tests.length,
                failedTests: 0
            };
        }

        // 2. 실패한 테스트 분석
        const failedTests = testResult.tests.filter(t => !t.passed);

        // 3. 각 실패 원인 분석 및 수정
        let testCode = await readFile(testFilePath);
        let modified = false;

        for (const failedTest of failedTests) {
            const failure = analyzeTestFailure(failedTest);

            if (failure.fixable) {
                testCode = applyFix(testCode, failedTest.name, failure);
                modified = true;
            }
        }

        if (modified) {
            await writeFile(testFilePath, testCode);
            retryCount++;
        } else {
            // 자동 수정 불가능
            return {
                success: false,
                failedTests: failedTests,
                message: '자동 수정 불가능한 테스트 실패'
            };
        }
    }

    return {
        success: false,
        message: `최대 재시도 횟수(${maxRetries}) 초과`
    };
}

function analyzeTestFailure(failedTest) {
    const errorMessage = failedTest.error.message;

    // MockK 에러: no answer found
    if (errorMessage.includes('no answer found for')) {
        const missingField = extractMissingField(errorMessage);
        return {
            type: 'MOCK_FIELD_MISSING',
            fixable: true,
            fix: {
                action: 'ADD_MOCK_FIELD',
                field: missingField
            }
        };
    }

    // Assertion 실패: Expected vs Actual
    if (errorMessage.includes('Expected') && errorMessage.includes('Actual')) {
        const { expected, actual } = extractExpectedActual(errorMessage);

        if (actual === '0' && expected !== '0') {
            return {
                type: 'EMPTY_RESULT',
                fixable: true,
                fix: {
                    action: 'CHECK_MOCK_RETURN',
                    suggestion: 'Mock이 빈 리스트/null을 반환하고 있는지 확인'
                }
            };
        }
    }

    // NPE
    if (errorMessage.includes('NullPointerException')) {
        const line = extractNPELine(errorMessage);
        return {
            type: 'NULL_POINTER',
            fixable: false, // 서비스 로직 문제일 가능성
            suggestion: 'Mock 설정에서 null 반환하는 부분 확인 또는 테스트 삭제'
        };
    }

    return {
        type: 'UNKNOWN',
        fixable: false,
        suggestion: '수동 검토 필요'
    };
}
```

**자동 수정 가능한 테스트 실패:**
- ✅ Mock 필드 누락 → 필드 추가
- ✅ Mock 반환값 문제 → 반환값 수정
- ✅ Assertion 값 불일치 → Mock 데이터 조정

**자동 수정 불가능 (사용자 확인 필요):**
- ❌ NullPointerException (서비스 로직 문제)
- ❌ 비즈니스 로직 검증 실패
- ❌ 복잡한 상태 의존성

### Step 5: 커버리지 확인 (선택)

**목적:** 테스트 커버리지 측정 및 미테스트 영역 파악

```javascript
async function checkCoverage(moduleName) {
    // 1. JaCoCo 리포트 생성
    await runGradleJaCoCo(moduleName);

    // 2. 리포트 파싱
    const coverageReport = await parseJaCoCoReport(
        `${moduleName}/build/reports/jacoco/test/jacocoTestReport.xml`
    );

    // 3. 커버리지 분석
    return {
        linesCovered: coverageReport.linesCovered,
        linesTotal: coverageReport.linesTotal,
        percentage: (coverageReport.linesCovered / coverageReport.linesTotal * 100).toFixed(2),
        uncoveredMethods: coverageReport.uncoveredMethods
    };
}
```

### Step 6: 최종 검증 완료

**목적:** 검증 완료 및 리포트 생성

```javascript
async function finalizeValidation(testFilePath, validationResults) {
    // 1. 검증 리포트 생성
    const report = {
        testFile: testFilePath,
        timestamp: new Date().toISOString(),
        compilation: validationResults.compilation,
        testExecution: validationResults.testExecution,
        coverage: validationResults.coverage,
        status: 'PASSED',
        retries: validationResults.totalRetries
    };

    // 2. 리포트 저장
    await saveReport(report);

    // 3. 사용자에게 결과 반환
    return {
        success: true,
        message: `테스트 검증 완료: ${testFilePath}`,
        details: report
    };
}
```

---

## 에러 핸들링 전략

### 재시도 전략

```javascript
const RETRY_CONFIG = {
    compilation: {
        maxRetries: 3,
        retryableErrors: [
            'TYPE_MISMATCH',
            'UNRESOLVED_REFERENCE',
            'MOCK_SETUP_ERROR'
        ]
    },
    testExecution: {
        maxRetries: 3,
        retryableFailures: [
            'MOCK_FIELD_MISSING',
            'EMPTY_RESULT',
            'MOCK_RETURN_ERROR'
        ]
    }
};
```

### 에러 보고

자동 수정이 불가능한 에러는 상세한 정보와 함께 사용자에게 보고:

```javascript
{
    "status": "NEEDS_MANUAL_FIX",
    "error": {
        "type": "NULL_POINTER_EXCEPTION",
        "location": "CommonServiceImpl.kt:102",
        "testMethod": "updateValidCacheManagedByDisplayCorner_deleteCacheKey",
        "suggestion": "서비스 코드가 !! 연산자를 사용하여 null을 처리하지 않습니다. 테스트에서 null을 반환하지 않도록 Mock 설정을 수정하거나, 해당 테스트를 삭제하세요."
    }
}
```

---

## 성능 최적화

### 병렬 처리

여러 테스트 메서드를 동시에 생성 및 검증:

```javascript
async function generateAndValidateMultipleTests(methods) {
    const promises = methods.map(async method => {
        const testCode = await generateTestCode(method);
        const compiled = await validateCompilation(testCode);
        const tested = await runAndValidateTests(testCode);
        return { method, compiled, tested };
    });

    return await Promise.all(promises);
}
```

### 캐싱

반복적으로 사용되는 정보 캐싱:

```javascript
const analysisCache = new Map();

async function getServiceAnalysis(servicePath) {
    if (analysisCache.has(servicePath)) {
        return analysisCache.get(servicePath);
    }

    const analysis = await analyzeSourceCode(servicePath);
    analysisCache.set(servicePath, analysis);
    return analysis;
}
```

---

## 사용 예시

### 단일 서비스 테스트 생성

```bash
mcp-tool generate_unit_test \
  --service-path olive-domain/src/main/kotlin/com/oliveyoung/domain/service/common/CommonServiceImpl.kt \
  --test-path olive-domain/src/test/kotlin/com/oliveyoung/domain/service/common/CommonServiceImplTest.kt \
  --validate true \
  --max-retries 3
```

### 전체 프로세스 실행

```javascript
const result = await testStandardMCP.generateAndValidate({
    servicePath: 'olive-domain/src/main/kotlin/.../CommonServiceImpl.kt',
    testPath: 'olive-domain/src/test/kotlin/.../CommonServiceImplTest.kt',
    options: {
        autoFix: true,
        maxRetries: 3,
        checkCoverage: true
    }
});

console.log(result);
// {
//   success: true,
//   compilation: { success: true, retries: 1 },
//   testExecution: { success: true, retries: 2, passedTests: 8, failedTests: 0 },
//   coverage: { percentage: 85.5, uncoveredMethods: ['privateMethod1'] }
// }
```

---

## 검증 메트릭

자가 검증 루프의 효율성을 측정:

```javascript
{
    "metrics": {
        "totalTests": 50,
        "firstTimeSuccess": 35,      // 70%
        "fixedAfterCompile": 10,     // 20%
        "fixedAfterTest": 4,         // 8%
        "manualFixNeeded": 1,        // 2%
        "averageRetries": 1.2,
        "totalTime": "45s"
    }
}
```

---

**작성일:** 2025-12-03
**버전:** 1.0.0
**기반 프로젝트:** oliveyoung-discovery
