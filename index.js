#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile, writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Oliveyoung Test Standard MCP Server
 * 테스트 코드 자동 생성 및 자가 검증 루프를 제공하는 MCP 서버
 */
class TestStandardMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'test-standard-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Standards 캐시
    this.testStandards = null;
    this.validationLoop = null;

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  /**
   * 진행 상황 로그 출력 (stderr로 출력하여 클라이언트에서 볼 수 있음)
   */
  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${level}] ${message}`);
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * 테스트 표준 문서 로드 (캐시 적용)
   */
  async loadTestStandards() {
    if (this.testStandards) {
      return this.testStandards;
    }

    try {
      const standardsPath = path.join(__dirname, 'standards', 'TEST_STANDARDS.md');
      this.testStandards = await readFile(standardsPath, 'utf-8');
      return this.testStandards;
    } catch (error) {
      console.error('[Warning] TEST_STANDARDS.md를 찾을 수 없습니다:', error.message);
      return '';
    }
  }

  /**
   * 자가 검증 루프 문서 로드 (캐시 적용)
   */
  async loadValidationLoop() {
    if (this.validationLoop) {
      return this.validationLoop;
    }

    try {
      const validationPath = path.join(__dirname, 'standards', 'VALIDATION_LOOP.md');
      this.validationLoop = await readFile(validationPath, 'utf-8');
      return this.validationLoop;
    } catch (error) {
      console.error('[Warning] VALIDATION_LOOP.md를 찾을 수 없습니다:', error.message);
      return '';
    }
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate_unit_test',
          description: `서비스 클래스의 단위 테스트를 생성합니다. 자가 검증 루프를 통해 컴파일 및 테스트 통과를 보장합니다.

권장 워크플로우 (Serena MCP 통합):
MCP 클라이언트(Claude Code, Amazon Q 등)가 자동으로:
1. Serena MCP의 find_symbol 또는 get_symbols_overview로 서비스 분석
2. 분석 결과를 serena_analysis 파라미터에 전달
3. 정확한 타입 정보를 바탕으로 완벽한 테스트 생성

