# Oliveyoung Discovery 프로젝트 테스트 코드 표준

> 지속적인 테스트 코드 작성 경험을 통해 수립된 표준 및 베스트 프랙티스

---

## 📋 목차

1. [테스트 파일 구조](#테스트-파일-구조)
2. [어노테이션 및 설정](#어노테이션-및-설정)
3. [Mock 설정 패턴](#mock-설정-패턴)
4. [테스트 메서드 작성](#테스트-메서드-작성)
5. [자가 검증 루프](#자가-검증-루프)
6. [흔한 에러와 해결 방법](#흔한-에러와-해결-방법)
7. [체크리스트](#체크리스트)

---

## 테스트 파일 구조

### 기본 구조

```kotlin
package com.oliveyoung.domain.service.xxx

import com.oliveyoung.domain.configuration.property.EncryptedPropertyConfig
import com.oliveyoung.domain.configuration.property.PropertyProvider
// ... 필요한 import

import io.mockk.*
import io.mockk.junit5.MockKExtension
import org.junit.jupiter.api.*
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Description
import org.springframework.test.context.ContextConfiguration
import org.springframework.test.context.TestConstructor
import org.springframework.test.util.ReflectionTestUtils

@SpringBootTest
@ContextConfiguration(
    classes = [
        EncryptedPropertyConfig::class,
        PropertyProvider::class
    ]
)
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
@ExtendWith(MockKExtension::class)
class XxxServiceImplTest {
    // Dependencies
    private val dependency1: Dependency1 = mockk()
    private val dependency2: Dependency2 = mockk()

    // Service under test
    private val xxxServiceImpl: XxxServiceImpl = spyk(
        XxxServiceImpl(
            dependency1 = dependency1,
            dependency2 = dependency2
        ), recordPrivateCalls = true
    )

    @BeforeEach
    fun setup() {
        MockKAnnotations.init(this)
        // ReflectionTestUtils로 private 필드 설정 (필요시)
    }

    @AfterEach
    fun afterTests() {
        unmockkAll()
    }

    // 테스트 메서드들...
}
```

### 네이밍 컨벤션

#### 테스트 파일명
- 구현체 테스트: `{ServiceName}ImplTest.kt`
- 통합 테스트: `{ServiceName}IntegratedServiceImplTest.kt`
- 컨트롤러 테스트: `{ControllerName}Test.kt`

#### 테스트 메서드명
**반드시 한글로 명확하게 작성** (backtick 사용)

```kotlin
@Test
@Description("기획전 static 정보 조회 - 정상 케이스")
fun `getPlanshopStaticContents_success`() { ... }

@Test
@Description("기획전 GNB 내 카테고리 조회 - searchWebClient 에러 케이스")
fun `getCurrentPlanshopNavigationByCommonSearch_null`() { ... }

@Test
fun `건강기능식품 영양정보 조회 - 정상`() { ... }

@Test
fun `건강기능식품 영양정보 조회 - 비정상`() { ... }
```

**패턴:**
- `{methodName}_{성공여부}` (영문)
- `{기능설명} - {케이스}` (한글)

---

## 어노테이션 및 설정

### 필수 어노테이션

```kotlin
@SpringBootTest                     // Spring 컨텍스트 로드
@ContextConfiguration(              // 설정 클래스 지정
    classes = [
        EncryptedPropertyConfig::class,
        PropertyProvider::class
    ]
)
@TestConstructor(                   // 생성자 주입 자동화
    autowireMode = TestConstructor.AutowireMode.ALL
)
@ExtendWith(MockKExtension::class)  // MockK 확장
```

### 테스트 메서드 어노테이션

```kotlin
@Test                               // JUnit 5 테스트
@Description("테스트 설명")          // 테스트 목적 명시
```

### 특수 케이스

```kotlin
@Suppress("UNCHECKED_CAST")         // 타입 캐스팅 경고 억제 (필요시)
```

---

## Mock 설정 패턴

### 기본 Mock 생성

```kotlin
// 일반 Mock
private val repository: SomeRepository = mockk()

// Relaxed Mock (명시하지 않은 메서드는 기본값 반환)
private val service: SomeService = mockk(relaxed = true)

// Spy (실제 객체를 부분적으로 Mock)
private val serviceImpl: ServiceImpl = spyk(
    ServiceImpl(dependency1, dependency2),
    recordPrivateCalls = true  // private 메서드도 검증 가능
)
```

### Mock 동작 정의

#### 단순 반환

```kotlin
every { repository.findById(any()) } returns Optional.of(mockData)
every { service.getSomething() } returns "result"
```

#### null 반환

```kotlin
every { repository.findById(any()) } returns null
every { webClient.fetchData(any()) } returns null
```

#### 예외 발생

```kotlin
every { service.process(any()) } throws Exception("에러 메시지")
every { repository.save(any()) } throws RuntimeException()
```

#### 리스트/맵 반환

```kotlin
every { service.getList() } returns listOf(item1, item2)
every { service.getMap() } returns mapOf("key1" to value1)
every { service.getEmpty() } returns emptyList()
```

#### 복잡한 Mock 객체

```kotlin
val mockObject = mockk<ComplexEntity> {
    every { id } returns 123L
    every { name } returns "테스트"
    every { nestedObject } returns mockk {
        every { subField } returns "값"
        every { anotherField } returns true
    }
}
```

### Private 메서드 Mock

```kotlin
// spyk의 recordPrivateCalls = true 필요
every {
    serviceImpl["privateMethodName"](arg1, arg2)
} returns expectedResult
```

### 타입 안정성 주의사항

**❌ 잘못된 예:**

```kotlin
// Repository가 Long을 반환하는데 Unit으로 mock
every { repository.deleteByIds(any()) } returns Unit

// Boolean 필드를 String으로 mock
every { entity.isActive } returns "Y"

// 실제 타입을 확인하지 않고 추측
every { service.count() } returns "10"  // 실제는 Long 반환
```

**✅ 올바른 예:**

```kotlin
// 반드시 실제 구현 코드에서 반환 타입 확인
every { repository.deleteByIds(any()) } returns 1L

// DTO 정의를 확인하고 정확한 타입 사용
every { entity.isActive } returns true

// 메서드 시그니처 확인
every { service.count() } returns 10L
```

**핵심 원칙: 테스트 작성 전 반드시 실제 코드 확인!**

---

## 테스트 메서드 작성

### Given-When-Then 구조

```kotlin
@Test
@Description("사용자 정보 조회 - 정상 케이스")
fun `getUserInfo_success`() {
    // Given: 테스트 데이터 준비
    val userId = "testUser"
    val mockUser = mockk<User> {
        every { id } returns userId
        every { name } returns "홍길동"
        every { email } returns "test@example.com"
    }

    every { userRepository.findById(userId) } returns Optional.of(mockUser)

    // When: 실행
    val result = userService.getUserInfo(userId)

    // Then: 검증
    assertEquals(userId, result.id)
    assertEquals("홍길동", result.name)
    assertEquals("test@example.com", result.email)

    // Mock 호출 검증 (필요시)
    verify { userRepository.findById(userId) }
}
```

### Assertion 패턴

#### 단일 값 검증

```kotlin
assertEquals(expected, actual)
assertNotNull(result)
assertTrue(condition)
assertFalse(condition)
```

#### 리스트/컬렉션 검증

```kotlin
assertEquals(3, result.size)
assertTrue(result.isNotEmpty())
assertEquals(expected, result[0].id)
```

#### 예외 검증

```kotlin
assertThrows<Exception> {
    service.throwException()
}

val exception = assertThrows<IllegalArgumentException> {
    service.validateInput(invalidData)
}
assertEquals("잘못된 입력", exception.message)
```

#### 컨트롤러 응답 검증 (MockMvc)

```kotlin
mockMvc.perform(get(apiUrl).contentType(APPLICATION_JSON))
    .andDo(print())
    .andExpect(status().isOk)
    .andExpect(jsonPath("$.status").value("SUCCESS"))
    .andExpect(jsonPath("$.code").value(HttpStatus.OK.value()))
    .andExpect(jsonPath("$.data").isArray)
```

### 테스트 케이스 분류

각 메서드마다 최소 2개 이상의 테스트 작성:

1. **정상 케이스 (success)**
   - 정상적인 입력과 예상되는 출력

2. **에러 케이스 (error/exception/null)**
   - null 반환
   - 예외 발생
   - 빈 리스트/컬렉션
   - 유효하지 않은 입력

```kotlin
@Test
@Description("사용자 정보 조회 - 정상")
fun `getUserInfo_success`() { ... }

@Test
@Description("사용자 정보 조회 - 사용자 없음")
fun `getUserInfo_notFound`() {
    every { userRepository.findById(any()) } returns Optional.empty()

    assertThrows<UserNotFoundException> {
        userService.getUserInfo("nonexistent")
    }
}

@Test
@Description("사용자 정보 조회 - DB 에러")
fun `getUserInfo_dbError`() {
    every { userRepository.findById(any()) } throws RuntimeException("DB 연결 실패")

    assertThrows<RuntimeException> {
        userService.getUserInfo("testUser")
    }
}
```

---

## 자가 검증 루프

### 테스트 작성 워크플로우

```
1. 서비스/컨트롤러 코드 읽기
   ↓
2. 테스트 메서드 작성
   ↓
3. 컴파일 검증
   ↓
4. 테스트 실행
   ↓
5. 실패 시 분석 및 수정
   ↓
6. 재검증
   ↓
7. 성공 → 다음 테스트
```

### 1단계: 컴파일 검증

```bash
# Kotlin 컴파일 (kapt 제외)
./gradlew :olive-domain:compileTestKotlin \
  -x kaptKotlin \
  -x kaptGenerateStubsKotlin \
  -x kaptTestKotlin \
  -x kaptGenerateStubsTestKotlin
```

**컴파일 에러가 발생하면:**
- 타입 불일치 확인
- import 누락 확인
- Mock 설정 오류 확인

### 2단계: 테스트 실행

```bash
# 특정 테스트 클래스 실행
JAVA_HOME=/usr/local/opt/openjdk@11/libexec/openjdk.jdk/Contents/Home \
./gradlew :olive-domain:test \
  --tests "CommonServiceImplTest" \
  -x kaptKotlin \
  -x kaptGenerateStubsKotlin \
  -x kaptTestKotlin \
  -x kaptGenerateStubsTestKotlin

# 특정 테스트 메서드 실행
./gradlew :olive-domain:test \
  --tests "CommonServiceImplTest.updateValidDisplayFeatureFlagCacheInfo_success"
```

### 3단계: 실패 분석

테스트 실패 시 확인 사항:

1. **Mock 미설정**
   ```
   io.mockk.MockKException: no answer found for:
   SomeClass(#123).getField()
   ```
   → 해당 필드/메서드에 대한 `every` 설정 추가

2. **타입 불일치**
   ```
   Type mismatch: inferred type is String but Boolean was expected
   ```
   → DTO 정의를 확인하고 정확한 타입으로 수정

3. **NPE (NullPointerException)**
   ```
   java.lang.NullPointerException at ServiceImpl.method(ServiceImpl.kt:102)
   ```
   → Mock 객체의 중첩된 필드가 null일 가능성 확인

4. **Assertion 실패**
   ```
   Expected :1
   Actual   :0
   ```
   → Mock 데이터가 제대로 반환되지 않거나, 로직 오류

### 4단계: 커버리지 확인

```bash
# JaCoCo 리포트 생성
JAVA_HOME=/usr/local/opt/openjdk@11/libexec/openjdk.jdk/Contents/Home \
./gradlew :olive-domain:jacocoTestReport \
  -x kaptKotlin \
  -x kaptGenerateStubsKotlin \
  -x kaptTestKotlin \
  -x kaptGenerateStubsTestKotlin

# 리포트 확인
open olive-domain/build/reports/jacoco/test/html/index.html
```

---

## 흔한 에러와 해결 방법

### 에러 1: MockK `just Runs` 컴파일 에러

**증상:**
```kotlin
every { service.doSomething() } just Runs
// 컴파일 에러 발생
```

**해결 방법:**
```kotlin
// 방법 1: justRun 사용
justRun { service.doSomething() }

// 방법 2: returns 사용 (선호)
every { service.doSomething() } returns true
```

### 에러 2: 타입 불일치 (Unit vs Long)

**증상:**
```kotlin
every { repository.deleteByIds(any()) } returns Unit
// Type mismatch: inferred type is Unit but Long was expected
```

**원인:** Repository의 실제 반환 타입을 확인하지 않음

**해결 방법:**
```kotlin
// 1. Repository 구현 확인
// fun deleteByIds(...): Long { ... }

// 2. 올바른 타입으로 mock 설정
every { repository.deleteByIds(any()) } returns 1L
```

### 에러 3: Boolean 필드를 String으로 Mock

**증상:**
```kotlin
every { option.representFlag } returns "Y"
// Type mismatch: inferred type is String but Boolean was expected
```

**원인:** 과거 컨벤션("Y"/"N")과 혼동

**해결 방법:**
```kotlin
// DTO 정의 확인 후
every { option.representFlag } returns true
```

### 에러 4: Mock 객체 필드 누락

**증상:**
```kotlin
io.mockk.MockKException: no answer found for:
DisplayCornerContentsLanguages(#69).getBannerFontColor()
```

**원인:** 복잡한 Mock 객체에서 필수 필드 누락

**해결 방법:**
```kotlin
// DTO 변환 메서드(convertFrom 등)를 확인하여 필요한 모든 필드 추가
val mockContents = mockk<DisplayCornerContents> {
    every { languagesinformation } returns mockk {
        every { bannerImageUrlAddress } returns "testImageUrl"
        every { bannerImageSubstituteText } returns "testAltText"
        every { bannerFontColor } returns BannerFontColorCodes.BLACK
        every { contentsDescription } returns "testDescription"
        every { linkButtonText } returns "testButtonText"
        every { imageAltText } returns "testImageAlt"
    }
    // ... 다른 필수 필드
}
```

### 에러 5: 컨트롤러 유효성 검사 순서

**증상:**
```kotlin
@Test
fun `건강기능식품 영양정보 조회 - 비정상`() {
    val attributeTypes = listOf("INVALID_TYPE")
    every { service.findAll(any(), any()) } throws Exception()

    // Expected: 200, Actual: 400
}
```

**원인:** 컨트롤러가 서비스 호출 **전에** 파라미터 유효성 검사를 수행

**해결 방법:**
```kotlin
// 1. 컨트롤러 코드를 확인하여 검증 로직 파악
// if (invalidTypes.isNotEmpty()) return BAD_REQUEST

// 2. 유효한 파라미터로 테스트 작성
val attributeTypes = listOf("HA002", "HA003")  // 유효한 코드
every { service.findAll(any(), any()) } throws Exception()

mockMvc.perform(...)
    .andExpect(status().isInternalServerError)  // 또는 적절한 상태 코드
```

### 에러 6: NullPointerException in Service

**증상:**
```kotlin
java.lang.NullPointerException at CommonServiceImpl.kt:102
// cornerContents?.languagesinformation!!.contentsSubDescription!!
```

**원인:** 테스트에서 `cornerContents`를 null로 설정했지만, 서비스 코드가 `!!` 사용

**해결 방법:**
```kotlin
// 옵션 1: 테스트에서 null이 아닌 mock 제공
val mockCornerContents = mockk<DisplayCornerContents> {
    every { languagesinformation } returns mockk {
        every { contentsSubDescription } returns "value"
    }
}

// 옵션 2: 테스트 삭제 (서비스 코드가 null을 처리하지 않으므로)
// 해당 케이스는 테스트 불가능
```

**중요:** 서비스 코드는 수정하지 않고, 테스트만 수정!

---

## 체크리스트

### 테스트 작성 전

- [ ] 테스트할 서비스/컨트롤러의 실제 코드를 읽었는가?
- [ ] 메서드의 반환 타입을 확인했는가?
- [ ] DTO 필드의 타입을 확인했는가?
- [ ] 의존성 목록을 파악했는가?
- [ ] private 필드(@Value 등)를 확인했는가?

### 테스트 작성 중

- [ ] Given-When-Then 구조를 따르는가?
- [ ] Mock 설정이 실제 타입과 일치하는가?
- [ ] 필요한 모든 Mock 필드를 설정했는가?
- [ ] 테스트 케이스가 명확한 한글 설명을 포함하는가?
- [ ] @Description 어노테이션을 추가했는가?

### 테스트 작성 후

- [ ] 컴파일이 성공하는가?
- [ ] 테스트가 통과하는가?
- [ ] 각 메서드마다 최소 2개 테스트(성공/실패)를 작성했는가?
- [ ] Mock 호출을 verify로 검증했는가? (필요시)
- [ ] 커버리지가 향상되었는가?

### 코드 리뷰 시

- [ ] 서비스 구현 코드를 수정하지 않았는가?
- [ ] 타입 안정성을 준수하는가?
- [ ] 불필요한 Mock을 사용하지 않았는가?
- [ ] 테스트가 독립적으로 실행 가능한가?
- [ ] @AfterEach에서 unmockkAll()을 호출하는가?

---

## 부록: 템플릿

### Service 테스트 템플릿

```kotlin
package com.oliveyoung.domain.service.xxx

import com.oliveyoung.domain.configuration.property.EncryptedPropertyConfig
import com.oliveyoung.domain.configuration.property.PropertyProvider
import io.mockk.*
import io.mockk.junit5.MockKExtension
import org.junit.jupiter.api.*
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Description
import org.springframework.test.context.ContextConfiguration
import org.springframework.test.context.TestConstructor
import org.springframework.test.util.ReflectionTestUtils

@SpringBootTest
@ContextConfiguration(
    classes = [
        EncryptedPropertyConfig::class,
        PropertyProvider::class
    ]
)
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
@ExtendWith(MockKExtension::class)
class {{ServiceName}}Test {
    // Dependencies
    private val dependency1: Dependency1 = mockk()
    private val dependency2: Dependency2 = mockk()

    // Service under test
    private val serviceImpl: {{ServiceName}} = spyk(
        {{ServiceName}}(
            dependency1 = dependency1,
            dependency2 = dependency2
        ), recordPrivateCalls = true
    )

    @BeforeEach
    fun setup() {
        MockKAnnotations.init(this)
        // ReflectionTestUtils.setField(serviceImpl, "fieldName", "value")
    }

    @AfterEach
    fun afterTests() {
        unmockkAll()
    }

    @Test
    @Description("{{기능설명}} - 정상 케이스")
    fun `{{methodName}}_success`() {
        // Given
        val mockData = mockk<Entity> {
            every { field1 } returns "value1"
            every { field2 } returns 123L
        }
        every { dependency1.getData(any()) } returns mockData

        // When
        val result = serviceImpl.someMethod(input)

        // Then
        assertEquals(expected, result)
        verify { dependency1.getData(any()) }
    }

    @Test
    @Description("{{기능설명}} - 에러 케이스")
    fun `{{methodName}}_error`() {
        // Given
        every { dependency1.getData(any()) } throws Exception("에러")

        // When & Then
        assertThrows<Exception> {
            serviceImpl.someMethod(input)
        }
    }
}
```

### Controller 테스트 템플릿

```kotlin
package com.oliveyoung.interfaces.controller.xxx

import com.oliveyoung.interfaces.controller.xxx.{{ControllerName}}
import io.mockk.*
import io.mockk.junit5.MockKExtension
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.http.MediaType.APPLICATION_JSON
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultHandlers.print
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.test.web.servlet.setup.MockMvcBuilders

@ExtendWith(MockKExtension::class)
class {{ControllerName}}Test {
    private lateinit var mockMvc: MockMvc

    private val service: {{ServiceName}} = mockk()

    private val controller: {{ControllerName}} = {{ControllerName}}(service)

    @BeforeEach
    fun setup() {
        MockKAnnotations.init(this)
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build()
    }

    @AfterEach
    fun afterTests() {
        unmockkAll()
    }

    @Test
    fun `{{API명}} - 정상`() {
        // Given
        val apiUrl = "/api/v1/xxx"
        every { service.getData(any()) } returns mockData

        // When & Then
        mockMvc.perform(get(apiUrl).contentType(APPLICATION_JSON))
            .andDo(print())
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.status").value("SUCCESS"))
            .andExpect(jsonPath("$.data").exists())
    }

    @Test
    fun `{{API명}} - 에러`() {
        // Given
        val apiUrl = "/api/v1/xxx"
        every { service.getData(any()) } throws Exception()

        // When & Then
        mockMvc.perform(get(apiUrl).contentType(APPLICATION_JSON))
            .andDo(print())
            .andExpect(status().isInternalServerError)
    }
}
```

---

**작성일:** 2025-12-03
**버전:** 1.0.0
**기반 프로젝트:** oliveyoung-discovery
**작성자:** Test Standardization Team
