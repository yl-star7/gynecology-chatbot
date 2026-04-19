const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Next.js 앱의 경로를 지정하여 next.config.js 및 .env 파일을 로드합니다
  dir: "./",
});

// Jest에 전달할 사용자 정의 설정
const customJestConfig = {
  // 각 테스트 실행 전에 실행할 설정 파일들
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  watchman: false,

  // 모듈을 찾을 때 사용할 환경
  testEnvironment: "jsdom",

  // 테스트 파일 패턴
  testMatch: [
    "**/__tests__/**/*.(js|jsx|ts|tsx)",
    "**/*.(test|spec).(js|jsx|ts|tsx)",
  ],

  // 무시할 패턴들
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/.next/standalone/",
    "<rootDir>/e2e/.*\\.spec\\.(js|jsx|ts|tsx)$",
  ],

  modulePathIgnorePatterns: ["<rootDir>/.next/"],

  // 변환 설정
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },

  // 모듈 이름 매핑 (절대 경로 지원)
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // 커버리지 설정
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "app/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!app/**/*.{js,jsx,ts,tsx}", // Next.js App Router 페이지 제외
    "!src/**/index.{js,jsx,ts,tsx}", // 인덱스 파일 제외
  ],

  // 커버리지 임계값
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // 모듈 파일 확장자
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // 전역 설정
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
};

// createJestConfig는 비동기이므로 Jest가 next/jest의 설정을 로드할 수 있도록 내보냅니다
module.exports = createJestConfig(customJestConfig);
