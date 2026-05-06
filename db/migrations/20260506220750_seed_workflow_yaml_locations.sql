-- Seed DB-backed YAML workflow locations for the mobile chat runtime and
-- admin workflow editor. Runtime code reads these rows first; do not rely on
-- env vars or synthetic catalog rows for GCS YAML paths.

WITH catalog(slug, name, workflow_kind, trigger, retrieval_scope, model_name, gcs_object) AS (
  VALUES
    (
      'maternal-nursing-monolith',
      '모성간호 monolith (채팅 런타임)',
      'monolith',
      'mobile chat runtime',
      '모바일 채팅 런타임 YAML',
      'gemini-2.5-flash-lite',
      'maternal-nursing.yaml'
    ),
    (
      'maternal-nursing-router',
      '모성간호 router (stage 분기)',
      'router',
      'stage router',
      'stage 기반 subworkflow 라우팅',
      'gemini-2.5-flash-lite',
      'maternal-nursing-router.yaml'
    ),
    (
      'maternal-nursing-baby-info',
      '모성간호 baby_info (주차 정보 요약)',
      'subworkflow',
      'stage=0 baby_info',
      '임신백과 주차 정보',
      'gemini-2.5-flash-lite',
      'subworkflows/baby-info.yaml'
    ),
    (
      'maternal-nursing-letter-reflection',
      '모성간호 letter_reflection (편지/공감 대화)',
      'subworkflow',
      'stage=2 letter_reflection',
      '오늘 질문 답변 맥락',
      'gemini-2.5-flash-lite',
      'subworkflows/letter-reflection.yaml'
    ),
    (
      'maternal-nursing-free-chat',
      '모성간호 free_chat (자유 대화)',
      'subworkflow',
      'stage=free_chat',
      '자유 대화',
      'gemini-2.5-flash-lite',
      'subworkflows/free-chat.yaml'
    ),
    (
      'maternal-nursing-general',
      '모성간호 general (폴백)',
      'subworkflow',
      'fallback/general',
      '일반 상담 폴백',
      'gemini-2.5-flash-lite',
      'subworkflows/general.yaml'
    )
),
seed AS (
  SELECT
    slug,
    name,
    workflow_kind,
    trigger,
    retrieval_scope,
    model_name,
    'agaya-workflow-config'::text AS gcs_bucket,
    gcs_object,
    'gs://agaya-workflow-config/' || gcs_object AS storage_path
  FROM catalog
)
INSERT INTO public.workflow_definitions (
  slug,
  name,
  provider,
  status,
  is_active,
  config,
  metadata
)
SELECT
  slug,
  name,
  'gcs-yaml',
  'published',
  true,
  jsonb_build_object(
    'workflowKind', workflow_kind,
    'yamlSource', 'gcs',
    'storagePath', storage_path,
    'gcsBucket', gcs_bucket,
    'gcsObject', gcs_object
  ),
  jsonb_build_object(
    'trigger', trigger,
    'retrievalScope', retrieval_scope,
    'modelName', model_name,
    'workflowKind', workflow_kind,
    'yamlSource', 'gcs',
    'storagePath', storage_path,
    'gcsBucket', gcs_bucket,
    'gcsObject', gcs_object,
    'managedBy', 'admin-workflow-yaml-catalog'
  )
FROM seed
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  provider = 'gcs-yaml',
  status = 'published',
  is_active = true,
  config = public.workflow_definitions.config ||
    jsonb_build_object(
      'workflowKind', EXCLUDED.config ->> 'workflowKind',
      'yamlSource', 'gcs',
      'storagePath', COALESCE(
        public.workflow_definitions.metadata ->> 'storagePath',
        public.workflow_definitions.config ->> 'storagePath',
        public.workflow_definitions.metadata ->> 'storage_path',
        public.workflow_definitions.config ->> 'storage_path',
        public.workflow_definitions.metadata ->> 'gcsPath',
        public.workflow_definitions.config ->> 'gcsPath',
        EXCLUDED.config ->> 'storagePath'
      ),
      'gcsBucket', COALESCE(
        public.workflow_definitions.metadata ->> 'gcsBucket',
        public.workflow_definitions.config ->> 'gcsBucket',
        public.workflow_definitions.metadata ->> 'gcs_bucket',
        public.workflow_definitions.config ->> 'gcs_bucket',
        EXCLUDED.config ->> 'gcsBucket'
      ),
      'gcsObject', COALESCE(
        public.workflow_definitions.metadata ->> 'gcsObject',
        public.workflow_definitions.config ->> 'gcsObject',
        public.workflow_definitions.metadata ->> 'gcs_object',
        public.workflow_definitions.config ->> 'gcs_object',
        public.workflow_definitions.metadata ->> 'yamlObject',
        public.workflow_definitions.config ->> 'yamlObject',
        EXCLUDED.config ->> 'gcsObject'
      )
    ),
  metadata = public.workflow_definitions.metadata ||
    jsonb_build_object(
      'trigger', EXCLUDED.metadata ->> 'trigger',
      'retrievalScope', EXCLUDED.metadata ->> 'retrievalScope',
      'modelName', EXCLUDED.metadata ->> 'modelName',
      'workflowKind', EXCLUDED.metadata ->> 'workflowKind',
      'yamlSource', 'gcs',
      'storagePath', COALESCE(
        public.workflow_definitions.metadata ->> 'storagePath',
        public.workflow_definitions.config ->> 'storagePath',
        public.workflow_definitions.metadata ->> 'storage_path',
        public.workflow_definitions.config ->> 'storage_path',
        public.workflow_definitions.metadata ->> 'gcsPath',
        public.workflow_definitions.config ->> 'gcsPath',
        EXCLUDED.metadata ->> 'storagePath'
      ),
      'gcsBucket', COALESCE(
        public.workflow_definitions.metadata ->> 'gcsBucket',
        public.workflow_definitions.config ->> 'gcsBucket',
        public.workflow_definitions.metadata ->> 'gcs_bucket',
        public.workflow_definitions.config ->> 'gcs_bucket',
        EXCLUDED.metadata ->> 'gcsBucket'
      ),
      'gcsObject', COALESCE(
        public.workflow_definitions.metadata ->> 'gcsObject',
        public.workflow_definitions.config ->> 'gcsObject',
        public.workflow_definitions.metadata ->> 'gcs_object',
        public.workflow_definitions.config ->> 'gcs_object',
        public.workflow_definitions.metadata ->> 'yamlObject',
        public.workflow_definitions.config ->> 'yamlObject',
        EXCLUDED.metadata ->> 'gcsObject'
      ),
      'managedBy', 'admin-workflow-yaml-catalog'
    ),
  updated_at = timezone('utc', now());
