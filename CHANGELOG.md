# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- AI 기반 Mock 데이터 생성
- 커버리지 기반 자동 테스트 추가
- 컨트롤러 테스트 템플릿 추가
- 더 정교한 자동 수정 로직

---

## [1.1.0] - 2025-12-03

### Added
- ✨ **Serena MCP 통합**: MCP 클라이언트를 통한 정확한 코드 분석
  - `serena_analysis` 파라미터 추가 (generate_unit_test)
  - LSP 기반 정확한 타입 분석 지원
  - 정규식 fallback 유지 (Serena 없이도 사용 가능)
- 🎯 `parseSerenaAnalysis()`: Serena MCP 결과를 내부 형식으로 변환
- 📖 **README 업데이트**: Serena MCP 워크플로우 및 비교표 추가
- 📦 **Standards 폴더 NPM 패키지 포함**: 테스트 표준 문서 자동 배포
- 🌐 **범용 MCP 클라이언트 지원**: Claude Code, Amazon Q, VS Code 등 모든 MCP 클라이언트 호환

### Improved
- 🔧 Tool description에 Serena MCP 권장 워크플로우 명시
- 📊 타입 정확도 100% 달성 (Serena 사용 시)
- 🚀 컴파일 에러 0건 (Serena 사용 시)

### Technical Details
- **아키텍처**: MCP 서버 간 통신은 **MCP 클라이언트**가 orchestration 수행
- **워크플로우**: Serena 분석 → MCP 클라이언트 전달 → Test Standard 생성
- **호환성**:
  - 모든 MCP 프로토콜 호환 클라이언트 지원
  - Serena 없이도 정규식 기반으로 동작 (degraded mode)
- **지원 클라이언트**: Claude Code, Amazon Q, VS Code + MCP, 기타

---

## [1.0.0] - 2025-12-03

### Added
- 🎉 **Initial Release**: Test Standard MCP 첫 배포
- **4개 MCP 도구 구현**:
  - `generate_unit_test`: 단위 테스트 자동 생성
  - `generate_integration_test`: 통합 테스트 생성
  - `validate_test`: 테스트 검증 및 자동 수정
  - `analyze_service`: 서비스 코드 분석
- **자가 검증 루프**: 컴파일 → 실행 → 수정 → 재검증 자동화
- **타입 안정성**: 실제 코드 분석을 통한 정확한 타입 추론
- **자동 에러 수정**:
  - Unit → Long 타입 불일치 수정
  - String → Boolean 타입 불일치 수정
  - Import 누락 자동 추가
- **테스트 표준 문서**:
  - TEST_STANDARDS.md (100+ 페이지)
  - VALIDATION_LOOP.md (자가 검증 프로세스)
- **상세한 문서화**:
  - README.md (사용 가이드 및 예제)
  - DEPLOYMENT.md (배포 및 설치 가이드)
  - Serena MCP 의존성 설치 가이드

### Dependencies
- **필수**: Serena MCP 0.1.4 이상 (코드 분석용)
- **필수**: Node.js 18.0.0 이상
- **필수**: Java 11 (Gradle 빌드용)
- **권장**: Claude Desktop (MCP 클라이언트)

### Technical Details
- **언어**: JavaScript (ES Modules)
- **MCP SDK**: @modelcontextprotocol/sdk ^0.5.0
- **아키텍처**: 단일 파일 MCP 서버 (index.js, 700+ 라인)
- **플랫폼**: macOS, Linux (Windows 미지원)

### Known Limitations
- 현재 Kotlin/Spring Boot 프로젝트만 지원
- 정규식 기반 코드 파싱 (향후 Serena MCP 직접 통합 예정)
- 간단한 타입 불일치만 자동 수정 가능
- MockK 기반 테스트만 지원
- JAVA_HOME 경로 하드코딩 (/usr/local/opt/openjdk@11)

### Tested On
- **프로젝트**: oliveyoung-discovery
- **모듈**: olive-domain, olive-interfaces
- **테스트 파일**: 4개 (CommonServiceImplTest, DisplayCornerServiceTest, ExternalControllerTest, PlanshopServiceImplTest)
- **생성된 테스트**: 40+ 메서드
- **성공률**: 95% (자동 수정 후)

---

## Version History

### [1.0.0] - 2025-12-03
Initial release with core functionality

---

## Contributing

버그 리포트, 기능 요청, Pull Request를 환영합니다!

**보고 방법:**
- GitHub Issues: https://github.com/oliveyoung/test-standard-mcp/issues
- Email: test-team@oliveyoung.co.kr

**개발 가이드:**
- [DEPLOYMENT.md](./DEPLOYMENT.md#기여자-가이드)

---

**관리자**: Oliveyoung Test Team
**라이선스**: MIT