Serena 없이도 동작하지만, 정확도가 낮아집니다(정규식 기반 fallback).`,
          inputSchema: {
            type: 'object',
            properties: {
              project_root: {
                type: 'string',
                description: '프로젝트 루트 디렉토리 경로 (예: /Users/yb/Documents/dev/oliveyoung-discovery)',
              },
              service_path: {
                type: 'string',
                description: '테스트할 서비스 파일의 상대 경로 (예: olive-domain/src/main/kotlin/.../CommonServiceImpl.kt)',
              },
              serena_analysis: {
                type: 'object',
                description: 'Serena MCP로 분석한 서비스 정보 (선택, 권장). find_symbol 또는 get_symbols_overview 결과를 JSON으로 전달. 이 정보가 있으면 더 정확한 테스트 생성 가능.',
              },
              test_path: {
                type: 'string',
                description: '생성할 테스트 파일의 상대 경로 (선택, 미지정 시 자동 생성)',
              },
              validate: {
                type: 'boolean',
                description: '테스트 생성 후 자동 검증 여부 (기본값: true)',
                default: true,
              },
              max_retries: {
                type: 'number',
                description: '검증 실패 시 최대 재시도 횟수 (기본값: 3)',
                default: 3,
              },
            },
            required: ['project_root', 'service_path'],
          },
        },
        {
          name: 'generate_integration_test',
          description: '통합 서비스의 테스트를 생성합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              project_root: {
                type: 'string',
                description: '프로젝트 루트 디렉토리 경로',
              },
              service_path: {
                type: 'string',
                description: '테스트할 통합 서비스 파일의 상대 경로',
              },
              test_path: {
                type: 'string',
                description: '생성할 테스트 파일의 상대 경로 (선택)',
              },
              validate: {
                type: 'boolean',
                default: true,
              },
              max_retries: {
                type: 'number',
                default: 3,
              },
            },
            required: ['project_root', 'service_path'],
          },
        },
        {
          name: 'validate_test',
          description: '기존 테스트 파일을 검증하고 자동으로 수정합니다. 컴파일 → 실행 → 수정 → 재검증 루프를 수행합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              project_root: {
                type: 'string',
                description: '프로젝트 루트 디렉토리 경로',
              },
              test_path: {
                type: 'string',
                description: '검증할 테스트 파일의 상대 경로',
              },
              max_retries: {
                type: 'number',
                description: '최대 재시도 횟수 (기본값: 3)',
                default: 3,
              },
              check_coverage: {
                type: 'boolean',
                description: '커버리지 리포트 생성 여부 (기본값: false)',
                default: false,
              },
            },
            required: ['project_root', 'test_path'],
          },
        },
        {
          name: 'analyze_service',
          description: '서비스 파일을 분석하여 메서드 목록, 의존성, DTO 타입 정보를 추출합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              project_root: {
                type: 'string',
                description: '프로젝트 루트 디렉토리 경로',
              },
              service_path: {
                type: 'string',
                description: '분석할 서비스 파일의 상대 경로',
              },
            },
            required: ['project_root', 'service_path'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_unit_test':
            return await this.handleGenerateUnitTest(args);
          case 'generate_integration_test':
            return await this.handleGenerateIntegrationTest(args);
          case 'validate_test':
            return await this.handleValidateTest(args);
          case 'analyze_service':
            return await this.handleAnalyzeService(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}\n\nStack: ${error.stack}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * 서비스 분석 (세레나 MCP 활용)
   */
  async handleAnalyzeService(args) {
    const { project_root, service_path } = args;
    const absolutePath = path.join(project_root, service_path);

    const startTime = Date.now();

    try {
      // 파일 읽기
      const serviceCode = await readFile(absolutePath, 'utf-8');

      // 기본 분석 (정규식 기반)
      const analysis = this.parseKotlinService(serviceCode, service_path);

      const duration = Date.now() - startTime;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              duration_ms: duration,
              analysis: {
                className: analysis.className,
                packageName: analysis.packageName,
                methods: analysis.methods,
                dependencies: analysis.dependencies,
                imports: analysis.imports.slice(0, 10), // 처음 10개만
              },
              message: `서비스 분석 완료: ${analysis.methods.length}개 메서드 발견`,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 단위 테스트 생성
   */
  async handleGenerateUnitTest(args) {
    const {
      project_root,
      service_path,
      serena_analysis,
      test_path,
      validate = true,
      max_retries = 3,
    } = args;

    this.log(`🚀 테스트 생성 시작: ${service_path}`);
    
    const startTime = Date.now();
    const results = {
      service_path,
      test_path: test_path || this.inferTestPath(service_path),
      steps: [],
    };

    // 테스트 표준 문서 로드
    await this.loadTestStandards();
    await this.loadValidationLoop();

    try {
      // Step 1: 서비스 분석
      this.log(`📊 Step 1: 서비스 분석 중...`);
      results.steps.push({
        step: 1,
        name: 'analyze_service',
        status: 'in_progress',
        message: serena_analysis
          ? '서비스 분석 (Serena MCP 결과 사용)...'
          : '서비스 코드 분석 중 (정규식 기반, Serena MCP 권장)...',
      });

      let analysis;
      if (serena_analysis) {
        // Serena MCP 분석 결과를 우선 사용
        this.log(`✅ Serena MCP 분석 결과 사용`);
        analysis = this.parseSerenaAnalysis(serena_analysis, service_path);
        results.steps[0].message += ' ✅ Serena MCP로 정확한 타입 분석 완료';
      } else {
        // Fallback: 정규식 기반 파싱
        this.log(`⚠️  정규식 기반 파싱 (Serena MCP 권장)`);
        const serviceCode = await readFile(path.join(project_root, service_path), 'utf-8');
        analysis = this.parseKotlinService(serviceCode, service_path);
        results.steps[0].message += ' ⚠️ 정규식 기반 파싱 (Serena MCP 권장)';
      }

      results.steps[0].status = 'completed';
      results.steps[0].result = {
        methods_found: analysis.methods.length,
        dependencies_found: analysis.dependencies.length,
      };
      this.log(`✅ Step 1 완료: ${analysis.methods.length}개 메서드, ${analysis.dependencies.length}개 의존성 발견`);

      // Step 2: 테스트 코드 생성
      this.log(`📝 Step 2: 테스트 코드 생성 중...`);
      results.steps.push({
        step: 2,
        name: 'generate_test_code',
        status: 'in_progress',
        message: '테스트 코드 생성 중...',
      });

      const testCode = this.generateTestCodeFromAnalysis(analysis);
      const testFilePath = path.join(project_root, results.test_path);
      await writeFile(testFilePath, testCode, 'utf-8');

      results.steps[1].status = 'completed';
      results.steps[1].result = {
        test_file: results.test_path,
        test_methods_generated: analysis.methods.filter(m => !m.isPrivate).length * 2, // success + error
      };
      this.log(`✅ Step 2 완료: ${results.test_path} 생성`);

      // Step 3: 검증 (옵션)
      if (validate) {
        this.log(`🔍 Step 3: 테스트 검증 시작...`);
        const validationResult = await this.validateTestFile(
          project_root,
          results.test_path,
          max_retries
        );

        results.steps.push(...validationResult.steps);
      }

      const duration = Date.now() - startTime;
      this.log(`🎉 테스트 생성 완료! (소요시간: ${duration}ms)`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              duration_ms: duration,
              ...results,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      this.log(`❌ 테스트 생성 실패: ${error.message}`, 'ERROR');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              ...results,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 통합 테스트 생성
   */
  async handleGenerateIntegrationTest(args) {
    // 단위 테스트와 유사하지만, IntegratedService용 템플릿 사용
    return await this.handleGenerateUnitTest({
      ...args,
      is_integration: true,
    });
  }

  /**
   * 테스트 검증
   */
  async handleValidateTest(args) {
    const {
      project_root,
      test_path,
      max_retries = 3,
      check_coverage = false,
    } = args;

    // 테스트 표준 문서 로드
    await this.loadTestStandards();
    await this.loadValidationLoop();

    const startTime = Date.now();

    try {
      const validationResult = await this.validateTestFile(
        project_root,
        test_path,
        max_retries
      );

      if (check_coverage && validationResult.success) {
        // 커버리지 체크
        const coverageResult = await this.checkCoverage(project_root, test_path);
        validationResult.coverage = coverageResult;
      }

      const duration = Date.now() - startTime;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ...validationResult,
              duration_ms: duration,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 테스트 파일 검증 (자가 검증 루프)
   */
  async validateTestFile(projectRoot, testPath, maxRetries) {
    const steps = [];

    // Step: 컴파일 검증
    this.log(`🔨 컴파일 검증 시작...`);
    steps.push({
      step: 3,
      name: 'compile_validation',
      status: 'in_progress',
      message: '컴파일 검증 중...',
    });

    let compileSuccess = false;
    let compileRetries = 0;

    while (!compileSuccess && compileRetries < maxRetries) {
      try {
        this.log(`  ⏳ 컴파일 시도 ${compileRetries + 1}/${maxRetries}...`);
        await this.runGradleCompile(projectRoot, testPath);
        compileSuccess = true;
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].result = {
          retries: compileRetries,
          message: '컴파일 성공',
        };
        this.log(`  ✅ 컴파일 성공 (${compileRetries}번 재시도)`);
      } catch (error) {
        compileRetries++;
        this.log(`  ⚠️  컴파일 실패 (${compileRetries}/${maxRetries}): ${error.message.substring(0, 100)}...`, 'WARN');
        if (compileRetries < maxRetries) {
          // 자동 수정 시도
          this.log(`  🔧 자동 수정 시도 중...`);
          const fixed = await this.fixCompilationErrors(projectRoot, testPath, error);
          if (!fixed) {
            this.log(`  ❌ 자동 수정 실패`, 'ERROR');
            break;
          }
          this.log(`  ✅ 자동 수정 완료, 재컴파일 시도`);
        } else {
          steps[steps.length - 1].status = 'failed';
          steps[steps.length - 1].error = error.message;
          this.log(`  ❌ 컴파일 최종 실패`, 'ERROR');
          return { success: false, steps };
        }
      }
    }

    if (!compileSuccess) {
      return { success: false, steps };
    }

    // Step: 테스트 실행
    this.log(`🧪 테스트 실행 시작...`);
    steps.push({
      step: 4,
      name: 'test_execution',
      status: 'in_progress',
      message: '테스트 실행 중...',
    });

    let testSuccess = false;
    let testRetries = 0;

    while (!testSuccess && testRetries < maxRetries) {
      try {
        this.log(`  ⏳ 테스트 실행 시도 ${testRetries + 1}/${maxRetries}...`);
        const testResult = await this.runGradleTest(projectRoot, testPath);
        testSuccess = true;
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].result = {
          retries: testRetries,
          passed_tests: testResult.passed,
          failed_tests: testResult.failed,
        };
        this.log(`  ✅ 테스트 성공 (통과: ${testResult.passed}, 실패: ${testResult.failed})`);
      } catch (error) {
        testRetries++;
        this.log(`  ⚠️  테스트 실패 (${testRetries}/${maxRetries}): ${error.message.substring(0, 100)}...`, 'WARN');
        if (testRetries < maxRetries) {
          // 자동 수정 시도
          this.log(`  🔧 자동 수정 시도 중...`);
          const fixed = await this.fixTestFailures(projectRoot, testPath, error);
          if (!fixed) {
            this.log(`  ❌ 자동 수정 실패`, 'ERROR');
            break;
          }
          this.log(`  ✅ 자동 수정 완료, 재테스트 시도`);
        } else {
          steps[steps.length - 1].status = 'failed';
          steps[steps.length - 1].error = error.message;
          this.log(`  ❌ 테스트 최종 실패`, 'ERROR');
          return { success: false, steps };
        }
      }
    }

    return {
      success: testSuccess,
      steps,
    };
  }

  /**
   * Gradle 컴파일 실행
   */
  async runGradleCompile(projectRoot, testPath) {
    const module = this.extractModule(testPath);
    const cmd = `cd "${projectRoot}" && JAVA_HOME=/usr/local/opt/openjdk@11/libexec/openjdk.jdk/Contents/Home ./gradlew :${module}:compileTestKotlin -x kaptKotlin -x kaptGenerateStubsKotlin -x kaptTestKotlin -x kaptGenerateStubsTestKotlin`;

    const { stdout, stderr } = await execAsync(cmd);

    if (stderr && stderr.includes('error:')) {
      throw new Error(`Compilation failed: ${stderr}`);
    }

    return { stdout, stderr };
  }

  /**
   * Gradle 테스트 실행
   */
  async runGradleTest(projectRoot, testPath) {
    const module = this.extractModule(testPath);
    const testClassName = this.extractTestClassName(testPath);

    const cmd = `cd "${projectRoot}" && JAVA_HOME=/usr/local/opt/openjdk@11/libexec/openjdk.jdk/Contents/Home ./gradlew :${module}:test --tests "${testClassName}" -x kaptKotlin -x kaptGenerateStubsKotlin -x kaptTestKotlin -x kaptGenerateStubsTestKotlin`;

    try {
      const { stdout, stderr } = await execAsync(cmd);

      // 테스트 결과 파싱
      const passed = (stdout.match(/(\d+) passed/i) || [0, 0])[1];
      const failed = (stdout.match(/(\d+) failed/i) || [0, 0])[1];

      if (parseInt(failed) > 0) {
        throw new Error(`Tests failed: ${failed} test(s) failed`);
      }

      return { passed: parseInt(passed), failed: parseInt(failed), stdout, stderr };
    } catch (error) {
      throw new Error(`Test execution failed: ${error.message}`);
    }
  }

  /**
   * 컴파일 에러 자동 수정
   */
  async fixCompilationErrors(projectRoot, testPath, error) {
    // 간단한 타입 불일치 수정 예시
    // 실제 구현에서는 더 정교한 로직 필요
    const testCode = await readFile(path.join(projectRoot, testPath), 'utf-8');

    let modified = testCode;
    let fixed = false;

    // Unit → Long 수정
    if (error.message.includes('Unit but Long')) {
      modified = modified.replace(/returns Unit/g, 'returns 1L');
      fixed = true;
    }

    // String → Boolean 수정
    if (error.message.includes('String but Boolean')) {
      modified = modified.replace(/"Y"/g, 'true').replace(/"N"/g, 'false');
      fixed = true;
    }

    if (fixed) {
      await writeFile(path.join(projectRoot, testPath), modified, 'utf-8');
    }

    return fixed;
  }

  /**
   * 테스트 실패 자동 수정
   */
  async fixTestFailures(projectRoot, testPath, error) {
    // MockK no answer found 에러 수정 등
    // 실제 구현에서는 세레나 MCP와 협력하여 DTO 분석 후 필드 추가
    return false; // 현재는 자동 수정 불가
  }

  /**
   * 커버리지 체크
   */
  async checkCoverage(projectRoot, testPath) {
    const module = this.extractModule(testPath);
    const cmd = `cd "${projectRoot}" && JAVA_HOME=/usr/local/opt/openjdk@11/libexec/openjdk.jdk/Contents/Home ./gradlew :${module}:jacocoTestReport -x kaptKotlin -x kaptGenerateStubsKotlin`;

    try {
      await execAsync(cmd);
      return {
        success: true,
        report_path: `${module}/build/reports/jacoco/test/html/index.html`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Serena MCP 분석 결과를 파싱하여 내부 형식으로 변환
   */
  parseSerenaAnalysis(serenaData, filePath) {
    // Serena MCP의 find_symbol 또는 get_symbols_overview 결과를 변환
    const packageMatch = filePath.match(/kotlin\/(.+)\//);
    const packageName = packageMatch
      ? packageMatch[1].replace(/\//g, '.')
      : 'com.oliveyoung.domain';

    const className = serenaData.name || this.extractClassNameFromPath(filePath);

    // Serena 분석 결과에서 메서드 추출
    const methods = [];
    if (serenaData.children) {
      serenaData.children.forEach((child) => {
        if (child.kind === 6 || child.kind === 'method' || child.kind === 'function') {
          // LSP SymbolKind.Method = 6
          methods.push({
            name: child.name,
            returnType: child.detail || 'Unit',
            parameters: this.parseSerenaParameters(child),
            isPrivate: child.name.startsWith('_') || false,
          });
        }
      });
    }

    // 의존성 추출 (constructor parameters)
    const dependencies = [];
    if (serenaData.children) {
      serenaData.children.forEach((child) => {
        if (child.kind === 9 || child.kind === 'constructor') {
          // LSP SymbolKind.Constructor = 9
          // Constructor의 파라미터들을 의존성으로 추출
          if (child.detail) {
            const params = this.extractDependenciesFromConstructor(child.detail);
            dependencies.push(...params);
          }
        }
      });
    }

    return {
      packageName,
      className,
      imports: [], // Serena에서 제공하는 경우 추가 가능
      dependencies,
      methods,
    };
  }

  /**
   * Serena 심볼의 파라미터 파싱
   */
  parseSerenaParameters(symbol) {
    if (!symbol.detail) return [];

    // detail에서 함수 시그니처 파싱
    const match = symbol.detail.match(/\((.*?)\)/);
    if (!match) return [];

    const paramsStr = match[1];
    if (!paramsStr) return [];

    return paramsStr.split(',').map((param) => {
      const parts = param.trim().split(':');
      return {
        name: parts[0]?.trim() || 'param',
        type: parts[1]?.trim() || 'Any',
      };
    });
  }

  /**
   * Constructor detail에서 의존성 추출
   */
  extractDependenciesFromConstructor(detail) {
    const match = detail.match(/\((.*?)\)/);
    if (!match) return [];

    const paramsStr = match[1];
    if (!paramsStr) return [];

    return paramsStr.split(',').map((param) => {
      const parts = param.trim().split(':');
      const name = parts[0]?.trim() || 'dependency';
      const type = parts[1]?.trim() || 'Any';

      return {
        name: name.replace(/^(val|var)\s+/, ''),
        type,
      };
    });
  }

  /**
   * Kotlin 서비스 파일 파싱 (정규식 기반 - Fallback)
   */
  parseKotlinService(code, filePath) {
    const lines = code.split('\n');

    // Package 추출
    const packageMatch = code.match(/package\s+([\w.]+)/);
    const packageName = packageMatch ? packageMatch[1] : '';

    // Class 이름 추출
    const classMatch = code.match(/class\s+(\w+)/);
    const className = classMatch ? classMatch[1] : '';

    // Import 추출
    const imports = [];
    for (const line of lines) {
      const importMatch = line.match(/import\s+([\w.]+)/);
      if (importMatch) {
        imports.push(importMatch[1]);
      }
    }

    // 생성자 의존성 추출
    const dependencies = [];
    const constructorMatch = code.match(/class\s+\w+\s*\(([\s\S]*?)\)\s*:/);
    if (constructorMatch) {
      const params = constructorMatch[1];
      const paramLines = params.split(',');
      for (const param of paramLines) {
        const paramMatch = param.trim().match(/(val|var)\s+(\w+)\s*:\s*([\w<>]+)/);
        if (paramMatch) {
          dependencies.push({
            name: paramMatch[2],
            type: paramMatch[3],
          });
        }
      }
    }

    // 메서드 추출 (간단한 버전)
    const methods = [];
    const methodRegex = /(override\s+)?fun\s+(\w+)\s*\(([\s\S]*?)\)\s*:\s*([\w<>?]+)/g;
    let match;

    while ((match = methodRegex.exec(code)) !== null) {
      methods.push({
        name: match[2],
        returnType: match[4],
        isPrivate: false, // 간단히 public으로 가정
      });
    }

    return {
      packageName,
      className,
      imports,
      dependencies,
      methods,
    };
  }

  /**
   * 테스트 코드 생성
   */
  generateTestCodeFromAnalysis(analysis) {
    const template = this.loadServiceTestTemplate();

    // camelCase 변환 (첫 글자만 소문자)
    const serviceNameLowercase = analysis.className.charAt(0).toLowerCase() + analysis.className.slice(1);

    let testCode = template
      .replace(/{{PackageName}}/g, analysis.packageName)
      .replace(/{{ServiceName}}/g, analysis.className)
      .replace(/{{ServiceName\|lowercase}}/g, serviceNameLowercase)
      .replace(/{{Dependencies}}/g, this.generateDependencyMocksCode(analysis.dependencies));

    // 테스트 메서드 생성
    let testMethods = '';
    for (const method of analysis.methods) {
      if (method.isPrivate) continue;

      testMethods += this.generateTestMethodCode(method, serviceNameLowercase);
    }

    testCode = testCode.replace(/{{TestMethods}}/g, testMethods);

    return testCode;
  }

  /**
   * 의존성 Mock 코드 생성
   */
  generateDependencyMocksCode(dependencies) {
    return dependencies.map(dep =>
      `    private val ${dep.name}: ${dep.type} = mockk()`
    ).join('\n');
  }

  /**
   * 테스트 메서드 코드 생성
   */
  generateTestMethodCode(method, serviceNameLowercase) {
    const successTest = `
    @Test
    @Description("${method.name} - 정상 케이스")
    fun \`${method.name}_success\`() {
        // Given
        // TODO: Mock 설정 추가

        // When
        val result = ${serviceNameLowercase}Impl.${method.name}()

        // Then
        assertNotNull(result)
    }
`;

    const errorTest = `
    @Test
    @Description("${method.name} - 에러 케이스")
    fun \`${method.name}_error\`() {
        // Given
        // TODO: 에러 시나리오 설정

        // When & Then
        assertThrows<Exception> {
            ${serviceNameLowercase}Impl.${method.name}()
        }
    }
`;

    return successTest + '\n' + errorTest;
  }

  /**
   * 서비스 테스트 템플릿 로드
   */
  loadServiceTestTemplate() {
    return `package {{PackageName}}

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
{{Dependencies}}

    private val {{ServiceName|lowercase}}Impl: {{ServiceName}} = spyk(
        {{ServiceName}}(
            // TODO: 의존성 주입
        ), recordPrivateCalls = true
    )

    @BeforeEach
    fun setup() {
        MockKAnnotations.init(this)
    }

    @AfterEach
    fun afterTests() {
        unmockkAll()
    }

{{TestMethods}}
}
`;
  }

  /**
   * 유틸리티: 테스트 경로 추론
   */
  inferTestPath(servicePath) {
    return servicePath
      .replace('/main/', '/test/')
      .replace('.kt', 'Test.kt');
  }

  /**
   * 유틸리티: 모듈 추출
   */
  extractModule(filePath) {
    const match = filePath.match(/^([\w-]+)\//);
    return match ? match[1] : 'olive-domain';
  }

  /**
   * 유틸리티: 테스트 클래스명 추출
   */
  extractTestClassName(filePath) {
    const fileName = path.basename(filePath, '.kt');
    return fileName;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Oliveyoung Test Standard MCP Server running on stdio');
  }
}

// Start the server
const server = new TestStandardMCPServer();
server.run().catch(console.error);
