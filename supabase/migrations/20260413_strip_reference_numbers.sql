-- 체크리스트/본문 텍스트에서 참조번호 (1), (3)(5) 등 제거
-- 원본 docx 각주 번호가 시드 데이터에 남아있던 문제 수정

BEGIN;

-- pregnancy_week_data: baby_summary, mother_summary
UPDATE content.pregnancy_week_data
SET
  baby_summary  = regexp_replace(
    regexp_replace(baby_summary, E'\\s?\\(\\d{1,2}\\)(\\(\\d{1,2}\\))*[,. -]*', '', 'g'),
    E'\\. *; *', '. ', 'g'),
  mother_summary = regexp_replace(
    regexp_replace(mother_summary, E'\\s?\\(\\d{1,2}\\)(\\(\\d{1,2}\\))*[,. -]*', '', 'g'),
    E'\\. *; *', '. ', 'g'),
  updated_at = timezone('utc', now())
WHERE baby_summary ~ E'\\(\\d{1,2}\\)' OR mother_summary ~ E'\\(\\d{1,2}\\)'
   OR baby_summary ~ E'\\.; ' OR mother_summary ~ E'\\.; ';

-- pregnancy_day_contents: baby_development_payload, mother_changes_payload
UPDATE content.pregnancy_day_contents
SET
  baby_development_payload = regexp_replace(
    regexp_replace(baby_development_payload::text, E'\\s?\\(\\d{1,2}\\)(\\(\\d{1,2}\\))*[,. -]*', '', 'g'),
    E'\\. *; *', '. ', 'g')::jsonb,
  mother_changes_payload = regexp_replace(
    regexp_replace(mother_changes_payload::text, E'\\s?\\(\\d{1,2}\\)(\\(\\d{1,2}\\))*[,. -]*', '', 'g'),
    E'\\. *; *', '. ', 'g')::jsonb,
  updated_at = timezone('utc', now())
WHERE baby_development_payload::text ~ E'\\(\\d{1,2}\\)' OR mother_changes_payload::text ~ E'\\(\\d{1,2}\\)'
   OR baby_development_payload::text ~ E'\\.; ' OR mother_changes_payload::text ~ E'\\.; ';

-- week_checklists: title, description, checklist_payload
UPDATE content.week_checklists
SET
  title = regexp_replace(
    regexp_replace(title, E'\\s?\\(\\d{1,2}\\)(\\(\\d{1,2}\\))*[,. -]*', '', 'g'),
    E'\\. *; *', '. ', 'g'),
  description = regexp_replace(
    regexp_replace(description, E'\\s?\\(\\d{1,2}\\)(\\(\\d{1,2}\\))*[,. -]*', '', 'g'),
    E'\\. *; *', '. ', 'g'),
  checklist_payload = regexp_replace(
    regexp_replace(checklist_payload::text, E'\\s?\\(\\d{1,2}\\)(\\(\\d{1,2}\\))*[,. -]*', '', 'g'),
    E'\\. *; *', '. ', 'g')::jsonb,
  updated_at = timezone('utc', now())
WHERE title ~ E'\\(\\d{1,2}\\)' OR description ~ E'\\(\\d{1,2}\\)' OR checklist_payload::text ~ E'\\(\\d{1,2}\\)'
   OR title ~ E'\\.; ' OR description ~ E'\\.; ' OR checklist_payload::text ~ E'\\.; ';

-- week_questions: title, description
UPDATE content.week_questions
SET
  title = regexp_replace(
    regexp_replace(title, E'\\s?\\(\\d{1,2}\\)(\\(\\d{1,2}\\))*[,. -]*', '', 'g'),
    E'\\. *; *', '. ', 'g'),
  description = regexp_replace(
    regexp_replace(description, E'\\s?\\(\\d{1,2}\\)(\\(\\d{1,2}\\))*[,. -]*', '', 'g'),
    E'\\. *; *', '. ', 'g'),
  updated_at = timezone('utc', now())
WHERE title ~ E'\\(\\d{1,2}\\)' OR description ~ E'\\(\\d{1,2}\\)'
   OR title ~ E'\\.; ' OR description ~ E'\\.; ';

-- 이동(2)해 → 이동해 (본문 내 임베디드 참조번호)
UPDATE content.pregnancy_day_contents
SET
  baby_development_payload = replace(baby_development_payload::text, '이동(2)해', '이동해')::jsonb,
  updated_at = timezone('utc', now())
WHERE baby_development_payload::text LIKE '%이동(2)해%';

-- 4) 태교 질문 오염 데이터 수정
UPDATE content.week_checklists
SET
  title = replace(title, '4) 태교 질문', ''),
  description = replace(description, '4) 태교 질문', ''),
  checklist_payload = replace(checklist_payload::text, '4) 태교 질문', '')::jsonb,
  updated_at = timezone('utc', now())
WHERE title LIKE '%4) 태교 질문%' OR description LIKE '%4) 태교 질문%' OR checklist_payload::text LIKE '%4) 태교 질문%';

-- 이중 마침표 정리
UPDATE content.pregnancy_day_contents
SET
  baby_development_payload = regexp_replace(baby_development_payload::text, E'\\.{2,}', '.', 'g')::jsonb,
  mother_changes_payload = regexp_replace(mother_changes_payload::text, E'\\.{2,}', '.', 'g')::jsonb,
  updated_at = timezone('utc', now())
WHERE baby_development_payload::text ~ E'\\.{2,}' OR mother_changes_payload::text ~ E'\\.{2,}';

COMMIT;
