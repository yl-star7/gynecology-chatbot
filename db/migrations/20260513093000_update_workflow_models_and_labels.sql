-- Align admin workflow rows with the Gemini 3.1 Flash-Lite runtime model and
-- operator-facing labels used by the workflow screen.

WITH catalog(slug, name, trigger, retrieval_scope, model_name) AS (
  VALUES
    (
      'maternal-nursing-monolith',
      '기본 상담 흐름',
      '앱 채팅 시작',
      '모바일 채팅 전체 흐름',
      'gemini-3.1-flash-lite'
    ),
    (
      'maternal-nursing-router',
      '대화 단계 분류',
      '대화 단계 선택',
      '주차 정보, 공감 대화, 자유 상담 분기',
      'gemini-3.1-flash-lite'
    ),
    (
      'maternal-nursing-baby-info',
      '주차 정보 답변',
      '주차 정보 요청',
      '임신백과 주차 정보',
      'gemini-3.1-flash-lite'
    ),
    (
      'maternal-nursing-letter-reflection',
      '오늘 질문 공감 답변',
      '오늘 질문 답변 중',
      '질문 답변과 대화 맥락',
      'gemini-3.1-flash-lite'
    ),
    (
      'maternal-nursing-free-chat',
      '자유 상담',
      '질문 완료 후 자유 대화',
      '최근 대화 맥락',
      'gemini-3.1-flash-lite'
    ),
    (
      'maternal-nursing-general',
      '기본 안내/응급 신호',
      '분류가 애매한 질문',
      '일반 상담 안전장치',
      'gemini-3.1-flash-lite'
    )
)
UPDATE public.workflow_definitions AS workflow
SET
  name = catalog.name,
  config = workflow.config ||
    jsonb_build_object(
      'modelName', catalog.model_name,
      'retrievalScope', catalog.retrieval_scope
    ),
  metadata = workflow.metadata ||
    jsonb_build_object(
      'trigger', catalog.trigger,
      'retrievalScope', catalog.retrieval_scope,
      'modelName', catalog.model_name
    ),
  updated_at = timezone('utc', now())
FROM catalog
WHERE workflow.slug = catalog.slug
  AND workflow.provider = 'gcs-yaml';
