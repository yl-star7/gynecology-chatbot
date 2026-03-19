# Pregnancy DOCX Seed Import Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DOCX 원본에서 주차별/일자별 임신 콘텐츠를 정규화하고, Supabase Storage + PostgreSQL 메타데이터로 시드할 수 있는 경로를 만든다.

**Architecture:** 주차 요약은 기존 `content.pregnancy_week_data`에 유지하고, 일일 본문/질문/체크리스트/이미지 메타데이터는 신규 일자 테이블들로 분리한다. 시드 스크립트는 DOCX 텍스트와 임베드 이미지를 파싱해 정규화한 뒤, Storage 업로드와 Postgres upsert를 순차 실행한다.

**Tech Stack:** Supabase Storage, PostgreSQL, TypeScript, tsx, Jest, Next.js workspace utilities

---

## Chunk 1: Schema

### Task 1: 신규 일자 콘텐츠 테이블 계약을 테스트와 스키마에 반영

**Files:**
- Modify: `packages/db/src/schema.test.ts`
- Modify: `packages/db/src/schema.ts`
- Modify: `apps/web/src/lib/mobile/local-postgres-schema.ts`
- Modify: `supabase/migrations/20260319_week_content_and_response_schema.sql`

- [ ] **Step 1: 신규 테이블 export 기대를 테스트로 고정**
- [ ] **Step 2: 테스트 실행으로 실패 확인**
- [ ] **Step 3: `pregnancy_day_contents`, `pregnancy_day_media` 및 day linkage 컬럼 추가**
- [ ] **Step 4: 테스트 재실행으로 통과 확인**

## Chunk 2: Importer

### Task 2: DOCX 정규화 파서를 테스트 우선으로 구현

**Files:**
- Create: `apps/web/src/lib/content/pregnancy-docx-import.ts`
- Create: `apps/web/src/lib/content/pregnancy-docx-import.test.ts`

- [ ] **Step 1: plain text/day parsing과 image placement 기대 테스트 작성**
- [ ] **Step 2: 테스트 실행으로 실패 확인**
- [ ] **Step 3: 문서 텍스트 정규화, 출처 숫자 제거, week/day 구조 파서 구현**
- [ ] **Step 4: 테스트 재실행으로 통과 확인**

### Task 3: 실행용 시드 스크립트 구현

**Files:**
- Create: `apps/web/scripts/import-pregnancy-docx.ts`
- Modify: `apps/web/package.json`

- [ ] **Step 1: 스크립트 엔트리와 CLI 옵션 계약 추가**
- [ ] **Step 2: Supabase Storage 업로드 + content schema upsert 연결**
- [ ] **Step 3: dry-run/json dump 옵션 추가**

## Chunk 3: Verification

### Task 4: 변경 범위 검증

**Files:**
- Modify: `docs/superpowers/plans/2026-03-19-pregnancy-docx-seed-import.md`

- [ ] **Step 1: 관련 Jest 테스트 실행**
- [ ] **Step 2: 타입체크 실행**
- [ ] **Step 3: dry-run으로 실제 DOCX 파싱 확인**
