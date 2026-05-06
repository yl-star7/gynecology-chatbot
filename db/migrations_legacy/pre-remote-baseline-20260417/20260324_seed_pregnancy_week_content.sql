-- Auto-generated from 임신 주수 별 발달정보 docx
-- Covers weeks: 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35

BEGIN;

-- ===== Week 5 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  5,
  '5주차 발달 정보',
  '아기의 크기는 참깨알만큼(약 2mm) 작지만, 심장이 단순한 형태로 형성되어 곧 뛰기 시작합니다.',
  '월경 예정일이 지나 임신 사실을 깨닫게 되는 시기입니다. 호르몬 변화로 인해 심한 피로감을 느낄 수 있습니다.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '5주 1일차',
  '{"items": ["아기의 크기는 참깨알만큼(약 2mm) 작지만, 심장이 단순한 형태로 형성되어 곧 뛰기 시작합니다."]}'::jsonb,
  '{"items": ["월경 예정일이 지나 임신 사실을 깨닫게 되는 시기입니다.", "호르몬 변화로 인해 심한 피로감을 느낄 수 있습니다."]}'::jsonb,
  '아가는 심장이 오늘부터 콩닥거리기 시작했어요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 5
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '5주 2일차',
  '{"items": ["아기의 뇌와 척수가 될 신경관이 형성되기 시작하며, 이는 태아 발달의 가장 중요한 첫 단계입니다.", "신경관 결손을 막기 위해 엽산 섭취가 매우 중요해요."]}'::jsonb,
  '{"items": ["유방이 부풀고 예민해지며, 젖꼭지에 통증이나 따끔거림을 느낄 수 있습니다.", "미열이 계속되어 감기 기운처럼 느껴질 수 있습니다."]}'::jsonb,
  '아가는 작은 두뇌가 쑥쑥 자라나고 있어요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 5
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '5주 3일차',
  '{"items": ["아기의 주요 기관인 간, 신장, 폐의 기초들이 빠르게 자리를 잡고 있어요.", "아기의 혈액 순환이 시작됩니다."]}'::jsonb,
  '{"items": ["메스꺼움과 입덧이 시작될 수 있으며, 이는 하루 중 언제든 나타날 수 있습니다.", "호르몬 변화로 후각이 예민해지거나 평소 좋아하던 음식에 대한 혐오감이 생길 수 있습니다."]}'::jsonb,
  '아가는 몸속에 작은 기관들이 생기고 있으며, 숨 쉬고, 먹고, 자랄 준비를 하고 있어요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 5
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '5주 4일차',
  '{"items": ["태반과 혈관이 발달하며, 엄마와 아기를 연결하는 탯줄의 기초가 만들어지고 있어요.", "태아를 보호하는 양막 주머니와 양수가 형성되기 시작합니다."]}'::jsonb,
  '{"items": ["커진 자궁이 방광을 압박하여 소변을 자주 보게 되는 빈뇨 증상이 나타납니다.", "소화가 느려지고 장 운동이 둔화되어 변비나 가스가 찰 수 있습니다."]}'::jsonb,
  '아가는 엄마 뱃속의 아늑한 양수 속에서 편안히 지내고 있어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 5
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '5주 5일차',
  '{"items": ["아기는 작은 올챙이 모양을 하고 있어요.", "머리, 몸통, 그리고 곧 팔다리가 될 부분이 나타나기 시작합니다."]}'::jsonb,
  '{"items": ["아랫배에 생리통과 비슷한 가벼운 경련이 느껴질 수 있습니다.", "자궁이 빠르게 확장하면서 가벼운 아랫배 당김이나 콕콕 쑤시는 듯한 느낌이 있을 수 있습니다.", "우윳빛의 질 분비물 양이 늘어날 수 있습니다."]}'::jsonb,
  '아가는 지금 폭풍처럼 자라고 있어요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 5
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '5주 6일차',
  '{"items": ["뇌와 척수, 혈관 발달이 더욱 빠르게 진행됩니다.", "신경 세포의 연결이 활발해집니다.", "얼굴의 윤곽, 눈, 귀의 형태가 생겨나기 시작합니다."]}'::jsonb,
  '{"items": ["임신 호르몬(에스트로겐, 프로게스테론)의 급격한 증가로 인해 감정 기복이 심해져 짜증, 불안, 우울감이 쉽게 찾아올 수 있습니다."]}'::jsonb,
  '엄마의 모든 소리와 감정이 아가에게 재미있는 자극이 되고 있어요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 5
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '5주 7일차',
  '{"items": ["초음파 검진에서 아기집(임신낭)과 함께 난황을 확인할 수 있어요.", "난황은 태반이 완성되기 전까지 아기에게 영양분을 공급해요."]}'::jsonb,
  '{"items": ["생리통보다 심한 복통이나 생리 양보다 많은 출혈이 있으면 유산의 징후일 수 있습니다.", "갑자기 입덧이나 증상이 사라지는 것도 주의해야 합니다."]}'::jsonb,
  '아가는 초음파에서 작은 모습을 보여주기 시작했어요. 엄마의 보살핌 덕분에 쑥쑥 클 거예요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 5
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 5)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w5-d1-cl-1', '산전 검진 예약을 했나요?', '산전 검진 예약을 했나요?', '{"items": [{"id": "w5-d1-cl-1", "label": "산전 검진 예약을 했나요?"}]}'::jsonb, 1, true),
    (1, 'w5-d1-cl-2', '엽산 복용을 시작했나요?', '엽산 복용을 시작했나요?', '{"items": [{"id": "w5-d1-cl-2", "label": "엽산 복용을 시작했나요?"}]}'::jsonb, 2, true),
    (1, 'w5-d1-cl-3', '카페인 섭취를 하루 200mg 이하로 줄였나요?', '카페인 섭취를 하루 200mg 이하로 줄였나요?', '{"items": [{"id": "w5-d1-cl-3", "label": "카페인 섭취를 하루 200mg 이하로 줄였나요?"}]}'::jsonb, 3, true),
    (2, 'w5-d2-cl-1', '엽산제를 오늘도 꾸준히 복용했나요?', '엽산제를 오늘도 꾸준히 복용했나요?', '{"items": [{"id": "w5-d2-cl-1", "label": "엽산제를 오늘도 꾸준히 복용했나요?"}]}'::jsonb, 1, true),
    (2, 'w5-d2-cl-2', '유방을 잘 받쳐주는 편안한 브래지어를 착용했나요?', '유방을 잘 받쳐주는 편안한 브래지어를 착용했나요?', '{"items": [{"id": "w5-d2-cl-2", "label": "유방을 잘 받쳐주는 편안한 브래지어를 착용했나요?"}]}'::jsonb, 2, true),
    (2, 'w5-d2-cl-3', '피로 해소를 위해 충분한 휴식을 취했나요?', '피로 해소를 위해 충분한 휴식을 취했나요?', '{"items": [{"id": "w5-d2-cl-3", "label": "피로 해소를 위해 충분한 휴식을 취했나요?"}]}'::jsonb, 3, true),
    (3, 'w5-d3-cl-1', '입덧 완화를 위해 소량씩 자주 식사했나요?', '입덧 완화를 위해 소량씩 자주 식사했나요?', '{"items": [{"id": "w5-d3-cl-1", "label": "입덧 완화를 위해 소량씩 자주 식사했나요?"}]}'::jsonb, 1, true),
    (3, 'w5-d3-cl-2', '날것, 가공육 등 피해야 할 음식을 삼갔나요?', '날것, 가공육 등 피해야 할 음식을 삼갔나요?', '{"items": [{"id": "w5-d3-cl-2", "label": "날것, 가공육 등 피해야 할 음식을 삼갔나요?"}]}'::jsonb, 2, true),
    (3, 'w5-d3-cl-3', '금주·금연을 실천하고 간접흡연을 피했나요?', '금주·금연을 실천하고 간접흡연을 피했나요?', '{"items": [{"id": "w5-d3-cl-3", "label": "금주·금연을 실천하고 간접흡연을 피했나요?"}]}'::jsonb, 3, true),
    (4, 'w5-d4-cl-1', '수분을 충분히 섭취하되, 밤에는 섭취량을 줄였나요?', '수분을 충분히 섭취하되, 밤에는 섭취량을 줄였나요?', '{"items": [{"id": "w5-d4-cl-1", "label": "수분을 충분히 섭취하되, 밤에는 섭취량을 줄였나요?"}]}'::jsonb, 1, true),
    (4, 'w5-d4-cl-2', '균형 잡힌 건강한 식사를 했나요?', '균형 잡힌 건강한 식사를 했나요?', '{"items": [{"id": "w5-d4-cl-2", "label": "균형 잡힌 건강한 식사를 했나요?"}]}'::jsonb, 2, true),
    (4, 'w5-d4-cl-3', '임산부용 비타민을 복용했나요?', '임산부용 비타민을 복용했나요?', '{"items": [{"id": "w5-d4-cl-3", "label": "임산부용 비타민을 복용했나요?"}]}'::jsonb, 3, true),
    (5, 'w5-d5-cl-1', '심한 경련이나 출혈 등 이상 증상이 있으면 즉시 병원에 연락할 준비가 되어 있나요?', '심한 경련이나 출혈 등 이상 증상이 있으면 즉시 병원에 연락할 준비가 되어 있나요?', '{"items": [{"id": "w5-d5-cl-1", "label": "심한 경련이나 출혈 등 이상 증상이 있으면 즉시 병원에 연락할 준비가 되어 있나요?"}]}'::jsonb, 1, true),
    (5, 'w5-d5-cl-2', '건강한 음식 위주로 균형 잡힌 식사를 했나요?', '건강한 음식 위주로 균형 잡힌 식사를 했나요?', '{"items": [{"id": "w5-d5-cl-2", "label": "건강한 음식 위주로 균형 잡힌 식사를 했나요?"}]}'::jsonb, 2, true),
    (5, 'w5-d5-cl-3', '임산부용 비타민을 오늘도 챙겨 복용했나요?', '임산부용 비타민을 오늘도 챙겨 복용했나요?', '{"items": [{"id": "w5-d5-cl-3", "label": "임산부용 비타민을 오늘도 챙겨 복용했나요?"}]}'::jsonb, 3, true),
    (6, 'w5-d6-cl-1', '심호흡이나 가벼운 운동으로 감정 기복을 조절했나요?', '심호흡이나 가벼운 운동으로 감정 기복을 조절했나요?', '{"items": [{"id": "w5-d6-cl-1", "label": "심호흡이나 가벼운 운동으로 감정 기복을 조절했나요?"}]}'::jsonb, 1, true),
    (6, 'w5-d6-cl-2', '긍정적인 마음가짐을 유지하려고 노력했나요?', '긍정적인 마음가짐을 유지하려고 노력했나요?', '{"items": [{"id": "w5-d6-cl-2", "label": "긍정적인 마음가짐을 유지하려고 노력했나요?"}]}'::jsonb, 2, true),
    (6, 'w5-d6-cl-3', '단백질과 엽산 등 균형 잡힌 영양을 섭취했나요?', '단백질과 엽산 등 균형 잡힌 영양을 섭취했나요?', '{"items": [{"id": "w5-d6-cl-3", "label": "단백질과 엽산 등 균형 잡힌 영양을 섭취했나요?"}]}'::jsonb, 3, true),
    (7, 'w5-d7-cl-1', '심한 출혈이나 복통 등 이상 징후가 없는지 확인했나요?', '심한 출혈이나 복통 등 이상 징후가 없는지 확인했나요?', '{"items": [{"id": "w5-d7-cl-1", "label": "심한 출혈이나 복통 등 이상 징후가 없는지 확인했나요?"}]}'::jsonb, 1, true),
    (7, 'w5-d7-cl-2', '복용 중인 약물이나 보조제의 안전성을 의사에게 확인했나요?', '복용 중인 약물이나 보조제의 안전성을 의사에게 확인했나요?', '{"items": [{"id": "w5-d7-cl-2", "label": "복용 중인 약물이나 보조제의 안전성을 의사에게 확인했나요?"}]}'::jsonb, 2, true),
    (7, 'w5-d7-cl-3', '산전 검진 일정을 확인하고 준비했나요?', '산전 검진 일정을 확인하고 준비했나요?', '{"items": [{"id": "w5-d7-cl-3", "label": "산전 검진 일정을 확인하고 준비했나요?"}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 5)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w5-d1-q-1', '아기의 심장 박동이 시작된 오늘, 엄마로서 아기에게 가장 먼저 전하고 싶은 축하와 사랑의 메시지는 무엇인가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w5-d1-q-2', '임신으로 인한 피로감 앞에서, 엄마는 자신의 몸을 어떻게 돌보고 위로하며 충분한 휴식을 취할 계획인가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (1, 'w5-d1-q-3', '초음파로 아기의 콩닥거리는 심장 소리를 들을 순간을 상상하며, 그때 아기에게 가장 먼저 해주고 싶은 특별한 말은 무엇인가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (2, 'w5-d2-q-1', '아기의 뇌가 쑥쑥 자랄 수 있도록, 엄마는 오늘 어떤 좋은 생각을 하고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w5-d2-q-2', '아기를 맞이할 준비로 변화하는 엄마의 가슴에 어떤 감사와 격려의 말을 전하고 싶나요? 이 변화를 통해 느끼는 엄마의 감정은 무엇인가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w5-d2-q-3', '아기가 세상에 나와 엄마의 목소리를 들을 날을 상상하며, 아기에게 불러주고 싶은 자장가나 특별한 노래의 한 소절을 적어볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (3, 'w5-d3-q-1', '입덧으로 인해 몸은 힘들지라도, 아기에게 기쁘고 평온한 엄마의 마음을 전해볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w5-d3-q-2', '아기의 기관들이 잘 만들어지도록, 오늘 특별히 감사한 몸의 부분이 있다면 어디인가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w5-d3-q-3', '아기와 엄마가 앞으로 함께할 건강하고 행복한 미래의 나날들을 상상하며, 가장 기대되는 장면은 무엇인가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (4, 'w5-d4-q-1', '아기에게 가장 안전하고 아늑한 공간을 제공하고 있는 자궁에게, 엄마가 느끼는 감사함과 사랑을 어떻게 표현하고 싶나요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w5-d4-q-2', '화장실에 자주 가거나 변비가 불편해도 아기가 잘 자라는 증거라고 긍정적으로 생각하며, 엄마는 이 증상들을 어떻게 이겨내고 마음을 다잡고 있나요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w5-d4-q-3', '탯줄처럼 엄마와 아기의 소중한 연결고리에 대해 엄마가 느끼는 감정과 아기에게 전하고 싶은 사랑의 메시지를 전해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (5, 'w5-d5-q-1', '아기의 작은 팔다리를 상상하며, 아기와 함께할 미래의 즐거운 활동에 대해 이야기해주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w5-d5-q-2', '아랫배의 가벼운 당김이 아기가 자라는 소리라고 생각하며, 엄마는 아기와 자신의 몸에게 위로와 격려의 말을 건네볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w5-d5-q-3', '아기가 곧 사람의 형태를 갖출 것을 상상하며, 아기의 건강한 성장을 응원해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (6, 'w5-d6-q-1', '엄마의 마음이 때때로 파도처럼 일렁이지만, 아기에게는 어떤 안정적인 느낌을 전해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w5-d6-q-2', '불안할 때마다 아기의 성장을 떠올리며, ''우리 아기 덕분에 엄마는 괜찮아''라고 말해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w5-d6-q-3', '아기의 작은 눈과 귀를 떠올리며, 아기가 세상에서 처음 듣고 보게 될 아름다운 것에 대해 이야기해주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (7, 'w5-d7-q-1', '아기집이 건강하다는 것을 확인하며, 아기가 이곳에서 얼마나 잘 자랄지 기대하는 마음을 표현해주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w5-d7-q-2', '몸의 작은 변화에 민감하게 반응하지 않고, 아기를 믿고 기다릴 것을 다짐해볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w5-d7-q-3', '난황이 영양분을 공급하는 것처럼, 엄마는 아기의 마음을 항상 채워줄 것을 약속해볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 6 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  6,
  '6주차 발달 정보',
  '아기의 크기는 약 4~5mm, 작은 콩알 크기로 자랐어요. 심장은 1분에 100~150번 정도 뛴답니다.',
  '유방이 더욱 커지고 단단해지며, 젖꼭지와 유륜의 색이 진해질 수 있어요. 황체호르몬 때문에 잠이 쏟아지는 극심한 피로감을 느낄 수 있답니다.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '6주 1일차',
  '{"items": ["아기의 크기는 약 4~5mm, 작은 콩알 크기로 자랐어요.", "심장은 1분에 100~150번 정도 뛴답니다."]}'::jsonb,
  '{"items": ["유방이 더욱 커지고 단단해지며, 젖꼭지와 유륜의 색이 진해질 수 있어요.", "황체호르몬 때문에 잠이 쏟아지는 극심한 피로감을 느낄 수 있답니다."]}'::jsonb,
  '아가는 심장 소리를 들려주며 여기서 콩닥콩닥 열심히 뛰고 있어요!',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 6
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '6주 2일차',
  '{"items": ["뇌와 척수를 이룰 신경 세포의 약 80%가 이 시기에 만들어지고 있어요.", "태아의 머리와 꼬리가 생겨나 올챙이처럼 보인답니다."]}'::jsonb,
  '{"items": ["입덧 증세(메스꺼움, 구토)가 심해져 하루 종일 지속될 수 있어요.", "입안에서 구리 맛 같은 ''금속 맛''이 느껴져 불쾌할 수 있어요. 이는 에스트로겐 급증 때문이랍니다.", "자궁이 점차 커지면서 자궁 주변 인대가 늘어나 아랫배에 당김이나 묵직한 느낌이 들 수 있어요."]}'::jsonb,
  '아가는 작은 머릿속에 똑똑한 세포들이 가득 생기고 있어요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 6
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '6주 3일차',
  '{"items": ["심장이 좌심실과 우심실로 분리되는 등 복잡하게 발달하고 있어요.", "주요 장기(폐의 기관지, 간 등)의 분화가 빠르게 진행된답니다."]}'::jsonb,
  '{"items": ["임신 호르몬의 영향으로 소화 속도가 느려져 가스, 붓기, 속 쓰림 증상을 흔히 경험할 수 있어요.", "질 분비물의 양이 늘어나 끈적한 유백색 분비물을 볼 수 있답니다."]}'::jsonb,
  '아가는 심장이 좌우로 나뉘었어요. 더 튼튼하게 엄마 품으로 갈 준비 중이에요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 6
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '6주 4일차',
  '{"items": ["팔과 다리가 될 부분이 짧은 지느러미처럼 솟아났어요.", "눈과 콧구멍은 검은 점처럼, 귀가 될 부분은 작은 구멍처럼 보이기 시작하며 얼굴 윤곽의 기초가 잡히고 있답니다."]}'::jsonb,
  '{"items": ["커진 자궁이 방광을 압박하여 소변이 자주 마려운 빈뇨 증상이 심화될 수 있어요.", "아랫배가 콕콕 쑤시거나 당기는 가벼운 통증이 느껴질 수 있답니다.", "임신 초기의 흔한 증상인 두통이 나타날 수 있어요. 수면 부족, 탈수, 호르몬 변화 등이 주요 원인이랍니다."]}'::jsonb,
  '아가는 작은 팔다리가 생겼어요! 이제 엄마에게 손 흔들어 줄 수 있어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 6
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '6주 5일차',
  '{"items": ["아기는 얇고 투명한 막(양막)으로 감싸여 보호되고 있어요.", "아기는 이미 작은 혈관들을 가지고 있으며, 이 혈관들이 모여 탯줄을 이루기 시작해요."]}'::jsonb,
  '{"items": ["임신 호르몬의 변화로 피부에 트러블이 생기거나 흑피증(기미, 잡티)이 나타날 수 있어요.", "머리카락이 더 풍성하고 윤기 있게 변하는 증상도 나타날 수 있어요."]}'::jsonb,
  '아가는 보금자리가 더 넓어지고 있으며, 여기서 튼튼하게 자라고 있어요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 6
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '6주 6일차',
  '{"items": ["아기의 몸은 아직 C자 형태로 웅크려 있지만, 매우 빠르게 성장하고 있어요.", "눈꺼풀과 코끝이 생기기 시작하며, 귀 안팎의 구조가 발달한답니다."]}'::jsonb,
  '{"items": ["호르몬 변화로 인해 감정 기복이 심해져 쉽게 짜증을 내거나 우울감을 느낄 수 있어요.", "호르몬 변화로 인해 감정이 예민해지거나 불안감을 느끼는 것은 이 시기에 매우 흔한 일이에요.", "변비나 치질 증상이 심화될 수 있으므로 주의가 필요하답니다."]}'::jsonb,
  '아가는 올챙이에서 사람 모습으로 변신하고 있어요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 6
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '6주 7일차',
  '{"items": ["이 시기에는 필수적인 신체 구조들이 빠르게 발달하고 있어요.", "아기의 손과 발은 작은 주걱 모양으로 자라나고 있어요."]}'::jsonb,
  '{"items": ["갑자기 임신 증상(입덧, 가슴 통증 등)이 사라지거나 생리 양보다 많은 출혈, 심한 통증이 있다면 주의해야 해요. 이는 유산을 의심해야 하는 주의 징후랍니다."]}'::jsonb,
  '아가는 이제 가장 중요한 성장 단계를 끝내고 있어요. 이제부터는 더 튼튼하게 자랄 거예요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 6
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 6)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w6-d1-cl-1', '첫 산전 진찰을 예약하고, 담당 의사와 나눌 건강 이력을 정리했나요?', '첫 산전 진찰을 예약하고, 담당 의사와 나눌 건강 이력을 정리했나요?', '{"items": [{"id": "w6-d1-cl-1", "label": "첫 산전 진찰을 예약하고, 담당 의사와 나눌 건강 이력을 정리했나요?"}]}'::jsonb, 1, true),
    (1, 'w6-d1-cl-2', '유방을 잘 받쳐주는 편안한 브래지어를 착용했나요?', '유방을 잘 받쳐주는 편안한 브래지어를 착용했나요?', '{"items": [{"id": "w6-d1-cl-2", "label": "유방을 잘 받쳐주는 편안한 브래지어를 착용했나요?"}]}'::jsonb, 2, true),
    (1, 'w6-d1-cl-3', '극심한 피로가 느껴질 때 충분한 휴식을 취했나요?', '극심한 피로가 느껴질 때 충분한 휴식을 취했나요?', '{"items": [{"id": "w6-d1-cl-3", "label": "극심한 피로가 느껴질 때 충분한 휴식을 취했나요?"}]}'::jsonb, 3, true),
    (2, 'w6-d2-cl-1', '엽산 보충제를 오늘도 복용했나요?', '엽산 보충제를 오늘도 복용했나요?', '{"items": [{"id": "w6-d2-cl-1", "label": "엽산 보충제를 오늘도 복용했나요?"}]}'::jsonb, 1, true),
    (2, 'w6-d2-cl-2', '입덧 완화를 위해 소량씩 자주 식사했나요?', '입덧 완화를 위해 소량씩 자주 식사했나요?', '{"items": [{"id": "w6-d2-cl-2", "label": "입덧 완화를 위해 소량씩 자주 식사했나요?"}]}'::jsonb, 2, true),
    (2, 'w6-d2-cl-3', '아침에 일어나기 전 마른 크래커를 먹어봤나요?', '아침에 일어나기 전 마른 크래커를 먹어봤나요?', '{"items": [{"id": "w6-d2-cl-3", "label": "아침에 일어나기 전 마른 크래커를 먹어봤나요?"}]}'::jsonb, 3, true),
    (3, 'w6-d3-cl-1', '소화 불량 완화를 위해 음식을 조금씩 자주 먹었나요?', '소화 불량 완화를 위해 음식을 조금씩 자주 먹었나요?', '{"items": [{"id": "w6-d3-cl-1", "label": "소화 불량 완화를 위해 음식을 조금씩 자주 먹었나요?"}]}'::jsonb, 1, true),
    (3, 'w6-d3-cl-2', '금연·금주를 실천하고 카페인 섭취를 줄였나요?', '금연·금주를 실천하고 카페인 섭취를 줄였나요?', '{"items": [{"id": "w6-d3-cl-2", "label": "금연·금주를 실천하고 카페인 섭취를 줄였나요?"}]}'::jsonb, 2, true),
    (3, 'w6-d3-cl-3', '신선한 과일과 채소, 비타민을 충분히 섭취했나요?', '신선한 과일과 채소, 비타민을 충분히 섭취했나요?', '{"items": [{"id": "w6-d3-cl-3", "label": "신선한 과일과 채소, 비타민을 충분히 섭취했나요?"}]}'::jsonb, 3, true),
    (4, 'w6-d4-cl-1', '소변이 마려울 때 참지 않고 충분한 수분 섭취를 했나요?', '소변이 마려울 때 참지 않고 충분한 수분 섭취를 했나요?', '{"items": [{"id": "w6-d4-cl-1", "label": "소변이 마려울 때 참지 않고 충분한 수분 섭취를 했나요?"}]}'::jsonb, 1, true),
    (4, 'w6-d4-cl-2', '두통 예방을 위해 충분한 수면과 수분 섭취를 했나요?', '두통 예방을 위해 충분한 수면과 수분 섭취를 했나요?', '{"items": [{"id": "w6-d4-cl-2", "label": "두통 예방을 위해 충분한 수면과 수분 섭취를 했나요?"}]}'::jsonb, 2, true),
    (4, 'w6-d4-cl-3', '직장이나 생활환경에서 화학물질 등 위험 요소를 점검했나요?', '직장이나 생활환경에서 화학물질 등 위험 요소를 점검했나요?', '{"items": [{"id": "w6-d4-cl-3", "label": "직장이나 생활환경에서 화학물질 등 위험 요소를 점검했나요?"}]}'::jsonb, 3, true),
    (5, 'w6-d5-cl-1', '산전 비타민(엽산 포함)을 오늘도 복용했나요?', '산전 비타민(엽산 포함)을 오늘도 복용했나요?', '{"items": [{"id": "w6-d5-cl-1", "label": "산전 비타민(엽산 포함)을 오늘도 복용했나요?"}]}'::jsonb, 1, true),
    (5, 'w6-d5-cl-2', '피부 관리를 위해 신선한 과일·채소와 비타민을 섭취했나요?', '피부 관리를 위해 신선한 과일·채소와 비타민을 섭취했나요?', '{"items": [{"id": "w6-d5-cl-2", "label": "피부 관리를 위해 신선한 과일·채소와 비타민을 섭취했나요?"}]}'::jsonb, 2, true),
    (5, 'w6-d5-cl-3', '스트레스 해소를 위해 가벼운 운동이나 산책을 했나요?', '스트레스 해소를 위해 가벼운 운동이나 산책을 했나요?', '{"items": [{"id": "w6-d5-cl-3", "label": "스트레스 해소를 위해 가벼운 운동이나 산책을 했나요?"}]}'::jsonb, 3, true),
    (6, 'w6-d6-cl-1', '감정 기복 조절을 위해 심호흡이나 명상을 했나요?', '감정 기복 조절을 위해 심호흡이나 명상을 했나요?', '{"items": [{"id": "w6-d6-cl-1", "label": "감정 기복 조절을 위해 심호흡이나 명상을 했나요?"}]}'::jsonb, 1, true),
    (6, 'w6-d6-cl-2', '긍정적인 마음가짐을 유지하고 규칙적인 생활을 했나요?', '긍정적인 마음가짐을 유지하고 규칙적인 생활을 했나요?', '{"items": [{"id": "w6-d6-cl-2", "label": "긍정적인 마음가짐을 유지하고 규칙적인 생활을 했나요?"}]}'::jsonb, 2, true),
    (6, 'w6-d6-cl-3', '변비 예방을 위해 충분한 수분과 섬유질이 풍부한 음식을 섭취했나요?', '변비 예방을 위해 충분한 수분과 섬유질이 풍부한 음식을 섭취했나요?', '{"items": [{"id": "w6-d6-cl-3", "label": "변비 예방을 위해 충분한 수분과 섬유질이 풍부한 음식을 섭취했나요?"}]}'::jsonb, 3, true),
    (7, 'w6-d7-cl-1', '심한 출혈이나 복통 등 유산 징후가 없는지 확인했나요?', '심한 출혈이나 복통 등 유산 징후가 없는지 확인했나요?', '{"items": [{"id": "w6-d7-cl-1", "label": "심한 출혈이나 복통 등 유산 징후가 없는지 확인했나요?"}]}'::jsonb, 1, true),
    (7, 'w6-d7-cl-2', '피해야 할 음식 목록을 확인하고 건강한 식습관을 유지했나요?', '피해야 할 음식 목록을 확인하고 건강한 식습관을 유지했나요?', '{"items": [{"id": "w6-d7-cl-2", "label": "피해야 할 음식 목록을 확인하고 건강한 식습관을 유지했나요?"}]}'::jsonb, 2, true),
    (7, 'w6-d7-cl-3', '가족 양쪽 건강력을 파악하여 의사와 상담할 준비를 했나요?', '가족 양쪽 건강력을 파악하여 의사와 상담할 준비를 했나요?', '{"items": [{"id": "w6-d7-cl-3", "label": "가족 양쪽 건강력을 파악하여 의사와 상담할 준비를 했나요?"}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 6)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w6-d1-q-1', '아기의 힘찬 심장 소리를 처음 들었을 때, 엄마 마음속에 피어난 가장 큰 감동과 아기를 향한 사랑의 크기를 표현해 보아요!', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w6-d1-q-2', '유방 변화나 피로감처럼, 아기를 위해 열심히 변화하고 준비하는 엄마 몸의 모습 중에서 가장 고맙고 감사한 부분을 자세히 이야기해 주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (1, 'w6-d1-q-3', '아기의 심장 박동처럼, 아기를 향한 엄마의 변치 않는 사랑을 아기가 쉽게 이해할 수 있도록 예쁜 비유나 재미있는 이야기로 표현해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (2, 'w6-d2-q-1', '아기의 신경 세포들이 활발하게 연결되는 것처럼, 엄마는 아기와 어떤 특별하고 새로운 감정적 교감(예: 평온, 기쁨, 이해)을 나누고 싶으신지 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w6-d2-q-2', '입덧이나 불쾌한 금속 맛 때문에 힘든 순간에도 아기를 위해 견뎌내는 엄마 자신에게 가장 필요하고 힘이 되는 격려의 한마디를 건네 보아요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w6-d2-q-3', '아기의 똑똑한 두뇌 발달을 응원하며, 오늘 아기에게 들려주고 싶은 ''평화롭고 긍정적인 생각''을 담은 이야기를 구체적으로 적어주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (3, 'w6-d3-q-1', '아기의 심장이 더욱 튼튼하게 발달하는 것을 기념하며, 아기에게 엄마의 ''완전한 사랑''을 담아 전해줄 노래를 선정하고, 그 이유를 설명해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w6-d3-q-2', '소화 불량이나 몸의 무거움 등 임신 초기 변화로 힘들 때, 엄마는 자신의 몸을 위해 어떤 따뜻한 위로와 감사함을 표현하고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w6-d3-q-3', '아기가 태어나 처음으로 스스로 건강한 호흡을 할 순간을 상상하며, 엄마가 지금 아기와 나누는 깊고 편안한 숨결에는 어떤 소망이 담겨 있는지 이야기해 보아요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (4, 'w6-d4-q-1', '아기의 작은 팔다리를 상상하며, 함께 손잡고 뛰어놀 날을 그리며 태담을 나누어줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w6-d4-q-2', '아랫배의 콕콕거리는 통증이 아기의 성장통이라고 생각하며, 잘 자라고 있다고 칭찬해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w6-d4-q-3', '아기가 처음 볼 세상과, 엄마가 함께 해줄 좋은 경험에 대해 이야기해주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (5, 'w6-d5-q-1', '난황이 아기에게 영양을 공급하는 것처럼, 엄마는 아기의 정서적, 육체적 필요를 채워주기 위해 오늘 가장 중요하게 다짐하고 약속하고 싶은 말은 무엇인지 적어 보아요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w6-d5-q-2', '엄마의 피부 변화도 아기를 지키기 위한 과정이래요. 변화하는 엄마 자신에게 힘을 북돋아 줄 긍정적인 칭찬과 격려를 해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w6-d5-q-3', '탯줄이 엄마와 아기를 연결하듯, 세상에 나온 후에도 영원히 끊어지지 않을 ''사랑의 끈''은 어떤 모습일지 상상하며 아기에게 자세히 설명해 주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (6, 'w6-d6-q-1', '호르몬 변화로 감정 기복이 심할 때, 엄마는 불안한 감정 대신 아기에게 어떤 구체적인 행동이나 생각으로 ''안정적이고 평온한 느낌''을 전달해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w6-d6-q-2', '아기의 몸통이 곧게 펴지고 길어지는 성장을 보며, 엄마는 자신의 마음도 넓고 여유롭게 가질 수 있도록 어떤 다짐을 하고 싶은지 이야기해 보아요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w6-d6-q-3', '눈꺼풀과 코끝이 생기기 시작한 아기의 얼굴을 상상하며, 엄마가 그리는 아기의 얼굴 모습(특징, 인상)을 자세히 묘사하고 태담을 나누어 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (7, 'w6-d7-q-1', '아기가 배아기를 건강하게 졸업했어요! 기특한 아기에게 어떤 칭찬과 축하의 말을 전해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w6-d7-q-2', '아기를 안전하게 품어주고 있는 엄마의 몸에게 어떤 방식으로 특별한 감사함과 고마움을 표현하고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w6-d7-q-3', '아기가 태아라는 새로운 이름으로 불릴 날을 축하하며, 앞으로의 건강한 성장을 위해 응원해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 7 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  7,
  '7주차 발달 정보',
  '아기의 크기는 약 1.3cm, 블루베리 크기만큼 자랐어요. 단 1주일 만에 크기가 두 배로 커지는 급성장 기간을 보내고 있답니다!',
  '메스꺼움(입덧)이 최고조에 달했을 수 있어요. 임신 중 심한 통증이나 출혈과 같은 주의해야 할 증상이 없는지 잘 살펴야 해요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '7주 1일차',
  '{"items": ["아기의 크기는 약 1.3cm, 블루베리 크기만큼 자랐어요.", "단 1주일 만에 크기가 두 배로 커지는 급성장 기간을 보내고 있답니다!"]}'::jsonb,
  '{"items": ["메스꺼움(입덧)이 최고조에 달했을 수 있어요.", "임신 중 심한 통증이나 출혈과 같은 주의해야 할 증상이 없는지 잘 살펴야 해요."]}'::jsonb,
  '아가는 블루베리만큼 커졌어요! 성장 속도가 대단해요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 7
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '7주 2일차',
  '{"items": ["아기의 뇌가 놀랍게 발달하고 있어요.", "신경관이 닫히고 뇌는 전뇌, 중뇌, 후뇌 세 영역으로 나뉘며, 분당 약 25만 개의 세포가 증가한답니다."]}'::jsonb,
  '{"items": ["소변이 더 자주 마려운 빈뇨 증상이 나타나요.", "기분 변화가 갑자기 심해져서 우울하거나 짜증날 수 있어요."]}'::jsonb,
  '아가는 작은 머릿속에서 똑똑한 세포들이 열심히 연결되고 있어요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 7
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '7주 3일차',
  '{"items": ["아기의 소화 시스템이 형성되기 시작했어요.", "위와 식도가 만들어지고, 간과 췌장도 발달을 시작한답니다."]}'::jsonb,
  '{"items": ["소화기관의 변화로 속이 불편하거나 메스꺼움이 지속될 수 있어요.", "호르몬(프로게스테론)의 영향으로 장 운동이 느려져 가스나 더부룩함이 생길 수 있어요."]}'::jsonb,
  '아가는 몸속에서 밥 먹을 준비를 하고 있어요! 엄마가 해주는 맛있는 음식이 기대돼요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 7
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '7주 4일차',
  '{"items": ["아기의 시력을 유지하는 눈의 주요 부분들 (각막, 홍채, 동공, 수정체, 망막)이 발달하기 시작했어요.", "팔다리의 싹이 더 길어지고 있답니다."]}'::jsonb,
  '{"items": ["후각이 극도로 예민해져서 구역질을 유발하는 냄새에 압도될 수 있어요.", "음식 혐오감이 나타나 예전에 좋아했던 음식이 갑자기 싫어질 수 있어요."]}'::jsonb,
  '아가는 이제 세상을 볼 준비를 하고 있어요! 엄마를 가장 먼저 보고 싶어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 7
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '7주 5일차',
  '{"items": ["아기의 작은 특징들인 눈, 코, 입, 귀가 점점 뚜렷해지고 있어요.", "눈꺼풀이 형성되어 눈을 부분적으로 덮기 시작한답니다."]}'::jsonb,
  '{"items": ["침 분비량(군침)이 많아져서 불편함을 느낄 수 있어요.", "가슴이 눈에 띄게 커지고 피부가 늘어나면서 가려움을 느끼거나 튼살이 생길 수 있어요."]}'::jsonb,
  '아가는 얼굴이 점점 사람 모습을 갖춰가고 있어요. 기대해주세요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 7
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '7주 6일차',
  '{"items": ["아기의 척추와 뇌가 되는 신경관이 거의 닫히고 있어요.", "팔다리의 성장에 따라 팔꿈치와 무릎 관절도 형성되기 시작했어요."]}'::jsonb,
  '{"items": ["피해야 할 음식 (날 것, 가공육, 고카페인 커피 등)이 많으니 주의해야 해요.", "임신 초기 산전 검사를 어떤 것으로 할지 결정해야 해요."]}'::jsonb,
  '아가는 이제 곧게 펴지고 있어요. 엄마 품에 안길 날을 기다리고 있어요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 7
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '7주 7일차',
  '{"items": ["모든 필수 장기가 형성되기 시작하며, 이제부터는 더욱 빠르게 성장할 거예요.", "태반은 아기에게 필요한 모든 것을 공급하기 위해 끊임없이 발달하고 있어요."]}'::jsonb,
  '{"items": ["자궁은 커지고 있지만 아직 배가 겉으로 나오지는 않았을 거예요."]}'::jsonb,
  '아가는 배아기를 건강하게 졸업해요. 이제 쑥쑥 커서 엄마 만날 준비를 할 거예요!',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 7
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 7)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w7-d1-cl-1', '메스꺼움 완화를 위해 소량씩 자주 간식을 먹고 속이 비지 않도록 했나요?', '메스꺼움 완화를 위해 소량씩 자주 간식을 먹고 속이 비지 않도록 했나요?', '{"items": [{"id": "w7-d1-cl-1", "label": "메스꺼움 완화를 위해 소량씩 자주 간식을 먹고 속이 비지 않도록 했나요?"}]}'::jsonb, 1, true),
    (1, 'w7-d1-cl-2', '임신 중 피해야 할 음식 목록을 다시 확인했나요?', '임신 중 피해야 할 음식 목록을 다시 확인했나요?', '{"items": [{"id": "w7-d1-cl-2", "label": "임신 중 피해야 할 음식 목록을 다시 확인했나요?"}]}'::jsonb, 2, true),
    (1, 'w7-d1-cl-3', '메스꺼움이 심할 때 생강이나 비타민 B6 섭취를 시도해봤나요?', '메스꺼움이 심할 때 생강이나 비타민 B6 섭취를 시도해봤나요?', '{"items": [{"id": "w7-d1-cl-3", "label": "메스꺼움이 심할 때 생강이나 비타민 B6 섭취를 시도해봤나요?"}]}'::jsonb, 3, true),
    (2, 'w7-d2-cl-1', '뇌 발달을 위해 요오드가 풍부한 음식(생선, 우유, 치즈)을 섭취했나요?', '뇌 발달을 위해 요오드가 풍부한 음식(생선, 우유, 치즈)을 섭취했나요?', '{"items": [{"id": "w7-d2-cl-1", "label": "뇌 발달을 위해 요오드가 풍부한 음식(생선, 우유, 치즈)을 섭취했나요?"}]}'::jsonb, 1, true),
    (2, 'w7-d2-cl-2', '수분을 충분히 섭취하되, 빈뇨가 심하면 취침 전에는 수분 섭취를 줄였나요?', '수분을 충분히 섭취하되, 빈뇨가 심하면 취침 전에는 수분 섭취를 줄였나요?', '{"items": [{"id": "w7-d2-cl-2", "label": "수분을 충분히 섭취하되, 빈뇨가 심하면 취침 전에는 수분 섭취를 줄였나요?"}]}'::jsonb, 2, true),
    (2, 'w7-d2-cl-3', '파트너와 임신 관련 이야기를 나누며 감정을 솔직하게 표현했나요?', '파트너와 임신 관련 이야기를 나누며 감정을 솔직하게 표현했나요?', '{"items": [{"id": "w7-d2-cl-3", "label": "파트너와 임신 관련 이야기를 나누며 감정을 솔직하게 표현했나요?"}]}'::jsonb, 3, true),
    (3, 'w7-d3-cl-1', '속쓰림 완화를 위해 소량씩 자주 먹고 크래커에 치즈처럼 단백질을 함께 섭취했나요?', '속쓰림 완화를 위해 소량씩 자주 먹고 크래커에 치즈처럼 단백질을 함께 섭취했나요?', '{"items": [{"id": "w7-d3-cl-1", "label": "속쓰림 완화를 위해 소량씩 자주 먹고 크래커에 치즈처럼 단백질을 함께 섭취했나요?"}]}'::jsonb, 1, true),
    (3, 'w7-d3-cl-2', '변비 예방을 위해 신선한 과일, 채소와 충분한 수분을 섭취했나요?', '변비 예방을 위해 신선한 과일, 채소와 충분한 수분을 섭취했나요?', '{"items": [{"id": "w7-d3-cl-2", "label": "변비 예방을 위해 신선한 과일, 채소와 충분한 수분을 섭취했나요?"}]}'::jsonb, 2, true),
    (3, 'w7-d3-cl-3', '균형 잡힌 건강한 식단(채소, 단백질, 통곡물)을 유지했나요?', '균형 잡힌 건강한 식단(채소, 단백질, 통곡물)을 유지했나요?', '{"items": [{"id": "w7-d3-cl-3", "label": "균형 잡힌 건강한 식단(채소, 단백질, 통곡물)을 유지했나요?"}]}'::jsonb, 3, true),
    (4, 'w7-d4-cl-1', '냄새를 유발하는 환경(특정 음식, 담배 연기)을 최대한 피했나요?', '냄새를 유발하는 환경(특정 음식, 담배 연기)을 최대한 피했나요?', '{"items": [{"id": "w7-d4-cl-1", "label": "냄새를 유발하는 환경(특정 음식, 담배 연기)을 최대한 피했나요?"}]}'::jsonb, 1, true),
    (4, 'w7-d4-cl-2', '혐오감이 드는 음식 대신 영양가 있는 대체 식품을 찾아 섭취했나요?', '혐오감이 드는 음식 대신 영양가 있는 대체 식품을 찾아 섭취했나요?', '{"items": [{"id": "w7-d4-cl-2", "label": "혐오감이 드는 음식 대신 영양가 있는 대체 식품을 찾아 섭취했나요?"}]}'::jsonb, 2, true),
    (4, 'w7-d4-cl-3', '엽산을 오늘도 챙겨 복용했나요?', '엽산을 오늘도 챙겨 복용했나요?', '{"items": [{"id": "w7-d4-cl-3", "label": "엽산을 오늘도 챙겨 복용했나요?"}]}'::jsonb, 3, true),
    (5, 'w7-d5-cl-1', '유방 변화에 맞는 편안하고 지지력 있는 브래지어를 착용했나요?', '유방 변화에 맞는 편안하고 지지력 있는 브래지어를 착용했나요?', '{"items": [{"id": "w7-d5-cl-1", "label": "유방 변화에 맞는 편안하고 지지력 있는 브래지어를 착용했나요?"}]}'::jsonb, 1, true),
    (5, 'w7-d5-cl-2', '통풍이 잘 되는 편안한 속옷을 착용하고 피부 청결을 유지했나요?', '통풍이 잘 되는 편안한 속옷을 착용하고 피부 청결을 유지했나요?', '{"items": [{"id": "w7-d5-cl-2", "label": "통풍이 잘 되는 편안한 속옷을 착용하고 피부 청결을 유지했나요?"}]}'::jsonb, 2, true),
    (5, 'w7-d5-cl-3', '피부가 늘어남에 따라 임산부에게 안전한 보습제를 사용했나요?', '피부가 늘어남에 따라 임산부에게 안전한 보습제를 사용했나요?', '{"items": [{"id": "w7-d5-cl-3", "label": "피부가 늘어남에 따라 임산부에게 안전한 보습제를 사용했나요?"}]}'::jsonb, 3, true),
    (6, 'w7-d6-cl-1', '피해야 할 음식(날것, 가공육, 고카페인)을 철저히 피했나요?', '피해야 할 음식(날것, 가공육, 고카페인)을 철저히 피했나요?', '{"items": [{"id": "w7-d6-cl-1", "label": "피해야 할 음식(날것, 가공육, 고카페인)을 철저히 피했나요?"}]}'::jsonb, 1, true),
    (6, 'w7-d6-cl-2', '산전 검사 옵션(NIPT, NT 초음파 등)에 대해 의사와 상담할 준비를 했나요?', '산전 검사 옵션(NIPT, NT 초음파 등)에 대해 의사와 상담할 준비를 했나요?', '{"items": [{"id": "w7-d6-cl-2", "label": "산전 검사 옵션(NIPT, NT 초음파 등)에 대해 의사와 상담할 준비를 했나요?"}]}'::jsonb, 2, true),
    (6, 'w7-d6-cl-3', '하루 30분 가벼운 운동이나 산책으로 몸을 움직였나요?', '하루 30분 가벼운 운동이나 산책으로 몸을 움직였나요?', '{"items": [{"id": "w7-d6-cl-3", "label": "하루 30분 가벼운 운동이나 산책으로 몸을 움직였나요?"}]}'::jsonb, 3, true),
    (7, 'w7-d7-cl-1', '복용 중인 일반 의약품이나 처방약의 안전성을 의사에게 확인했나요?', '복용 중인 일반 의약품이나 처방약의 안전성을 의사에게 확인했나요?', '{"items": [{"id": "w7-d7-cl-1", "label": "복용 중인 일반 의약품이나 처방약의 안전성을 의사에게 확인했나요?"}]}'::jsonb, 1, true),
    (7, 'w7-d7-cl-2', '파트너와 임신 소식을 알릴 시기와 방법에 대해 이야기 나눴나요?', '파트너와 임신 소식을 알릴 시기와 방법에 대해 이야기 나눴나요?', '{"items": [{"id": "w7-d7-cl-2", "label": "파트너와 임신 소식을 알릴 시기와 방법에 대해 이야기 나눴나요?"}]}'::jsonb, 2, true),
    (7, 'w7-d7-cl-3', '긍정적인 마음가짐을 유지하며 충분한 휴식을 취했나요?', '긍정적인 마음가짐을 유지하며 충분한 휴식을 취했나요?', '{"items": [{"id": "w7-d7-cl-3", "label": "긍정적인 마음가짐을 유지하며 충분한 휴식을 취했나요?"}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 7)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w7-d1-q-1', '아기가 단 일주일 만에 블루베리만큼 두 배로 급성장했어요! 엄마는 아기에게 어떤 특별한 방식으로 사랑을 두 배로 전해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w7-d1-q-2', '메스꺼움이 힘들지만, 아기가 잘 자라는 증거라고 긍정적으로 생각하며 엄마 자신을 어떻게 위로하고 다독여줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (1, 'w7-d1-q-3', '아기가 세상에 나온 후, 엄마가 아기와 꼭 함께 가고 싶은 ''첫 번째 특별한 여행지''는 어디이며, 그곳에서 아기와 어떤 경험을 나누고 싶으신지 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (2, 'w7-d2-q-1', '아기의 뇌가 열심히 성장하는 것처럼, 엄마는 아기에게 지혜로운 생각을 담은 태담을 들려줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w7-d2-q-2', '잦은 소변 때문에 힘들지만, 아기를 위한 몸의 변화임을 긍정하며 엄마 자신을 위로하고 마음을 다스릴 수 있는 방법을 기록해 보아요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w7-d2-q-3', '아기가 세상에 나와 스스로 지혜롭고 멋진 선택을 내릴 모습을 상상하며, 아기의 용기와 지혜를 응원하는 엄마의 한마디를 전해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (3, 'w7-d3-q-1', '아기가 소화기관을 만들고 있어요. 아기가 세상에 나와 가장 먼저 맛보게 해주고 싶은 엄마의 요리는 무엇인가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w7-d3-q-2', '속쓰림으로 고통스러울 때, 엄마는 자신의 몸에게 어떤 방식으로 ''따뜻한 휴식과 선물''을 주고 싶은지 설명해 주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w7-d3-q-3', '아기가 건강한 식습관을 가질 것을 상상하며, 아기에게 먹여주고 싶은 ''영양가 있는 음식’은 무엇인가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (4, 'w7-d4-q-1', '아기의 시력을 유지하는 눈의 주요 부분들이 발달하기 시작했어요. 엄마는 아기가 태어나 어떤 ''밝고 아름다운 세상''을 보기를 바라며, 어떤 이야기를 들려주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w7-d4-q-2', '예민한 후각과 음식 혐오가 아기를 지키는 몸의 현상이라고 생각하며, 이 불편함을 엄마는 어떤 긍정적인 말이나 생각으로 이겨내고 받아들이고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w7-d4-q-3', '점점 길어지고 있는 아기의 팔다리를 상상하며, 21 아기가 이 팔다리로 세상에 나와 함께 갈 ''가장 아름다운 곳''은 어디이며, 그곳에서 무엇을 할지 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (5, 'w7-d5-q-1', '눈, 코, 입, 귀 등 아기의 작은 얼굴 특징들이 뚜렷해지고 있어요. 아기에게 보여주고 싶은 엄마의 ''가장 사랑스럽고 평온한 미소''는 어떤 모습인지 설명해 주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w7-d5-q-2', '가슴이 커지고 변화하는 모습을 보며, 아기에게 젖을 줄 준비를 하는 엄마의 몸에게 어떤 구체적인 감사의 말을 전하고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w7-d5-q-3', '아기가 태어나 가장 듣고 싶어 할 엄마의 목소리와 노래를 상상하며, 그 ''특별한 노래''의 가사나 멜로디에 담고 싶은 마음을 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (6, 'w7-d6-q-1', '''엄마 아빠의 사랑의 결실''인 아기에게, 엄마 아빠의 연결에 대해 이야기해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w7-d6-q-2', '아기의 몸통이 곧게 펴지는 것처럼, 엄마는 아기의 건강과 행복을 위해 어떤 마음을 곧게 다잡고 전념할 것을 약속하고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w7-d6-q-3', '아기의 별자리를 보며, 아기가 가질 멋진 성격을 상상하며 이야기해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (7, 'w7-d7-q-1', '아기가 배아기를 건강하게 통과했어요! 기특한 아기에게 어떤 칭찬과 축하의 말을 전해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w7-d7-q-2', '엄마의 몸이 이상 신호 없이 아기를 잘 품어주고 있다는 것에 대해 엄마가 느끼는 감사함과 고마움을 어떤 방식으로 표현하고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w7-d7-q-3', '앞으로의 건강한 성장을 위해 새로운 이름인 태명을 지어줄까요? 그리고 그 의미는 무엇인지 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 8 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  8,
  '8주차 발달 정보',
  '아기의 크기는 약 1.6cm, 라즈베리 크기만큼 자랐어요. 꼬리가 완전히 사라지고, 아기는 C자 형태에서 점차 직립하는 사람의 모습으로 변해가고 있답니다.',
  '자궁이 점점 커지면서 배가 약간 부풀어 오를 수 있어요. 유방이 더 커지고 단단해지며 통증이 느껴질 수 있어요. 이는 모유 수유를 위해 몸이 준비하기 때문이에요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '8주 1일차',
  '{"items": ["아기의 크기는 약 1.6cm, 라즈베리 크기만큼 자랐어요.", "꼬리가 완전히 사라지고, 아기는 C자 형태에서 점차 직립하는 사람의 모습으로 변해가고 있답니다."]}'::jsonb,
  '{"items": ["자궁이 점점 커지면서 배가 약간 부풀어 오를 수 있어요.", "유방이 더 커지고 단단해지며 통증이 느껴질 수 있어요. 이는 모유 수유를 위해 몸이 준비하기 때문이에요."]}'::jsonb,
  '아가는 이제 꼬리가 없어지고 사람처럼 보이려고 노력하고 있어요!',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 8
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '8주 2일차',
  '{"items": ["아기의 팔은 이제 팔꿈치를 구부릴 수 있을 만큼 발달했어요.", "손가락과 발가락이 길어지고 있으며, 연골이 골세포와 관절로 대체되기 시작했어요."]}'::jsonb,
  '{"items": ["입덧이 가장 심한 시기일 수 있으며, 구토와 메스꺼움이 하루 종일 지속되기도 해요.", "임신 호르몬의 영향으로 쉽게 피곤하고 나른함, 졸음이 올 수 있어요."]}'::jsonb,
  '아가는 작은 팔다리가 길어지고 있어요. 곧 엄마에게 손을 뻗을 수 있을 거예요!',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 8
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '8주 3일차',
  '{"items": ["아기의 얼굴 특징이 더욱 상세하게 나타나며, 눈꺼풀이 만들어지고 코가 오뚝해지기 시작해요.", "턱뼈가 자라 작은 입의 형태가 뚜렷해지고 두 개의 콧구멍도 보이게 된답니다."]}'::jsonb,
  '{"items": ["임신 호르몬으로 인해 감정 기복이 심해져 짜증이나 두려움을 느낄 수 있어요.", "질 분비물의 양이 임신 전보다 늘어날 수 있어요."]}'::jsonb,
  '아가는 얼굴에 눈코입이 생길 자리가 잡히고 있어요. 엄마를 꼭 닮을 거예요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 8
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '8주 4일차',
  '{"items": ["아기의 심장과 뇌가 더욱 복잡하게 발달하며 심박동을 초음파로 들을 수 있어요.", "뼈와 근육이 발달하면서 아기는 조금씩 움직일 수 있게 되었어요."]}'::jsonb,
  '{"items": ["혈액량이 증가하면서 심장은 아기를 위해 분당 50% 더 많은 혈액을 펌프질합니다.", "자궁이 커지면서 방광을 압박하여 소변이 자주 마렵고 잔뇨감이 있을 수 있어요."]}'::jsonb,
  '아가는 작은 심장이 힘차게 뛰고 있어요! 이제 혼자 움직일 수도 있답니다.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 8
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '8주 5일차',
  '{"items": ["연골이 골세포와 관절로 대체되기 시작하며, 다리가 더 길게 자라나요.", "아기의 몸 전체에 신경망이 퍼지면서, 초음파로 움직임을 확인할 수 있을 정도로 활발해져요."]}'::jsonb,
  '{"items": ["복부 팽만감으로 인해 배가 살짝 나온 듯한 느낌을 받을 수 있어요.", "자궁이 커지면서 인대가 늘어나 생리통과 비슷한 경련이 느껴질 수 있는데, 이는 자연스러운 현상이에요."]}'::jsonb,
  '아가는 다리가 길어지고 있어요. 조금 더 힘차게 움직여서 엄마에게 자신을 보여줄 거예요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 8
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '8주 6일차',
  '{"items": ["아기의 눈에 새로운 색소 세포가 생성되면서 눈빛이 점점 어두워지기 시작해요.", "외이(귀의 바깥 부분)의 형태가 갖춰지기 시작하고 있어요."]}'::jsonb,
  '{"items": ["기미나 잡티가 늘어나는 등 얼굴빛이 어두워질 수 있어요.", "출혈이나 심한 경련이 있다면 즉시 의사에게 알려야 해요."]}'::jsonb,
  '아가는 눈이 빛을 느끼기 시작했어요. 엄마 목소리도 더 잘 들으려고 귀를 열고 있어요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 8
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '8주 7일차',
  '{"items": ["아기의 맛봉오리가 형성되기 시작하며, 호흡기도 발달하고 있어요."]}'::jsonb,
  '{"items": ["유산의 위험이 비교적 높은 시기이므로 안정이 중요해요.", "아직 배가 부른 상태는 아니지만, 배가 약간 부풀어 오를 수 있어요."]}'::jsonb,
  '아가는 자신만의 지문을 만들고 있어요. 나중에 손도장 찍어줄 거예요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 8
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 8)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w8-d1-cl-1', '유방이 커지고 아플 때를 대비해 편안한 임부용 브래지어를 준비했나요?', '유방이 커지고 아플 때를 대비해 편안한 임부용 브래지어를 준비했나요?', '{"items": [{"id": "w8-d1-cl-1", "label": "유방이 커지고 아플 때를 대비해 편안한 임부용 브래지어를 준비했나요?"}]}'::jsonb, 1, true),
    (1, 'w8-d1-cl-2', '자외선 차단을 위해 SPF 30 이상의 자외선 차단제를 매일 사용했나요?', '자외선 차단을 위해 SPF 30 이상의 자외선 차단제를 매일 사용했나요?', '{"items": [{"id": "w8-d1-cl-2", "label": "자외선 차단을 위해 SPF 30 이상의 자외선 차단제를 매일 사용했나요?"}]}'::jsonb, 2, true),
    (1, 'w8-d1-cl-3', '임신 초기를 기록하기 위해 배 사진을 찍어두었나요?', '임신 초기를 기록하기 위해 배 사진을 찍어두었나요?', '{"items": [{"id": "w8-d1-cl-3", "label": "임신 초기를 기록하기 위해 배 사진을 찍어두었나요?"}]}'::jsonb, 3, true),
    (2, 'w8-d2-cl-1', '입덧 완화를 위해 아침에 일어나기 전 마른 크래커를 먹었나요?', '입덧 완화를 위해 아침에 일어나기 전 마른 크래커를 먹었나요?', '{"items": [{"id": "w8-d2-cl-1", "label": "입덧 완화를 위해 아침에 일어나기 전 마른 크래커를 먹었나요?"}]}'::jsonb, 1, true),
    (2, 'w8-d2-cl-2', '소량씩 자주 먹어 허기지지 않도록 식사 간격을 조절했나요?', '소량씩 자주 먹어 허기지지 않도록 식사 간격을 조절했나요?', '{"items": [{"id": "w8-d2-cl-2", "label": "소량씩 자주 먹어 허기지지 않도록 식사 간격을 조절했나요?"}]}'::jsonb, 2, true),
    (2, 'w8-d2-cl-3', '생강차나 생강 음료를 메스꺼움 완화에 활용해봤나요?', '생강차나 생강 음료를 메스꺼움 완화에 활용해봤나요?', '{"items": [{"id": "w8-d2-cl-3", "label": "생강차나 생강 음료를 메스꺼움 완화에 활용해봤나요?"}]}'::jsonb, 3, true),
    (3, 'w8-d3-cl-1', '감정 기복이 심할 때 명상이나 가벼운 산책으로 마음을 달랬나요?', '감정 기복이 심할 때 명상이나 가벼운 산책으로 마음을 달랬나요?', '{"items": [{"id": "w8-d3-cl-1", "label": "감정 기복이 심할 때 명상이나 가벼운 산책으로 마음을 달랬나요?"}]}'::jsonb, 1, true),
    (3, 'w8-d3-cl-2', '불안이나 걱정이 있을 때 조산사나 의사와 이야기를 나눴나요?', '불안이나 걱정이 있을 때 조산사나 의사와 이야기를 나눴나요?', '{"items": [{"id": "w8-d3-cl-2", "label": "불안이나 걱정이 있을 때 조산사나 의사와 이야기를 나눴나요?"}]}'::jsonb, 2, true),
    (3, 'w8-d3-cl-3', '균형 잡힌 식사와 아연이 풍부한 음식(소고기, 통곡물, 견과류)을 섭취했나요?', '균형 잡힌 식사와 아연이 풍부한 음식(소고기, 통곡물, 견과류)을 섭취했나요?', '{"items": [{"id": "w8-d3-cl-3", "label": "균형 잡힌 식사와 아연이 풍부한 음식(소고기, 통곡물, 견과류)을 섭취했나요?"}]}'::jsonb, 3, true),
    (4, 'w8-d4-cl-1', '소변이 마려울 때 참지 않고, 충분한 수분 섭취를 했나요?', '소변이 마려울 때 참지 않고, 충분한 수분 섭취를 했나요?', '{"items": [{"id": "w8-d4-cl-1", "label": "소변이 마려울 때 참지 않고, 충분한 수분 섭취를 했나요?"}]}'::jsonb, 1, true),
    (4, 'w8-d4-cl-2', '두통 예방을 위해 충분한 수분을 섭취하고 휴식을 취했나요?', '두통 예방을 위해 충분한 수분을 섭취하고 휴식을 취했나요?', '{"items": [{"id": "w8-d4-cl-2", "label": "두통 예방을 위해 충분한 수분을 섭취하고 휴식을 취했나요?"}]}'::jsonb, 2, true),
    (4, 'w8-d4-cl-3', '카페인이 함유되지 않은 가벼운 차를 통해 수분을 유지했나요?', '카페인이 함유되지 않은 가벼운 차를 통해 수분을 유지했나요?', '{"items": [{"id": "w8-d4-cl-3", "label": "카페인이 함유되지 않은 가벼운 차를 통해 수분을 유지했나요?"}]}'::jsonb, 3, true),
    (5, 'w8-d5-cl-1', '피로 해소를 위해 일찍 잠자리에 들거나 낮잠을 취했나요?', '피로 해소를 위해 일찍 잠자리에 들거나 낮잠을 취했나요?', '{"items": [{"id": "w8-d5-cl-1", "label": "피로 해소를 위해 일찍 잠자리에 들거나 낮잠을 취했나요?"}]}'::jsonb, 1, true),
    (5, 'w8-d5-cl-2', '규칙적으로 가벼운 산책을 통해 신선한 공기를 마셨나요?', '규칙적으로 가벼운 산책을 통해 신선한 공기를 마셨나요?', '{"items": [{"id": "w8-d5-cl-2", "label": "규칙적으로 가벼운 산책을 통해 신선한 공기를 마셨나요?"}]}'::jsonb, 2, true),
    (5, 'w8-d5-cl-3', '비타민과 필수 영양소 섭취를 위해 신선한 채소를 충분히 먹었나요?', '비타민과 필수 영양소 섭취를 위해 신선한 채소를 충분히 먹었나요?', '{"items": [{"id": "w8-d5-cl-3", "label": "비타민과 필수 영양소 섭취를 위해 신선한 채소를 충분히 먹었나요?"}]}'::jsonb, 3, true),
    (6, 'w8-d6-cl-1', '기미 예방을 위해 SPF 30 이상의 자외선 차단제를 바르고 외출 시 모자를 착용했나요?', '기미 예방을 위해 SPF 30 이상의 자외선 차단제를 바르고 외출 시 모자를 착용했나요?', '{"items": [{"id": "w8-d6-cl-1", "label": "기미 예방을 위해 SPF 30 이상의 자외선 차단제를 바르고 외출 시 모자를 착용했나요?"}]}'::jsonb, 1, true),
    (6, 'w8-d6-cl-2', '비침습적 산전 검사(NIPT)에 대해 의사와 상담하고 검사 여부를 결정했나요?', '비침습적 산전 검사(NIPT)에 대해 의사와 상담하고 검사 여부를 결정했나요?', '{"items": [{"id": "w8-d6-cl-2", "label": "비침습적 산전 검사(NIPT)에 대해 의사와 상담하고 검사 여부를 결정했나요?"}]}'::jsonb, 2, true),
    (6, 'w8-d6-cl-3', '정신 건강을 위해 충분한 휴식과 명상, 소량씩 자주 먹는 습관을 유지했나요?', '정신 건강을 위해 충분한 휴식과 명상, 소량씩 자주 먹는 습관을 유지했나요?', '{"items": [{"id": "w8-d6-cl-3", "label": "정신 건강을 위해 충분한 휴식과 명상, 소량씩 자주 먹는 습관을 유지했나요?"}]}'::jsonb, 3, true),
    (7, 'w8-d7-cl-1', '지속적인 구토로 인한 치아 손상을 예방하기 위해 치과 방문 또는 구강 관리를 했나요?', '지속적인 구토로 인한 치아 손상을 예방하기 위해 치과 방문 또는 구강 관리를 했나요?', '{"items": [{"id": "w8-d7-cl-1", "label": "지속적인 구토로 인한 치아 손상을 예방하기 위해 치과 방문 또는 구강 관리를 했나요?"}]}'::jsonb, 1, true),
    (7, 'w8-d7-cl-2', '엽산, 비타민 B, 요오드 등 필수 영양제를 오늘도 챙겨 복용했나요?', '엽산, 비타민 B, 요오드 등 필수 영양제를 오늘도 챙겨 복용했나요?', '{"items": [{"id": "w8-d7-cl-2", "label": "엽산, 비타민 B, 요오드 등 필수 영양제를 오늘도 챙겨 복용했나요?"}]}'::jsonb, 2, true),
    (7, 'w8-d7-cl-3', '임신 진행 상황을 기록하기 위해 이번 주 배 사진을 찍었나요?', '임신 진행 상황을 기록하기 위해 이번 주 배 사진을 찍었나요?', '{"items": [{"id": "w8-d7-cl-3", "label": "임신 진행 상황을 기록하기 위해 이번 주 배 사진을 찍었나요?"}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 8)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w8-d1-q-1', '꼬리가 사라지고 사람 모습을 갖춰가는 아기에게, 엄마의 어떤 모습을 닮기를 바라는지 전해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w8-d1-q-2', '자궁이 아기를 열심히 품어주는 것에 대해, 엄마가 느끼는 감사함과 사랑을 어떤 특별한 말로 표현하고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (1, 'w8-d1-q-3', '아기가 세상에 나와 엄마, 아빠와 함께 할 ''첫 번째 의미 있는 활동''을 상상하며, 그 활동이 아기에게 어떤 즐거움을 줄지 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (2, 'w8-d2-q-1', '아기의 힘찬 움직임을 상상하며, 아기에게 에너지와 용기를 북돋아 주는 ''엄마만의 응원가''를 불러주고 그 이유를 설명해 줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w8-d2-q-2', '입덧으로 힘들고 지칠 때, 엄마는 ''아기를 위한 인내''를 어떻게 표현하며 스스로에게 가장 위로가 되는 격려의 말을 건네고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w8-d2-q-3', '길어진 아기의 손을 상상하며, 아기가 태어난 후 손을 잡고 함께할 ''첫 번째 재미있는 놀이''를 계획해 이야기해 주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (3, 'w8-d3-q-1', '눈꺼풀과 코의 윤곽이 잡히는 아기의 예쁜 얼굴을 상상하며, 엄마는 아기에게 어떤 상황에서 ''가장 밝고 행복한 미소''를 보여주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w8-d3-q-2', '호르몬으로 인해 감정 기복이 심해질 때, 엄마는 이 변화가 아기를 위한 것이라고 어떻게 스스로를 이해시키고 다독이며 마음의 평화를 찾고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w8-d3-q-3', '아기의 예쁜 코를 상상하며, 세상의 어떤 냄새를 가장 먼저 맡게 해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (4, 'w8-d4-q-1', '아기의 힘찬 심장 소리를 들으며, 엄마는 아기에게 어떤 응원의 메시지를 전해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w8-d4-q-2', '잦은 소변이나 군침 같은 불편한 증상들을 ''아기가 잘 크고 있다는 기쁜 신호''로 바꾸어 긍정적으로 생각할 수 있는 엄마만의 특별한 방법은 무엇인가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w8-d4-q-3', '아기의 활발한 움직임을 상상하며, 엄마가 가장 좋아하는 운동을 아기에게 설명해 주고, 나중에 함께 해볼 상상을 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (5, 'w8-d5-q-1', '아기가 자유롭게 움직이고 있대요. 엄마의 가장 편안하고 기분 좋은 감정을 아기에게 보내줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w8-d5-q-2', '복부 팽만감을 느낄 때, 이것이 아기의 성장을 위한 몸의 변화임을 깨닫고 엄마는 어떻게 이 불편함을 기꺼이 받아들이고 아기를 칭찬하고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w8-d5-q-3', '아기의 튼튼한 다리를 상상하며, 아기가 세상에 나와 함께 ''가장 먼저 산책할 아름다운 길''은 어디이며, 그 길을 걷는 상상을 자세히 이야기해 주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (6, 'w8-d6-q-1', '빛에 반응하는 아기에게, 엄마가 세상에서 ''가장 좋아하는 색깔''을 정하고, 그 색깔이 엄마에게 어떤 의미가 있는지 자세히 설명해 줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w8-d6-q-2', '피부 변화도 아기를 지키는 과정임을 인정하며, 엄마는 자신에게 어떤 방식으로 진심 어린 칭찬과 감사의 말을 해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w8-d6-q-3', '아기의 균형 감각을 상상하며, 아기가 태어나 엄마와 함께할 ''가장 즐겁고 신나는 춤''은 어떤 춤이며, 어떤 음악에 맞추어 출지 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (7, 'w8-d7-q-1', '태명이 아기에게 어떤 멋진 소망과 의미를 담고 있는지 구체적으로 설명해 주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w8-d7-q-2', '아직 배가 나오지 않았어도 허리가 굵어지는 등 엄마의 몸이 아기를 위해 변화하는 과정을 ''사랑스럽게'' 받아들이기 위해 어떤 긍정적인 마음가짐을 가져보고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w8-d7-q-3', '세상에 하나뿐인 작은 지문이 생겨나기 시작한 아기에게, 엄마는 아기가 세상에 남길 ''가장 멋지고 자랑스러운 발자취''는 무엇일지 상상하며 응원해 주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 9 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  9,
  '9주차 발달 정보',
  '아기의 크기는 약 2.3cm, 포도알 크기만큼 성장했어요. 꼬리가 완전히 사라지고, 아기는 본격적인 ''태아'' 단계로 접어듭니다.',
  '자궁이 계속 커지면서 허리둘레가 늘어나는 것을 느낄 수 있어요. 임신 호르몬(hCG)이 최고조에 달하는 시기로, 입덧이 이번 주에 가장 심할 수 있어요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '9주 1일차',
  '{"items": ["아기의 크기는 약 2.3cm, 포도알 크기만큼 성장했어요.", "꼬리가 완전히 사라지고, 아기는 본격적인 ''태아'' 단계로 접어듭니다."]}'::jsonb,
  '{"items": ["자궁이 계속 커지면서 허리둘레가 늘어나는 것을 느낄 수 있어요.", "임신 호르몬(hCG)이 최고조에 달하는 시기로, 입덧이 이번 주에 가장 심할 수 있어요."]}'::jsonb,
  '아가는 이제 태아예요. 엄마 몸속에서 새로운 단계를 시작해요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 9
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '9주 2일차',
  '{"items": ["아기의 손가락과 발가락이 더욱 뚜렷하게 분리되고, 작은 주먹을 쥘 수 있어요.", "무릎, 팔꿈치, 어깨, 발목, 손목 관절이 모두 작동하기 시작하며 더욱 활발하게 움직여요."]}'::jsonb,
  '{"items": ["피로, 탈수, 카페인 중단, 수면 부족 등으로 두통이 나타날 수 있어요.", "자궁 확장과 골반 혈류 증가로 잦은 소변이 나타나요."]}'::jsonb,
  '아가는 이제 주먹을 쥘 수 있어요. 곧 엄마 손을 잡아볼 수 있을 거예요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 9
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '9주 3일차',
  '{"items": ["아기의 머리가 몸통보다 여전히 크지만, 머리가 조금 더 둥글어지고 목도 발달하고 있어요.", "눈꺼풀이 형성되어 눈을 덮고 있으며, 눈에 색소가 생기기 시작해요."]}'::jsonb,
  '{"items": ["가슴이 눈에 띄게 커지고 유방 통증이 심해질 수 있어요.", "소량의 출혈이나 생리통 같은 경련이 나타날 수 있으니 주의 깊게 관찰해야 해요."]}'::jsonb,
  '아가는 이제 고개를 조금 들 수 있어요. 엄마에게 서프라이즈로 보여줄 거예요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 9
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '9주 4일차',
  '{"items": ["아기의 주요 내부 장기가 거의 제자리를 잡고 기능을 하기 시작해요.", "심장, 뇌, 폐, 신장 등 주요 장기가 계속해서 발달하고 있어요."]}'::jsonb,
  '{"items": ["임신 호르몬(에스트로겐, 프로게스테론)이 높아지면서 자궁으로 가는 혈류량이 증가해요.", "호르몬이 과다 분비되면서 극심한 피로감을 느낄 수 있어요."]}'::jsonb,
  '아가는 몸속의 작은 공장들이 열심히 돌아가기 시작했어요. 이제 혼자서도 잘 해낼 준비를 하고 있어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 9
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '9주 5일차',
  '{"items": ["아기는 양막낭 안에서 자유롭게 움직이며, 심지어 엄지손가락을 빠는 동작도 해요.", "근육이 형성되기 시작하면서 아기의 움직임이 더욱 자유로워집니다."]}'::jsonb,
  '{"items": ["복부 팽만감이 지속되고, 자궁이 두 배로 커지면서 배가 나온 듯한 느낌이 들 수 있어요.", "코막힘이 예상치 못한 증상으로 나타날 수 있어요. 임신 중에는 점액 분비가 증가하기 때문이에요."]}'::jsonb,
  '아가는 이제 팔다리를 더 힘차게 움직일 수 있어요!',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 9
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '9주 6일차',
  '{"items": ["아기의 생식 기관이 형성되고 있지만, 초음파로 성별을 확인하기에는 아직 일러요.", "아기의 뼈대가 형성되기 시작하지만, 아직 뼈는 부드러운 상태예요."]}'::jsonb,
  '{"items": ["잇몸이 예민해지고 염증이 생기기 쉬운 시기예요. 임신 호르몬이 잇몸을 민감하게 만들기 때문이에요.", "심박동이 확인된 후 유산 위험은 2~9%로 낮아지지만, 여전히 안정이 중요해요."]}'::jsonb,
  '아가는 몸에서 머리카락이 될 자리가 생기고 있어요. 성별은 아직 비밀이에요!',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 9
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '9주 7일차',
  '{"items": ["아기는 중요한 배아 기간을 지나 이제 덜 민감하고 더 안정된 발달 단계에 접어들었어요."]}'::jsonb,
  '{"items": ["hCG 호르몬 수치가 이번 주 최고조에 달한 후, 서서히 완화되기 시작할 수 있어요.", "호르몬 변화로 머리카락이 굵어지거나 피부 변화가 나타날 수 있어요."]}'::jsonb,
  '아가는 이제 쑥쑥 자라서 엄마 품에 안길 준비를 할 거예요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 9
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 9)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w9-d1-cl-1', '태아 단계에 접어든 아기를 위해 첫 산전 진찰 예약을 했나요?', '태아 단계에 접어든 아기를 위해 첫 산전 진찰 예약을 했나요?', '{"items": [{"id": "w9-d1-cl-1", "label": "태아 단계에 접어든 아기를 위해 첫 산전 진찰 예약을 했나요?"}]}'::jsonb, 1, true),
    (1, 'w9-d1-cl-2', '변비와 속쓰림 예방을 위해 소량씩 자주 먹고 야식과 매운 음식을 피했나요?', '변비와 속쓰림 예방을 위해 소량씩 자주 먹고 야식과 매운 음식을 피했나요?', '{"items": [{"id": "w9-d1-cl-2", "label": "변비와 속쓰림 예방을 위해 소량씩 자주 먹고 야식과 매운 음식을 피했나요?"}]}'::jsonb, 2, true),
    (1, 'w9-d1-cl-3', '칼슘이 풍부한 음식(치즈, 정어리, 브로콜리)을 오늘 섭취했나요?', '칼슘이 풍부한 음식(치즈, 정어리, 브로콜리)을 오늘 섭취했나요?', '{"items": [{"id": "w9-d1-cl-3", "label": "칼슘이 풍부한 음식(치즈, 정어리, 브로콜리)을 오늘 섭취했나요?"}]}'::jsonb, 3, true),
    (2, 'w9-d2-cl-1', '두통 예방을 위해 수분을 충분히 섭취하고 규칙적으로 음식을 먹었나요?', '두통 예방을 위해 수분을 충분히 섭취하고 규칙적으로 음식을 먹었나요?', '{"items": [{"id": "w9-d2-cl-1", "label": "두통 예방을 위해 수분을 충분히 섭취하고 규칙적으로 음식을 먹었나요?"}]}'::jsonb, 1, true),
    (2, 'w9-d2-cl-2', '잦은 소변에도 불구하고 수분 섭취를 충분히 유지했나요?', '잦은 소변에도 불구하고 수분 섭취를 충분히 유지했나요?', '{"items": [{"id": "w9-d2-cl-2", "label": "잦은 소변에도 불구하고 수분 섭취를 충분히 유지했나요?"}]}'::jsonb, 2, true),
    (2, 'w9-d2-cl-3', '비타민 D 보충제를 오늘도 챙겨 복용했나요?', '비타민 D 보충제를 오늘도 챙겨 복용했나요?', '{"items": [{"id": "w9-d2-cl-3", "label": "비타민 D 보충제를 오늘도 챙겨 복용했나요?"}]}'::jsonb, 3, true),
    (3, 'w9-d3-cl-1', '유방 통증 완화를 위해 편안한 속옷이나 임부용 브래지어를 착용했나요?', '유방 통증 완화를 위해 편안한 속옷이나 임부용 브래지어를 착용했나요?', '{"items": [{"id": "w9-d3-cl-1", "label": "유방 통증 완화를 위해 편안한 속옷이나 임부용 브래지어를 착용했나요?"}]}'::jsonb, 1, true),
    (3, 'w9-d3-cl-2', '소량의 출혈이나 심한 경련 등 이상 증상이 없는지 확인했나요?', '소량의 출혈이나 심한 경련 등 이상 증상이 없는지 확인했나요?', '{"items": [{"id": "w9-d3-cl-2", "label": "소량의 출혈이나 심한 경련 등 이상 증상이 없는지 확인했나요?"}]}'::jsonb, 2, true),
    (3, 'w9-d3-cl-3', '엽산 및 임산부용 비타민을 오늘도 복용했나요?', '엽산 및 임산부용 비타민을 오늘도 복용했나요?', '{"items": [{"id": "w9-d3-cl-3", "label": "엽산 및 임산부용 비타민을 오늘도 복용했나요?"}]}'::jsonb, 3, true),
    (4, 'w9-d4-cl-1', '피로 해소를 위해 낮잠을 자거나 임산부용 베개를 활용해 숙면을 취했나요?', '피로 해소를 위해 낮잠을 자거나 임산부용 베개를 활용해 숙면을 취했나요?', '{"items": [{"id": "w9-d4-cl-1", "label": "피로 해소를 위해 낮잠을 자거나 임산부용 베개를 활용해 숙면을 취했나요?"}]}'::jsonb, 1, true),
    (4, 'w9-d4-cl-2', '가벼운 음식 위주의 소량씩 자주 먹는 식사 방법을 실천했나요?', '가벼운 음식 위주의 소량씩 자주 먹는 식사 방법을 실천했나요?', '{"items": [{"id": "w9-d4-cl-2", "label": "가벼운 음식 위주의 소량씩 자주 먹는 식사 방법을 실천했나요?"}]}'::jsonb, 2, true),
    (4, 'w9-d4-cl-3', '날것·덜 익힌 음식·비살균 유제품 등 감염 위험 식품을 피했나요?', '날것·덜 익힌 음식·비살균 유제품 등 감염 위험 식품을 피했나요?', '{"items": [{"id": "w9-d4-cl-3", "label": "날것·덜 익힌 음식·비살균 유제품 등 감염 위험 식품을 피했나요?"}]}'::jsonb, 3, true),
    (5, 'w9-d5-cl-1', '하루 20~60분 걷기 운동을 했나요? 운동 전 단백질 간식을 섭취했나요?', '하루 20~60분 걷기 운동을 했나요? 운동 전 단백질 간식을 섭취했나요?', '{"items": [{"id": "w9-d5-cl-1", "label": "하루 20~60분 걷기 운동을 했나요? 운동 전 단백질 간식을 섭취했나요?"}]}'::jsonb, 1, true),
    (5, 'w9-d5-cl-2', '탄성 있는 편안한 옷으로 바지 압박감을 줄였나요?', '탄성 있는 편안한 옷으로 바지 압박감을 줄였나요?', '{"items": [{"id": "w9-d5-cl-2", "label": "탄성 있는 편안한 옷으로 바지 압박감을 줄였나요?"}]}'::jsonb, 2, true),
    (5, 'w9-d5-cl-3', '아기의 뼈 발달을 위해 비타민 D가 풍부한 음식(달걀, 기름진 생선)을 섭취했나요?', '아기의 뼈 발달을 위해 비타민 D가 풍부한 음식(달걀, 기름진 생선)을 섭취했나요?', '{"items": [{"id": "w9-d5-cl-3", "label": "아기의 뼈 발달을 위해 비타민 D가 풍부한 음식(달걀, 기름진 생선)을 섭취했나요?"}]}'::jsonb, 3, true),
    (6, 'w9-d6-cl-1', '잇몸 보호를 위해 부드러운 칫솔로 꼼꼼히 양치질을 했나요?', '잇몸 보호를 위해 부드러운 칫솔로 꼼꼼히 양치질을 했나요?', '{"items": [{"id": "w9-d6-cl-1", "label": "잇몸 보호를 위해 부드러운 칫솔로 꼼꼼히 양치질을 했나요?"}]}'::jsonb, 1, true),
    (6, 'w9-d6-cl-2', '구강 건강을 위해 칼슘이 풍부한 임산부용 비타민을 복용했나요?', '구강 건강을 위해 칼슘이 풍부한 임산부용 비타민을 복용했나요?', '{"items": [{"id": "w9-d6-cl-2", "label": "구강 건강을 위해 칼슘이 풍부한 임산부용 비타민을 복용했나요?"}]}'::jsonb, 2, true),
    (6, 'w9-d6-cl-3', '독감 예방 접종 등 임신 중 권장 백신 접종 계획을 확인했나요?', '독감 예방 접종 등 임신 중 권장 백신 접종 계획을 확인했나요?', '{"items": [{"id": "w9-d6-cl-3", "label": "독감 예방 접종 등 임신 중 권장 백신 접종 계획을 확인했나요?"}]}'::jsonb, 3, true),
    (7, 'w9-d7-cl-1', '머리카락·피부 관리를 위해 순한 샴푸와 보습제를 사용했나요?', '머리카락·피부 관리를 위해 순한 샴푸와 보습제를 사용했나요?', '{"items": [{"id": "w9-d7-cl-1", "label": "머리카락·피부 관리를 위해 순한 샴푸와 보습제를 사용했나요?"}]}'::jsonb, 1, true),
    (7, 'w9-d7-cl-2', '아기와 유대감을 위해 조용한 시간을 갖고 태담이나 일기를 썼나요?', '아기와 유대감을 위해 조용한 시간을 갖고 태담이나 일기를 썼나요?', '{"items": [{"id": "w9-d7-cl-2", "label": "아기와 유대감을 위해 조용한 시간을 갖고 태담이나 일기를 썼나요?"}]}'::jsonb, 2, true),
    (7, 'w9-d7-cl-3', '생활환경 내 세척제·살충제·페인트 등 유해 화학물질에 노출되지 않았나요?', '생활환경 내 세척제·살충제·페인트 등 유해 화학물질에 노출되지 않았나요?', '{"items": [{"id": "w9-d7-cl-3", "label": "생활환경 내 세척제·살충제·페인트 등 유해 화학물질에 노출되지 않았나요?"}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 9)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w9-d1-q-1', '본격적인 ''태아''가 된 아기에게, 태명을 부르며 엄마의 진심을 담은 ''환영과 축하의 마음''을 전해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w9-d1-q-2', '멜론만큼 커진 자궁이 아기를 열심히 품어주는 것에 대해, 엄마는 자궁에게 어떤 특별한 감사의 말을 건네고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (1, 'w9-d1-q-3', '아기가 세상에 나와 이유식을 시작할 때, 엄마가 가장 먼저 함께 먹고 싶은 ''특별하고 건강한 간식''은 무엇이며, 그 이유는 무엇인지 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (2, 'w9-d2-q-1', '작은 주먹을 쥔 아기에게, 엄마가 전하고 싶은 ''가장 힘차고 용기를 북돋아 주는 응원의 메시지''는 무엇인지 자세히 들려주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w9-d2-q-2', '두통이나 잦은 소변 때문에 힘들 때, ''아기가 잘 자라는 증거''임을 되새기며 엄마 자신에게 가장 힘이 되는 긍정적인 말은 무엇인지 기록해 보아요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w9-d2-q-3', '아기의 작은 주먹을 상상하며, 아기가 세상에 나와 ''어떤 힘 있는 선한 행동''을 하며 살아가기를 바라는지 엄마의 소망을 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (3, 'w9-d3-q-1', '눈을 감은 아기에게, 엄마가 가장 아름답다고 생각하는 것들에 대해 이야기해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w9-d3-q-2', '눈에 띄게 커지고 통증도 느껴지는 가슴이 아기에게 젖을 줄 준비를 하는 몸이라고 생각하며, 엄마는 자신의 몸에게 어떤 따뜻한 감사함을 표현하고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w9-d3-q-3', '목이 길어지며 고개를 들 수 있게 된 아기가 세상에 나와 ''가장 먼저 바라볼 엄마의 모습''은 어떤 모습일지, 그때 엄마가 지을 표정과 감정을 상상해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (4, 'w9-d4-q-1', '몸속의 작은 장기들이 열심히 기능을 시작한 아기에게, 엄마의 ''건강하고 활기찬 에너지''를 어떤 방식으로 보내주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w9-d4-q-2', '쉽게 땀을 흘리거나 피로를 느끼는 엄마의 몸에게, 오늘 가장 필요하고 시원한 ''편안한 휴식''을 선물하고 어떤 위로의 말을 해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w9-d4-q-3', '아기가 건강하게 세상에 나와 엄마와 함께 ''가장 먼저 경험하고 싶은 즐거운 일''을 구체적으로 상상하며, 아기에게 기대감을 담아 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (5, 'w9-d5-q-1', '양수 속에서 팔다리를 활발하게 움직이는 아기를 위해, 엄마가 가장 좋아하는 ''신나고 긍정적인 댄스 음악''을 틀어주고 그 느낌을 이야기해 줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w9-d5-q-2', '아기를 품는 과정에서 겪는 몸의 변화를 자연스럽게 받아들이고, 엄마는 자신의 ''가장 아름다운 점''을 어떻게 칭찬하고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w9-d5-q-3', '아기가 세상에 나와 엄마, 아빠와 함께 ''가장 먼저 춤출 상황''은 언제일지 상상하며, 그때의 행복한 기분을 아기에게 미리 전달해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (6, 'w9-d6-q-1', '작은 손톱이 자라기 시작한 아기의 손을 상상하며, 엄마는 아기에게 자신의 ''예쁜 손이 어떤 일을 하는지''에 대해 어떤 이야기를 들려주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w9-d6-q-2', '태명에 담긴 엄마의 ''가장 깊고 간절한 소망''은 무엇인지 구체적으로 이야기해 주고, 그 이름이 아기에게 어떤 힘을 주기를 바라시는지 설명해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w9-d6-q-3', '엄마가 생각하는 '' 가장 매력적인 목소리''를 아기에게 들려주고 어떤 내용을 담았는지 설명해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (7, 'w9-d7-q-1', '배아기의 마지막을 건강하게 마무리한 아기의 놀라운 3주간의 성장을 진심으로 칭찬하며, 엄마가 느끼는 ''가장 큰 감동과 자랑스러움''을 표현해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w9-d7-q-2', '입덧의 절정 속에서도 아기를 훌륭하게 품어준 엄마의 몸에게, 가장 고맙고 미안했던 점은 무엇이며 어떻게 보답하고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w9-d7-q-3', '입덧의 고통스러운 임신 초기를 곧 졸업해요! 아기가 안정될 중기에 접어들어 엄마와 아기가 함께 ''가장 먼저 이루고 싶은 계획''은 무엇인가요', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 10 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  10,
  '10주차 발달 정보',
  '아기의 크기는 약 3.1cm, 딸기 크기만큼 성장했어요. 팔꿈치를 처음으로 구부릴 수 있고, 손목도 형성되었으며 연골과 뼈도 자라고 있어요.',
  '입덧이 여전히 지속될 수 있지만, 이번 주를 기점으로 서서히 완화되기 시작하는 산모들이 많아요. 자궁이 자몽 크기만큼 커지면서 아랫배가 뻐근하게 느껴질 수 있어요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '10주 1일차',
  '{"items": ["아기의 크기는 약 3.1cm, 딸기 크기만큼 성장했어요.", "팔꿈치를 처음으로 구부릴 수 있고, 손목도 형성되었으며 연골과 뼈도 자라고 있어요."]}'::jsonb,
  '{"items": ["입덧이 여전히 지속될 수 있지만, 이번 주를 기점으로 서서히 완화되기 시작하는 산모들이 많아요.", "자궁이 자몽 크기만큼 커지면서 아랫배가 뻐근하게 느껴질 수 있어요."]}'::jsonb,
  '아가는 이제 딸기만큼 컸어요! 손목도 돌릴 수 있는 능력자예요!',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 10
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '10주 2일차',
  '{"items": ["아기의 손가락과 발가락이 완전히 분리되고, 손톱과 발톱이 아주 작게 자라나기 시작했어요.", "손가락 관절이 발달하며, 곧 주먹을 쥐는 동작도 할 수 있게 돼요."]}'::jsonb,
  '{"items": ["임신 호르몬의 영향으로 피부가 기름지거나 트러블이 생길 수 있어요.", "혈액량이 증가하면서 혈관이 도드라져 보이거나 거미줄 혈관이 생길 수 있어요."]}'::jsonb,
  '아가는 이제 손가락이 완벽하게 분리되었어요!',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 10
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '10주 3일차',
  '{"items": ["아기의 이마는 발달하는 뇌 때문에 일시적으로 볼록해지고, 머리 크기가 몸의 절반 정도예요.", "중요 장기들이 제자리를 잡았으며, 뇌와 신경계는 더욱 정교하고 복잡하게 발달하고 있어요."]}'::jsonb,
  '{"items": ["혈류 증가와 에스트로겐 증가로 투명하고 무취한 흰색 질 분비물이 늘어날 수 있어요.", "빈뇨가 계속될 수 있으며, 자궁이 커지면서 일상생활이 불편할 수 있어요."]}'::jsonb,
  '아가는 태반이 자신을 열심히 키워주고 있어요. 이제 성장에 집중할 거예요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 10
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '10주 4일차',
  '{"items": ["아기는 양수 속에서 삼키기와 차기 연습을 하고 있어요.", "경련성 움직임이 나타나며, 초음파로 아기의 움직임을 확인할 수 있어요."]}'::jsonb,
  '{"items": ["체중 증가가 나타나기 시작하는 시기예요. 1~5파운드 정도 증가가 정상이에요.", "프로게스테론이 소화기관 근육을 이완시켜 속쓰림과 복부 팽만감이 생길 수 있어요."]}'::jsonb,
  '아가는 오늘 양수 속에서 운동했어요!',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 10
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '10주 5일차',
  '{"items": ["아기는 양수를 삼키며 소화 기관을 연습하고, 빨기 반사도 준비하고 있어요.", "치아가 될 작은 세포 그룹이 턱뼈에서 형성되고 있어요."]}'::jsonb,
  '{"items": ["아랫배에 당김이나 가벼운 통증이 있을 수 있어요. 이는 자궁이 커지면서 인대가 늘어나는 자연스러운 현상이에요.", "임신 호르몬의 영향으로 어지러움이나 현기증이 느껴질 수 있어요."]}'::jsonb,
  '아가는 이제 물도 삼킬 수 있어요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 10
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '10주 6일차',
  '{"items": ["뼈와 연골이 전신에서 자라기 시작하며, 척수의 시냅스가 팔다리와 손가락 움직임을 가능하게 해요.", "귀가 연골 조직으로 발달하기 시작하고, 눈은 각막·홍채·동공·수정체·망막이 완전히 형성됐어요."]}'::jsonb,
  '{"items": ["치아와 잇몸이 약해지고 염증이 생기기 쉬우니 주의해야 해요.", "철분 부족으로 인한 빈혈이나 현기증에 주의해야 해요. 철분 섭취량을 점검하세요."]}'::jsonb,
  '아가는 이제 튼튼한 뼈를 만들고 있어요. 똑똑한 뇌도 열심히 크고 있답니다!',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 10
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '10주 7일차',
  '{"items": ["대부분의 기형은 임신 10주 이전에 결정되며, 12주말에는 유산 위험이 크게 줄어들어요.", "이 시기부터는 정확한 성별을 확인할 수 있는 생식 기관이 형성됩니다."]}'::jsonb,
  '{"items": ["복부가 나오기 시작하며, 신축성 있는 허리밴드나 임부복 착용을 고려할 시기예요.", "감정 기복이 있을 수 있지만, 이제 감정이 점차 안정되기 시작하는 산모들도 많아요."]}'::jsonb,
  '아가는 이제 안전하고 튼튼해요!',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 10
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 10)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w10-d1-cl-1', '입덧 완화를 위해 5~6번 소량씩 나눠 먹고 차가운 음식을 활용해봤나요?', '입덧 완화를 위해 5~6번 소량씩 나눠 먹고 차가운 음식을 활용해봤나요?', '{"items": [{"id": "w10-d1-cl-1", "label": "입덧 완화를 위해 5~6번 소량씩 나눠 먹고 차가운 음식을 활용해봤나요?"}]}'::jsonb, 1, true),
    (1, 'w10-d1-cl-2', '임부용 브래지어를 준비해 커진 가슴을 잘 받쳐주었나요?', '임부용 브래지어를 준비해 커진 가슴을 잘 받쳐주었나요?', '{"items": [{"id": "w10-d1-cl-2", "label": "임부용 브래지어를 준비해 커진 가슴을 잘 받쳐주었나요?"}]}'::jsonb, 2, true),
    (1, 'w10-d1-cl-3', 'NIPT 검사 등 산전 유전자 검사 일정과 종류를 의사와 확인했나요?', 'NIPT 검사 등 산전 유전자 검사 일정과 종류를 의사와 확인했나요?', '{"items": [{"id": "w10-d1-cl-3", "label": "NIPT 검사 등 산전 유전자 검사 일정과 종류를 의사와 확인했나요?"}]}'::jsonb, 3, true),
    (2, 'w10-d2-cl-1', '철분이 풍부한 음식(붉은 육류, 녹색 채소, 견과류, 달걀)을 오늘 섭취했나요?', '철분이 풍부한 음식(붉은 육류, 녹색 채소, 견과류, 달걀)을 오늘 섭취했나요?', '{"items": [{"id": "w10-d2-cl-1", "label": "철분이 풍부한 음식(붉은 육류, 녹색 채소, 견과류, 달걀)을 오늘 섭취했나요?"}]}'::jsonb, 1, true),
    (2, 'w10-d2-cl-2', '철분 흡수를 높이기 위해 비타민 C가 풍부한 과일이나 주스를 함께 먹었나요?', '철분 흡수를 높이기 위해 비타민 C가 풍부한 과일이나 주스를 함께 먹었나요?', '{"items": [{"id": "w10-d2-cl-2", "label": "철분 흡수를 높이기 위해 비타민 C가 풍부한 과일이나 주스를 함께 먹었나요?"}]}'::jsonb, 2, true),
    (2, 'w10-d2-cl-3', '혈관이 도드라지거나 거미줄 혈관이 생겨도 정상이므로 과도하게 걱정하지 않았나요?', '혈관이 도드라지거나 거미줄 혈관이 생겨도 정상이므로 과도하게 걱정하지 않았나요?', '{"items": [{"id": "w10-d2-cl-3", "label": "혈관이 도드라지거나 거미줄 혈관이 생겨도 정상이므로 과도하게 걱정하지 않았나요?"}]}'::jsonb, 3, true),
    (3, 'w10-d3-cl-1', '목덜미 투명대 검사(NT scan) 예약을 했나요?', '목덜미 투명대 검사(NT scan) 예약을 했나요?', '{"items": [{"id": "w10-d3-cl-1", "label": "목덜미 투명대 검사(NT scan) 예약을 했나요?"}]}'::jsonb, 1, true),
    (3, 'w10-d3-cl-2', '질 분비물이 투명하고 무취한 경우 정상임을 확인했나요?', '질 분비물이 투명하고 무취한 경우 정상임을 확인했나요?', '{"items": [{"id": "w10-d3-cl-2", "label": "질 분비물이 투명하고 무취한 경우 정상임을 확인했나요?"}]}'::jsonb, 2, true),
    (3, 'w10-d3-cl-3', '치과 예약을 하고 양치질·치실 사용으로 구강 건강을 관리했나요?', '치과 예약을 하고 양치질·치실 사용으로 구강 건강을 관리했나요?', '{"items": [{"id": "w10-d3-cl-3", "label": "치과 예약을 하고 양치질·치실 사용으로 구강 건강을 관리했나요?"}]}'::jsonb, 3, true),
    (4, 'w10-d4-cl-1', '소화 불량·속쓰림 예방을 위해 소량 6번 식사, 야식과 커피·기름진 음식을 피했나요?', '소화 불량·속쓰림 예방을 위해 소량 6번 식사, 야식과 커피·기름진 음식을 피했나요?', '{"items": [{"id": "w10-d4-cl-1", "label": "소화 불량·속쓰림 예방을 위해 소량 6번 식사, 야식과 커피·기름진 음식을 피했나요?"}]}'::jsonb, 1, true),
    (4, 'w10-d4-cl-2', '임신 중 음주를 완전히 피하고 건강한 차(생강차·루이보스 등)로 대체했나요?', '임신 중 음주를 완전히 피하고 건강한 차(생강차·루이보스 등)로 대체했나요?', '{"items": [{"id": "w10-d4-cl-2", "label": "임신 중 음주를 완전히 피하고 건강한 차(생강차·루이보스 등)로 대체했나요?"}]}'::jsonb, 2, true),
    (4, 'w10-d4-cl-3', '튼살 예방을 위해 가슴·배·허벅지에 보습 크림을 발랐나요?', '튼살 예방을 위해 가슴·배·허벅지에 보습 크림을 발랐나요?', '{"items": [{"id": "w10-d4-cl-3", "label": "튼살 예방을 위해 가슴·배·허벅지에 보습 크림을 발랐나요?"}]}'::jsonb, 3, true),
    (5, 'w10-d5-cl-1', '인대 통증이 있을 때 심하면 의사에게 알리고 적절히 휴식을 취했나요?', '인대 통증이 있을 때 심하면 의사에게 알리고 적절히 휴식을 취했나요?', '{"items": [{"id": "w10-d5-cl-1", "label": "인대 통증이 있을 때 심하면 의사에게 알리고 적절히 휴식을 취했나요?"}]}'::jsonb, 1, true),
    (5, 'w10-d5-cl-2', '피로 해소를 위해 몸이 신호를 보낼 때 바로 쉬어주었나요?', '피로 해소를 위해 몸이 신호를 보낼 때 바로 쉬어주었나요?', '{"items": [{"id": "w10-d5-cl-2", "label": "피로 해소를 위해 몸이 신호를 보낼 때 바로 쉬어주었나요?"}]}'::jsonb, 2, true),
    (5, 'w10-d5-cl-3', '산전 요가나 가벼운 운동으로 몸을 움직였나요?', '산전 요가나 가벼운 운동으로 몸을 움직였나요?', '{"items": [{"id": "w10-d5-cl-3", "label": "산전 요가나 가벼운 운동으로 몸을 움직였나요?"}]}'::jsonb, 3, true),
    (6, 'w10-d6-cl-1', '오늘 엽산, 비타민D, 철분제 등 산전 비타민을 챙겨 복용했나요?', '오늘 엽산, 비타민D, 철분제 등 산전 비타민을 챙겨 복용했나요?', '{"items": [{"id": "w10-d6-cl-1", "label": "오늘 엽산, 비타민D, 철분제 등 산전 비타민을 챙겨 복용했나요?"}]}'::jsonb, 1, true),
    (6, 'w10-d6-cl-2', '피부 보호를 위해 순한 스킨케어 제품과 자외선 차단제를 사용했나요?', '피부 보호를 위해 순한 스킨케어 제품과 자외선 차단제를 사용했나요?', '{"items": [{"id": "w10-d6-cl-2", "label": "피부 보호를 위해 순한 스킨케어 제품과 자외선 차단제를 사용했나요?"}]}'::jsonb, 2, true),
    (6, 'w10-d6-cl-3', '소변 시 통증·혼탁·악취 등 요로 감염 증상이 없는지 확인했나요?', '소변 시 통증·혼탁·악취 등 요로 감염 증상이 없는지 확인했나요?', '{"items": [{"id": "w10-d6-cl-3", "label": "소변 시 통증·혼탁·악취 등 요로 감염 증상이 없는지 확인했나요?"}]}'::jsonb, 3, true),
    (7, 'w10-d7-cl-1', '몸에 달라붙지 않는 편안하고 신축성 있는 옷으로 바꿔 입었나요?', '몸에 달라붙지 않는 편안하고 신축성 있는 옷으로 바꿔 입었나요?', '{"items": [{"id": "w10-d7-cl-1", "label": "몸에 달라붙지 않는 편안하고 신축성 있는 옷으로 바꿔 입었나요?"}]}'::jsonb, 1, true),
    (7, 'w10-d7-cl-2', '임신 소식을 언제 어떻게 알릴지 배우자와 이야기를 나눴나요?', '임신 소식을 언제 어떻게 알릴지 배우자와 이야기를 나눴나요?', '{"items": [{"id": "w10-d7-cl-2", "label": "임신 소식을 언제 어떻게 알릴지 배우자와 이야기를 나눴나요?"}]}'::jsonb, 2, true),
    (7, 'w10-d7-cl-3', '임신 1분기 마무리를 앞두고 스스로를 칭찬하고 충분히 쉬었나요?', '임신 1분기 마무리를 앞두고 스스로를 칭찬하고 충분히 쉬었나요?', '{"items": [{"id": "w10-d7-cl-3", "label": "임신 1분기 마무리를 앞두고 스스로를 칭찬하고 충분히 쉬었나요?"}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 10)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w10-d1-q-1', '딸기처럼 귀여운 아기에게, 엄마가 가장 좋아하는 과일 이야기를 들려줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w10-d1-q-2', '이제 곧 입덧이 완화될 거예요! 입덧으로 힘들었지만 아기를 훌륭히 품어준 엄마의 몸에게 어떤 특별한 감사와 위로의 말을 전해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (1, 'w10-d1-q-3', '아기가 세상에 나와 작은 손으로 엄마의 손을 처음 잡는 순간을 상상하며, 그 순간 엄마의 마음과 감동을 자세히 기록해 보아요', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (2, 'w10-d2-q-1', '작고 귀여운 손톱과 발톱이 자라기 시작했어요. 엄마의 사랑이 앞으로 아기를 어떻게 지켜줄 것인지, 구체적인 다짐을 담아 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w10-d2-q-2', '몸의 변화가 아기를 위한 노력이라고 생각하며, 엄마는 자신에게 어떤 따뜻한 위로와 긍정적인 칭찬을 해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w10-d2-q-3', '세상에 하나뿐인 아기의 지문이 형성되고 있어요. 아기가 세상에 남길 ''고유하고 멋진 흔적''은 어떤 모습일지 엄마의 소망을 담아 이야기해 보아요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (3, 'w10-d3-q-1', '태반처럼 아기를 든든하게 지켜줄 엄마의 마음에 대해 이야기해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w10-d3-q-2', '잦은 소변 때문에 잠을 설치거나 일상생활이 불편해도, 이것이 아기가 건강하다는 증거라고 긍정적으로 생각할 수 있는 엄마만의 특별한 방법을 찾아볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w10-d3-q-3', '눈꺼풀 속에 덮여 있는 아기의 밝은 눈을 상상하며, 아기가 세상에 나와 처음 엄마를 바라볼 때 엄마는 어떤 표정과 태도로 아기를 맞이하고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (4, 'w10-d4-q-1', '아기가 하품하고 딸꾹질하는 모습을 상상하며, 엄마는 오늘 어떤 사랑스러운 말을 해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w10-d4-q-2', '태반이 아기에게 영양분을 주듯, 엄마는 아기에게 ''어떤 형태의 사랑과 가치''를 가장 풍부하게 공급해주는 사람이 되고 싶은지 구체적으로 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w10-d4-q-3', '아기의 활발한 움직임을 응원하며, 엄마와 아기가 세상에 나와 함께 ''가장 활발하고 재미있게 할 활동''을 구체적으로 계획해 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (5, 'w10-d5-q-1', '아기가 양수를 삼키는 모습을 상상하며, 세상에 나올 준비를 하는 아기를 응원해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w10-d5-q-2', '아랫배의 당김이나 뻐근함이 아기가 커지고 있다는 기쁜 소식이라고 믿으며, 엄마는 이 불편함을 이겨내기 위해 어떤 긍정적인 생각이나 휴식 방법을 취하고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w10-d5-q-3', '아기가 세상에 나와 엄마의 젖을 물 모습을 상상하며, 그 순간 아기에게 전해주고 싶은 ''가장 따뜻하고 헌신적인 사랑의 표현''은 무엇인지 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (6, 'w10-d6-q-1', '단단해지는 아기의 뼈처럼, 엄마는 아기에게 흔들리지 않는 사랑을 약속해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w10-d6-q-2', '뇌가 급속도로 발달하는 아기를 위해, 엄마가 가장 좋아하는 ''삶의 지혜가 담긴 이야기''를 선정하고, 아기에게 어떻게 들려주고 싶은지 구체적으로 적어 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w10-d6-q-3', '움직임이 활발해진 아기에게, 엄마가 아기의 미래를 위해 심어주고 싶은 ''가장 멋지고 행복한 꿈''은 무엇이며, 그 꿈을 위해 엄마가 해줄 수 있는 것은 무엇인지 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (7, 'w10-d7-q-1', '아기가 안전하게 잘 자라고 있음에 대해 엄마의 기쁨과 감사를 표현해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w10-d7-q-2', '입덧의 고통을 이겨내고 임신 중기에 접어들 준비를 하는 엄마 자신에게, 가장 해주고 싶은 ''진심 어린 칭찬과 보상''은 무엇인지 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w10-d7-q-3', '안정기에 접어드는 중기부터 아기에게 집중적으로 해주고 싶은 ''가장 중요한 태교 계획(예: 미술, 음악, 독서 등)''을 세워 이야기해 주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 11 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  11,
  '11주차 발달 정보',
  '아기의 크기는 약 4.1cm, 무화과(또는 라임) 크기만큼 성장했어요. 유산 위험이 현저히 낮아지기 시작하며, 주요 장기 형성이 거의 마무리됩니다.',
  '입덧은 9~11주에 정점을 찍고 12~14주부터 크게 완화되기 시작해요. 자궁이 골반 위로 올라오기 시작하며, 근육과 인대가 늘어나 복부 주변에 통증이 생길 수 있어요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '11주 1일차',
  '{"items": ["아기의 크기는 약 4.1cm, 무화과(또는 라임) 크기만큼 성장했어요.", "유산 위험이 현저히 낮아지기 시작하며, 주요 장기 형성이 거의 마무리됩니다."]}'::jsonb,
  '{"items": ["입덧은 9~11주에 정점을 찍고 12~14주부터 크게 완화되기 시작해요.", "자궁이 골반 위로 올라오기 시작하며, 근육과 인대가 늘어나 복부 주변에 통증이 생길 수 있어요."]}'::jsonb,
  '아가는 이제 무화과만큼 컸어요! 위험한 시기를 넘기고 안전하게 자랄 거예요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 11
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '11주 2일차',
  '{"items": ["아기는 손가락으로 놀이를 하며 엄지손가락을 입에 넣을 수도 있어요.", "손가락과 발가락의 물갈퀴가 완전히 사라지고, 작은 손발톱과 모낭이 형성되고 있어요."]}'::jsonb,
  '{"items": ["가스와 소화 불량이 지속될 수 있어요. 기름진 음식, 콩류 등 가스 유발 음식을 피하세요.", "혈액이 평소보다 최대 50% 더 많이 순환하면서 몸이 덥고 땀이 나며 어지러움을 느낄 수 있어요."]}'::jsonb,
  '아가는 양수 속에서 뱅글뱅글 돌고 있어요! 엄마는 아가의 움직임을 느낄 수 있나요?',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 11
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '11주 3일차',
  '{"items": ["모든 얼굴 뼈가 자리를 잡고, 귀가 보다 친숙한 형태를 갖추기 시작해요.", "간은 적혈구를 만들고, 신장은 소변을 생성하며, 췌장은 인슐린을 분비하기 시작해요."]}'::jsonb,
  '{"items": ["빈뇨 증상이 다소 완화될 수 있어요. 자궁이 골반 위로 올라오면서 방광 압박이 일시적으로 줄어들기 때문이에요.", "감정 기복이 심해질 수 있어요. 요가 같은 심신 운동이 도움이 될 수 있어요."]}'::jsonb,
  '아가는 이제 소변도 만들 수 있어요. 몸속 기관들이 열심히 일하고 있답니다.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 11
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '11주 4일차',
  '{"items": ["뇌의 좌우 반구가 모두 발달하고 있어요. 좌뇌는 논리, 우뇌는 언어 처리를 담당하게 돼요.", "생식 기관이 발달하기 시작하지만, 초음파로 성별을 확인하기에는 아직 몇 주 더 걸려요."]}'::jsonb,
  '{"items": ["질 분비물이 늘어날 수 있어요. 이는 자궁과 자궁경부의 분비물을 배출하는 자연스러운 현상이에요.", "두통, 현기증 등의 증상이 나타날 수 있으며, 이는 호르몬 변화와 혈액량 증가 때문이에요."]}'::jsonb,
  '아가는 머릿속에서 복잡하고 신기한 일이 벌어지고 있어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 11
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '11주 5일차',
  '{"items": ["아기는 입을 벌리고 닫을 수 있으며, 주먹을 쥐는 동작도 할 수 있어요.", "치아 싹이 잇몸 아래에서 자라고 있어요."]}'::jsonb,
  '{"items": ["앞으로 몇 주간 유방 및 유두 통증이 지속될 수 있어요. 이는 유선이 발달하는 자연스러운 과정이에요.", "심한 피로감이 지속될 수 있지만, 임신 2분기에 접어들면서 에너지가 돌아올 거예요."]}'::jsonb,
  '아가는 작은 주먹을 쥐었다 폈다 할 수 있어요!',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 11
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '11주 6일차',
  '{"items": ["탯줄이 영양분을 공급하고 노폐물을 제거하는 역할을 하고 있어요.", "아기는 뱃속에서 활발하게 움직이지만, 태동은 16~22주경이 되어야 느낄 수 있어요."]}'::jsonb,
  '{"items": ["배 아래쪽 중앙에 어두운 선(linea nigra)이 나타날 수 있는데, 이는 호르몬 변화로 인한 정상적인 증상이에요.", "소화기관이 느려져 속쓰림이 나타날 수 있어요. 소량씩 자주 먹고 기름진 음식을 피하세요."]}'::jsonb,
  '아가는 탯줄이 아주 튼튼해요. 엄마의 좋은 기운을 듬뿍 받고 있답니다!',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 11
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '11주 7일차',
  '{"items": ["아기는 앞으로 3주 안에 키가 약 두 배로 커질 예정이에요.", "태반이 난황낭의 역할을 이어받아 아기에게 영양을 공급하고 노폐물을 제거해요."]}'::jsonb,
  '{"items": ["2주 후면 임신 2분기가 시작됩니다. 많은 여성들이 이 시기부터 생기가 돌고 활력을 되찾기 시작해요.", "호르몬이 점차 안정되면서 두통, 피로, 메스꺼움 등의 증상이 점차 완화되기 시작해요."]}'::jsonb,
  '아가는 이제 성장 모드를 켰어요! 엄마가 주시는 영양분으로 쑥쑥 클 거예요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 11
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 11)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w11-d1-cl-1', '칼슘이 풍부한 음식(우유·치즈·두부·아몬드·연어·달걀)을 하루 1000mg 목표로 섭취했나요?', '칼슘이 풍부한 음식(우유·치즈·두부·아몬드·연어·달걀)을 하루 1000mg 목표로 섭취했나요?', '{"items": [{"id": "w11-d1-cl-1", "label": "칼슘이 풍부한 음식(우유·치즈·두부·아몬드·연어·달걀)을 하루 1000mg 목표로 섭취했나요?"}]}'::jsonb, 1, true),
    (1, 'w11-d1-cl-2', 'NIPT(비침습적 산전 검사) 또는 목덜미 투명대 검사(NT) 예약을 확인했나요?', 'NIPT(비침습적 산전 검사) 또는 목덜미 투명대 검사(NT) 예약을 확인했나요?', '{"items": [{"id": "w11-d1-cl-2", "label": "NIPT(비침습적 산전 검사) 또는 목덜미 투명대 검사(NT) 예약을 확인했나요?"}]}'::jsonb, 2, true),
    (1, 'w11-d1-cl-3', '수분을 충분히 섭취하고 자외선 차단제와 보습제로 피부를 관리했나요?', '수분을 충분히 섭취하고 자외선 차단제와 보습제로 피부를 관리했나요?', '{"items": [{"id": "w11-d1-cl-3", "label": "수분을 충분히 섭취하고 자외선 차단제와 보습제로 피부를 관리했나요?"}]}'::jsonb, 3, true),
    (2, 'w11-d2-cl-1', '가스 유발 음식(콩류·기름진 음식)을 피하고 섬유질과 수분을 충분히 섭취했나요?', '가스 유발 음식(콩류·기름진 음식)을 피하고 섬유질과 수분을 충분히 섭취했나요?', '{"items": [{"id": "w11-d2-cl-1", "label": "가스 유발 음식(콩류·기름진 음식)을 피하고 섬유질과 수분을 충분히 섭취했나요?"}]}'::jsonb, 1, true),
    (2, 'w11-d2-cl-2', '어지러움이 느껴질 때 무리하지 않고 충분히 쉬었나요?', '어지러움이 느껴질 때 무리하지 않고 충분히 쉬었나요?', '{"items": [{"id": "w11-d2-cl-2", "label": "어지러움이 느껴질 때 무리하지 않고 충분히 쉬었나요?"}]}'::jsonb, 2, true),
    (2, 'w11-d2-cl-3', '임부복(신축성 있는 허리밴드)을 준비해 편하게 입었나요?', '임부복(신축성 있는 허리밴드)을 준비해 편하게 입었나요?', '{"items": [{"id": "w11-d2-cl-3", "label": "임부복(신축성 있는 허리밴드)을 준비해 편하게 입었나요?"}]}'::jsonb, 3, true),
    (3, 'w11-d3-cl-1', '복부 통증이 심할 때 바로 조산사나 의사에게 연락할 준비가 되어 있나요?', '복부 통증이 심할 때 바로 조산사나 의사에게 연락할 준비가 되어 있나요?', '{"items": [{"id": "w11-d3-cl-1", "label": "복부 통증이 심할 때 바로 조산사나 의사에게 연락할 준비가 되어 있나요?"}]}'::jsonb, 1, true),
    (3, 'w11-d3-cl-2', '감정 기복 조절을 위해 요가나 마음챙김 운동을 했나요?', '감정 기복 조절을 위해 요가나 마음챙김 운동을 했나요?', '{"items": [{"id": "w11-d3-cl-2", "label": "감정 기복 조절을 위해 요가나 마음챙김 운동을 했나요?"}]}'::jsonb, 2, true),
    (3, 'w11-d3-cl-3', '1차 기형아 검사(초음파·혈액 검사) 일정을 확인했나요?', '1차 기형아 검사(초음파·혈액 검사) 일정을 확인했나요?', '{"items": [{"id": "w11-d3-cl-3", "label": "1차 기형아 검사(초음파·혈액 검사) 일정을 확인했나요?"}]}'::jsonb, 3, true),
    (4, 'w11-d4-cl-1', '질 분비물이 투명하고 무취인지 확인하고 팬티라이너를 활용했나요?', '질 분비물이 투명하고 무취인지 확인하고 팬티라이너를 활용했나요?', '{"items": [{"id": "w11-d4-cl-1", "label": "질 분비물이 투명하고 무취인지 확인하고 팬티라이너를 활용했나요?"}]}'::jsonb, 1, true),
    (4, 'w11-d4-cl-2', '두통 예방을 위해 수분을 충분히 섭취하고 규칙적으로 식사했나요?', '두통 예방을 위해 수분을 충분히 섭취하고 규칙적으로 식사했나요?', '{"items": [{"id": "w11-d4-cl-2", "label": "두통 예방을 위해 수분을 충분히 섭취하고 규칙적으로 식사했나요?"}]}'::jsonb, 2, true),
    (4, 'w11-d4-cl-3', '임신 소식을 언제 어떻게 알릴지 계획해봤나요?', '임신 소식을 언제 어떻게 알릴지 계획해봤나요?', '{"items": [{"id": "w11-d4-cl-3", "label": "임신 소식을 언제 어떻게 알릴지 계획해봤나요?"}]}'::jsonb, 3, true),
    (5, 'w11-d5-cl-1', '편안하고 지지력 있는 임부용 브래지어를 착용했나요?', '편안하고 지지력 있는 임부용 브래지어를 착용했나요?', '{"items": [{"id": "w11-d5-cl-1", "label": "편안하고 지지력 있는 임부용 브래지어를 착용했나요?"}]}'::jsonb, 1, true),
    (5, 'w11-d5-cl-2', '다리 경련 예방을 위해 충분한 수분과 칼륨·마그네슘이 풍부한 음식을 섭취했나요?', '다리 경련 예방을 위해 충분한 수분과 칼륨·마그네슘이 풍부한 음식을 섭취했나요?', '{"items": [{"id": "w11-d5-cl-2", "label": "다리 경련 예방을 위해 충분한 수분과 칼륨·마그네슘이 풍부한 음식을 섭취했나요?"}]}'::jsonb, 2, true),
    (5, 'w11-d5-cl-3', '걷기 등 가벼운 운동으로 몸을 움직였나요?', '걷기 등 가벼운 운동으로 몸을 움직였나요?', '{"items": [{"id": "w11-d5-cl-3", "label": "걷기 등 가벼운 운동으로 몸을 움직였나요?"}]}'::jsonb, 3, true),
    (6, 'w11-d6-cl-1', '속쓰림 예방을 위해 소량 자주 식사하고 식후 바로 눕지 않았나요?', '속쓰림 예방을 위해 소량 자주 식사하고 식후 바로 눕지 않았나요?', '{"items": [{"id": "w11-d6-cl-1", "label": "속쓰림 예방을 위해 소량 자주 식사하고 식후 바로 눕지 않았나요?"}]}'::jsonb, 1, true),
    (6, 'w11-d6-cl-2', '물·가벼운 차·과채 주스로 하루 2리터 수분 섭취를 유지했나요?', '물·가벼운 차·과채 주스로 하루 2리터 수분 섭취를 유지했나요?', '{"items": [{"id": "w11-d6-cl-2", "label": "물·가벼운 차·과채 주스로 하루 2리터 수분 섭취를 유지했나요?"}]}'::jsonb, 2, true),
    (6, 'w11-d6-cl-3', '신선한 과일과 채소 위주의 균형 잡힌 식단을 유지했나요?', '신선한 과일과 채소 위주의 균형 잡힌 식단을 유지했나요?', '{"items": [{"id": "w11-d6-cl-3", "label": "신선한 과일과 채소 위주의 균형 잡힌 식단을 유지했나요?"}]}'::jsonb, 3, true),
    (7, 'w11-d7-cl-1', '임신 기간 동안의 배 변화를 기록하는 사진 일기를 시작했나요?', '임신 기간 동안의 배 변화를 기록하는 사진 일기를 시작했나요?', '{"items": [{"id": "w11-d7-cl-1", "label": "임신 기간 동안의 배 변화를 기록하는 사진 일기를 시작했나요?"}]}'::jsonb, 1, true),
    (7, 'w11-d7-cl-2', '베이비문 여행을 배우자와 함께 계획해봤나요?', '베이비문 여행을 배우자와 함께 계획해봤나요?', '{"items": [{"id": "w11-d7-cl-2", "label": "베이비문 여행을 배우자와 함께 계획해봤나요?"}]}'::jsonb, 2, true),
    (7, 'w11-d7-cl-3', '임신 1분기를 무사히 지낸 스스로에게 충분히 칭찬하고 쉬었나요?', '임신 1분기를 무사히 지낸 스스로에게 충분히 칭찬하고 쉬었나요?', '{"items": [{"id": "w11-d7-cl-3", "label": "임신 1분기를 무사히 지낸 스스로에게 충분히 칭찬하고 쉬었나요?"}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 11)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w11-d1-q-1', '무화과처럼 예쁜 아기에게, 엄마가 세상에서 가장 아끼는 것에 대해 이야기해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w11-d1-q-2', '점점 불러오는 배를 보며, 아기를 안전하게 품어준 엄마의 몸에게 어떤 진심 어린 사랑의 말을 전해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (1, 'w11-d1-q-3', '아기가 건강하게 세상에 나와 엄마, 아빠와 함께 할 ''첫 번째 야외 활동''은 무엇이며, 그 활동이 아기에게 어떤 즐거운 기억을 선사할지 구체적으로 상상해 이야기해 주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (2, 'w11-d2-q-1', '팔을 뻗고 몸을 구부리며 활발하게 움직이는 아기에게, 에너지를 북돋아 주고 함께 리듬을 타고 싶은 ''엄마만의 신나는 노래''를 불러주고 그 이유를 설명해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w11-d2-q-2', '변비나 소화불량, 어지러움 같은 불편함이 아기의 활발한 성장을 위한 것이라고 믿으며, 엄마는 자신에게 어떤 긍정적인 말로 스스로를 격려하고 위로해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w11-d2-q-3', '손가락 발가락이 완성되고 움직임이 활발해진 아기에게, 세상에 나와 ''가장 먼저 배우면 좋을 춤이나 놀이''는 무엇이며, 엄마가 어떻게 가르쳐주고 싶으신지 이야기해 주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (3, 'w11-d3-q-1', '열심히 일하는 아기의 몸에 대해 칭찬해주며 사랑의 에너지를 보내줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w11-d3-q-2', '감정 기복이 심해졌지만, 아기와 함께여서 고맙다고 이야기해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w11-d3-q-3', '작은 손으로 주먹을 쥐고 펴는 아기에게, 엄마의 따뜻한 사랑과 감성이 담긴 ''가장 좋아하는 시''를 읽어주고 시가 가진 의미를 설명해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (4, 'w11-d4-q-1', '똑똑하게 발달하는 아기의 뇌에게, 엄마의 가장 행복한 기억을 이야기해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w11-d4-q-2', '임신선이 생기거나 피부색이 짙어질까 걱정될 때, 이를 ''아기를 품은 자랑스러운 훈장''이라 여기며 엄마 자신에게 어떤 긍정적인 위로와 격려를 해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w11-d4-q-3', '아기가 세상에 나와 처음으로 엄마에게 들려줄 목소리(울음, 옹알이)를 상상하며, 그 소리를 들었을 때 엄마가 느낄 감동과 반응을 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (5, 'w11-d5-q-1', '작은 주먹을 쥐었다 폈다 할 수 있는 아기에게, 엄마가 아기를 세상에서 가장 따뜻하게 안아주고 싶은 마음을 어떤 구체적인 표현이나 이야기로 전달해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w11-d5-q-2', '가슴 주변의 푸른 혈관이 선명해지는 것을 보며, 이것이 아기에게 영양을 전달하는 엄마의 숭고한 노력이라고 어떻게 긍정적으로 받아들이고 감사함을 표현하고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w11-d5-q-3', '아기가 세상에 나와 엄마에게 보일 ''천진난만하고 사랑스러운 첫 미소''를 상상하며, 그 미소가 엄마에게 어떤 행복과 감동을 줄지 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (6, 'w11-d6-q-1', '더욱 강해지고 두꺼워진 탯줄이 아기에게 산소와 영양분을 효율적으로 공급해주는 것에 대해, 엄마가 탯줄에게 어떤 특별한 감사와 안도감을 표현하고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w11-d6-q-2', '양수를 흡입하고 배출하며 호흡 연습을 하는 아기의 폐 기능 발달을 응원하며, 엄마의 깊고 건강한 숨결을 아기가 느낄 수 있도록 어떤 방식으로 교감하고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w11-d6-q-3', '임신 초기 단계를 넘어선 아기가 세상에 나와 가장 먼저 엄마와 나누고 싶은 ''가장 사소하고 행복한 이야기''는 무엇일지 상상하며 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (7, 'w11-d7-q-1', '아기가 2분기를 맞이하는 것에 대해 엄마의 기대감과 설렘을 표현해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w11-d7-q-2', '힘든 초기를 견뎌낸 엄마의 몸에게 가장 감사하고 싶은 점을 이야기해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w11-d7-q-3', '아기가 세상에 나와 함께 축하하고 싶은 특별한 기념일은 무엇인지 이야기해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 12 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  12,
  '12주차 발달 정보',
  '아기의 크기는 약 5.4cm, 자두(또는 라임) 크기만큼 성장했어요. 주요 장기, 뼈, 근육이 모두 자리를 잡아 완전한 형성을 이루었어요.',
  '유방이 점점 커지고 부드러워지며, 유두 색이 진해질 수 있어요. 호르몬 변화로 피로감이 지속될 수 있어요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '12주 1일차',
  '{"items": ["아기의 크기는 약 5.4cm, 자두(또는 라임) 크기만큼 성장했어요.", "주요 장기, 뼈, 근육이 모두 자리를 잡아 완전한 형성을 이루었어요."]}'::jsonb,
  '{"items": ["유방이 점점 커지고 부드러워지며, 유두 색이 진해질 수 있어요.", "호르몬 변화로 피로감이 지속될 수 있어요."]}'::jsonb,
  '아가는 자두만큼 컸어요! 이제 더 튼튼하게 자랄 거예요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 12
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '12주 2일차',
  '{"items": ["아기는 손가락과 발가락이 완전히 분리되어 주먹을 쥐거나 발가락을 오므릴 수 있어요.", "아주 작은 손발톱이 자라나고 있어요."]}'::jsonb,
  '{"items": ["잦은 소변이 지속될 수 있어요.", "감정 기복이 심해질 수 있지만, 호르몬이 점차 안정되면서 나아질 거예요."]}'::jsonb,
  '아가는 손가락이 이제 따로따로 움직여요. 곧 엄마 손도 잡아볼 수 있겠죠.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 12
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '12주 3일차',
  '{"items": ["아기의 뇌가 빠르게 발달하고 반사 신경이 작동하기 시작해요.", "아기의 코와 턱이 뚜렷하게 드러나며 사람다운 얼굴 윤곽이 잡히기 시작해요."]}'::jsonb,
  '{"items": ["배가 볼록해지기 시작하고 임부복이나 신축성 있는 옷이 필요해질 수 있어요.", "멜라닌 색소 증가로 기미(임신 마스크)가 생길 수 있어요."]}'::jsonb,
  '아가는 얼굴이 점점 또렷해지고 있어요. 곧 귀여운 옆모습을 보여줄 수 있어요!',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 12
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '12주 4일차',
  '{"items": ["주요 장기, 뼈, 근육이 자리를 잡고 소화·비뇨·순환 시스템이 기능하기 시작해요.", "아기는 소량의 양수를 삼키며 폐호흡과 음식 섭취를 연습하고 소변도 배출해요."]}'::jsonb,
  '{"items": ["두통과 어지러움이 나타날 수 있어요. 혈당 저하, 탈수, 호르몬 변화가 주요 원인이에요.", "출혈이 보이거나 복통을 동반한 출혈이라면 즉시 의사에게 알려야 해요."]}'::jsonb,
  '아가는 양수 속에서 운동했어요. 팔다리도 뻗고, 하품도 했답니다!',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 12
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '12주 5일차',
  '{"items": ["아기의 장이 탯줄 쪽으로 돌출되었다가 곧 복벽이 닫히며 복부 안으로 들어가게 돼요.", "간이 적혈구를 만들어 내기 시작하며, 이제부터는 성장과 성숙에 집중해요."]}'::jsonb,
  '{"items": ["혈류량 증가로 외음부가 푸른빛을 띠는 등의 혈관 변화가 나타날 수 있어요.", "체중 증가가 시작되며, 주당 약 250~300g 속도로 늘어나기 시작해요."]}'::jsonb,
  '아가는 이제 물도 삼킬 수 있어요. 젖도 잘 먹을 준비를 하고 있어요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 12
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '12주 6일차',
  '{"items": ["치아 싹 20개가 잇몸 아래에 자리하고 있고, 성기관도 형성되고 있어요.", "손가락에 촉각 패드가 발달하고 눈꺼풀의 미세한 움직임도 초음파로 확인할 수 있어요."]}'::jsonb,
  '{"items": ["피로감이 지속될 수 있어요. 이는 철분 부족과도 연관될 수 있으므로 철분 수치를 점검해보세요.", "투명한 질 분비물이 늘어날 수 있어요. 이는 질 감염을 예방하는 자연스러운 현상이에요.", "철분 부족으로 인한 빈혈이나 현기증에 주의해야 해요."]}'::jsonb,
  '아가는 이제 엄마 목소리의 울림을 느낄 수 있어요. 자주 이야기해 주세요!',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 12
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '12주 7일차',
  '{"items": ["임신 1분기가 끝나가며 아기는 뼈·근육·팔다리·장기를 모두 갖추어 완전한 형성을 이루었어요.", "이제 2분기부터는 각 장기와 조직이 빠르게 성장하고 성숙해지는 단계에 진입해요."]}'::jsonb,
  '{"items": ["13주차부터 임신 2분기가 시작됩니다. 지금까지 잘 견뎌주신 엄마 몸에 감사해요!"]}'::jsonb,
  '아가는 힘든 초기 단계를 건강하게 통과했어요! 이제 안정적인 중기로 함께 나아가요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 12
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 12)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w12-d1-cl-1', '이번 주 유산 위험이 크게 감소했어요. 충분한 수분(하루 8~10컵)을 섭취했나요?', '이번 주 유산 위험이 크게 감소했어요. 충분한 수분(하루 8~10컵)을 섭취했나요?', '{"items": [{"id": "w12-d1-cl-1", "label": "이번 주 유산 위험이 크게 감소했어요. 충분한 수분(하루 8~10컵)을 섭취했나요?"}]}'::jsonb, 1, true),
    (1, 'w12-d1-cl-2', '임신 중 권장 백신 접종 일정을 의사와 확인했나요?', '임신 중 권장 백신 접종 일정을 의사와 확인했나요?', '{"items": [{"id": "w12-d1-cl-2", "label": "임신 중 권장 백신 접종 일정을 의사와 확인했나요?"}]}'::jsonb, 2, true),
    (1, 'w12-d1-cl-3', '임신 소식을 가족·친구에게 알릴 시기와 방법을 계획했나요?', '임신 소식을 가족·친구에게 알릴 시기와 방법을 계획했나요?', '{"items": [{"id": "w12-d1-cl-3", "label": "임신 소식을 가족·친구에게 알릴 시기와 방법을 계획했나요?"}]}'::jsonb, 3, true),
    (2, 'w12-d2-cl-1', '입덧이 완화되기 시작했나요? 여전히 소량씩 자주 먹는 습관을 유지했나요?', '입덧이 완화되기 시작했나요? 여전히 소량씩 자주 먹는 습관을 유지했나요?', '{"items": [{"id": "w12-d2-cl-1", "label": "입덧이 완화되기 시작했나요? 여전히 소량씩 자주 먹는 습관을 유지했나요?"}]}'::jsonb, 1, true),
    (2, 'w12-d2-cl-2', '에너지가 돌아오기 시작하면 가벼운 산전 운동을 시작할 준비를 했나요?', '에너지가 돌아오기 시작하면 가벼운 산전 운동을 시작할 준비를 했나요?', '{"items": [{"id": "w12-d2-cl-2", "label": "에너지가 돌아오기 시작하면 가벼운 산전 운동을 시작할 준비를 했나요?"}]}'::jsonb, 2, true),
    (2, 'w12-d2-cl-3', '아기 이름을 생각하기 시작하거나 아기 용품 목록을 만들어봤나요?', '아기 이름을 생각하기 시작하거나 아기 용품 목록을 만들어봤나요?', '{"items": [{"id": "w12-d2-cl-3", "label": "아기 이름을 생각하기 시작하거나 아기 용품 목록을 만들어봤나요?"}]}'::jsonb, 3, true),
    (3, 'w12-d3-cl-1', '기미 예방을 위해 SPF 광물성 자외선 차단제와 챙 넓은 모자를 사용했나요?', '기미 예방을 위해 SPF 광물성 자외선 차단제와 챙 넓은 모자를 사용했나요?', '{"items": [{"id": "w12-d3-cl-1", "label": "기미 예방을 위해 SPF 광물성 자외선 차단제와 챙 넓은 모자를 사용했나요?"}]}'::jsonb, 1, true),
    (3, 'w12-d3-cl-2', '임부복 쇼핑을 시작하고, 신축성 있는 편한 옷으로 교체했나요?', '임부복 쇼핑을 시작하고, 신축성 있는 편한 옷으로 교체했나요?', '{"items": [{"id": "w12-d3-cl-2", "label": "임부복 쇼핑을 시작하고, 신축성 있는 편한 옷으로 교체했나요?"}]}'::jsonb, 2, true),
    (3, 'w12-d3-cl-3', '12주 초음파 검사(예정일 계산 초음파)를 받을 준비를 했나요?', '12주 초음파 검사(예정일 계산 초음파)를 받을 준비를 했나요?', '{"items": [{"id": "w12-d3-cl-3", "label": "12주 초음파 검사(예정일 계산 초음파)를 받을 준비를 했나요?"}]}'::jsonb, 3, true),
    (4, 'w12-d4-cl-1', '두통 예방을 위해 규칙적인 식사와 충분한 수분을 섭취했나요?', '두통 예방을 위해 규칙적인 식사와 충분한 수분을 섭취했나요?', '{"items": [{"id": "w12-d4-cl-1", "label": "두통 예방을 위해 규칙적인 식사와 충분한 수분을 섭취했나요?"}]}'::jsonb, 1, true),
    (4, 'w12-d4-cl-2', '출혈이나 심한 복통 등 이상 증상이 없는지 확인했나요?', '출혈이나 심한 복통 등 이상 증상이 없는지 확인했나요?', '{"items": [{"id": "w12-d4-cl-2", "label": "출혈이나 심한 복통 등 이상 증상이 없는지 확인했나요?"}]}'::jsonb, 2, true),
    (4, 'w12-d4-cl-3', '임신 진행 사항을 기록하기 위해 임신 일기나 배 사진을 남겼나요?', '임신 진행 사항을 기록하기 위해 임신 일기나 배 사진을 남겼나요?', '{"items": [{"id": "w12-d4-cl-3", "label": "임신 진행 사항을 기록하기 위해 임신 일기나 배 사진을 남겼나요?"}]}'::jsonb, 3, true),
    (5, 'w12-d5-cl-1', '골반저근 강화를 위해 케겔 운동을 하루에 10~20회 이상 실천했나요?', '골반저근 강화를 위해 케겔 운동을 하루에 10~20회 이상 실천했나요?', '{"items": [{"id": "w12-d5-cl-1", "label": "골반저근 강화를 위해 케겔 운동을 하루에 10~20회 이상 실천했나요?"}]}'::jsonb, 1, true),
    (5, 'w12-d5-cl-2', '건강한 임신을 위해 규칙적인 운동(걷기 등 20~30분)을 했나요?', '건강한 임신을 위해 규칙적인 운동(걷기 등 20~30분)을 했나요?', '{"items": [{"id": "w12-d5-cl-2", "label": "건강한 임신을 위해 규칙적인 운동(걷기 등 20~30분)을 했나요?"}]}'::jsonb, 2, true),
    (5, 'w12-d5-cl-3', '튼살 예방을 위해 가슴·배·허벅지에 보습 크림을 발랐나요?', '튼살 예방을 위해 가슴·배·허벅지에 보습 크림을 발랐나요?', '{"items": [{"id": "w12-d5-cl-3", "label": "튼살 예방을 위해 가슴·배·허벅지에 보습 크림을 발랐나요?"}]}'::jsonb, 3, true),
    (6, 'w12-d6-cl-1', '피로가 지속된다면 철분 수치 확인을 위해 혈액 검사를 의사에게 요청했나요?', '피로가 지속된다면 철분 수치 확인을 위해 혈액 검사를 의사에게 요청했나요?', '{"items": [{"id": "w12-d6-cl-1", "label": "피로가 지속된다면 철분 수치 확인을 위해 혈액 검사를 의사에게 요청했나요?"}]}'::jsonb, 1, true),
    (6, 'w12-d6-cl-2', '철분 식품(붉은 육류·시금치·완두콩)을 비타민 C와 함께 섭취했나요?', '철분 식품(붉은 육류·시금치·완두콩)을 비타민 C와 함께 섭취했나요?', '{"items": [{"id": "w12-d6-cl-2", "label": "철분 식품(붉은 육류·시금치·완두콩)을 비타민 C와 함께 섭취했나요?"}]}'::jsonb, 2, true),
    (6, 'w12-d6-cl-3', '오메가-3 식품(연어·고등어·견과류)을 주 1~2회 섭취하며 아기 뇌 발달을 지원했나요?', '오메가-3 식품(연어·고등어·견과류)을 주 1~2회 섭취하며 아기 뇌 발달을 지원했나요?', '{"items": [{"id": "w12-d6-cl-3", "label": "오메가-3 식품(연어·고등어·견과류)을 주 1~2회 섭취하며 아기 뇌 발달을 지원했나요?"}]}'::jsonb, 3, true),
    (7, 'w12-d7-cl-1', '임신 1분기를 무사히 마친 스스로를 충분히 칭찬하고 쉬었나요?', '임신 1분기를 무사히 마친 스스로를 충분히 칭찬하고 쉬었나요?', '{"items": [{"id": "w12-d7-cl-1", "label": "임신 1분기를 무사히 마친 스스로를 충분히 칭찬하고 쉬었나요?"}]}'::jsonb, 1, true),
    (7, 'w12-d7-cl-2', '2분기 시작을 앞두고 산전 운동 계획을 세웠나요?', '2분기 시작을 앞두고 산전 운동 계획을 세웠나요?', '{"items": [{"id": "w12-d7-cl-2", "label": "2분기 시작을 앞두고 산전 운동 계획을 세웠나요?"}]}'::jsonb, 2, true),
    (7, 'w12-d7-cl-3', '아기와의 유대를 위해 매일 태담이나 일기 쓰기를 시작했나요?', '아기와의 유대를 위해 매일 태담이나 일기 쓰기를 시작했나요?', '{"items": [{"id": "w12-d7-cl-3", "label": "아기와의 유대를 위해 매일 태담이나 일기 쓰기를 시작했나요?"}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 12)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w12-d1-q-1', '오늘 아기가 자두만큼 자랐다는 사실을 떠올리며, 엄마는 어떤 축하의 말을 해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w12-d1-q-2', '점점 커지고 부드러워지는 유방이 아기에게 젖을 줄 준비를 하고 있대요. 아기를 위해 노력하는 엄마의 몸에게 어떤 구체적인 감사의 말을 전해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (1, 'w12-d1-q-3', '아기가 세상에 나온 후 함께 할 ''가장 기대되는 첫 번째 나들이 계획''은 무엇이며, 그곳에서 어떤 추억을 만들고 싶으신지 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (2, 'w12-d2-q-1', '아기의 작은 주먹을 상상하며, 아기에게 용기와 격려를 주는 태담을 들려줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w12-d2-q-2', '입덧을 이겨낸 엄마의 몸에게 지금 가장 먹고 싶은 ''건강하고 맛있는 음식''을 선물하고 어떤 위로의 말을 해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w12-d2-q-3', '아기가 세상에 나와 작은 발로 걸을 ''가장 아름답고 행복한 길''은 어디이며, 그 길을 걸으며 아기에게 어떤 이야기를 들려주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (3, 'w12-d3-q-1', '눈이 제자리를 찾아 얼굴이 더욱 또렷해진 아기에게, ''어떤 멋진 가치관을 가진 사람''이 되길 바라며 덕담을 해볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w12-d3-q-2', '아기를 훌륭하게 품어주느라 겪는 허리 통증이나 불편함에 대해, 엄마는 자신의 몸에게 어떤 따뜻하고 진심 어린 격려의 말을 건네고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w12-d3-q-3', '아기가 세상에 나와 처음 엄마와 눈을 맞춘 후, 엄마가 아기와 ''가장 먼저 나누고 싶은 사랑스러운 행동''은 무엇인지 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (4, 'w12-d4-q-1', '아기가 하품하고 딸꾹질하는 모습을 상상하며, 엄마는 오늘 어떤 사랑스러운 말을 해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w12-d4-q-2', '임신 호르몬으로 인해 몸이 붓거나 더부룩할 때, 엄마 자신에게 가장 필요하고 ''따뜻하고 편안한 휴식''은 무엇인지 기록해 보아요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w12-d4-q-3', '아기가 세상에 나와 엄마와 함께 ''가장 활발하고 신나게 할 재미있는 활동''을 구체적으로 상상하며, 아기에게 기대감을 전달해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (5, 'w12-d5-q-1', '양수를 삼키며 세상에 나올 준비를 하는 아기의 노력을 격려하며, 엄마가 아기에게 전하는 ''가장 힘이 되는 응원의 메시지''를 표현해 주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w12-d5-q-2', '아랫배의 당김이나 복통을 ''아기가 잘 자라고 있다는 증거''라고 믿으며, 이 불편함을 긍정적으로 받아들이기 위한 엄마만의 마음가짐을 기록해 보아요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w12-d5-q-3', '아기가 세상에 나와 엄마의 젖을 물었을 때, 그 순간의 벅찬 감동을 아기에게 전달하며 ''가장 따뜻하고 헌신적인 사랑의 표현''을 어떻게 해주고 싶으신가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (6, 'w12-d6-q-1', '귀가 발달한 아기에게, 엄마의 사랑스런 목소리로 오늘 하루 어땠는지 혹은 오늘 하루 어떻게 함께 보낼 것인지 이야기해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w12-d6-q-2', '아기가 세상에 나와 작은 손으로 ''가장 먼저 만져보고 싶어 할'' 물건(또는 사람)은 무엇일지 상상하며, 그 만남을 위해 엄마가 해줄 수 있는 것을 이야기해 볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w12-d6-q-3', '피부의 촉각이 발달하는 아기를 위해, 엄마가 가장 좋아하는 ''부드럽고 편안한 촉감''은 무엇이며, 아기가 세상에 나와 어떤 것을 만져보길 바라는지 이야기해 주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (7, 'w12-d7-q-1', '아기가 안정적인 2분기를 맞이하는 것에 대해 엄마의 기대감과 설렘을 표현해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w12-d7-q-2', '힘든 초기를 견뎌낸 엄마의 몸에게 가장 감사하고 싶은 점을 이야기해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w12-d7-q-3', '아기가 세상에 나와 함께 축하하고 싶은 특별한 기념일은 무엇인지 이야기해줄까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 13 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  13,
  '13주차 발달 정보',
  '아기의 크기는 레몬만큼, 약 7.4cm / 81g이에요.',
  '입덧과 피로가 완화되며, 기운이 조금씩 돌아오기 시작해요. 가슴·배에 파란 정맥이 파랗게 드러날 수도 있어요.임신 중에는 혈액이 많이 필요해서 30~50%가량 혈액량이 증가하기 때문이에요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '13주 1일차',
  '{"items": ["아기의 크기는 레몬만큼, 약 7.4cm / 81g이에요."]}'::jsonb,
  '{"items": ["입덧과 피로가 완화되며, 기운이 조금씩 돌아오기 시작해요.", "가슴·배에 파란 정맥이 파랗게 드러날 수도 있어요.임신 중에는 혈액이 많이 필요해서 30~50%가량 혈액량이 증가하기 때문이에요.", "체중이 서서히 늘고, 자궁이 골반 밖으로 올라오면서 아랫배가 도드라질 수 있어요."]}'::jsonb,
  '아가는 이제 레몬만큼 커졌어요. 여전히 머리가 더 무겁지만 몸도 점점 커지면서 아주 작은 아기처럼 엄마 배 속에서 크고 있어요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 13
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '13주 2일차',
  '{"items": ["두개골과 긴 뼈가 단단해지고, 치아 구조·손톱·발톱이 형성돼요.", "손목과 발목도 만들어집니다.", "눈은 머리 옆에서 앞으로 이동해 제자리를 찾아가고, 얼굴 윤곽이 뚜렷해지고 있어요."]}'::jsonb,
  '{"items": ["임신 중기에 들어서면서 조금 편안해지지만,아직 초기의 증상이 바로 사라지지 않을 수 있고,불편한 증상도 나타날 수 있어요.", "코막힘, 속쓰림, 잇몸 출혈 같은 불편감이 생길 수 있어요.이는 혈액량 증가와 호르몬 변화 때문이며 대부분 정상이에요.잇몸에 작은 출혈은 호르몬 영향이지만,통증이 심하거나 염증이 동반되면 검진 때 알려야 해요!", "속쓰림이 심하다면 식사 후 껌을 씹어 위산을 중화시켜보세요!그래도 증상이 나아지지 않는다면 위험하지 않은 속쓰림 약을 추천해드릴게요."]}'::jsonb,
  '아가는 얼굴 윤곽이 두드러지고, 손목과 발목도 생기고 있어요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 13
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '13주 3일차',
  '{"items": ["아기는 양수를 삼키고 소변을 만들어 배출할 수 있어요.", "삼킨 양수는 장에 모여 첫 대변인 ‘태변’을 이룹니다."]}'::jsonb,
  '{"items": ["입덧이 줄어들며 식욕이 돌아오고, 체중이 늘기 시작해요.", "이제 본격적인 영양 관리가 필요해요 — 아기와 엄마 모두를 위한 시간이에요."]}'::jsonb,
  '아가는 물을 삼키고 배변하는 연습을 해요. 세상에 나가서 잘 먹고 쉴 준비 중이에요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 13
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '13주 4일차',
  '{"items": ["아기는 양수 속에서 몸을 구부리고, 손과 발을 움직이며 운동 연습을 해요."]}'::jsonb,
  '{"items": ["엄마의 가슴에서는 초유(colostrum)가 만들어지기 시작해요.", "이 시점부터 유방은 변화를 준비하는 거예요. 어쩌면 엄마의 가슴에서 아기를 위한 준비를 하기 위해 무거워질 수 있어요.(교과서)이는 출산 후 며칠간 아기에게 주는 첫 영양 공급원으로, 자연스러운 변화에요.", "엄마는 느낄 수 없지만 아기와 연결된 태반이 완전히 발달했어요."]}'::jsonb,
  '아가는 양수 속에서 팔다리를 쭉 뻗었어요. 운동하는 기분이에요!',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 13
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '13주 5일차',
  '{"items": ["아기는 엄마 배 표면에 더 가까워지고,움직임이 활발해집니다."]}'::jsonb,
  '{"items": ["감정이 한결 차분해지고, 정서적 안정감이 찾아옵니다.", "이 시기의 성생활은 대부분 안전하며, 부부 간 교감이 정서적으로 도움됩니다."]}'::jsonb,
  '아가는 엄마의 배 바로 아래에서 심장이 콩닥콩닥 뛰고 있어요!',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 13
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '13주 6일차',
  '{"items": ["성별을 구분 짓는 장기가 조금씩 뚜렷해지고 있어요."]}'::jsonb,
  '{"items": ["초기 불편 증상은 줄고, 몸의 균형이 잡혀가요.", "체중과 감정의 변화를 꾸준히 관찰하는 시기에요"]}'::jsonb,
  '아직은 이를지라도, 곧 성별을 알아볼 수 있을 거에요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 13
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '13주 7일차',
  '{"items": ["이번 주, 아기는 레몬 크기만큼 성장하며 눈·손·발·지문까지 세밀하게 발달했어요.", "양수를 삼키고 소변을 만들어내며, 태변을 저장할 준비를 마쳤답니다.", "이제 곧 14주차가 되면, 아기의 움직임이 더 활발해지고 태동에 가까운 변화를 보일 거예요."]}'::jsonb,
  '{"items": ["초기의 피로감과 입덧이 사라지며 몸이 점점 안정되어가요.", "자궁이 커지면서 배가 조금 더 도드라지고, 옆으로 누워 자는 습관이 몸을 편안하게 해줄 거예요.", "체중이 증가하기 시작했지만 너무 빠르지 않게, 균형 잡힌 식단으로 관리해 주세요."]}'::jsonb,
  '아가는 이번 주 정말 많이 컸어요. 곧 엄마에게 잘 자라고 있다는 신호를 보낼게요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 13
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w13-d1-cl-1', '오늘 체중을 기록했나요?', '오늘 체중을 기록했나요?', '{"items": [{"id": "w13-d1-cl-1", "label": "오늘 체중을 기록했나요?"}]}'::jsonb, 1, true),
    (1, 'w13-d1-cl-2', '앞으로는 4주간격으로 검진을 받아야해요. 산전검진 일정을 확인했나요?', '앞으로는 4주간격으로 검진을 받아야해요. 산전검진 일정을 확인했나요?', '{"items": [{"id": "w13-d1-cl-2", "label": "앞으로는 4주간격으로 검진을 받아야해요. 산전검진 일정을 확인했나요?"}]}'::jsonb, 2, true),
    (2, 'w13-d2-cl-1', '코막힘 시 실내 공기 습도 유지하기', '코막힘 시 실내 공기 습도 유지하기', '{"items": [{"id": "w13-d2-cl-1", "label": "코막힘 시 실내 공기 습도 유지하기"}]}'::jsonb, 1, true),
    (2, 'w13-d2-cl-2', '속쓰림 완화를 위해 맵고 산성 음식 피하기 🍊', '속쓰림 완화를 위해 맵고 산성 음식 피하기 🍊', '{"items": [{"id": "w13-d2-cl-2", "label": "속쓰림 완화를 위해 맵고 산성 음식 피하기 🍊"}]}'::jsonb, 2, true),
    (2, 'w13-d2-cl-3', '잇몸 출혈이 있다면 부드러운 칫솔 사용하기', '잇몸 출혈이 있다면 부드러운 칫솔 사용하기', '{"items": [{"id": "w13-d2-cl-3", "label": "잇몸 출혈이 있다면 부드러운 칫솔 사용하기"}]}'::jsonb, 3, true),
    (3, 'w13-d3-cl-1', '단백질·철분·칼슘·엽산 챙겨 먹었나요?', '단백질·철분·칼슘·엽산 챙겨 먹었나요?', '{"items": [{"id": "w13-d3-cl-1", "label": "단백질·철분·칼슘·엽산 챙겨 먹었나요?"}]}'::jsonb, 1, true),
    (3, 'w13-d3-cl-2', '하루 340kcal 정도 추가 섭취하기 (공기밥 한 공기 정도) 🍚', '하루 340kcal 정도 추가 섭취하기 (공기밥 한 공기 정도) 🍚', '{"items": [{"id": "w13-d3-cl-2", "label": "하루 340kcal 정도 추가 섭취하기 (공기밥 한 공기 정도) 🍚"}]}'::jsonb, 2, true),
    (3, 'w13-d3-cl-3', '가벼운 산책으로 소화와 혈액순환 돕기', '가벼운 산책으로 소화와 혈액순환 돕기', '{"items": [{"id": "w13-d3-cl-3", "label": "가벼운 산책으로 소화와 혈액순환 돕기"}]}'::jsonb, 3, true),
    (4, 'w13-d4-cl-1', '가슴 압박하지 않기, 편한 브래지어 착용 👕', '가슴 압박하지 않기, 편한 브래지어 착용 👕', '{"items": [{"id": "w13-d4-cl-1", "label": "가슴 압박하지 않기, 편한 브래지어 착용 👕"}]}'::jsonb, 1, true),
    (4, 'w13-d4-cl-2', '초유가 보이더라도 정상이니 당황하지 않기!억지로 짜내지 않고 부드럽게 닦아내기', '초유가 보이더라도 정상이니 당황하지 않기!억지로 짜내지 않고 부드럽게 닦아내기', '{"items": [{"id": "w13-d4-cl-2", "label": "초유가 보이더라도 정상이니 당황하지 않기!억지로 짜내지 않고 부드럽게 닦아내기"}]}'::jsonb, 2, true),
    (5, 'w13-d5-cl-1', '파트너와 함께 심장소리 들어보기💑', '파트너와 함께 심장소리 들어보기💑', '{"items": [{"id": "w13-d5-cl-1", "label": "파트너와 함께 심장소리 들어보기💑"}]}'::jsonb, 1, true),
    (5, 'w13-d5-cl-2', '스트레칭이나 음악 감상으로 마음 안정하기 🎶', '스트레칭이나 음악 감상으로 마음 안정하기 🎶', '{"items": [{"id": "w13-d5-cl-2", "label": "스트레칭이나 음악 감상으로 마음 안정하기 🎶"}]}'::jsonb, 2, true),
    (5, 'w13-d5-cl-3', '하루 한 번 아기에게 다정한 말을 건네기 💬', '하루 한 번 아기에게 다정한 말을 건네기 💬', '{"items": [{"id": "w13-d5-cl-3", "label": "하루 한 번 아기에게 다정한 말을 건네기 💬"}]}'::jsonb, 3, true),
    (6, 'w13-d6-cl-1', '일주일 동안의 몸 상태 기록하기 📖', '일주일 동안의 몸 상태 기록하기 📖', '{"items": [{"id": "w13-d6-cl-1", "label": "일주일 동안의 몸 상태 기록하기 📖"}]}'::jsonb, 1, true),
    (6, 'w13-d6-cl-2', '식사·운동·감정 밸런스 되돌아보기 💬', '식사·운동·감정 밸런스 되돌아보기 💬', '{"items": [{"id": "w13-d6-cl-2", "label": "식사·운동·감정 밸런스 되돌아보기 💬"}]}'::jsonb, 2, true),
    (6, 'w13-d6-cl-3', '검진 일정 확인하기 📅', '검진 일정 확인하기 📅', '{"items": [{"id": "w13-d6-cl-3", "label": "검진 일정 확인하기 📅"}]}'::jsonb, 3, true),
    (6, 'w13-d6-cl-4', '태아 보험에 대해 알아보세요.', '태아 보험에 대해 알아보세요.', '{"items": [{"id": "w13-d6-cl-4", "label": "태아 보험에 대해 알아보세요."}]}'::jsonb, 4, true),
    (7, 'w13-d7-cl-1', '• 일주일 동안 기록한 체중과 감정 변화를 다시 살펴보세요 📖', '• 일주일 동안 기록한 체중과 감정 변화를 다시 살펴보세요 📖', '{"items": [{"id": "w13-d7-cl-1", "label": "• 일주일 동안 기록한 체중과 감정 변화를 다시 살펴보세요 📖"}]}'::jsonb, 1, true),
    (7, 'w13-d7-cl-2', '• 식사·운동·휴식의 균형이 잘 맞는지 확인해 보세요 💬', '• 식사·운동·휴식의 균형이 잘 맞는지 확인해 보세요 💬', '{"items": [{"id": "w13-d7-cl-2", "label": "• 식사·운동·휴식의 균형이 잘 맞는지 확인해 보세요 💬"}]}'::jsonb, 2, true),
    (7, 'w13-d7-cl-3', '• 다음 검진 일정을 확인하고, 필요한 검사나 질문을 미리 준비해 두세요 📅', '• 다음 검진 일정을 확인하고, 필요한 검사나 질문을 미리 준비해 두세요 📅', '{"items": [{"id": "w13-d7-cl-3", "label": "• 다음 검진 일정을 확인하고, 필요한 검사나 질문을 미리 준비해 두세요 📅"}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w13-d1-q-1', '“작은 씨앗 크기에서 레몬 크기만큼 자란 아기를 떠올리며, 오늘은 감사에 대해 엄마의 생각을 들려주세요. 살아오면서 엄마에게 가장 감사했던 사람은 누구였나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w13-d1-q-2', '“작은 것에 감사를 느끼는 것이 왜 중요한가요? 엄마의 생각을 들려주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w13-d2-q-1', '“오늘은 아기의 이목구비가 뚜렷해지고 있는 모습을 떠올리며, 엄마의 어떤 모습을 닮았으면 좋을 것 같나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w13-d2-q-2', '“당신은 부모님의 어떤 모습을 닮았나요? 외형적인 것도 좋고 성격적인 것도 한번 떠올려보세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w13-d3-q-1', '“오늘 아기가 ‘물 삼키기’ 연습을 하고 있대요. 엄마는 오늘 어떤 식사를 했는지 떠올려볼까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w13-d3-q-2', '“우리 아기와 함께 식사하게되는 날이 되면, 어떤 음식을 요리해주고 싶은지 떠올려볼까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w13-d4-q-1', '그동안 우리 몸은 아기를 위해 태반을 만들고,초유를 준비하고 있대요. 엄마가 될 준비를 하고 있는 몸을 보며 어떤 마음이 드나요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w13-d4-q-2', '마음의 준비가 많이 필요했던 변화는 어떤 것이었나요? 배 아래에서 자라고 있는 작은 생명에게 아기를 만나기 위해 어떤 것을 준비했는지 들려주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w13-d5-q-1', '오늘은 작은 심장을 바쁘게 콩닥거리며 엄마의 이야기를 기다리고 있을 아기에게, ‘용기’에 대한 엄마의 생각을 들려주세요. 살아오면서 큰 용기를 발휘했던 때는 언제였나요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w13-d5-q-2', '지금의 엄마에게도 큰 용기가 필요한 일이 있나요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w13-d6-q-1', '“우리 아기의 성별을 상상해본 적 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w13-d6-q-2', '“귀여운 우리 아기가 딸이라면 해보고 싶은 일이 있나요,귀여운 우리 아기가 아들이라면 해보고 싶은 일이 있나요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w13-d7-q-1', '이번 주 가장 기억에 남는 아기의 성장은 무엇이었나요?,', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w13-d7-q-2', '이번 주 엄마는 어떤 증상을 경험했나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 14 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  14,
  '14주차 발달 정보',
  '아기의 길이는 약 8~9cm, 몸무게는 약 40~45g, 복숭아 크기예요. 아기의 목이 길어지고, 얼굴 윤곽이 또렷해지며 사람다운 모습으로 변하고 있어요.',
  '자궁이 골반 밖으로 나오면서 아랫배가 살짝 볼록해지고 옷 맵시가 달라져요. 복부압박으로 위가 눌리면서 속이 더부룩하거나 트림이 늘 수 있어요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '14주 1일차',
  '{"items": ["아기의 길이는 약 8~9cm, 몸무게는 약 40~45g, 복숭아 크기예요.", "아기의 목이 길어지고, 얼굴 윤곽이 또렷해지며 사람다운 모습으로 변하고 있어요."]}'::jsonb,
  '{"items": ["자궁이 골반 밖으로 나오면서 아랫배가 살짝 볼록해지고 옷 맵시가 달라져요.", "복부압박으로 위가 눌리면서 속이 더부룩하거나 트림이 늘 수 있어요.", "하늘을 보고 눕는 자세보단 왼쪽으로 눕는 습관을 들이면 좋아요."]}'::jsonb,
  '아가는 엄마의 심장까지 조금씩 올라가고 싶어요. 아직은 멀지만 손을 뻗으면 엄마의 심장이 닿을 것 같아요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 14
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '14주 2일차',
  '{"items": ["아기의 비장과 간이 각각 적혈구와 담즙을 만들어내며 활발히 일하고 있어요.", "작은 심장은 분당 150회 이상 뛰며 혈액을 온몸으로 보내요."]}'::jsonb,
  '{"items": ["혈액량이 급격히 늘면서 심장이 더 열심히 일하고, 맥박이 빨라질 수 있어요.", "코피, 코막힘, 잇몸출혈이 생기기도 하는데 혈관이 확장된 자연스러운 현상이에요.", "혈류 증가로 피부 온도가 높아지고, 얼굴이 붉거나 정맥선이 드러날 수 있어요."]}'::jsonb,
  '아가는 엄마의 심장과 함께 뛰어요. 아가의 심장은 엄청 빨리 뛰어요!',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 14
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '14주 3일차',
  '{"items": ["아기의 피부가 아직 얇지만, 부드러운 솜털(lanugo) 이 자라기 시작해요.", "이 털은 태어날 때까지 아기를 따뜻하게 감싸주는 역할을 해요."]}'::jsonb,
  '{"items": ["혈류 증가로 땀이 많아지고 체온이 높게 느껴질 수 있어요.", "피부의 색소가 진해지며 유륜, 배 중앙선(리니아 니그라)이 점차 생겨나요. 몇주내로 이 선은뚜렷해질거에요.", "유방이 단단해지고 간혹 투명한 초유(colostrum) 이 맺힐 수 있어요."]}'::jsonb,
  '아가는 몸에 따뜻한 외투가 생기고 있어요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 14
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '14주 4일차',
  '{"items": ["태아의 갑상선이 기능을 시작하면서 스스로 호르몬을 만들어내요.", "내부 장기들이 거의 완성돼, 이제 성장을 위한 에너지를 모으는 시기예요."]}'::jsonb,
  '{"items": ["입덧이 완화되고 피로감이 줄며, 정서적으로도 편안함을 느끼면서 여유가 생겨요.", "배가 조금 무거워지지만 안정감이 느껴지는 시기로, 대부분의 임신부가 “안정기”로 들어섰다고 말해요.", "프로게스테론 영향으로 변비가 생기기 쉬우니 수분과 지금부터 식단에 섬유질을 늘려야 해요."]}'::jsonb,
  '아가는 몸속에서도 일이 시작됐어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 14
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '14주 5일차',
  '{"items": ["아기의 눈꺼풀이 서로 붙어 눈을 감은 상태지만, 눈 안에서는 망막이 점점 발달하며 빛의 변화를 감지해요."]}'::jsonb,
  '{"items": ["혈류가 늘어나 얼굴과 피부가 밝아 보이거나 붉게 보일 수 있어요.", "코피나 잇몸출혈, 코막힘은 여전히 흔해요. 불편할거에요.", "감정 기복이 줄면서도, 때로는 작은 일에도 눈물이 날 수 있어요."]}'::jsonb,
  '아직 세상을 볼 수 없지만, 심장 소리는 느낄 수 있어요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 14
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '14주 6일차',
  '{"items": ["아기의 귀가 얼굴 양옆 자리로 이동하며 청력기관이 완성되는 중이에요.", "이제 곧 엄마의 심장 소리, 소화음, 그리고 목소리의 진동을 느낄 수 있어요."]}'::jsonb,
  '{"items": ["몸 전체 혈액순환이 활발해지며 손발이 따뜻해지거나 붓기가 생길 수 있어요.", "자궁이 커지면서 방광 압박으로 소변이 자주 마려워요.", "호르몬 영향으로 머리카락이 풍성해지거나 피부가 윤기 있게 보여요."]}'::jsonb,
  '아가는 귀가 아직 만들어지고 있지만, 진동을 통해 엄마의 신호를 어렴풋이 느껴요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 14
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '14주 7일차',
  '{"items": ["이번 주, 아기는 피부 아래 솜털이 자라고, 갑상선이 작동을 시작하며, 심장·간·비장 등 주요 장기가 본격적으로 일하기 시작했어요."]}'::jsonb,
  '{"items": ["입덧이 줄고, 소화가 서서히 회복되며 에너지가 돌아와요.", "배가 조금 더 앞으로 나와 임신의 실감이 커지는 시기예요.", "감정의 균형이 서서히 잡히면서 아기를 떠올리는 시간이 늘어요."]}'::jsonb,
  '아가는 이번 주 몸 안의 시계를 맞추고 있어요. 박자를 찾아가요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 14
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 14)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w14-d1-cl-1', '오늘 하루동안 수시로 옆으로 누워 휴식하는 연습을 해보세요.', '오늘 하루동안 수시로 옆으로 누워 휴식하는 연습을 해보세요.', '{"items": [{"id": "w14-d1-cl-1", "label": "오늘 하루동안 수시로 옆으로 누워 휴식하는 연습을 해보세요."}]}'::jsonb, 1, true),
    (1, 'w14-d1-cl-2', '속이 더부룩하면 식사량을 줄이고 자주 조금씩 먹기로 바꿔요.', '속이 더부룩하면 식사량을 줄이고 자주 조금씩 먹기로 바꿔요.', '{"items": [{"id": "w14-d1-cl-2", "label": "속이 더부룩하면 식사량을 줄이고 자주 조금씩 먹기로 바꿔요."}]}'::jsonb, 2, true),
    (1, 'w14-d1-cl-3', '복부가 당기면 손으로 살짝 쓰다듬으며 아기에게 인사하기', '복부가 당기면 손으로 살짝 쓰다듬으며 아기에게 인사하기', '{"items": [{"id": "w14-d1-cl-3", "label": "복부가 당기면 손으로 살짝 쓰다듬으며 아기에게 인사하기"}]}'::jsonb, 3, true),
    (2, 'w14-d2-cl-1', '오늘 하루 물을 자주 마시며 혈액순환을 도와주세요.', '오늘 하루 물을 자주 마시며 혈액순환을 도와주세요.', '{"items": [{"id": "w14-d2-cl-1", "label": "오늘 하루 물을 자주 마시며 혈액순환을 도와주세요."}]}'::jsonb, 1, true),
    (2, 'w14-d2-cl-2', '잇몸 출혈이 있으면 부드러운 칫솔로 양치하기', '잇몸 출혈이 있으면 부드러운 칫솔로 양치하기', '{"items": [{"id": "w14-d2-cl-2", "label": "잇몸 출혈이 있으면 부드러운 칫솔로 양치하기"}]}'::jsonb, 2, true),
    (2, 'w14-d2-cl-3', '낮에 한 번, 손을 가슴에 얹고 ‘엄마의 심장 리듬’을 느껴보기', '낮에 한 번, 손을 가슴에 얹고 ‘엄마의 심장 리듬’을 느껴보기', '{"items": [{"id": "w14-d2-cl-3", "label": "낮에 한 번, 손을 가슴에 얹고 ‘엄마의 심장 리듬’을 느껴보기"}]}'::jsonb, 3, true),
    (3, 'w14-d3-cl-1', '통풍이 잘되는 옷, 면 소재 속옷으로 체온 조절하기.', '통풍이 잘되는 옷, 면 소재 속옷으로 체온 조절하기.', '{"items": [{"id": "w14-d3-cl-1", "label": "통풍이 잘되는 옷, 면 소재 속옷으로 체온 조절하기."}]}'::jsonb, 1, true),
    (3, 'w14-d3-cl-2', '유방이 묵직할 땐 브라 착용 시간 줄이기.', '유방이 묵직할 땐 브라 착용 시간 줄이기.', '{"items": [{"id": "w14-d3-cl-2", "label": "유방이 묵직할 땐 브라 착용 시간 줄이기."}]}'::jsonb, 2, true),
    (3, 'w14-d3-cl-3', '하루 한 번 거울 앞에서 엄마가 되어가는 과정 중 눈에 띄는 변화 기록하기.', '하루 한 번 거울 앞에서 엄마가 되어가는 과정 중 눈에 띄는 변화 기록하기.', '{"items": [{"id": "w14-d3-cl-3", "label": "하루 한 번 거울 앞에서 엄마가 되어가는 과정 중 눈에 띄는 변화 기록하기."}]}'::jsonb, 3, true),
    (4, 'w14-d4-cl-1', '오늘은 따뜻한 물 한 잔으로 장을 깨워요.', '오늘은 따뜻한 물 한 잔으로 장을 깨워요.', '{"items": [{"id": "w14-d4-cl-1", "label": "오늘은 따뜻한 물 한 잔으로 장을 깨워요."}]}'::jsonb, 1, true),
    (4, 'w14-d4-cl-2', '오늘 식사에 식이섬유 채소 한 접시 추가하기', '오늘 식사에 식이섬유 채소 한 접시 추가하기', '{"items": [{"id": "w14-d4-cl-2", "label": "오늘 식사에 식이섬유 채소 한 접시 추가하기"}]}'::jsonb, 2, true),
    (4, 'w14-d4-cl-3', '잠들기 전, 오늘 하루 감사한 일 세 가지 적기', '잠들기 전, 오늘 하루 감사한 일 세 가지 적기', '{"items": [{"id": "w14-d4-cl-3", "label": "잠들기 전, 오늘 하루 감사한 일 세 가지 적기"}]}'::jsonb, 3, true),
    (5, 'w14-d5-cl-1', '실내 습도를 건조하지 않게 하여, 코·피부 점막 보호하기.', '실내 습도를 건조하지 않게 하여, 코·피부 점막 보호하기.', '{"items": [{"id": "w14-d5-cl-1", "label": "실내 습도를 건조하지 않게 하여, 코·피부 점막 보호하기."}]}'::jsonb, 1, true),
    (5, 'w14-d5-cl-2', '자기 전, 눈을 감고 아기의 모습 상상해보기.', '자기 전, 눈을 감고 아기의 모습 상상해보기.', '{"items": [{"id": "w14-d5-cl-2", "label": "자기 전, 눈을 감고 아기의 모습 상상해보기."}]}'::jsonb, 2, true),
    (5, 'w14-d5-cl-3', '거울을 보고 배를 쓰다듬으며 “오늘도 잘 자라고 있어.”라고 말해보기.', '거울을 보고 배를 쓰다듬으며 “오늘도 잘 자라고 있어.”라고 말해보기.', '{"items": [{"id": "w14-d5-cl-3", "label": "거울을 보고 배를 쓰다듬으며 “오늘도 잘 자라고 있어.”라고 말해보기."}]}'::jsonb, 3, true),
    (6, 'w14-d6-cl-1', '평소보다 수분 섭취를 늘리되, 자기 전엔 양 조절하기.', '평소보다 수분 섭취를 늘리되, 자기 전엔 양 조절하기.', '{"items": [{"id": "w14-d6-cl-1", "label": "평소보다 수분 섭취를 늘리되, 자기 전엔 양 조절하기."}]}'::jsonb, 1, true),
    (6, 'w14-d6-cl-2', '다리 올려 10분 휴식하며 붓기 완화하기.', '다리 올려 10분 휴식하며 붓기 완화하기.', '{"items": [{"id": "w14-d6-cl-2", "label": "다리 올려 10분 휴식하며 붓기 완화하기."}]}'::jsonb, 2, true),
    (6, 'w14-d6-cl-3', '하루 한 번, 엄마의 목소리로 아기에게 “잘 지내?”라고 말하기.', '하루 한 번, 엄마의 목소리로 아기에게 “잘 지내?”라고 말하기.', '{"items": [{"id": "w14-d6-cl-3", "label": "하루 한 번, 엄마의 목소리로 아기에게 “잘 지내?”라고 말하기."}]}'::jsonb, 3, true),
    (7, 'w14-d7-cl-1', '한 주 동안 느낀 몸의 변화(피로, 통증, 감정)를 간단히 기록하기.', '한 주 동안 느낀 몸의 변화(피로, 통증, 감정)를 간단히 기록하기.', '{"items": [{"id": "w14-d7-cl-1", "label": "한 주 동안 느낀 몸의 변화(피로, 통증, 감정)를 간단히 기록하기."}]}'::jsonb, 1, true),
    (7, 'w14-d7-cl-2', '배 위에 손 얹고, 심호흡하며 “이 한 주도 함께 잘했다” 속삭이기.', '배 위에 손 얹고, 심호흡하며 “이 한 주도 함께 잘했다” 속삭이기.', '{"items": [{"id": "w14-d7-cl-2", "label": "배 위에 손 얹고, 심호흡하며 “이 한 주도 함께 잘했다” 속삭이기."}]}'::jsonb, 2, true),
    (7, 'w14-d7-cl-3', '내일부터의 변화를 위해, 다음 주 식단·운동·휴식 계획 세우기.', '내일부터의 변화를 위해, 다음 주 식단·운동·휴식 계획 세우기.', '{"items": [{"id": "w14-d7-cl-3", "label": "내일부터의 변화를 위해, 다음 주 식단·운동·휴식 계획 세우기."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 14)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w14-d1-q-1', '“엄마의 배가 조금 더 앞으로 나왔어요. 이제 정말 ‘함께 자라는 느낌’을 느끼나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w14-d1-q-2', '“엄마의 몸속에서 점점 위로 올라오는 아기가 느껴지나요? 어떤 마음이 드나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w14-d2-q-1', '“엄마의 심장소리를 들으며 자라는 아기에게, 오늘 들려주고 싶은 마음의 소리는 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w14-d2-q-2', '“엄마가 아기의 존재를 처음 알게 되었던 가슴 떨리는 그날의 기억을 아기에게 들려주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w14-d3-q-1', '“아기의 솜털이 자라듯, 엄마도 자신을 감싸주는 무언가가 있나요? 무엇이 당신을 따뜻하게 하나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w14-d3-q-2', '“누군가를 품는다는 것은 당신에게 어떤 느낌인가요?, 누군가를 품어본 경험을 말해주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w14-d4-q-1', '“몸이 한결 편해진 지금, 마음은 어떤가요? ‘편안함’을 느낀 순간을 떠올려보세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w14-d4-q-2', '“무럭무럭 자라고 있는 아기를 떠올리며, 엄마의 마음이 무럭무럭 자랐던 순간을 기억해보세요. 마음이 단단하게 자라기 위해서는 무엇이 필요한가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w14-d5-q-1', '“눈을 감고 떠올릴 때, ‘엄마의 마음 빛’은 어떤 색인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w14-d5-q-2', '“요즘 내 감정을 가장 잘 보여주는 빛깔은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w14-d6-q-1', '“내 목소리로 전할 수 있는 가장 따뜻한 말은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w14-d6-q-2', '“내 소리를 아기가 듣는다면, 어떤 말을 해주고 싶은가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w14-d7-q-1', '“이번 주 아기의 변화나 질문 중 가장 기억에 남는게 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w14-d7-q-2', '“이번 주 엄마가 되어가는 과정 중에 가장 기억에 남는 엄마 몸의 변화는 무엇이었나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 15 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  15,
  '15주차 발달 정보',
  '태아의 키는 15cm정도 이고 몸무게는 115g으로 사과만큼 자랐어요.',
  '자궁이 커지면서 하복부·골반 당김이 잦아질 수 있어요. 질 분비물(백대하) 이 증가하는데 감염 예방 작용을 해요(색·냄새·질감 이상 시 진료).',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '15주 1일차',
  '{"items": ["태아의 키는 15cm정도 이고 몸무게는 115g으로 사과만큼 자랐어요."]}'::jsonb,
  '{"items": ["자궁이 커지면서 하복부·골반 당김이 잦아질 수 있어요.", "질 분비물(백대하) 이 증가하는데 감염 예방 작용을 해요(색·냄새·질감 이상 시 진료)."]}'::jsonb,
  '아가는 사과만큼 자랐어요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 15
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '15주 2일차',
  '{"items": ["아기는 배를 통해 들어오는 빛에 민감해지고, 엄마의 심장 소리와 배에서 나는 꼬르륵 소리를 듣기를 시작해요. 엄마가 아기에게 보내는 음성이 닿을 수 있어요."]}'::jsonb,
  '{"items": ["저번주에 생겼던 변화가 이어져요.혈액량 증가와 점막 변화로 코막힘·코피가 흔해요.", "숨가쁨이 잠깐 느껴질 수 있어요."]}'::jsonb,
  '아가는 오늘은 배를 통해 들어오는 불빛을 작게 느꼈어요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 15
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '15주 3일차',
  '{"items": ["온몸에 솜털이 자라면서 체온 유지 준비를 해요."]}'::jsonb,
  '{"items": ["피부 가려움이 생길 수 있어요(특히 배·가슴).", "저번주에 생겼던 변화가 이어져요.유방·유선 발달로 묵직하고 민감해질 수 있어요."]}'::jsonb,
  '아가는 자신이 만든 따뜻한 솜털 외투를 입었어요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 15
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '15주 4일차',
  '{"items": ["다리가 팔보다 길어지며 신체 비율이 더 ‘사람답게’ 균형을 찾아요.", "폐 발달이 시작되고, 아주 미세한 딸꾹질 같은 움직임이 있을 수 있어요."]}'::jsonb,
  '{"items": ["입덧이 줄고 식욕·에너지가 돌아오며 ‘안정기’ 느낌이 커져요(저번 주와 같이).", "엄마 배 아래의 작은 사람에게도 에너지를 전달해야하기 때문에 전보다 300칼로리정도 에너지 보충이 필요해요.3)"]}'::jsonb,
  '아가는 몸의 균형이 맞춰지고 있어요. 한 걸음 더, 엄마에게 가까이.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 15
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '15주 5일차',
  '{"items": ["눈썹· 속눈썹· 머리카락이 보이기 시작하지만 피부는 아직 얇고 반투명해요.", "팔다리와 관절을 활발히 움직이며 엄지 빨기·하품 같은 동작도 보여요."]}'::jsonb,
  '{"items": ["배가 점점 도드라지기 시작하고(첫 임신은 더 늦게, 두번째임신은 더 일찍이겠지만) 이제 눈에 보이게 옷 핏이 달라져요.", "찌릿한 옆구리 통증을 느낄 수 있어요."]}'::jsonb,
  '아가는 엄지를 빠는 동작도 연습했어요. 어쩌면 초음파 사진에서 엄지 빠는 모습을 들킬지도 몰라요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 15
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '15주 6일차',
  '{"items": ["듣기 발달로 엄마의 심장·장 소리가 더 익숙해져요(저번 주와 같이).", "손가락을 쥐었다 폈다 하고 팔다리를 더 자주 뻗어요."]}'::jsonb,
  '{"items": ["잇몸 출혈·민감이 흔해요(임신 치은염, 치과 진료는 안전).", "속쓰림/가스/소화불량이 생길 수 있어요."]}'::jsonb,
  '아기는 손을 꼭 쥐는 연습을 하고 있어요. 곧 엄마 손을 잡을 그날을 상상하며.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 15
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '15주 7일차',
  '{"items": ["초음파에서 뼈 윤곽(BPD 등 측정) 이 뚜렷하게 보일 수 있어요."]}'::jsonb,
  '{"items": ["이번주에는 에너지 회복·활동성 증가가 느껴지고, 배는 더 또렷해졌어요.", "필요한 경우 2분기 선별검사(MMS/쿼드), NIPT, 양수검사 등의 일정·선택을 의료진과 상의해요. 아기의 유전적 이상을 찾을 수 있는 중요한 검사에요."]}'::jsonb,
  '아기는 이번 주 사과만큼 많이 자랐어요. 다음 주엔 더 성장한 모습으로 인사할 거예요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 15
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 15)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w15-d1-cl-1', '20분 걷기 또는 물운동/요가로 순환 돕기.', '20분 걷기 또는 물운동/요가로 순환 돕기.', '{"items": [{"id": "w15-d1-cl-1", "label": "20분 걷기 또는 물운동/요가로 순환 돕기."}]}'::jsonb, 1, true),
    (1, 'w15-d1-cl-2', '케겔 운동으로 골반저근 강화 시작.', '케겔 운동으로 골반저근 강화 시작.', '{"items": [{"id": "w15-d1-cl-2", "label": "케겔 운동으로 골반저근 강화 시작."}]}'::jsonb, 2, true),
    (1, 'w15-d1-cl-3', '분비물 변화 색·냄새·질감 메모해 두기.', '분비물 변화 색·냄새·질감 메모해 두기.', '{"items": [{"id": "w15-d1-cl-3", "label": "분비물 변화 색·냄새·질감 메모해 두기."}]}'::jsonb, 3, true),
    (2, 'w15-d2-cl-1', '코피가 나지 않게 가습·수분 섭취로 비강 건조 막기.', '코피가 나지 않게 가습·수분 섭취로 비강 건조 막기.', '{"items": [{"id": "w15-d2-cl-1", "label": "코피가 나지 않게 가습·수분 섭취로 비강 건조 막기."}]}'::jsonb, 1, true),
    (2, 'w15-d2-cl-2', '취침 시 호흡이 편하지 않다면 베개로 상체 살짝 높이기', '취침 시 호흡이 편하지 않다면 베개로 상체 살짝 높이기', '{"items": [{"id": "w15-d2-cl-2", "label": "취침 시 호흡이 편하지 않다면 베개로 상체 살짝 높이기"}]}'::jsonb, 2, true),
    (2, 'w15-d2-cl-3', '오늘 아기에게 들려준 한 문장을 일기에 적기.', '오늘 아기에게 들려준 한 문장을 일기에 적기.', '{"items": [{"id": "w15-d2-cl-3", "label": "오늘 아기에게 들려준 한 문장을 일기에 적기."}]}'::jsonb, 3, true),
    (3, 'w15-d3-cl-1', '무향 보습제로 배·가슴 피부를 부드럽게 관리.', '무향 보습제로 배·가슴 피부를 부드럽게 관리.', '{"items": [{"id": "w15-d3-cl-1", "label": "무향 보습제로 배·가슴 피부를 부드럽게 관리."}]}'::jsonb, 1, true),
    (3, 'w15-d3-cl-2', '편안한 브래지어로 유방 부담 줄이기.', '편안한 브래지어로 유방 부담 줄이기.', '{"items": [{"id": "w15-d3-cl-2", "label": "편안한 브래지어로 유방 부담 줄이기."}]}'::jsonb, 2, true),
    (3, 'w15-d3-cl-3', '면 소재 속옷·헐렁한 옷으로 쓸림 줄이기.', '면 소재 속옷·헐렁한 옷으로 쓸림 줄이기.', '{"items": [{"id": "w15-d3-cl-3", "label": "면 소재 속옷·헐렁한 옷으로 쓸림 줄이기."}]}'::jsonb, 3, true),
    (4, 'w15-d4-cl-1', '오늘 단백질+채소 중심 식사 한 끼 챙기기.', '오늘 단백질+채소 중심 식사 한 끼 챙기기.', '{"items": [{"id": "w15-d4-cl-1", "label": "오늘 단백질+채소 중심 식사 한 끼 챙기기."}]}'::jsonb, 1, true),
    (4, 'w15-d4-cl-2', '잠자리에서 왼쪽 옆으로 눕는 자세로 15분 휴식.', '잠자리에서 왼쪽 옆으로 눕는 자세로 15분 휴식.', '{"items": [{"id": "w15-d4-cl-2", "label": "잠자리에서 왼쪽 옆으로 눕는 자세로 15분 휴식."}]}'::jsonb, 2, true),
    (4, 'w15-d4-cl-3', '수중 운동,산전 요가, 필라테스 같은 운동으로 산전 운동 루틴을 만들어보세요!', '수중 운동,산전 요가, 필라테스 같은 운동으로 산전 운동 루틴을 만들어보세요!', '{"items": [{"id": "w15-d4-cl-3", "label": "수중 운동,산전 요가, 필라테스 같은 운동으로 산전 운동 루틴을 만들어보세요!"}]}'::jsonb, 3, true),
    (5, 'w15-d5-cl-1', '편하고 예쁜 임부복을 쇼핑해보세요!', '편하고 예쁜 임부복을 쇼핑해보세요!', '{"items": [{"id": "w15-d5-cl-1", "label": "편하고 예쁜 임부복을 쇼핑해보세요!"}]}'::jsonb, 1, true),
    (5, 'w15-d5-cl-2', '통증이 나타나면 다리 올리고 10분 휴식하기.', '통증이 나타나면 다리 올리고 10분 휴식하기.', '{"items": [{"id": "w15-d5-cl-2", "label": "통증이 나타나면 다리 올리고 10분 휴식하기."}]}'::jsonb, 2, true),
    (5, 'w15-d5-cl-3', '대중교통을 이용할 때 부끄러워하지 말고 자리를 요청하세요', '대중교통을 이용할 때 부끄러워하지 말고 자리를 요청하세요', '{"items": [{"id": "w15-d5-cl-3", "label": "대중교통을 이용할 때 부끄러워하지 말고 자리를 요청하세요"}]}'::jsonb, 3, true),
    (6, 'w15-d6-cl-1', '치과 검진 예약하고 부드러운 칫솔·치실 사용.', '치과 검진 예약하고 부드러운 칫솔·치실 사용.', '{"items": [{"id": "w15-d6-cl-1", "label": "치과 검진 예약하고 부드러운 칫솔·치실 사용."}]}'::jsonb, 1, true),
    (6, 'w15-d6-cl-2', '속쓰림,소화불량 유발 음식 체크하기 (매운/기름진/산성)하고 소량·자주 먹기.', '속쓰림,소화불량 유발 음식 체크하기 (매운/기름진/산성)하고 소량·자주 먹기.', '{"items": [{"id": "w15-d6-cl-2", "label": "속쓰림,소화불량 유발 음식 체크하기 (매운/기름진/산성)하고 소량·자주 먹기."}]}'::jsonb, 2, true),
    (6, 'w15-d6-cl-3', '저녁에 상체 약간 높여 휴식해 보기.', '저녁에 상체 약간 높여 휴식해 보기.', '{"items": [{"id": "w15-d6-cl-3", "label": "저녁에 상체 약간 높여 휴식해 보기."}]}'::jsonb, 3, true),
    (7, 'w15-d7-cl-1', '이번 주 체중·증상·분비물 변화를 한 번에 기록.', '이번 주 체중·증상·분비물 변화를 한 번에 기록.', '{"items": [{"id": "w15-d7-cl-1", "label": "이번 주 체중·증상·분비물 변화를 한 번에 기록."}]}'::jsonb, 1, true),
    (7, 'w15-d7-cl-2', '산전 수업/출산 강좌·보육 옵션 미리 알아보기.', '산전 수업/출산 강좌·보육 옵션 미리 알아보기.', '{"items": [{"id": "w15-d7-cl-2", "label": "산전 수업/출산 강좌·보육 옵션 미리 알아보기."}]}'::jsonb, 2, true),
    (7, 'w15-d7-cl-3', '다음 주 검사 리스트 작성해보기.', '다음 주 검사 리스트 작성해보기.', '{"items": [{"id": "w15-d7-cl-3", "label": "다음 주 검사 리스트 작성해보기."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 15)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w15-d1-q-1', '“작은 씨앗 크기에서 사과 크기만큼 자란 아기를 떠올리며, 오늘은 사랑에 대해 엄마의 생각을 들려주세요. 사랑을 키우는 방법을 알려주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w15-d1-q-2', '“사랑은 주는 것과 받는 것 중 어떤 것이 더 행복한가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w15-d2-q-1', '“아기와 찬란한 빛을 보는 날을 상상하며,우리 아기에게 소개하고 싶은 야경 명소가 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w15-d2-q-2', '“사람의 눈이 가장 반짝이는 순간은 언제라고 생각하나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w15-d3-q-1', '“오늘은 아이에게 ‘부드러움’이 가진 힘에 대해 이야기해볼 거예요. 부드러움은 다른 사람을 어떻게 변화시키나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w15-d3-q-2', '“부드러움이 아닌 다른 방법으로 사람을 대해야 할 때가 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w15-d4-q-1', '“몸이 가벼워진 이 시기에, 내 마음을 가장 안정시키는 루틴은 무엇인가요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w15-d4-q-2', '“몸의 건강함과 마음의 건강함 중 어떤 것이 더 중요한가요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w15-d5-q-1', '‘오늘은 어떤 하루를 보냈나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w15-d5-q-2', '“오늘은 아기에게 ‘휴식’에 대해 이야기해봅시다. 진정한 ‘휴식’이란 어떤 것인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w15-d6-q-1', '“최근에 나를 가장 잘 돌본 순간은 언제였나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w15-d6-q-2', '“그 돌봄을 아기에게 어떻게 이어질 수 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w15-d7-q-1', '“이번 주 가장 기억에 남는 우리 아기의 성장은 무엇이었나요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w15-d7-q-2', '“이번 주 가장 기억에 남는 엄마로서의 변화는 무엇이었나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 16 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  16,
  '16주차 발달 정보',
  '아기의 키는 18cm정도이고 몸무게는 150g정도에요. 아기가 아보카도 크기로 자랐어요.',
  '자궁이 커지면서 둥근 인대 통증(찌릿한 옆구리/하복부 통증)이 나타날 수 있어요. 쉬면 빠르게 가라앉는 경우가 많아요. 이번주에도 여전히 임신 호르몬과 순환 변화로 코막힘·코피·울혈감이 있을 수 있고, 정맥이 늘어나 정맥류가 보이기도 해요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '16주 1일차',
  '{"items": ["아기의 키는 18cm정도이고 몸무게는 150g정도에요.", "아기가 아보카도 크기로 자랐어요."]}'::jsonb,
  '{"items": ["자궁이 커지면서 둥근 인대 통증(찌릿한 옆구리/하복부 통증)이 나타날 수 있어요. 쉬면 빠르게 가라앉는 경우가 많아요.", "이번주에도 여전히 임신 호르몬과 순환 변화로 코막힘·코피·울혈감이 있을 수 있고, 정맥이 늘어나 정맥류가 보이기도 해요."]}'::jsonb,
  '아기는 오늘 두 손 안에 쏙 들어갈 아보카도만큼 자랐어요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 16
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '16주 2일차',
  '{"items": ["작은 태동(퀵닝)을 느낄 수 있는 시기에 들어섰어요. 보통 16–22주 사이에 시작되고, 첫 임신이  아닌 산모가 더 일찍 알아차리기도 해요."]}'::jsonb,
  '{"items": ["가스·팽만감이 잦아질 수 있어요. 프로게스테론이 장운동을 늦춰서 생기는 변화예요.", "변비도 심해질 수 있어요."]}'::jsonb,
  '아기는 물결처럼 살짝 스치는 신호를 보내고 있어요. 곧 더 분명해질 거예요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 16
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '16주 3일차',
  '{"items": ["아기는 얼굴 표정(미소·찡그림 등)을 짓기 시작하지만, 아직 근육 조절이 없어 ‘무작위’로 일어나요.", "귀의 작은 뼈가 형성되고, 엄마의 목소리를 듣고 인지하기 시작해요."]}'::jsonb,
  '{"items": ["건망증이 생겼음을 느낄 수 있어요. 뚜렷한 원인이 있는 건 아니지만 스트레스·피로·호르몬 변화가 복합적으로 작용한 결과로 보고돼요.", "두통은 흔하지만, 2·3기에 심한 두통이 반복되면 자간전증 신호일 수 있어 확인이 필요해요."]}'::jsonb,
  '아기는 엄마 소리를 들으며 가끔 미소 짓는 연습을 하고 있어요. 아직은 연습 중이라 우연이 많지만요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 16
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '16주 4일차',
  '{"items": ["두피 모낭의 패턴이 형성돼요. 이 패턴은 평생 유지될 머리카락 자람의 ‘지도’가 돼요. 이렇게 만들어진 지도는 한번 만들어진 후로 새로 생기진 않아요."]}'::jsonb,
  '{"items": ["소화불량·속쓰림이 있을 수 있어요. 자세·식사 패턴을 조절해 불편을 줄여보세요.", "지난주 변화와 마찬가지로 자궁이 커지며 복부/골반 당김이 이어질 수 있어요."]}'::jsonb,
  '아기의 머리카락 지도가 그려지고 있어요. 언젠가 엄마가 쓰다듬어 줄 머리카락을 상상하며.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 16
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '16주 5일차',
  '{"items": ["아기의 간기능이 발달하면서 이 시기부터 (16–18주) AFP(신경관 결손 선별)나, 상황에 따라 쿼드 스크린을 권할 수 있어요. 양수검사(15–20주)는 선택적 진단검사예요.중요한 검사인 만큼 병원에 방문하면 우리 아기에게 필요한지 꼭 확인해주세요."]}'::jsonb,
  '{"items": ["산전 방문에서 혈압·소변(단백뇨) 확인으로 임신성 당뇨·자간전증 징후도 함께 살펴봐요.", "일상 활동은 가능하지만 낙상·복부 외상 위험 활동은 피해야 해요."]}'::jsonb,
  '엄마가 준비해주는 검사는 아기와 엄마를 더 안전하게 지켜줘요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 16
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '16주 6일차',
  '{"items": ["순환 기능이 활발해지고(자료에 따라 매일 수십 리터 규모의 혈액 운반으로 설명), 팔·손가락을 구부리고 맞잡고 주먹 쥐기 같은 동작이 늘어요."]}'::jsonb,
  '{"items": ["임산부·수유부는비타민 D 보충 10 µg/일(=400 IU)가 권장돼요. 음식만으론 충분량 도달이 어려워서 비타민으로 보충해야해요.", "자궁이 커져서 하늘 보고 눕는 자세는 혈관을 눌러 저혈압까지 일으킬 수 있어요.이제 갑자기 일어나면 어지러울 수도 있답니다."]}'::jsonb,
  '엄마의 하루가 아기의 피처럼 또르르 흐르며 아기를 크게 키워줘요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 16
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '16주 7일차',
  '{"items": ["이번 주의 큰 변화는 ‘작은 태동’의 시작 시기에 들어섰다는 점과, 엄마 목소리를 듣고 인지하기 시작했다는 거예요. 표정을 짓지만 아직은 무작위라는 사실도 기억해봐요."]}'::jsonb,
  '{"items": ["통증·가스/팽만·허리 통증 같은 2기 증상이 이어질 수 있어요.", "윤기나는 피부와 모발, 얼굴에 갈색 반점이 생길 수도 있어요내 몸이 임신 중기에 적응 중이라는 신호예요."]}'::jsonb,
  '아기는 이번 주 엄마의 소리에 조금씩 반응하며, 아주 작은 인사도 보냈어요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 16
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 16)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w16-d1-cl-1', '당김이 느껴지면 활동 멈추고 5–10분 휴식하기.', '당김이 느껴지면 활동 멈추고 5–10분 휴식하기.', '{"items": [{"id": "w16-d1-cl-1", "label": "당김이 느껴지면 활동 멈추고 5–10분 휴식하기."}]}'::jsonb, 1, true),
    (1, 'w16-d1-cl-2', '실내 가습·생리식염수 스프레이로 비강 건조 줄이기.', '실내 가습·생리식염수 스프레이로 비강 건조 줄이기.', '{"items": [{"id": "w16-d1-cl-2", "label": "실내 가습·생리식염수 스프레이로 비강 건조 줄이기."}]}'::jsonb, 2, true),
    (1, 'w16-d1-cl-3', '오늘의 몸 느낌(통증·호흡·피로)을 간단히 일기에 기록하기.', '오늘의 몸 느낌(통증·호흡·피로)을 간단히 일기에 기록하기.', '{"items": [{"id": "w16-d1-cl-3", "label": "오늘의 몸 느낌(통증·호흡·피로)을 간단히 일기에 기록하기."}]}'::jsonb, 3, true),
    (2, 'w16-d2-cl-1', '조용히 누워 배의 미세한 느낌을 5분간 관찰해 메모하며 아기가 보내는 노크를 느껴보기', '조용히 누워 배의 미세한 느낌을 5분간 관찰해 메모하며 아기가 보내는 노크를 느껴보기', '{"items": [{"id": "w16-d2-cl-1", "label": "조용히 누워 배의 미세한 느낌을 5분간 관찰해 메모하며 아기가 보내는 노크를 느껴보기"}]}'::jsonb, 1, true),
    (2, 'w16-d2-cl-2', '속이 더부룩하면 소량씩 자주 식사하고 탄산음료는 피하기.', '속이 더부룩하면 소량씩 자주 식사하고 탄산음료는 피하기.', '{"items": [{"id": "w16-d2-cl-2", "label": "속이 더부룩하면 소량씩 자주 식사하고 탄산음료는 피하기."}]}'::jsonb, 2, true),
    (2, 'w16-d2-cl-3', '통밀 빵 콩 같은 섬유질이 풍부한 음식을 섭취하기 (아보카도도 섬유질이 풍부해요!)', '통밀 빵 콩 같은 섬유질이 풍부한 음식을 섭취하기 (아보카도도 섬유질이 풍부해요!)', '{"items": [{"id": "w16-d2-cl-3", "label": "통밀 빵 콩 같은 섬유질이 풍부한 음식을 섭취하기 (아보카도도 섬유질이 풍부해요!)"}]}'::jsonb, 3, true),
    (3, 'w16-d3-cl-1', '중요한 할 일이 있다면 휴대폰 캘린더/메모로 단순화해두기.', '중요한 할 일이 있다면 휴대폰 캘린더/메모로 단순화해두기.', '{"items": [{"id": "w16-d3-cl-1", "label": "중요한 할 일이 있다면 휴대폰 캘린더/메모로 단순화해두기."}]}'::jsonb, 1, true),
    (3, 'w16-d3-cl-2', '두통 예방 위해 수분·휴식 확보, 증상 기록하기.', '두통 예방 위해 수분·휴식 확보, 증상 기록하기.', '{"items": [{"id": "w16-d3-cl-2", "label": "두통 예방 위해 수분·휴식 확보, 증상 기록하기."}]}'::jsonb, 2, true),
    (3, 'w16-d3-cl-3', '부드러운 대화로 아기와 소통해보기.', '부드러운 대화로 아기와 소통해보기.', '{"items": [{"id": "w16-d3-cl-3", "label": "부드러운 대화로 아기와 소통해보기."}]}'::jsonb, 3, true),
    (4, 'w16-d4-cl-1', '취침 전 상체 살짝 높이기(베개로 받치기).', '취침 전 상체 살짝 높이기(베개로 받치기).', '{"items": [{"id": "w16-d4-cl-1", "label": "취침 전 상체 살짝 높이기(베개로 받치기)."}]}'::jsonb, 1, true),
    (4, 'w16-d4-cl-2', '매운·기름진 음식을 피하고, 식사 후 가벼운 산책하기.', '매운·기름진 음식을 피하고, 식사 후 가벼운 산책하기.', '{"items": [{"id": "w16-d4-cl-2", "label": "매운·기름진 음식을 피하고, 식사 후 가벼운 산책하기."}]}'::jsonb, 2, true),
    (4, 'w16-d4-cl-3', '당김이 오면 옆으로 눕거나 다리 올리고 10분 쉬기.', '당김이 오면 옆으로 눕거나 다리 올리고 10분 쉬기.', '{"items": [{"id": "w16-d4-cl-3", "label": "당김이 오면 옆으로 눕거나 다리 올리고 10분 쉬기."}]}'::jsonb, 3, true),
    (5, 'w16-d5-cl-1', '검사 일정·질문 리스트를 메모해 진료에 가져가기.', '검사 일정·질문 리스트를 메모해 진료에 가져가기.', '{"items": [{"id": "w16-d5-cl-1", "label": "검사 일정·질문 리스트를 메모해 진료에 가져가기."}]}'::jsonb, 1, true),
    (5, 'w16-d5-cl-2', '접촉스포츠·스쿠버·스키·놀이기구 등 위험 활동 체크 후 회피하기.', '접촉스포츠·스쿠버·스키·놀이기구 등 위험 활동 체크 후 회피하기.', '{"items": [{"id": "w16-d5-cl-2", "label": "접촉스포츠·스쿠버·스키·놀이기구 등 위험 활동 체크 후 회피하기."}]}'::jsonb, 2, true),
    (5, 'w16-d5-cl-3', '오늘 혈압/부종/두통 유무 기록하기.', '오늘 혈압/부종/두통 유무 기록하기.', '{"items": [{"id": "w16-d5-cl-3", "label": "오늘 혈압/부종/두통 유무 기록하기."}]}'::jsonb, 3, true),
    (6, 'w16-d6-cl-1', '나의 비타민 D 섭취 루틴(영양제·식단·햇빛)을 점검하기.', '나의 비타민 D 섭취 루틴(영양제·식단·햇빛)을 점검하기.', '{"items": [{"id": "w16-d6-cl-1", "label": "나의 비타민 D 섭취 루틴(영양제·식단·햇빛)을 점검하기."}]}'::jsonb, 1, true),
    (6, 'w16-d6-cl-2', '오늘도 옆으로 눕거나 다리를 올려 휴식하는 자세 연습하기', '오늘도 옆으로 눕거나 다리를 올려 휴식하는 자세 연습하기', '{"items": [{"id": "w16-d6-cl-2", "label": "오늘도 옆으로 눕거나 다리를 올려 휴식하는 자세 연습하기"}]}'::jsonb, 2, true),
    (6, 'w16-d6-cl-3', '운동은 짧고 가볍게헤주세요. 무리하지 않고 컨디션 체크.', '운동은 짧고 가볍게헤주세요. 무리하지 않고 컨디션 체크.', '{"items": [{"id": "w16-d6-cl-3", "label": "운동은 짧고 가볍게헤주세요. 무리하지 않고 컨디션 체크."}]}'::jsonb, 3, true),
    (7, 'w16-d7-cl-1', '불편한 증상을 완화하기 위해 편안한 임부복과 속옷을 구매해보세요.', '불편한 증상을 완화하기 위해 편안한 임부복과 속옷을 구매해보세요.', '{"items": [{"id": "w16-d7-cl-1", "label": "불편한 증상을 완화하기 위해 편안한 임부복과 속옷을 구매해보세요."}]}'::jsonb, 1, true),
    (7, 'w16-d7-cl-2', '굽이 너무 낮거나 높지 않은 편안한 신발을 구매해보세요.부종을 고려하여 반사이즈 업하는 것도 잊지마세요.', '굽이 너무 낮거나 높지 않은 편안한 신발을 구매해보세요.부종을 고려하여 반사이즈 업하는 것도 잊지마세요.', '{"items": [{"id": "w16-d7-cl-2", "label": "굽이 너무 낮거나 높지 않은 편안한 신발을 구매해보세요.부종을 고려하여 반사이즈 업하는 것도 잊지마세요."}]}'::jsonb, 2, true),
    (7, 'w16-d7-cl-3', '산전 마사지,페이셜 마사지,매니큐어나 페디큐어는 기본 예방 수칙만 지키면 안전해요.', '산전 마사지,페이셜 마사지,매니큐어나 페디큐어는 기본 예방 수칙만 지키면 안전해요.', '{"items": [{"id": "w16-d7-cl-3", "label": "산전 마사지,페이셜 마사지,매니큐어나 페디큐어는 기본 예방 수칙만 지키면 안전해요."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 16)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w16-d1-q-1', '“아보카도만큼 자란 우리 아기에게, 오늘 내 몸이 보내준 신호 중 가장 고마웠던 건 무엇이었을까?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w16-d1-q-2', '“오늘 몸이 보낸 신호 중 유난히 힘들었던 느낌이 있었다면 말해주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w16-d2-q-1', '“이번 주 속이 불편하진 않았나요? 어떤 증상을 경험했나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w16-d2-q-2', '“이번주, 아기가 엄마에게 보내는 작은 노크를 경험하게 된다면 어떤 감정이 들 것 같나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w16-d2-q-3', '“', 'text', '편하게 적어 주세요.', '{}'::jsonb, 3, false),
    (3, 'w16-d3-q-1', '“오늘은 ‘실수’에 대해서 이야기해봐요. 기억에 남는 실수가 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w16-d3-q-2', '“시간 지나 돌아봤을 때 그 실수는 엄마에게 어떤 경험으로 남았는지 사랑하는 아기에게 이야기해주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w16-d4-q-1', '“내가 아이에게 물려주고 싶은 ‘삶을 대하는 패턴’은 무엇입니까? 말의 습관, 표정, 삶의 태도 중에서요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w16-d4-q-2', '‘삶을 대하는 패턴’이라는 것은 어떻게 만들어지는 건가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w16-d5-q-1', '“아기를 위해 절제했던 경험을 들려주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w16-d5-q-2', '“인생에서 절제가 중요한 이유는 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w16-d6-q-1', '“엄마가 좋아하는 계절과 그 이유를 알려주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w16-d6-q-2', '“비 내리는 날과 햇볕이 쨍쨍한 날 중 어떤 날을 좋아하나요 그 이유도 들려주세요”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w16-d7-q-1', '아기에게 ‘나를 사랑하는 방법’에 대해 알려주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w16-d7-q-2', '아기가 나중에 커서 자기 자신에 대한 사랑을 어떻게 실현하면 좋겠나요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 17 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  17,
  '17주차 발달 정보',
  '아기는 키 약 20 cm, 몸무게 약 180 g으로 자라가고, 배 크기만큼 자랐어요.',
  '자궁이 더 올라와 배가 눈에 띄기 시작하고 허리선이 사라진 느낌이 들 수 있어요. 이제 진짜 ‘임신부의 몸’이 보이기 시작하죠. 주변에서 축하받는 기쁨도 있지만 낯설게 느껴질 수도 있어요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '17주 1일차',
  '{"items": ["아기는 키 약 20 cm, 몸무게 약 180 g으로 자라가고, 배 크기만큼 자랐어요."]}'::jsonb,
  '{"items": ["자궁이 더 올라와 배가 눈에 띄기 시작하고 허리선이 사라진 느낌이 들 수 있어요.", "이제 진짜 ‘임신부의 몸’이 보이기 시작하죠. 주변에서 축하받는 기쁨도 있지만 낯설게 느껴질 수도 있어요."]}'::jsonb,
  '아기는 오늘 작은 손에 꼭 안길 순무/샐러리만큼 자랐어요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 17
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '17주 2일차',
  '{"items": ["아기의 골격이 연골이 뼈로 바뀌는 중이에요."]}'::jsonb,
  '{"items": ["탯줄이 더 튼튼하고 굵게 자라며 영양·산소를 전해요.", "칼슘·철분·비타민 D 섭취가 중요한 시기예요. 엄마의 칼슘 섭취는 아기 뼈(엄마 뼈 포함)에 도움을 주고, 고혈압·자간전증 위험 감소에도 연결돼요."]}'::jsonb,
  '아기의 뼈가 튼튼해지고 있어요!',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 17
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '17주 3일차',
  '{"items": ["피부를 감싸는태지가 형성되기 시작해요.", "땀샘 발달이 시작되고, 피부층은 다음 주쯤 더 갖춰져요."]}'::jsonb,
  '{"items": ["임신 중기엔 윤기 나는 머리카락·기름진 피부·얼굴 갈색 반점(기미)이 나타날 수 있어요.", "가려운 피부·튼살이 흔해요. 보습이 도움 되지만 완전 예방은 어려워요."]}'::jsonb,
  '아기는 지난번에 입었던 솜털 외투 위로 태지 외투가 생기고 있어요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 17
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '17주 4일차',
  '{"items": ["아기는 빛과 어둠을 인지해요.아가는 따뜻하고 밝은쪽으로 옮겨가요.", "이제 소리를 인식하고 반응할 수 있어요.시끄러운 소리에 놀라 움찔할 수 있어요."]}'::jsonb,
  '{"items": ["자궁이 많이 커져서 이제 잘때도 옆으로 누워서 자야해요.", "임신 중 시력 변화(흐림·건조) 생길 수 있어요. 단순 흐림이 아닌 복시 등 심한 증상이 있다면 상담하세요."]}'::jsonb,
  '아기는 엄마 배 바깥의 세상의 소리와 빛을 느끼고 있어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 17
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '17주 5일차',
  '{"items": ["지난주에 이어 작은 태동(퀵닝)을 느낄 수도, 아직 못 느낄 수도 있는 시기예요(16–22주).", "아기의 심장은 하루에 약 100파인트를 펌핑할 만큼 강하게 일해요."]}'::jsonb,
  '{"items": ["호르몬 변화로 인해 이상한 꿈이나 불안/감정 기복이 늘 수 있어요. 필요하면 의료진과 상의해요.", "자궁이 많이 커져서 안전벨트가 자궁을 압박할 수 있어요."]}'::jsonb,
  '아기는 신호를 보내고 있어요. 아직 미약하지만 곧 더 강하게 신호를 보낼 거예요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 17
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '17주 6일차',
  '{"items": ["피하지방이 쌓이기 시작하며 점점 포동포동해져요."]}'::jsonb,
  '{"items": ["‘둥지 본능’이 올라와 출산 계획·아기방 인테리어를 둘러보고 있진 않으신가요?", "변비/팽만이 이어질 수 있고, 빈혈이 의심되면 철분 보충에 대해 상담해요."]}'::jsonb,
  '아기는 엄마의 사랑을 먹고 자라며 통통하게 지방을 찌우고 있어요. 점점 귀여워지고 있어요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 17
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '17주 7일차',
  '{"items": ["이번 주의 큰 변화로 작은 태동의 시작 가능성, 골격이 뼈로 단단해짐, 피하지방 형성, 빛·소리 반응을 다시 떠올려요."]}'::jsonb,
  '{"items": ["배가 더 눈에 띄고(허리선 변화), 피부·머리카락의 윤기, 가려움/튼살 관리는 계속해요.", "수면은 옆으로, 현기증 땐 바로 쉬기!"]}'::jsonb,
  '아기는 빛과 목소리를 느끼고 있어요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 17
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 17)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w17-d1-cl-1', '배가 불러옴을 기념하며첫 ‘임신 사진’을 찍어보세요.남편이나 친정엄마와 함께 찍으면 더 기억에 오래 남을거에요.', '배가 불러옴을 기념하며첫 ‘임신 사진’을 찍어보세요.남편이나 친정엄마와 함께 찍으면 더 기억에 오래 남을거에요.', '{"items": [{"id": "w17-d1-cl-1", "label": "배가 불러옴을 기념하며첫 ‘임신 사진’을 찍어보세요.남편이나 친정엄마와 함께 찍으면 더 기억에 오래 남을거에요."}]}'::jsonb, 1, true),
    (1, 'w17-d1-cl-2', '늦지않게 가까운 지인이나 친척에게 임신사실을 말해주세요.어쩌면 기다리고 있을지도 몰라요.', '늦지않게 가까운 지인이나 친척에게 임신사실을 말해주세요.어쩌면 기다리고 있을지도 몰라요.', '{"items": [{"id": "w17-d1-cl-2", "label": "늦지않게 가까운 지인이나 친척에게 임신사실을 말해주세요.어쩌면 기다리고 있을지도 몰라요."}]}'::jsonb, 2, true),
    (1, 'w17-d1-cl-3', '낯선 사람이 배를 만지는 것이 불쾌하다면 단호하게 거절해보세요!', '낯선 사람이 배를 만지는 것이 불쾌하다면 단호하게 거절해보세요!', '{"items": [{"id": "w17-d1-cl-3", "label": "낯선 사람이 배를 만지는 것이 불쾌하다면 단호하게 거절해보세요!"}]}'::jsonb, 3, true),
    (2, 'w17-d2-cl-1', '점심에 칼슘 풍부한 식사(+수분)로 뼈 성장을 응원해요.', '점심에 칼슘 풍부한 식사(+수분)로 뼈 성장을 응원해요.', '{"items": [{"id": "w17-d2-cl-1", "label": "점심에 칼슘 풍부한 식사(+수분)로 뼈 성장을 응원해요."}]}'::jsonb, 1, true),
    (2, 'w17-d2-cl-2', '서 있을 땐 무릎 살짝 굽혀 정맥순환 보조, 현기증 시 즉시 앉거나 옆으로 눕기.', '서 있을 땐 무릎 살짝 굽혀 정맥순환 보조, 현기증 시 즉시 앉거나 옆으로 눕기.', '{"items": [{"id": "w17-d2-cl-2", "label": "서 있을 땐 무릎 살짝 굽혀 정맥순환 보조, 현기증 시 즉시 앉거나 옆으로 눕기."}]}'::jsonb, 2, true),
    (2, 'w17-d2-cl-3', '오늘의 칼슘 섭취/어지러움 발생 기록하기.', '오늘의 칼슘 섭취/어지러움 발생 기록하기.', '{"items": [{"id": "w17-d2-cl-3", "label": "오늘의 칼슘 섭취/어지러움 발생 기록하기."}]}'::jsonb, 3, true),
    (3, 'w17-d3-cl-1', '샤워 후 무향 보습제로 배·가슴을 천천히 마사지.', '샤워 후 무향 보습제로 배·가슴을 천천히 마사지.', '{"items": [{"id": "w17-d3-cl-1", "label": "샤워 후 무향 보습제로 배·가슴을 천천히 마사지."}]}'::jsonb, 1, true),
    (3, 'w17-d3-cl-2', 'SPF 30+ 선크림과 모자로 색소 침착 악화 예방.', 'SPF 30+ 선크림과 모자로 색소 침착 악화 예방.', '{"items": [{"id": "w17-d3-cl-2", "label": "SPF 30+ 선크림과 모자로 색소 침착 악화 예방."}]}'::jsonb, 2, true),
    (3, 'w17-d3-cl-3', '가려움/피부 변화 체킹해 두기.', '가려움/피부 변화 체킹해 두기.', '{"items": [{"id": "w17-d3-cl-3", "label": "가려움/피부 변화 체킹해 두기."}]}'::jsonb, 3, true),
    (4, 'w17-d4-cl-1', '잠자리 준비: 왼쪽으로 눕는 자세 + 베개 보조.', '잠자리 준비: 왼쪽으로 눕는 자세 + 베개 보조.', '{"items": [{"id": "w17-d4-cl-1", "label": "잠자리 준비: 왼쪽으로 눕는 자세 + 베개 보조."}]}'::jsonb, 1, true),
    (4, 'w17-d4-cl-2', '저녁엔 조용한 음악과 밝지 않은 조명으로 아기와 소리 및 환경 교감.', '저녁엔 조용한 음악과 밝지 않은 조명으로 아기와 소리 및 환경 교감.', '{"items": [{"id": "w17-d4-cl-2", "label": "저녁엔 조용한 음악과 밝지 않은 조명으로 아기와 소리 및 환경 교감."}]}'::jsonb, 2, true),
    (4, 'w17-d4-cl-3', '눈 건조엔 실내 습도 관리·휴식.', '눈 건조엔 실내 습도 관리·휴식.', '{"items": [{"id": "w17-d4-cl-3", "label": "눈 건조엔 실내 습도 관리·휴식."}]}'::jsonb, 3, true),
    (5, 'w17-d5-cl-1', '잠들기 전 호흡·근육 이완으로 마음 진정 연습.', '잠들기 전 호흡·근육 이완으로 마음 진정 연습.', '{"items": [{"id": "w17-d5-cl-1", "label": "잠들기 전 호흡·근육 이완으로 마음 진정 연습."}]}'::jsonb, 1, true),
    (5, 'w17-d5-cl-2', '차 탈 땐 벨트 위치 재확인.허리끈은 배 아래·골반뼈, 어깨끈은 가슴 사이→배 옆).', '차 탈 땐 벨트 위치 재확인.허리끈은 배 아래·골반뼈, 어깨끈은 가슴 사이→배 옆).', '{"items": [{"id": "w17-d5-cl-2", "label": "차 탈 땐 벨트 위치 재확인.허리끈은 배 아래·골반뼈, 어깨끈은 가슴 사이→배 옆)."}]}'::jsonb, 2, true),
    (5, 'w17-d5-cl-3', '오늘 태동/감정 변화를 한 줄 일기에 써보기.', '오늘 태동/감정 변화를 한 줄 일기에 써보기.', '{"items": [{"id": "w17-d5-cl-3", "label": "오늘 태동/감정 변화를 한 줄 일기에 써보기."}]}'::jsonb, 3, true),
    (6, 'w17-d6-cl-1', '아기방 체크리스트 초안 작성.', '아기방 체크리스트 초안 작성.', '{"items": [{"id": "w17-d6-cl-1", "label": "아기방 체크리스트 초안 작성."}]}'::jsonb, 1, true),
    (6, 'w17-d6-cl-2', '출산계획에 대해 천천히 체크리스트를 만들어봐요.', '출산계획에 대해 천천히 체크리스트를 만들어봐요.', '{"items": [{"id": "w17-d6-cl-2", "label": "출산계획에 대해 천천히 체크리스트를 만들어봐요."}]}'::jsonb, 2, true),
    (6, 'w17-d6-cl-3', '물+섬유질+가벼운 걷기로 변비 관리.', '물+섬유질+가벼운 걷기로 변비 관리.', '{"items": [{"id": "w17-d6-cl-3", "label": "물+섬유질+가벼운 걷기로 변비 관리."}]}'::jsonb, 3, true),
    (7, 'w17-d7-cl-1', '편한 옷·신발·보습 루틴을 정해요.', '편한 옷·신발·보습 루틴을 정해요.', '{"items": [{"id": "w17-d7-cl-1", "label": "편한 옷·신발·보습 루틴을 정해요."}]}'::jsonb, 1, true),
    (7, 'w17-d7-cl-2', '수면 루틴(왼쪽으로 눕기 + 베개 보조)을 한 번 더 고정.', '수면 루틴(왼쪽으로 눕기 + 베개 보조)을 한 번 더 고정.', '{"items": [{"id": "w17-d7-cl-2", "label": "수면 루틴(왼쪽으로 눕기 + 베개 보조)을 한 번 더 고정."}]}'::jsonb, 2, true),
    (7, 'w17-d7-cl-3', '다음 주 병원 메모: 자각 증상·태동·질문 리스트.', '다음 주 병원 메모: 자각 증상·태동·질문 리스트.', '{"items": [{"id": "w17-d7-cl-3", "label": "다음 주 병원 메모: 자각 증상·태동·질문 리스트."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 17)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w17-d1-q-1', '“아기가 세상에 나와서 함께 첫 가족사진을 찍게되는 날을 상상하며,어떤 옷을 입고 어떤 컨셉으로 찍어보고 싶은지 상상해볼까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w17-d1-q-2', '“친구들에게 임신 사실을 알렸을 때 어떤 반응이었나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w17-d2-q-1', '뼈가 튼튼해지고 있는 아기에게 마음의 단단함이란 어떤 의미인지 알려주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w17-d2-q-2', '나는 어떤 마음을 단단히 지키고 싶은가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w17-d3-q-1', '“오늘은 엄마 몸의 어떤 변화를 경험했나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w17-d3-q-2', '“변해가는 엄마의 몸을 보며, 어떤 감상이 드시나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w17-d4-q-1', '“오늘아기에게 전달한 엄마의 목소리 온도는 어땠을까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w17-d4-q-2', '“내일은 어떤 목소리로 아기에게 인사할 건가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w17-d5-q-1', '“요즘에 꿨던 재미난 꿈 이야기를 들려주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w17-d5-q-2', '“아기는 어떤 꿈을 꾸고 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w17-d6-q-1', '“우리 가족의 첫 만남 공간을 상상하며, 그 공간에 가장 먼저 채우고 싶은 건 무엇인지 생각해볼까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w17-d6-q-2', '아기방의 컨셉은 무엇인가요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w17-d7-q-1', '“한 주를 돌아보며,이번주에 느꼈던 가장 큰 변화는 어떤 것이었나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w17-d7-q-2', '“아기가 어떻게 생겼을지 상상해볼까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 18 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  18,
  '18주차 발달 정보',
  '',
  '',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 19 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  19,
  '19주차 발달 정보',
  '오늘 아기는 키 약 24–25cm, 몸무게 약 270–300g, 손에 쥘 수 있는 석류 하나 크기만큼 자랐어요. 손가락과 발가락에는 영원히 변하지 않을 지문과 발자국 무늬가 드디어 완성되었어요. 일란성 쌍둥이도 서로 다른, 오직 자기만의 무늬예요.',
  '자궁의 끝부분이 배꼽 근처까지 올라와 배가 더 ‘임산부 배’처럼 둥글게 보이기 시작해요. 체형에 따라 어떤 사람은 배가 많이 나온 것 같고, 어떤 사람은 덜 나온 것처럼 보여서 걱정되기도 하지만, 의사가 아기 성장과 체중 증가를 괜찮다고 한다면 배 모양과 크기 차이는 전부 정상 범위예요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '19주 1일차',
  '{"items": ["오늘 아기는 키 약 24–25cm, 몸무게 약 270–300g, 손에 쥘 수 있는 석류 하나 크기만큼 자랐어요.", "손가락과 발가락에는 영원히 변하지 않을 지문과 발자국 무늬가 드디어 완성되었어요. 일란성 쌍둥이도 서로 다른, 오직 자기만의 무늬예요."]}'::jsonb,
  '{"items": ["자궁의 끝부분이 배꼽 근처까지 올라와 배가 더 ‘임산부 배’처럼 둥글게 보이기 시작해요.", "체형에 따라 어떤 사람은 배가 많이 나온 것 같고, 어떤 사람은 덜 나온 것처럼 보여서 걱정되기도 하지만, 의사가 아기 성장과 체중 증가를 괜찮다고 한다면 배 모양과 크기 차이는 전부 정상 범위예요."]}'::jsonb,
  '아기는 이제 세상 어디에도 없는 나만의 무늬가 생겼어요. 엄마 품에 안길 날을 기다리며 조용히 준비하고 있어요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 19
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '19주 2일차',
  '{"items": ["아기 뇌에서는 후각·미각·청각·시각·촉각을 담당하는 영역이 분주하게 연결되고 있어요. 오감의 회로가 하나씩 켜지는 시기예요.", "아기는 양수 속에서 삼키고, 빨고, 움직이며 세상을 느끼는 연습을 하고 있어요. 자주 듣는 엄마·아빠 목소리를 뇌가 기억해 두기 시작해요."]}'::jsonb,
  '{"items": ["자궁이 자라며 골반과 연결된 인대가 늘어나면서, 사타구니에서 시작해 엉덩이 위쪽까지 찌릿한 둥근 인대 통증이 느껴질 수 있어요.", "이 통증은 보통 짧고 금세 지나가며, 갑자기 움직이거나 자세를 바꿀 때 더 잘 느껴질 수 있어요.", "하지만 휴식을 취해도 사라지지 않는 강한 경련성 통증이 계속되거나, 발열·어지럼증·상복부 압통이 함께 있다면 의료진과 꼭 상의해야 해요."]}'::jsonb,
  '아기는 이제 엄마 목소리가 점점 더 익숙해지고 있어요. 목소리를 자주 들려주세요. 나중에 태어났을 때, ‘아, 이 목소리 알아!’ 하고 미소 지을 수 있게요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 19
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '19주 3일차',
  '{"items": ["아기 폐의 작은 기관지들이 더 멀리 뻗어나가고, 말단에 작은 호흡 주머니들이 더 촘촘하게 자라며 아기의 폐가 산소를 받아들일 준비를 하고 있어요.", "갈색 지방이라는 것이 형성되기 시작해요. 이 지방은 태어난 뒤 몸을 따뜻하게 지키고 에너지와 혈당·인슐린을 조절하는 데 중요한 역할을 하게 될 거예요."]}'::jsonb,
  '{"items": ["임신 중에는 평소보다 더 많은 산소가 필요해져, 계단을 조금만 올라가도 숨이 찬 느낌이 들 수 있어요.", "시간이 갈수록 커지는 자궁이 가슴을 누르며, 가만히 앉아있을 때도 답답하거나 숨이 짧게 느껴질 수 있어요.", "혈압이 예전보다 살짝 낮아질 수 있어 갑자기 일어날 때 어지럽거나 눈앞이 흐려지는 경험을 할 수도 있어요."]}'::jsonb,
  '아기는 아직 엄마처럼 폐로 숨을 쉬진 않지만 언젠가 엄마 품에서 처음 숨을 들이쉴 그날을 상상하고 있어요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 19
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '19주 4일차',
  '{"items": ["아기의 피부는 아직 얇고 투명해서 혈관이 비쳐 붉게 보이지만, 그 위를 감싸는 버닉스, 우리나라 말로는 태지라고 불리는 크림같은 보호막이 완성되어가고 있어요.", "이 태지는 아기의 피부를 보호하고 수분을 지켜주며, 해로운 박테리아로부터도 지켜주고 폐와 소화관이 발달하는 데도 도움을 준다고 알려져 있어요."]}'::jsonb,
  '{"items": ["임신 호르몬과 색소 변화 때문에, 윗입술·뺨·이마에 기미(‘산모의 가면’)가 생기거나 유두·겨드랑이·허벅지 안쪽 피부가 더 어두워질 수 있어요.", "배꼽에서 치골까지 이어지는 임신선이 점점 뚜렷해지고 있어요.", "얼굴·어깨·팔에는 작은 붉은 실핏줄 얼룩(거미 모반)이 보일 수 있는데, 대부분은 혈관·호르몬 변화로 생기는 자연스러운 변화예요."]}'::jsonb,
  '아기 피부 위에 하얀 외투가 입혀지고 있어요. 엄마 품으로 나갈 때까지 아기를 따뜻하게 지켜줄 거예요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 19
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '19주 5일차',
  '{"items": ["아기는 자주 몸을 뒤집고, 발로 차고, 비틀면서 근육과 신경을 단련하고 있어요."]}'::jsonb,
  '{"items": ["임신 중기에는 다리 경련이 자주 생길 수 있는데, 체중 증가, 부종, 근육에 가해지는 부담과 관련된 것으로 여겨져요.", "밤중이나 새벽에 종아리가 갑자기 ‘꽉’ 뭉치거나, 한동안 발을 딛기 힘들 정도로 당기는 느낌이 들 수 있어요.", "발목·발, 손가락이 약간 붓는 것도 흔한 변화라, 오래 서 있거나 앉아 있으면 더 심해질 수 있어요."]}'::jsonb,
  '엄마가 느끼는 “금붕어가 살랑거리는 느낌”은 점점 더 뚜렷해져, 나중엔 분명한 발차기와 회전으로 느껴지게 될 거예요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 19
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '19주 6일차',
  '{"items": ["아기의 귀 구조(외·중·내이)가 정교하게 발달해, 자궁 속에서 들리는 심장 박동, 혈류 소리, 장 운동 소리 등을 듣기 시작했어요.", "기억력을 담당하는 뇌가 발달해, 자주 듣는 엄마·아빠 목소리를 기억할 수 있는 단계라고 해요."]}'::jsonb,
  '{"items": ["혈액량이 늘어나고 점막이 붓기 쉬워져, 코막힘이나 코피를 경험하는 임신부가 적지 않아요. 임산부의 약 5명 중 1명 정도가 코피를 경험한다고도 해요.", "코피가 날 때는 앉아서 몸을 살짝 앞으로 숙이고, 코 아래 부분을 10–15분간 꼬집어 압박한 뒤, 콧대에 찬 찜질을 해주는 방법이 권장돼요.", "피로와 수면 문제, 자주 깨는 밤이 이어지면서 “몸은 지치고, 머리는 예민한” 상태가 계속될 수 있어요."]}'::jsonb,
  '아기는 물속에서 열심히 몸을 움직이고 있어요. 하루하루 더 힘있게 신호를 보내고 있어요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 19
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '19주 7일차',
  '{"items": ["이번 주 동안 아기는 후각·미각·청각·시각·촉각을 담당하는 뇌 영역이 뚜렷하게 발달하며, 오감을 위한 회로를 하나씩 켜 가고 있어요.", "자주 듣는 엄마·아빠의 목소리를 기억할 수 있는 기반이 만들어지고, 손가락과 발가락에는 단 하나뿐인 지문과 발바닥 무늬가 자리잡았어요."]}'::jsonb,
  '{"items": ["배는 더 임산부답게 둥글어졌고, 사람들 눈에도 ‘이제 임신한 게 보이는’ 시기가 되어가고 있어요. 하지만 배의 크기와 모양은 키, 몸통 길이, 근육, 이전 임신 경험에 따라 모두 다르게 나타나는 게 정상이에요.", "피로, 수면 문제, 둥근 인대 통증, 다리 경련, 코피, 피부 변화 등 여러 증상이 겹치면서 “몸도 마음도 바쁘고 지치는 시기”가 될 수 있어요."]}'::jsonb,
  '엄마의 목소리와 종종 들려주는 노래가 이제 익숙하게 느껴져요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 19
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 19)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w19-d1-cl-1', '샤워 후 수건으로 배를 톡톡 닦으며, 자궁이 어디까지 올라왔는지 손으로 천천히 느껴보기. (잘 느껴지지 않을 수 있지만 지금은 배꼽까지 올라온 자궁의 끝 부분이 임신 말기에는 명치까지 올라갈 거예요.)', '샤워 후 수건으로 배를 톡톡 닦으며, 자궁이 어디까지 올라왔는지 손으로 천천히 느껴보기. (잘 느껴지지 않을 수 있지만 지금은 배꼽까지 올라온 자궁의 끝 부분이 임신 말기에는 명치까지 올라갈 거예요.)', '{"items": [{"id": "w19-d1-cl-1", "label": "샤워 후 수건으로 배를 톡톡 닦으며, 자궁이 어디까지 올라왔는지 손으로 천천히 느껴보기. (잘 느껴지지 않을 수 있지만 지금은 배꼽까지 올라온 자궁의 끝 부분이 임신 말기에는 명치까지 올라갈 거예요.)"}]}'::jsonb, 1, true),
    (1, 'w19-d1-cl-2', '진료 때 들었던 말 중 안심되었던 따뜻한 말 한 가지를 떠올리며 다시 마음속으로 되새겨 보기.', '진료 때 들었던 말 중 안심되었던 따뜻한 말 한 가지를 떠올리며 다시 마음속으로 되새겨 보기.', '{"items": [{"id": "w19-d1-cl-2", "label": "진료 때 들었던 말 중 안심되었던 따뜻한 말 한 가지를 떠올리며 다시 마음속으로 되새겨 보기."}]}'::jsonb, 2, true),
    (1, 'w19-d1-cl-3', '체형을 숨기기보다 편하고 숨 쉬기 좋은 옷을 골라 입어보기. (내 몸을 있는 그대로 받아들이는 연습이기도 해요.)', '체형을 숨기기보다 편하고 숨 쉬기 좋은 옷을 골라 입어보기. (내 몸을 있는 그대로 받아들이는 연습이기도 해요.)', '{"items": [{"id": "w19-d1-cl-3", "label": "체형을 숨기기보다 편하고 숨 쉬기 좋은 옷을 골라 입어보기. (내 몸을 있는 그대로 받아들이는 연습이기도 해요.)"}]}'::jsonb, 3, true),
    (2, 'w19-d2-cl-1', '통증이 올 때는 그 자리에서 잠시 멈추고 숨을 고르며, 배와 골반에 힘을 빼는 연습을 해보세요.', '통증이 올 때는 그 자리에서 잠시 멈추고 숨을 고르며, 배와 골반에 힘을 빼는 연습을 해보세요.', '{"items": [{"id": "w19-d2-cl-1", "label": "통증이 올 때는 그 자리에서 잠시 멈추고 숨을 고르며, 배와 골반에 힘을 빼는 연습을 해보세요."}]}'::jsonb, 1, true),
    (2, 'w19-d2-cl-2', '갑작스럽게 일어나는 것보다는, 일어나기 전에 다리를 한 번 쭉 뻗고 몸을 천천히 세우는 습관을 들여보세요.', '갑작스럽게 일어나는 것보다는, 일어나기 전에 다리를 한 번 쭉 뻗고 몸을 천천히 세우는 습관을 들여보세요.', '{"items": [{"id": "w19-d2-cl-2", "label": "갑작스럽게 일어나는 것보다는, 일어나기 전에 다리를 한 번 쭉 뻗고 몸을 천천히 세우는 습관을 들여보세요."}]}'::jsonb, 2, true),
    (2, 'w19-d2-cl-3', '오늘 저녁, 아랫배가 당기거나 묵직했던 순간을 짧게 메모해두면, 다음 진료 때 의료진과 이야기할 때 도움이 돼요.', '오늘 저녁, 아랫배가 당기거나 묵직했던 순간을 짧게 메모해두면, 다음 진료 때 의료진과 이야기할 때 도움이 돼요.', '{"items": [{"id": "w19-d2-cl-3", "label": "오늘 저녁, 아랫배가 당기거나 묵직했던 순간을 짧게 메모해두면, 다음 진료 때 의료진과 이야기할 때 도움이 돼요."}]}'::jsonb, 3, true),
    (3, 'w19-d3-cl-1', '숨이 차다고 느껴질 땐, “조금만 더 버텨야지”보다 지금 하던 일을 잠시 멈추고 의자나 침대에 앉아 깊게 숨 들이마시고 내쉬기를 선택해보세요.', '숨이 차다고 느껴질 땐, “조금만 더 버텨야지”보다 지금 하던 일을 잠시 멈추고 의자나 침대에 앉아 깊게 숨 들이마시고 내쉬기를 선택해보세요.', '{"items": [{"id": "w19-d3-cl-1", "label": "숨이 차다고 느껴질 땐, “조금만 더 버텨야지”보다 지금 하던 일을 잠시 멈추고 의자나 침대에 앉아 깊게 숨 들이마시고 내쉬기를 선택해보세요."}]}'::jsonb, 1, true),
    (3, 'w19-d3-cl-2', '누워 있다가 일어날 때는 옆으로 몸을 돌린 뒤, 손으로 지지하며 천천히 몸을 세우는 동작을 연습해보세요.', '누워 있다가 일어날 때는 옆으로 몸을 돌린 뒤, 손으로 지지하며 천천히 몸을 세우는 동작을 연습해보세요.', '{"items": [{"id": "w19-d3-cl-2", "label": "누워 있다가 일어날 때는 옆으로 몸을 돌린 뒤, 손으로 지지하며 천천히 몸을 세우는 동작을 연습해보세요."}]}'::jsonb, 2, true),
    (3, 'w19-d3-cl-3', '어지러운 양상이 평소와 다르다면(갑자기 숨이 가쁘거나 불규칙하게 심장이 뛰는 것 같다면) 구체적으로 때와 지속시간을 기록하기', '어지러운 양상이 평소와 다르다면(갑자기 숨이 가쁘거나 불규칙하게 심장이 뛰는 것 같다면) 구체적으로 때와 지속시간을 기록하기', '{"items": [{"id": "w19-d3-cl-3", "label": "어지러운 양상이 평소와 다르다면(갑자기 숨이 가쁘거나 불규칙하게 심장이 뛰는 것 같다면) 구체적으로 때와 지속시간을 기록하기"}]}'::jsonb, 3, true),
    (4, 'w19-d4-cl-1', '거울을 볼 때, 몸 곳곳에 생긴 짙은 선과 얼룩에 집중하기 보단 이 모든 변화 아래 품고 있는 작은 생명을 생각하기.', '거울을 볼 때, 몸 곳곳에 생긴 짙은 선과 얼룩에 집중하기 보단 이 모든 변화 아래 품고 있는 작은 생명을 생각하기.', '{"items": [{"id": "w19-d4-cl-1", "label": "거울을 볼 때, 몸 곳곳에 생긴 짙은 선과 얼룩에 집중하기 보단 이 모든 변화 아래 품고 있는 작은 생명을 생각하기."}]}'::jsonb, 1, true),
    (4, 'w19-d4-cl-2', '햇볕이 강한 시간대의 장시간 외출은 피하고, 가능한 그늘과 실내를 다니려고 하며 자외선 노출을 피하기.', '햇볕이 강한 시간대의 장시간 외출은 피하고, 가능한 그늘과 실내를 다니려고 하며 자외선 노출을 피하기.', '{"items": [{"id": "w19-d4-cl-2", "label": "햇볕이 강한 시간대의 장시간 외출은 피하고, 가능한 그늘과 실내를 다니려고 하며 자외선 노출을 피하기."}]}'::jsonb, 2, true),
    (4, 'w19-d4-cl-3', '오늘 일기나 메모에 내 몸에 생기는 얼룩에 대한 생각과 감정을 솔직하게 담아보기, (어떤 것도 괜찮아요.)', '오늘 일기나 메모에 내 몸에 생기는 얼룩에 대한 생각과 감정을 솔직하게 담아보기, (어떤 것도 괜찮아요.)', '{"items": [{"id": "w19-d4-cl-3", "label": "오늘 일기나 메모에 내 몸에 생기는 얼룩에 대한 생각과 감정을 솔직하게 담아보기, (어떤 것도 괜찮아요.)"}]}'::jsonb, 3, true),
    (5, 'w19-d5-cl-1', '오늘 하루 물을 의식적으로 더 자주 마셔보세요. 컵을 비울 때마다 “나와 아기 모두에게 물 한잔 더 준다”고 떠올려보기.', '오늘 하루 물을 의식적으로 더 자주 마셔보세요. 컵을 비울 때마다 “나와 아기 모두에게 물 한잔 더 준다”고 떠올려보기.', '{"items": [{"id": "w19-d5-cl-1", "label": "오늘 하루 물을 의식적으로 더 자주 마셔보세요. 컵을 비울 때마다 “나와 아기 모두에게 물 한잔 더 준다”고 떠올려보기."}]}'::jsonb, 1, true),
    (5, 'w19-d5-cl-2', '자기 전, 침대 옆에서 종아리와 발목을 부드럽게 스트레칭하고, 발가락을 까딱이며 근육이 긴장을 풀도록 도와주기.', '자기 전, 침대 옆에서 종아리와 발목을 부드럽게 스트레칭하고, 발가락을 까딱이며 근육이 긴장을 풀도록 도와주기.', '{"items": [{"id": "w19-d5-cl-2", "label": "자기 전, 침대 옆에서 종아리와 발목을 부드럽게 스트레칭하고, 발가락을 까딱이며 근육이 긴장을 풀도록 도와주기."}]}'::jsonb, 2, true),
    (5, 'w19-d5-cl-3', '휴식할 수 있을 때는 다리를 심장보다 조금 높게 올려놓고, 내 다리가 오늘 견뎌준 무게를 떠올리며 “수고했어”라고 속으로 말해보기.', '휴식할 수 있을 때는 다리를 심장보다 조금 높게 올려놓고, 내 다리가 오늘 견뎌준 무게를 떠올리며 “수고했어”라고 속으로 말해보기.', '{"items": [{"id": "w19-d5-cl-3", "label": "휴식할 수 있을 때는 다리를 심장보다 조금 높게 올려놓고, 내 다리가 오늘 견뎌준 무게를 떠올리며 “수고했어”라고 속으로 말해보기."}]}'::jsonb, 3, true),
    (6, 'w19-d6-cl-1', '오늘은 아주 짧은 동화 한 편이든, 하루를 정리한 일기 한 부분이든, 아기에게 읽어주는 시간을 가져보기 (목소리가 아기의 뇌에 “익숙한 소리”로 쌓이고 있어요.)', '오늘은 아주 짧은 동화 한 편이든, 하루를 정리한 일기 한 부분이든, 아기에게 읽어주는 시간을 가져보기 (목소리가 아기의 뇌에 “익숙한 소리”로 쌓이고 있어요.)', '{"items": [{"id": "w19-d6-cl-1", "label": "오늘은 아주 짧은 동화 한 편이든, 하루를 정리한 일기 한 부분이든, 아기에게 읽어주는 시간을 가져보기 (목소리가 아기의 뇌에 “익숙한 소리”로 쌓이고 있어요.)"}]}'::jsonb, 1, true),
    (6, 'w19-d6-cl-2', '실내가 너무 건조하지 않도록 물 한 컵을 옆에 두고, 조금씩 자주 마시며 점막이 마르지 않게 하기', '실내가 너무 건조하지 않도록 물 한 컵을 옆에 두고, 조금씩 자주 마시며 점막이 마르지 않게 하기', '{"items": [{"id": "w19-d6-cl-2", "label": "실내가 너무 건조하지 않도록 물 한 컵을 옆에 두고, 조금씩 자주 마시며 점막이 마르지 않게 하기"}]}'::jsonb, 2, true),
    (6, 'w19-d6-cl-3', '오늘 카페인은 평소보다 더 줄여보기', '오늘 카페인은 평소보다 더 줄여보기', '{"items": [{"id": "w19-d6-cl-3", "label": "오늘 카페인은 평소보다 더 줄여보기"}]}'::jsonb, 3, true),
    (7, 'w19-d7-cl-1', '오늘은 내 체형과 기분에 잘 맞는 옷을 골라 입고, 내 배와 얼굴이 꾸밈없이 드러나는 모습을 사진으로 한 장 남겨보세요. (나와 아기가 함께한 이 시기를 나중에 돌아볼 수 있을 거예요.)', '오늘은 내 체형과 기분에 잘 맞는 옷을 골라 입고, 내 배와 얼굴이 꾸밈없이 드러나는 모습을 사진으로 한 장 남겨보세요. (나와 아기가 함께한 이 시기를 나중에 돌아볼 수 있을 거예요.)', '{"items": [{"id": "w19-d7-cl-1", "label": "오늘은 내 체형과 기분에 잘 맞는 옷을 골라 입고, 내 배와 얼굴이 꾸밈없이 드러나는 모습을 사진으로 한 장 남겨보세요. (나와 아기가 함께한 이 시기를 나중에 돌아볼 수 있을 거예요.)"}]}'::jsonb, 1, true),
    (7, 'w19-d7-cl-2', '파트너나 믿고 의지하는 사람과, 아기가 태어난 뒤 서로 도와줄 수 있는 부분들(돌봄, 집안일, 정서적 지지)에 대해 가볍게 대화를 나눠보기.', '파트너나 믿고 의지하는 사람과, 아기가 태어난 뒤 서로 도와줄 수 있는 부분들(돌봄, 집안일, 정서적 지지)에 대해 가볍게 대화를 나눠보기.', '{"items": [{"id": "w19-d7-cl-2", "label": "파트너나 믿고 의지하는 사람과, 아기가 태어난 뒤 서로 도와줄 수 있는 부분들(돌봄, 집안일, 정서적 지지)에 대해 가볍게 대화를 나눠보기."}]}'::jsonb, 2, true),
    (7, 'w19-d7-cl-3', '오늘 하루의 끝에서, “이 많은 변화 속에서도 여기까지 잘 온 나”에게 짧은 편지나 메시지를 써보기. (언젠가 아기와 함께 다시 읽어도 좋을, 엄마 자신의 마음을 담아보는 거예요.)', '오늘 하루의 끝에서, “이 많은 변화 속에서도 여기까지 잘 온 나”에게 짧은 편지나 메시지를 써보기. (언젠가 아기와 함께 다시 읽어도 좋을, 엄마 자신의 마음을 담아보는 거예요.)', '{"items": [{"id": "w19-d7-cl-3", "label": "오늘 하루의 끝에서, “이 많은 변화 속에서도 여기까지 잘 온 나”에게 짧은 편지나 메시지를 써보기. (언젠가 아기와 함께 다시 읽어도 좋을, 엄마 자신의 마음을 담아보는 거예요.)"}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 19)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w19-d1-q-1', '“세상 어디에도 없는 지문처럼, 나만이 갖고 있는 ‘나다운 점’은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w19-d1-q-2', '“나다움이라는 고유한 가치는 왜 중요한가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w19-d2-q-1', '“오늘 아기에게 들려주고 싶은 목소리는 어떤 목소리인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w19-d2-q-2', '“아기에게 익숙한 목소리로 엄마의 따뜻한 마음을 전해주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w19-d3-q-1', '“요즘 나를 가장 숨차게 만드는 상황(계단오르기, 단거리 달리기 등)이 있나요? 나는 그 상황에서도 내 몸의 신호를 잘 들어주고 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w19-d3-q-2', '"버스 문 닫히기 직전에 뛰어갈 때처럼, 요즘 마음이 따라잡지 못하는 순간이 있었나요?"', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w19-d4-q-1', '“살면서 더 중요한 것을 쥐기 위해 손에 쥔 것을 내려놓았던 경험이 있나요? 당시 기억에 대해 알려주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w19-d4-q-2', '“희생이라는 가치는 언제 아름다워질 수 있다고 생각하나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w19-d5-q-1', '“요즘 내 다리가 가장 힘들어하는 순간은 언제인가요? 그때 나는 나에게 얼마나 따뜻하게 말해주고 있나요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w19-d5-q-2', '“아기가 자라며 내 몸이 버티고 있는 무게를 생각할 때, 나는 나 자신에게 어떤 감사 인사를 해주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w19-d6-q-1', '“아기가 가장 많이 듣게 될 내 목소리는 어떤 내용이길 바라나요? 비록 피곤함이 많은 날일 지라도 조금 더 많이 들려주고 싶은말이 있진 않은가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w19-d6-q-2', '“오늘 하루 중, 아기에게 꼭 들려주고 싶은 소리는 무엇이었나요? (웃음소리, 빗소리, 음악… 무엇이든) 그 이유는 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w19-d7-q-1', '“이번 주, 내 몸과 마음에서 가장 크게 느껴졌던 변화는 무엇이었나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w19-d7-q-2', '“이번 주, 내 변화를 ‘두려움’ 대신 ‘성장’으로 바라본다면, 어떤 문장으로 바꿔볼 수 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 20 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  20,
  '20주차 발달 정보',
  '오늘 아기는 머리부터 발끝까지 약 25cm 전후, 체중은 약 330g 정도로, 귀여운 바나나 크기만큼 자랐어요. 아직 지방이 많이 쌓이진 않아서 지금 아기를 만난다면 너무 마르고 얇은 느낌이겠지만, 장기와 얼굴·팔·다리는 “작은 사람 아기” 모습에 아주 가까워졌어요.',
  '자궁은 임신 전보다 두 배 이상 커져서, 자궁의 끝부분이 배꼽 근처까지 올라와 있어요. 이 시점에 평균적으로 약 4.5kg 정도 체중이 늘고, 배가 둥글게 나오면서 배꼽이 납작해지거나 약간 튀어나오는 느낌을 받을 수 있어요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '20주 1일차',
  '{"items": ["오늘 아기는 머리부터 발끝까지 약 25cm 전후, 체중은 약 330g 정도로, 귀여운 바나나 크기만큼 자랐어요.", "아직 지방이 많이 쌓이진 않아서 지금 아기를 만난다면 너무 마르고 얇은 느낌이겠지만, 장기와 얼굴·팔·다리는 “작은 사람 아기” 모습에 아주 가까워졌어요."]}'::jsonb,
  '{"items": ["자궁은 임신 전보다 두 배 이상 커져서, 자궁의 끝부분이 배꼽 근처까지 올라와 있어요.", "이 시점에 평균적으로 약 4.5kg 정도 체중이 늘고, 배가 둥글게 나오면서 배꼽이 납작해지거나 약간 튀어나오는 느낌을 받을 수 있어요.", "자궁이 위와 장을 위로 밀어 올리면서 소화불량·속쓰림·복부 팽만감도 더 잘 느껴질 수 있어요."]}'::jsonb,
  '아기는 점점 더 세심하게 세상을 느끼고 있어요. 나만의 무늬와 나만의 감각으로, 엄마 곁에서 살아갈 준비를 하고 있어요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 20
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '20주 2일차',
  '{"items": ["아기는 오늘도 양수 속에서 몸을 비틀고, 차고, 돌고, 주먹을 쥐었다 폈다 하며 운동 신경과 균형감각을 열심히 연습하고 있어요.", "엄마 입장에서 느껴지는 태동은 비눗방울이 톡톡 터지거나, 나비가 배 속에서 살랑거리는 듯한 느낌으로 다가올 수 있어요."]}'::jsonb,
  '{"items": ["자궁이 커지고 인대와 근육이 늘어나면서, 아랫배가 당기거나 묵직한 느낌이 전보다 더 자주 올라올 수 있어요.", "혈액량이 크게 증가하고 호르몬 변화까지 겹쳐, 갑자기 일어날 때 어지럽거나 숨이 조금 차는 느낌도 흔하게 나타날 수 있어요."]}'::jsonb,
  '아기는 우리 여정의 딱 절반까지 왔어요. 이제부터는 남은 절반을 함께 걸어가요. 아기도, 엄마 몸도, 쉼 없이 자라고 있어요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 20
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '20주 3일차',
  '{"items": ["아기의 미뢰(맛봉오리)는 이미 뇌와 연결되어 있어, 엄마가 먹은 음식의 분자가 양수로 스며들면 그 맛을 살짝 느껴볼 수 있어요.", "연습이기는 하지만, 아기는 양수를 삼키고, 다시 소화시키는 과정을 통해 소화계와 맛에 대한 경험을 동시에 쌓고 있어요."]}'::jsonb,
  '{"items": ["소화기관이 자궁에 눌리고, 장 움직임이 느려져 변비와 복부 팽만감, 가스가 더욱 쉽게 생길 수 있는 시기예요.", "변비가 오래 지속되면 치질이 생기거나 악화되기도 해서, ‘배변 패턴’ 자체를 돌봐줄 필요가 있어요."]}'::jsonb,
  '엄마가 오늘 무엇을 먹는지, 양수의 변화로 작지만 함께 느껴보고 있어요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 20
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '20주 4일차',
  '{"items": ["아기의 피부는 아직 얇고 연약하지만, 온몸을 감싸는 태지와 가는 솜털(라누고)이 보호막처럼 덮여 양수 속 자극으로부터 지켜주고 있어요.", "이 태지와 솜털은 나중에 태어날 때 미끄럽게 산도를 통과하는 데도 도움을 줄 수 있어요."]}'::jsonb,
  '{"items": ["배와 가슴 주변 피부가 빠르게 늘어나면서, 당김과 가려움을 느끼기 쉬운 시기예요.", "복부에는 임신선이라 불리는 흑선(linea nigra)이 배꼽에서 치골까지 짙게 그어질 수 있고, 튼살이 옅은 분홍색 또는 붉은 선으로 나타날 수 있어요.", "얼굴에는 갈색 반점이나 기미(‘임신의 가면’)가 생기고, 피부가 더 기름지고 번들거리는 느낌이 들 수 있어요."]}'::jsonb,
  '아가는 나름의 보호막을 두르고 있어요. 엄마 피부가 늘어나고 당기는 것처럼, 아가도 나갈 준비를 하고 있답니다.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 20
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '20주 5일차',
  '{"items": ["아기는 깨어 있을 때는 비틀고, 차고, 돌며 활발히 움직이고, 조용할 때는 잠을 자는 시간이 점점 뚜렷해지고 있어요.", "연구에 따르면, 심박수와 눈·입 움직임 패턴에서 수면–각성 주기와 REM 수면과 비슷한 양상이 관찰되기 시작하는 시기예요."]}'::jsonb,
  '{"items": ["배가 앞으로 더 나오면서 허리와 골반에 부담이 쌓여, 허리 통증과 골반 주변 불편감이 심해지기 쉬워요.", "한밤중 다리·종아리에 갑작스럽게 쥐가 나거나, 자다가 깨는 다리 경련을 경험할 수 있어요."]}'::jsonb,
  '아가는 이제 잠자는 시간대와 활동하는 시간대가 생겼어요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 20
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '20주 6일차',
  '{"items": ["20주 전후에는 초음파를 통해 아기의 심장, 뇌, 신장, 팔다리, 성기 등 장기의 구조와 발달 상태를 자세히 확인해요."]}'::jsonb,
  '{"items": ["이 시기에는 AFP 검사, 양수검사 등의 기형아 검사가 권유되기도 하고, 필요 시 추가 검사를 결정하게 돼요.", "백일해 예방접종을 16–32주 사이, 특히 20주 전후에 임신부에게 권장하는데, 엄마가 만든 항체가 태반을 통해 아기에게 전달되어 생후 8주 전까지 아기를 보호해줘요.", "혹시라도 20주 이후부터 자궁 수축이 강하게 느껴지거나, 주기적으로 느껴진다면 의료진에게 연락해야 합니다."]}'::jsonb,
  '아가는 병원에서 자세히 들여다보는 날이에요. 엄마가 걱정되기도 하겠지만, 함께 잘 확인하고, 함께 안심할 거예요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 20
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '20주 7일차',
  '{"items": ["20주인 지금, 아기는 약 25cm 전후, 270–300g 정도로 자라, 바나나나 파파야 크기와 비슷한 길이와 무게를 가진 작은 사람 아기로 성장해 있어요.", "아기의 움직임은 비눗방울처럼 살랑이던 초기 태동에서, 점점 더 규칙적이고 의미 있는 “리듬”을 가진 움직임으로 변해가고 있어요."]}'::jsonb,
  '{"items": ["임신 중반을 지나면서, 심한 피로와 입덧은 어느 정도 가라앉고, 대신 배의 묵직함·허리 통증·가벼운 숨가쁨 같은 새로운 불편감들이 자리를 잡기 시작해요.", "몸의 선과 피부, 머리카락, 체중까지 많은 변화가 한꺼번에 찾아와, ‘예전의 나’와 ‘지금의 나 사이’에서 어색함과 자존감의 흔들림을 느낄 수도 있는 시기예요."]}'::jsonb,
  '아가는 우리 여정의 절반을 지나왔어요. 이제 남은 절반도, 함께 천천히 걸어가요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 20
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 20)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w20-d1-cl-1', '샤워 후, 따뜻한 손으로 배를 천천히 쓸어내리며 지금까지 해왔던 것만큼 한번 더 해보자고 스스로와 아기를 격려해주세요.', '샤워 후, 따뜻한 손으로 배를 천천히 쓸어내리며 지금까지 해왔던 것만큼 한번 더 해보자고 스스로와 아기를 격려해주세요.', '{"items": [{"id": "w20-d1-cl-1", "label": "샤워 후, 따뜻한 손으로 배를 천천히 쓸어내리며 지금까지 해왔던 것만큼 한번 더 해보자고 스스로와 아기를 격려해주세요."}]}'::jsonb, 1, true),
    (1, 'w20-d1-cl-2', '오늘 자기 전, “임신의 절반까지 온 것에 대해 친밀한 대상과 감상을 나눠보기.”', '오늘 자기 전, “임신의 절반까지 온 것에 대해 친밀한 대상과 감상을 나눠보기.”', '{"items": [{"id": "w20-d1-cl-2", "label": "오늘 자기 전, “임신의 절반까지 온 것에 대해 친밀한 대상과 감상을 나눠보기.”"}]}'::jsonb, 2, true),
    (1, 'w20-d1-cl-3', '소화가 부담스럽다면 가벼운 식단으로, 한 번에 많이 먹기보다 소량씩 천천히 먹는 연습을 해보기.', '소화가 부담스럽다면 가벼운 식단으로, 한 번에 많이 먹기보다 소량씩 천천히 먹는 연습을 해보기.', '{"items": [{"id": "w20-d1-cl-3", "label": "소화가 부담스럽다면 가벼운 식단으로, 한 번에 많이 먹기보다 소량씩 천천히 먹는 연습을 해보기."}]}'::jsonb, 3, true),
    (2, 'w20-d2-cl-1', '아기는 엄마가 맛있는 것을 먹거나, 기분이 좋을 때 더 반응하곤 합니다. 오늘 태동을 강하게느꼈던 순간이 있다면 짧게 메모해 두기.', '아기는 엄마가 맛있는 것을 먹거나, 기분이 좋을 때 더 반응하곤 합니다. 오늘 태동을 강하게느꼈던 순간이 있다면 짧게 메모해 두기.', '{"items": [{"id": "w20-d2-cl-1", "label": "아기는 엄마가 맛있는 것을 먹거나, 기분이 좋을 때 더 반응하곤 합니다. 오늘 태동을 강하게느꼈던 순간이 있다면 짧게 메모해 두기."}]}'::jsonb, 1, true),
    (2, 'w20-d2-cl-2', '앉아 있다가 일어날 때는 다리를 한 번 쭉 뻗고, 천천히 상체를 일으켜 어지러움을 줄여보기.', '앉아 있다가 일어날 때는 다리를 한 번 쭉 뻗고, 천천히 상체를 일으켜 어지러움을 줄여보기.', '{"items": [{"id": "w20-d2-cl-2", "label": "앉아 있다가 일어날 때는 다리를 한 번 쭉 뻗고, 천천히 상체를 일으켜 어지러움을 줄여보기."}]}'::jsonb, 2, true),
    (2, 'w20-d2-cl-3', '체중관리 및 심혈관 건강을 위해 주3-5회 정도 30분가량 걷길 추천합니다. 오늘 30분 가량 좋아하는 산책 경로로 한번 걸어보기', '체중관리 및 심혈관 건강을 위해 주3-5회 정도 30분가량 걷길 추천합니다. 오늘 30분 가량 좋아하는 산책 경로로 한번 걸어보기', '{"items": [{"id": "w20-d2-cl-3", "label": "체중관리 및 심혈관 건강을 위해 주3-5회 정도 30분가량 걷길 추천합니다. 오늘 30분 가량 좋아하는 산책 경로로 한번 걸어보기"}]}'::jsonb, 3, true),
    (3, 'w20-d3-cl-1', '오늘 하루, 물 컵을 눈에 보이는 자리에 두고 마실 때마다 체크해 보기.', '오늘 하루, 물 컵을 눈에 보이는 자리에 두고 마실 때마다 체크해 보기.', '{"items": [{"id": "w20-d3-cl-1", "label": "오늘 하루, 물 컵을 눈에 보이는 자리에 두고 마실 때마다 체크해 보기."}]}'::jsonb, 1, true),
    (3, 'w20-d3-cl-2', '식단에 통곡물(현미, 통밀빵), 과일, 채소를 한 가지씩이라도 더 추가해 보기.', '식단에 통곡물(현미, 통밀빵), 과일, 채소를 한 가지씩이라도 더 추가해 보기.', '{"items": [{"id": "w20-d3-cl-2", "label": "식단에 통곡물(현미, 통밀빵), 과일, 채소를 한 가지씩이라도 더 추가해 보기."}]}'::jsonb, 2, true),
    (3, 'w20-d3-cl-3', '변비가 계속된다면, 의료진과 상담할 메모용으로 “배변 간격과 불편했던 점”을 간단히 기록해 두기.', '변비가 계속된다면, 의료진과 상담할 메모용으로 “배변 간격과 불편했던 점”을 간단히 기록해 두기.', '{"items": [{"id": "w20-d3-cl-3", "label": "변비가 계속된다면, 의료진과 상담할 메모용으로 “배변 간격과 불편했던 점”을 간단히 기록해 두기."}]}'::jsonb, 3, true),
    (4, 'w20-d4-cl-1', '샤워 후 물기가 마르기 전에 배·가슴·허벅지 뒤쪽에 크림이나 보습제를 부드럽게 발라주기.', '샤워 후 물기가 마르기 전에 배·가슴·허벅지 뒤쪽에 크림이나 보습제를 부드럽게 발라주기.', '{"items": [{"id": "w20-d4-cl-1", "label": "샤워 후 물기가 마르기 전에 배·가슴·허벅지 뒤쪽에 크림이나 보습제를 부드럽게 발라주기."}]}'::jsonb, 1, true),
    (4, 'w20-d4-cl-2', '너무 뜨거운 물보다는 미지근한 물로 샤워해서 피부 자극을 줄여 보기.', '너무 뜨거운 물보다는 미지근한 물로 샤워해서 피부 자극을 줄여 보기.', '{"items": [{"id": "w20-d4-cl-2", "label": "너무 뜨거운 물보다는 미지근한 물로 샤워해서 피부 자극을 줄여 보기."}]}'::jsonb, 2, true),
    (4, 'w20-d4-cl-3', '거울 앞에서 배에 생긴 선과 변화를 보며, “이건 아기를 맞이하러 가는 나의 흔적”이라고 한 번 따뜻하게 불러주기.', '거울 앞에서 배에 생긴 선과 변화를 보며, “이건 아기를 맞이하러 가는 나의 흔적”이라고 한 번 따뜻하게 불러주기.', '{"items": [{"id": "w20-d4-cl-3", "label": "거울 앞에서 배에 생긴 선과 변화를 보며, “이건 아기를 맞이하러 가는 나의 흔적”이라고 한 번 따뜻하게 불러주기."}]}'::jsonb, 3, true),
    (5, 'w20-d5-cl-1', '자기 전, 종아리·허벅지 뒤를 부드럽게 스트레칭하고, 발목을 천천히 돌려준 뒤 잠자리에 들기.', '자기 전, 종아리·허벅지 뒤를 부드럽게 스트레칭하고, 발목을 천천히 돌려준 뒤 잠자리에 들기.', '{"items": [{"id": "w20-d5-cl-1", "label": "자기 전, 종아리·허벅지 뒤를 부드럽게 스트레칭하고, 발목을 천천히 돌려준 뒤 잠자리에 들기."}]}'::jsonb, 1, true),
    (5, 'w20-d5-cl-2', '낮 동안 10–15분 정도라도 가볍게 걷기나 스트레칭을 해서 혈액 순환을 도와주기.', '낮 동안 10–15분 정도라도 가볍게 걷기나 스트레칭을 해서 혈액 순환을 도와주기.', '{"items": [{"id": "w20-d5-cl-2", "label": "낮 동안 10–15분 정도라도 가볍게 걷기나 스트레칭을 해서 혈액 순환을 도와주기."}]}'::jsonb, 2, true),
    (5, 'w20-d5-cl-3', '허리가 아플 땐 한 번에 오래 서 있지 말고, 서 있는 시간과 앉아서 쉬는 시간을 번갈아 주기.', '허리가 아플 땐 한 번에 오래 서 있지 말고, 서 있는 시간과 앉아서 쉬는 시간을 번갈아 주기.', '{"items": [{"id": "w20-d5-cl-3", "label": "허리가 아플 땐 한 번에 오래 서 있지 말고, 서 있는 시간과 앉아서 쉬는 시간을 번갈아 주기."}]}'::jsonb, 3, true),
    (6, 'w20-d6-cl-1', '정밀 초음파나 추가 검사에 대해 궁금한 점·걱정되는 부분을 오늘 한 번 메모해두고, 진료 시 의료진에게 직접 질문해 보기.', '정밀 초음파나 추가 검사에 대해 궁금한 점·걱정되는 부분을 오늘 한 번 메모해두고, 진료 시 의료진에게 직접 질문해 보기.', '{"items": [{"id": "w20-d6-cl-1", "label": "정밀 초음파나 추가 검사에 대해 궁금한 점·걱정되는 부분을 오늘 한 번 메모해두고, 진료 시 의료진에게 직접 질문해 보기."}]}'::jsonb, 1, true),
    (6, 'w20-d6-cl-2', '백일해 예방접종(또는 다른 필요한 예방접종)에 대한 안내를 다시 확인하고, 일정이 필요하다면 오늘 중으로 예약하기.', '백일해 예방접종(또는 다른 필요한 예방접종)에 대한 안내를 다시 확인하고, 일정이 필요하다면 오늘 중으로 예약하기.', '{"items": [{"id": "w20-d6-cl-2", "label": "백일해 예방접종(또는 다른 필요한 예방접종)에 대한 안내를 다시 확인하고, 일정이 필요하다면 오늘 중으로 예약하기."}]}'::jsonb, 2, true),
    (6, 'w20-d6-cl-3', '초음파 사진을 받는다면, 가장 마음에 드는 한 장을 골라 임신기 중반을 보내며 아기에게 하고 싶은 말을 적어 보관해 두기.', '초음파 사진을 받는다면, 가장 마음에 드는 한 장을 골라 임신기 중반을 보내며 아기에게 하고 싶은 말을 적어 보관해 두기.', '{"items": [{"id": "w20-d6-cl-3", "label": "초음파 사진을 받는다면, 가장 마음에 드는 한 장을 골라 임신기 중반을 보내며 아기에게 하고 싶은 말을 적어 보관해 두기."}]}'::jsonb, 3, true),
    (7, 'w20-d7-cl-1', '오늘 하루는 특별히“축하하는 날”로 정하고, 작은 디저트나 산책, 좋아하는 음악 등 나를 위한 선물을 하나 준비해 보기.', '오늘 하루는 특별히“축하하는 날”로 정하고, 작은 디저트나 산책, 좋아하는 음악 등 나를 위한 선물을 하나 준비해 보기.', '{"items": [{"id": "w20-d7-cl-1", "label": "오늘 하루는 특별히“축하하는 날”로 정하고, 작은 디저트나 산책, 좋아하는 음악 등 나를 위한 선물을 하나 준비해 보기."}]}'::jsonb, 1, true),
    (7, 'w20-d7-cl-2', '지난 20주 동안의 몸·마음 변화를 떠올리며, “나는 이런 순간들을 잘 버텼다”라고 느끼는 장면 3가지를 떠올려 써보기.', '지난 20주 동안의 몸·마음 변화를 떠올리며, “나는 이런 순간들을 잘 버텼다”라고 느끼는 장면 3가지를 떠올려 써보기.', '{"items": [{"id": "w20-d7-cl-2", "label": "지난 20주 동안의 몸·마음 변화를 떠올리며, “나는 이런 순간들을 잘 버텼다”라고 느끼는 장면 3가지를 떠올려 써보기."}]}'::jsonb, 2, true),
    (7, 'w20-d7-cl-3', '앞으로의 20주 동안 가장 중요하게 지키고 싶은 것(예: 충분한 휴식, 검사 일정, 나만의 시간, 파트너와의 대화)을 1–2가지 정해 적어두기.', '앞으로의 20주 동안 가장 중요하게 지키고 싶은 것(예: 충분한 휴식, 검사 일정, 나만의 시간, 파트너와의 대화)을 1–2가지 정해 적어두기.', '{"items": [{"id": "w20-d7-cl-3", "label": "앞으로의 20주 동안 가장 중요하게 지키고 싶은 것(예: 충분한 휴식, 검사 일정, 나만의 시간, 파트너와의 대화)을 1–2가지 정해 적어두기."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 20)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w20-d1-q-1', '“20주 전, 즉 임신하기 전의 내 사진을 보며 지금과 모습을 비교해보세요. 가장 바뀐 겉모습과 마음가짐 어떤 것인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w20-d1-q-2', '“20주 전과 지금의 나는 겉모습과 마음가짐이 많이 바뀌었겠지만, 변하지 않은 것도 존재하나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w20-d2-q-1', '“내가 처음 태동을 느꼈을 때 떠올랐던 생각이나 감정은 무엇이었나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w20-d2-q-2', '“아기의 작은 움직임이 나에게 알려주는 ‘지금 여기’의 메시지는 무엇일까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w20-d3-q-1', '“아기와 함께 나누고 싶은 ‘우리 가족만의 음식’은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w20-d3-q-2', '“아기에게 그 음식에 대한 맛과 함께 그 음식과 관련된 어떤 기억이나 추억을 들려주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w20-d4-q-1', '“내 몸에 새로 생긴 선과 흔적들을 내가 어떻게 바라보고 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w20-d4-q-2', '“몸이 남긴 이 기록과 관련하여, 언젠가 아이에게 어떤 이야기를 들려줄 수 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w20-d5-q-1', '“내 몸의 통증과 피곤함을 ‘신호’라고 본다면, 지금 내 몸은 어떤 도움을 요청하고 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w20-d5-q-2', '“오늘 내 몸이 수고한 부분을 하나 떠올리고, 그 부분에게 어떤 말을 건네주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w20-d6-q-1', '“지금까지의 20주 여정에서 가장 견디기 어려웠던 기억이 있나요?, 그 경험을 어떻게 이겨냈는지 들려주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w20-d6-q-2', '“지금까지의 20주 여정에서, ‘정말 잘 해냈다’고 스스로에게 꼭 말해주고 싶은 순간은 언제인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w20-d7-q-1', '“아직은 330g정도인 우리 아기는 20주가 지나면 10배의 몸무게가 될 거에요. 예상되는 어려움은 어떤게 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w20-d7-q-2', '“앞으로 남은 20주의 여정 중 예상되는 설렘도 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 21 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  21,
  '21주차 발달 정보',
  '오늘 아기는 머리부터 발끝까지 약 27.4–28cm 정도, 망고 정도 크기로 자랐고, 몸무게는 약 390g, 이제는 태반보다 더 무겁게 성장한 시기예요. 피부는 아직 얇고 주름져서 혈관이 비쳐 붉게 보이지만, 그 안에서는 표피와 진피가 뚜렷이 나뉘고, 피하 지방이 차곡차곡 쌓일 준비를 하고 있어요.',
  '21주는 임신 후반기의 시작, 몸도 마음도 ‘절반’을 본격적으로 맞이하는 시기예요. 자궁은 배꼽을 지나 위쪽으로 올라와 있고, 겉으로 봐도 임신한 배가 확실히 드러나 ‘이제 정말 임산부 배구나’ 하는 실감이 더 커져요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '21주 1일차',
  '{"items": ["오늘 아기는 머리부터 발끝까지 약 27.4–28cm 정도, 망고 정도 크기로 자랐고, 몸무게는 약 390g, 이제는 태반보다 더 무겁게 성장한 시기예요.", "피부는 아직 얇고 주름져서 혈관이 비쳐 붉게 보이지만, 그 안에서는 표피와 진피가 뚜렷이 나뉘고, 피하 지방이 차곡차곡 쌓일 준비를 하고 있어요."]}'::jsonb,
  '{"items": ["21주는 임신 후반기의 시작, 몸도 마음도 ‘절반’을 본격적으로 맞이하는 시기예요.", "자궁은 배꼽을 지나 위쪽으로 올라와 있고, 겉으로 봐도 임신한 배가 확실히 드러나 ‘이제 정말 임산부 배구나’ 하는 실감이 더 커져요.", "지금까지 대략 4.5–6.5kg 정도 체중이 늘어 있을 수 있고, 앞으로는 주당 약 0.5kg 내외로 조금씩 더해질 수 있어요."]}'::jsonb,
  '아가는 이제 태반보다 더 무거운 작은 사람이 되었어요. 절반의 시간만큼, 아가도 많이 자랐지요?',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 21
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '21주 2일차',
  '{"items": ["아기의 온몸은 복숭아 표면 같은 솜털로 덮여 있는데, 이 부드러운 털은 체온을 일정하게 유지하게 도와줄 뿐 아니라, 아기가 움직일 때 미세한 진동을 만들어 성장 자극을 준다고 여겨져요.", "피지선에서 분비되는 하얗고 왁스 같은 태지가 피부를 덮으면서, 양수 속에서 피부를 유연하게 지키는 보호막 역할을 해요."]}'::jsonb,
  '{"items": ["배와 가슴 피부가 빠르게 늘어나면서, 당김·건조함·가려움이 더 두드러질 수 있어요.", "이때 피부 표면 아래 작은 찢어짐이 생기며 튼살이 나타나기 시작하는데, 임신선(흑선)처럼 사라지는 선이 아니라, 옅어지더라도 어느 정도 흔적이 남는 ‘몸의 기록’이 되기도 해요.", "얼굴에는 기미나 ‘임신의 가면’이 보일 수 있고, 피부가 더 기름지거나 여드름이 잘 나는 느낌을 받을 수도 있어요."]}'::jsonb,
  '아가는 나만의 작은 코트를 입고 있어요. 솜털과 태지가 아가를 포근히 감싸 주듯, 엄마 마음도 언제나 아가를 감싸주고 있다는 걸 느껴요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 21
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '21주 3일차',
  '{"items": ["아기의 입 안에는 어른보다 더 많은 미뢰 봉우리가 있어, 엄마가 먹는 음식에 따라 살짝 달라지는 양수의 맛을 민감하게 느끼기 시작해요.", "엄마가 다양한 음식을 먹을수록 양수의 맛도 미세하게 변해, 아기가 뱃속에서 여러 가지 맛에 노출될 수 있고, 이는 출생 후 식습관에도 영향을 줄 수 있는 것으로 여겨져요.)"]}'::jsonb,
  '{"items": ["자궁이 위와 장을 눌러 소화가 느려지고, 변비·복부팽만·가스가 더욱 쉽게 생길 수 있어요.", "위가 눌리고 식도 괄약근이 느슨해져 속쓰림·소화불량을 경험하는 경우도 많고, 무엇을 먹느냐에 따라 증상이 달라질 수 있어요."]}'::jsonb,
  '엄마가 먹는 음식의 작은 맛 변화는 아가에겐 첫 번째 ‘세상 수업’이에요. 오늘은 어떤 맛과 소리를 나누고 싶나요?',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 21
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '21주 4일차',
  '{"items": ["그동안 간과 비장이 맡아오던 적혈구 생성 역할을, 이제 새로 발달한 골수가 점차 넘겨받기 시작하는 시기예요.", "아기의 적혈구 속 헤모글로빈은 태반을 통해 들어온 산소를 온몸에 전달하고, 사용 후 생긴 이산화탄소를 다시 태반으로 실어 보내 엄마 쪽으로 배출하게 돼요."]}'::jsonb,
  '{"items": ["혈액량과 심장 부담이 늘어나면서, 숨이 더 쉽게 차고, 더 쉽게 피곤해질 수 있어요.", "임신 중에는 철분 요구량과 마그네슘 필요량이 증가해, 부족할 경우 피로감·무기력감, 다리 경련이 더 잘 나타날 수 있어요."]}'::jsonb,
  '아가의 뼛속에서도 조용히 일이 시작되었어요. 보이지 않는 곳에서, 엄마에게서 온 산소를 나눠 받고 또 돌려 보내며, 아가만의 리듬을 만들어가고 있어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 21
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '21주 5일차',
  '{"items": ["21주차의 중요한 발달 중 하나는 두개골의 능선(머리뼈 봉합 부위의 융기)이 형성되는 것으로, 우리 문화권에서 ‘숨구멍’이라고 부르는 부위가 출생 후까지 유연하게 열려 있어, 분만 시 머리가 잘 맞추어 지나갈 수 있게 해줘요.", "여자 아기라면 이미 자궁이 형성되어 있고, 평생 사용할 난자들이 난소 안에서 만들어진 상태예요.남자 아기라면 고환이 형성되었지만 아직 복부 안에 머물러 있고, 앞으로 몇 주~몇 달 동안 서서히 음낭으로 내려오게 됩니다."]}'::jsonb,
  '{"items": ["배가 더 커지면서 허리·골반 통증, 아랫배 당김, 묵직한 느낌이 잦아질 수 있어요.", "피부 속 작은 찢어짐으로 생기는 튼살은 점차 눈에 띄게 될 수 있고, 반지·속옷·팔찌 등이 점점 더 꽉 끼는 느낌을 줄 수 있어요."]}'::jsonb,
  '아가는 벌써 나만의 방식으로 아주 먼 날까지 이어질 성별의 씨앗을 품고 자라나고 있답니다.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 21
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '21주 6일차',
  '{"items": ["21주 아기는 발로 차고, 몸을 회전하고, 잡고·빨기 동작을 하며 매우 활발하게 움직이는 시기예요.", "배를 손바닥으로 아주 부드럽게 눌렀다가 떼면, 안에서 살짝 밀어내는 듯한 반응이 느껴질 수 있는데, 이는 태아의 반사와 조정된 움직임이 발달하고 있다는 신호예요."]}'::jsonb,
  '{"items": ["배가 더 앞으로 나오고 관절이 느슨해지면서, 무게 중심이 바뀌어균형 잡기 어려운 느낌이 생길 수 있어요.", "다리의 정맥에는 자궁이 주는 압력과 호르몬 영향이 더해져 정맥류·부종이 나타나기 쉬운 시기라, 다리에 피로와 무거움을 느끼기 쉽습니다."]}'::jsonb,
  '엄마가 조심스럽게 톡 두드리면, 아가도 안에서 살짝 톡 대답해요. 아직은 작은 반사에 가깝지만, 이건 분명 엄마와 아가만 아는 비밀스러운 대화예요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 21
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '21주 7일차',
  '{"items": ["연구에 따르면, 태아의 신경계는 적어도 임신 24–25주 이전까지는 통증을 경험할 만큼 발달하지 않은 상태로 여겨져요.", "오늘도 아기는 하루 12–14시간 정도를 자는 것으로 추정되고, 깨어 있는 시간엔 움직이고, 태동으로 엄마에게 자신의 존재를 꾸준히 알려주고 있어요."]}'::jsonb,
  '{"items": ["배는 더 단단하고 묵직하게 느껴지고, 밤에는 아기가 깨어 움직이는 패턴 때문에 깊은 잠을 자기가 어려울 수 있어요.", "허리·골반 통증, 다리 경련, 부종, 속쓰림·변비·가려움 등 여러 증상이 동시에 존재할 수 있어, “조금만 움직여도 힘들다”는 생각이 드는 날도 늘어날 수 있어요."]}'::jsonb,
  '아가는 아직 ‘아프다’는 감각을 다 알지는 못하지만, 엄마가 아가를 지키기 위해 얼마나 조심스럽게 하루하루를 보내는지는 느낄 수 있어요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 21
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 21)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w21-d1-cl-1', '거울 앞에서 오늘의 배 모양을 한 번 바라보며, “이만큼 커진 건 우리 둘이 함께 걸어온 시간의 기록이야”라고 마음속으로 말해보기.', '거울 앞에서 오늘의 배 모양을 한 번 바라보며, “이만큼 커진 건 우리 둘이 함께 걸어온 시간의 기록이야”라고 마음속으로 말해보기.', '{"items": [{"id": "w21-d1-cl-1", "label": "거울 앞에서 오늘의 배 모양을 한 번 바라보며, “이만큼 커진 건 우리 둘이 함께 걸어온 시간의 기록이야”라고 마음속으로 말해보기."}]}'::jsonb, 1, true),
    (1, 'w21-d1-cl-2', '진찰 때 배꼽 위로 올라온 자궁을 의사와 함께 확인하고, 궁금한 점(크기·체중 증가 등)을 편하게 물어보기.', '진찰 때 배꼽 위로 올라온 자궁을 의사와 함께 확인하고, 궁금한 점(크기·체중 증가 등)을 편하게 물어보기.', '{"items": [{"id": "w21-d1-cl-2", "label": "진찰 때 배꼽 위로 올라온 자궁을 의사와 함께 확인하고, 궁금한 점(크기·체중 증가 등)을 편하게 물어보기."}]}'::jsonb, 2, true),
    (1, 'w21-d1-cl-3', '오늘 하루 식사 중 한 끼는 채소·단백질·통곡물을 고루 담아, “태반보다 더 무거워진 너에게 보내는 축하 식사”라고 생각하며 천천히 맛보기.', '오늘 하루 식사 중 한 끼는 채소·단백질·통곡물을 고루 담아, “태반보다 더 무거워진 너에게 보내는 축하 식사”라고 생각하며 천천히 맛보기.', '{"items": [{"id": "w21-d1-cl-3", "label": "오늘 하루 식사 중 한 끼는 채소·단백질·통곡물을 고루 담아, “태반보다 더 무거워진 너에게 보내는 축하 식사”라고 생각하며 천천히 맛보기."}]}'::jsonb, 3, true),
    (2, 'w21-d2-cl-1', '샤워 후 물기가 마르기 전에 배·가슴·허벅지·엉덩이에 임신 안전한 보습제나 오일을 충분히 발라, 당김과 가려움을 미리 달래주기.', '샤워 후 물기가 마르기 전에 배·가슴·허벅지·엉덩이에 임신 안전한 보습제나 오일을 충분히 발라, 당김과 가려움을 미리 달래주기.', '{"items": [{"id": "w21-d2-cl-1", "label": "샤워 후 물기가 마르기 전에 배·가슴·허벅지·엉덩이에 임신 안전한 보습제나 오일을 충분히 발라, 당김과 가려움을 미리 달래주기."}]}'::jsonb, 1, true),
    (2, 'w21-d2-cl-2', '거울에 비친 튼살과 임신선을 보고 “이건 내가 너를 품고 있었던 시간의 무늬야”라고 마음속으로 한 번 불러주기.', '거울에 비친 튼살과 임신선을 보고 “이건 내가 너를 품고 있었던 시간의 무늬야”라고 마음속으로 한 번 불러주기.', '{"items": [{"id": "w21-d2-cl-2", "label": "거울에 비친 튼살과 임신선을 보고 “이건 내가 너를 품고 있었던 시간의 무늬야”라고 마음속으로 한 번 불러주기."}]}'::jsonb, 2, true),
    (2, 'w21-d2-cl-3', '햇볕이 강한 날엔 모자나 자외선 차단제를 챙겨 피부톤 변화를 완화하고, 나에게 편안한 수준에서 피부를 돌보는 루틴을 만들어 보기.', '햇볕이 강한 날엔 모자나 자외선 차단제를 챙겨 피부톤 변화를 완화하고, 나에게 편안한 수준에서 피부를 돌보는 루틴을 만들어 보기.', '{"items": [{"id": "w21-d2-cl-3", "label": "햇볕이 강한 날엔 모자나 자외선 차단제를 챙겨 피부톤 변화를 완화하고, 나에게 편안한 수준에서 피부를 돌보는 루틴을 만들어 보기."}]}'::jsonb, 3, true),
    (3, 'w21-d3-cl-1', '오늘 하루, 물병을 가까이 두고 작게 자주 마시기를 실천해 보기.', '오늘 하루, 물병을 가까이 두고 작게 자주 마시기를 실천해 보기.', '{"items": [{"id": "w21-d3-cl-1", "label": "오늘 하루, 물병을 가까이 두고 작게 자주 마시기를 실천해 보기."}]}'::jsonb, 1, true),
    (3, 'w21-d3-cl-2', '하루 식단에 과일·채소·통곡물(현미, 통밀빵 등)을 한 가지씩 추가하고, 가스를 많이 유발하는 음식(마늘, 양파, 콩 등)에 대한 나만의 반응을 관찰해 보기.', '하루 식단에 과일·채소·통곡물(현미, 통밀빵 등)을 한 가지씩 추가하고, 가스를 많이 유발하는 음식(마늘, 양파, 콩 등)에 대한 나만의 반응을 관찰해 보기.', '{"items": [{"id": "w21-d3-cl-2", "label": "하루 식단에 과일·채소·통곡물(현미, 통밀빵 등)을 한 가지씩 추가하고, 가스를 많이 유발하는 음식(마늘, 양파, 콩 등)에 대한 나만의 반응을 관찰해 보기."}]}'::jsonb, 2, true),
    (3, 'w21-d3-cl-3', '속쓰림이나 소화불량이 반복된다면, ‘무엇을 먹었을 때 더 불편했는지’ 간단한 음식 일기에 기록해 두기.', '속쓰림이나 소화불량이 반복된다면, ‘무엇을 먹었을 때 더 불편했는지’ 간단한 음식 일기에 기록해 두기.', '{"items": [{"id": "w21-d3-cl-3", "label": "속쓰림이나 소화불량이 반복된다면, ‘무엇을 먹었을 때 더 불편했는지’ 간단한 음식 일기에 기록해 두기."}]}'::jsonb, 3, true),
    (4, 'w21-d4-cl-1', '철분이 풍부한 음식(충분히 익힌 살코기, 녹색 잎채소, 렌틸콩, 철분 강화 우유, 달걀, 말린 과일 등)을 오늘 식단에 한 가지 이상 넣어 보기.', '철분이 풍부한 음식(충분히 익힌 살코기, 녹색 잎채소, 렌틸콩, 철분 강화 우유, 달걀, 말린 과일 등)을 오늘 식단에 한 가지 이상 넣어 보기.', '{"items": [{"id": "w21-d4-cl-1", "label": "철분이 풍부한 음식(충분히 익힌 살코기, 녹색 잎채소, 렌틸콩, 철분 강화 우유, 달걀, 말린 과일 등)을 오늘 식단에 한 가지 이상 넣어 보기."}]}'::jsonb, 1, true),
    (4, 'w21-d4-cl-2', '다리 경련이 있다면 자기 전 종아리를 부드럽게 스트레칭하고, 마그네슘이 풍부한 음식(녹색 잎채소, 등푸른 생선 등)을 조금씩 자주 섭취해 보기.', '다리 경련이 있다면 자기 전 종아리를 부드럽게 스트레칭하고, 마그네슘이 풍부한 음식(녹색 잎채소, 등푸른 생선 등)을 조금씩 자주 섭취해 보기.', '{"items": [{"id": "w21-d4-cl-2", "label": "다리 경련이 있다면 자기 전 종아리를 부드럽게 스트레칭하고, 마그네슘이 풍부한 음식(녹색 잎채소, 등푸른 생선 등)을 조금씩 자주 섭취해 보기."}]}'::jsonb, 2, true),
    (4, 'w21-d4-cl-3', '빈혈이나 심한 피로감이 걱정된다면, 다음 진료에서 혈액검사·철분제 복용에 대해 의료진과 사전에 메모해둔 질문을 나눠 보기.', '빈혈이나 심한 피로감이 걱정된다면, 다음 진료에서 혈액검사·철분제 복용에 대해 의료진과 사전에 메모해둔 질문을 나눠 보기.', '{"items": [{"id": "w21-d4-cl-3", "label": "빈혈이나 심한 피로감이 걱정된다면, 다음 진료에서 혈액검사·철분제 복용에 대해 의료진과 사전에 메모해둔 질문을 나눠 보기."}]}'::jsonb, 3, true),
    (5, 'w21-d5-cl-1', '손가락이 붓거나 반지가 조금이라도 꽉 낀다면, 지금 미리 빼서 목걸이에 걸거나 보관함에 두기.', '손가락이 붓거나 반지가 조금이라도 꽉 낀다면, 지금 미리 빼서 목걸이에 걸거나 보관함에 두기.', '{"items": [{"id": "w21-d5-cl-1", "label": "손가락이 붓거나 반지가 조금이라도 꽉 낀다면, 지금 미리 빼서 목걸이에 걸거나 보관함에 두기."}]}'::jsonb, 1, true),
    (5, 'w21-d5-cl-2', '오늘 시간 여유가 된다면, 아기 이름·성별 파티·기념하고 싶은 방식에 대해 파트너와 가볍게 이야기 나눠 보기(지금이 성별 공개 파티를 준비하기 좋은 시기예요).', '오늘 시간 여유가 된다면, 아기 이름·성별 파티·기념하고 싶은 방식에 대해 파트너와 가볍게 이야기 나눠 보기(지금이 성별 공개 파티를 준비하기 좋은 시기예요).', '{"items": [{"id": "w21-d5-cl-2", "label": "오늘 시간 여유가 된다면, 아기 이름·성별 파티·기념하고 싶은 방식에 대해 파트너와 가볍게 이야기 나눠 보기(지금이 성별 공개 파티를 준비하기 좋은 시기예요)."}]}'::jsonb, 2, true),
    (5, 'w21-d5-cl-3', '허리와 골반이 아프다면, 무거운 물건 들기는 잠시 내려놓고, 따뜻한 찜질·가벼운 스트레스으로 몸을 달래주는 시간을 가져 보기.', '허리와 골반이 아프다면, 무거운 물건 들기는 잠시 내려놓고, 따뜻한 찜질·가벼운 스트레스으로 몸을 달래주는 시간을 가져 보기.', '{"items": [{"id": "w21-d5-cl-3", "label": "허리와 골반이 아프다면, 무거운 물건 들기는 잠시 내려놓고, 따뜻한 찜질·가벼운 스트레스으로 몸을 달래주는 시간을 가져 보기."}]}'::jsonb, 3, true),
    (6, 'w21-d6-cl-1', '미끄러운 바닥·높은 곳(의자나 사다리 등)·넘어질 위험이 있는 환경은 최대한 피하고, 굽이 낮고 안정적인 신발을 선택하기.', '미끄러운 바닥·높은 곳(의자나 사다리 등)·넘어질 위험이 있는 환경은 최대한 피하고, 굽이 낮고 안정적인 신발을 선택하기.', '{"items": [{"id": "w21-d6-cl-1", "label": "미끄러운 바닥·높은 곳(의자나 사다리 등)·넘어질 위험이 있는 환경은 최대한 피하고, 굽이 낮고 안정적인 신발을 선택하기."}]}'::jsonb, 1, true),
    (6, 'w21-d6-cl-2', '다리가 자주 붓거나 정맥이 도드라져 보인다면, 의료진과 상의 후 압박스타킹 착용을 고려해 보기. 이는 다리 혈류를 도와 정맥류·부종을 줄이는 데 도움이 될 수 있어요.', '다리가 자주 붓거나 정맥이 도드라져 보인다면, 의료진과 상의 후 압박스타킹 착용을 고려해 보기. 이는 다리 혈류를 도와 정맥류·부종을 줄이는 데 도움이 될 수 있어요.', '{"items": [{"id": "w21-d6-cl-2", "label": "다리가 자주 붓거나 정맥이 도드라져 보인다면, 의료진과 상의 후 압박스타킹 착용을 고려해 보기. 이는 다리 혈류를 도와 정맥류·부종을 줄이는 데 도움이 될 수 있어요."}]}'::jsonb, 2, true),
    (6, 'w21-d6-cl-3', '오늘은 배 위에 손을 살짝 얹고, 너무 세게 누르지 않는 선에서 아기의 태명을 부르며 인사한 후, 아기에게서 돌아오는 작은 느낌이 있는지 천천히 느껴보기.', '오늘은 배 위에 손을 살짝 얹고, 너무 세게 누르지 않는 선에서 아기의 태명을 부르며 인사한 후, 아기에게서 돌아오는 작은 느낌이 있는지 천천히 느껴보기.', '{"items": [{"id": "w21-d6-cl-3", "label": "오늘은 배 위에 손을 살짝 얹고, 너무 세게 누르지 않는 선에서 아기의 태명을 부르며 인사한 후, 아기에게서 돌아오는 작은 느낌이 있는지 천천히 느껴보기."}]}'::jsonb, 3, true),
    (7, 'w21-d7-cl-1', '오늘 하루만큼은, 내가 참아온 몸의 불편감을 하나 골라“이건 그냥 견디는 게 아니라, 돌봐줘야 하는 신호”라고 인정해주기.', '오늘 하루만큼은, 내가 참아온 몸의 불편감을 하나 골라“이건 그냥 견디는 게 아니라, 돌봐줘야 하는 신호”라고 인정해주기.', '{"items": [{"id": "w21-d7-cl-1", "label": "오늘 하루만큼은, 내가 참아온 몸의 불편감을 하나 골라“이건 그냥 견디는 게 아니라, 돌봐줘야 하는 신호”라고 인정해주기."}]}'::jsonb, 1, true),
    (7, 'w21-d7-cl-2', '출산 때 남편에게 어떤 정서적·신체적 지지가 필요할지, 어떤 모습이면 좋을지 상상해 보기.', '출산 때 남편에게 어떤 정서적·신체적 지지가 필요할지, 어떤 모습이면 좋을지 상상해 보기.', '{"items": [{"id": "w21-d7-cl-2", "label": "출산 때 남편에게 어떤 정서적·신체적 지지가 필요할지, 어떤 모습이면 좋을지 상상해 보기."}]}'::jsonb, 2, true),
    (7, 'w21-d7-cl-3', '21주차를 지나며 느껴온 태동·피로·기쁨·불안들을 짧은 일기나 메모로 정리해, “이 시기의 나와 아기의 기록”을 남겨두기.', '21주차를 지나며 느껴온 태동·피로·기쁨·불안들을 짧은 일기나 메모로 정리해, “이 시기의 나와 아기의 기록”을 남겨두기.', '{"items": [{"id": "w21-d7-cl-3", "label": "21주차를 지나며 느껴온 태동·피로·기쁨·불안들을 짧은 일기나 메모로 정리해, “이 시기의 나와 아기의 기록”을 남겨두기."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 21)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w21-d1-q-1', '“내 몸이 눈에 띄게 변하기 시작한 이 시점, 나는 어떤 면에서 더 ‘엄마’가 되어 가고 있다고 느끼나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w21-d1-q-2', '“앞으로 이어질 임신에서, 가장 지키고 싶은 나의 가치나 태도는 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w21-d2-q-1', '“내 몸에 새로 생기는 무늬와 선들을, 오늘 나는 어떤 시선으로 바라보고 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w21-d2-q-2', '“이 무늬들을 나중에 아이에게 보여주게 된다면, 어떤 이야기를 들려주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w21-d3-q-1', '“앞으로 아기와 함께 나눌 우리집 대표 ‘집밥 메뉴’는 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w21-d3-q-2', '“요즘 먹은 음식들 중, 아기에게 ‘이 맛을 꼭 전해주고 싶다’고 느낀 건 무엇이었나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w21-d4-q-1', '“내 몸 안에서 피가 더 많이 흐르며, 아이에게 산소와 영양을 보내고 있다는 사실을 떠올리면 어떤 기분이 드나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w21-d4-q-2', '“오늘 내가 나와 아기의 ‘에너지 탱크’를 채워주기 위해 할 수 있는 작은 선택은 무엇일까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w21-d5-q-1', '“우리 아기의 성별을 공개할 방법에 대해 고민해보았나요? 재밌는 방법들에 대해 검토해보세요!”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w21-d5-q-2', '“내가 아이에게 꼭 전해주고 싶은 ‘몸에 대한 태도’는 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w21-d6-q-1', '“내가 요즘 가장 불편한 ‘나의 몸 신호’는 무엇인가요? (피로, 붓기 등)”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w21-d6-q-2', '“배에 손을 얹고 인사할 때, 내가 엄마가 되고 있다는 걸 실감하나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w21-d7-q-1', '“내가 아기를 지키기 위해 요즘 더 조심스러워진 부분(몸·생활·마음)은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w21-d7-q-2', '“오늘의 나에게, 그리고 21주차 아기에게, 꼭 해주고 싶은 한 문장은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 22 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  22,
  '22주차 발달 정보',
  '22주 태아는 머리부터 발끝까지 약 28cm, 출생 시 예상 키의 절반 정도에 이르렀고, 몸무게는 약 430–475g 정도로 자란 상태예요. 평균 길이는 고구마 크기에요.',
  '자궁은 이제 배꼽 위 약 1인치 정도까지 올라와 있어서, 옷차림에 따라 확실한 아기 배로 보이기도 하고, 넉넉한 옷을 입으면 살짝 감춰지기도 해요. 기저부 높이는 평균적으로 약 20–24cm 정도로 측정되고, 매 진찰 때 이 수치를 보며 아기의 성장과 자궁 크기를 함께 확인해요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '22주 1일차',
  '{"items": ["22주 태아는 머리부터 발끝까지 약 28cm, 출생 시 예상 키의 절반 정도에 이르렀고, 몸무게는 약 430–475g 정도로 자란 상태예요.", "평균 길이는 고구마 크기에요.", "이제부터는 키가 크는 속도보다 체중이 늘어나는 속도가 더 빨라지기 시작해, 앞으로 지방이 차오르며 체중이 훌쩍 늘어날 준비를 하고 있어요."]}'::jsonb,
  '{"items": ["자궁은 이제 배꼽 위 약 1인치 정도까지 올라와 있어서, 옷차림에 따라 확실한 아기 배로 보이기도 하고, 넉넉한 옷을 입으면 살짝 감춰지기도 해요.", "기저부 높이는 평균적으로 약 20–24cm 정도로 측정되고, 매 진찰 때 이 수치를 보며 아기의 성장과 자궁 크기를 함께 확인해요.", "22주쯤에는 하루 약 300kcal 정도를 추가로 섭취하면서, 주당 약 0.5kg 정도의 느리고 꾸준한 체중 증가를 권장하는 경우가 많아요."]}'::jsonb,
  '아가는 지금 고구마만 한 작은 사람이에요. 키는 어느 정도 만들어졌고, 이제부터는 엄마가 보내주는 영양으로 포동포동 살을 찌워볼게요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 22
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '22주 2일차',
  '{"items": ["22주 아기는 이제 신생아 모습과 거의 비슷한 얼굴과 몸 형태를 가지고 있지만, 아직 피하지방이 부족해서 피부에 주름이 많고 마른 편이에요. 앞으로 지방이 늘어나 점점 통통하고 포동포동한 아기다운 모습이 될 예정이에요.", "머리에는 얇은 아기 머리카락이 보이기 시작했고, 눈썹과 속눈썹도 어느 정도 자라 있지만, 색소가 덜 들어가서 부드럽고 옅은 솜털처럼 보일 수 있어요."]}'::jsonb,
  '{"items": ["배·허벅지·가슴 피부가 빠르게 늘어나면서, 미세한 찢어짐이 생겨 보이는 튼살이 더욱 눈에 띄기 시작할 수 있어요. 출산 후 옅어지긴 하지만 완전히 사라지지 않는 경우가 많아서, 일종의 “임신의 흔적”으로 남기도 해요.", "배 가운데의 임신선이 더 진해 보일 수 있고, 얼굴에는 ‘임신의 가면(기미)’과 어두운 갈색 반점이 생기거나, 피부가 더 기름지고 여드름이 쉽게 날 수도 있어요."]}'::jsonb,
  '아가는 지금 신생아랑 거의 비슷하게 생겼지만, 아직은 조금 말라 있고 주름도 많아요. 그래도 엄마가 천천히 채워줄 살과 온기를 기다리는 중이랍니다.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 22
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '22주 3일차',
  '{"items": ["22주 아기는 엄마 몸 안의 심장 박동·호흡·장 소리뿐 아니라, 자궁 밖에서 들려오는 소리·리듬·멜로디에 점점 더 민감하게 반응해요.", "특히 엄마의 목소리는 태아가 가장 선명하게 들을 수 있는 소리라서, 지금 엄마가 들려주는 말과 노래가 나중에 태어난 뒤 아기를 달랠 때 큰 힘이 될 수 있다는 연구 결과도 있어요."]}'::jsonb,
  '{"items": ["임신 2분기라고 해도 피로와 수면 문제는 계속될 수 있고, 배가 커지고 아기가 밤에 활발히 움직이면서 자주 깨거나, 누운 자세가 불편해지기도 해요.", "몸 안 혈액량과 대사량이 증가하면서 더 덥고, 뜨거운 느낌·땀 증가·어지러움이 쉽게 나타날 수 있어요."]}'::jsonb,
  '아가는 요즘 엄마 목소리와 노랫소리를 조용히 마음에 저장하고 있어요. 나중에 세상이 낯설고 무서울 때, 오늘의 이 목소리가 아가를 다시 진정시켜 줄 거예요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 22
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '22주 4일차',
  '{"items": ["태아의 미각이 발달하면서, 엄마가 먹는 음식에 따라 양수의 맛이 달라지고, 아기는 양수를 삼키며 다양한 맛 자극을 경험해요.", "엄마가 신선한 과일·채소와 건강한 식단을 먹을수록, 아기는 긍정적인 맛 경험을 하게 되고, 이는 나중에 아기가 어떤 음식을 잘 받아들이는지에도 영향을 줄 수 있다고 알려져 있어요."]}'::jsonb,
  '{"items": ["임신 22주에는 자궁이 장을 압박하고, 호르몬이 장운동을 느리게 만들어 변비가 매우 흔하게 나타나요.", "속쓰림·소화불량 또한 자주 동반되고, 특히 맵고 기름진 음식·튀김·탄산·카페인 등이 증상을 악화시킬 수 있어요."]}'::jsonb,
  '엄마가 오늘 먹은 과일 한 조각, 따뜻한 국 한 숟가락도 아가에겐 세상의 맛이에요. 엄마가 사랑으로 고른 음식들이 아가의 ‘좋아하는 맛 리스트’를 만들어 줄지도 몰라요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 22
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '22주 5일차',
  '{"items": ["22주에는 양수의 양이 충분히 많아져 아기가 손발을 자유롭게 움직이고, 몸의 방향을 자주 바꾸며, 온 공간을 누비듯 움직이고 있어요.", "이제는 임산부가 배 위에 손을 얹으면, 엄마뿐 아니라 다른 사람들도 태동을 느낄 수 있을 정도로 아기의 움직임이 힘차고 분명해진 시기예요."]}'::jsonb,
  '{"items": ["체액 증가와 자궁의 압박으로 발·발목·다리 부종이 흔하게 나타나고, 하반신 혈액순환이 원활하지 않으면 다리가 무겁고 욱신거리는 느낌이 들 수 있어요.", "밤에 누워 있을 때 다리 경련(쥐)이 자주 생길 수 있고, 체중 증가·부종·전해질 불균형이 함께 원인이 되기도 해요."]}'::jsonb,
  '아가는 지금 양수 속에서 자유롭게 이리저리 헤엄치고 있어요. 엄마가 배를 쓰다듬으면, 아가도 안에서 ‘나 여기 있어요’ 하고 힘차게 대답해 보고 싶어져요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 22
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '22주 6일차',
  '{"items": ["아기의 잇몸 아래에서는 첫 번째 젖니(유치)가 서서히 만들어지기 시작했어요. 이 젖니들은 생후 6–9개월쯤 잇몸 위로 올라오게 되고, 그 뒤를 이을 영구치의 기반도 이미 만들어지는 중이에요.", "아기는 엄마의 혈류에서 항체를 전달받으며 면역 체계를 만들어 가고 있고, 이는 출생 후 감염을 이겨내는 힘이 되어줘요."]}'::jsonb,
  '{"items": ["유방은 임신 후기와 출산 후 모유 수유를 준비하면서 더 커지고 묵직해지며, 피부가 늘어나 불편감을 느낄 수 있어요.", "유륜 주변의 작은 돌기인 몽고메리 분비선이 더 도드라져 보이는데, 나중에 유분을 분비해 유두·유륜을 보호하고, 항균·윤활 역할을 하는 중요한 부분이에요.", "유선으로 가는 혈류가 증가하면서 피부 아래 푸른 정맥이 더 뚜렷하게 보일 수 있는데, 이는 수유를 위한 준비 과정으로 자연스러운 변화예요."]}'::jsonb,
  '아가의 잇몸 아래에서는 벌써 첫 이들이 자라고 있어요. 지금은 잘 보이지 않지만, 언젠가 지금 만들고 있는 이 젖니를 보여줄 날이 올 거예요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 22
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '22주 7일차',
  '{"items": ["22주 아기는 양수를 마시고 오줌을 누며, 양수 순환과 장·신장 기능 발달에 참여하고 있고, 양수 속에서 팔·다리·귀·얼굴을 만지며 촉각과 협응력을 키워가요.", "엄마의 목소리·음악·생활 소리에 반응하며 움직임이 달라질 수 있어, 이 시기는 엄마의 소리와 행동에 따라 아기가 반응하는 걸 느끼기 좋은 태교의 때이기도 해요."]}'::jsonb,
  '{"items": ["손과 손목이 붓기 쉬워 손목터널증후군이 생기기 쉬운데, 특히 컴퓨터 작업·스마트폰 사용 등 손목을 반복적으로 쓰면 저림·찌릿함·감각둔화가 심해질 수 있어요.", "에스트로겐과 프로게스테론이 여전히 높은 상태라 감정기복이 심해지고, 몸의 불편함·수면 부족·소화 문제까지 겹치면“몸도 마음도 버거운 느낌”이 드는 날이 많아질 수 있어요."]}'::jsonb,
  '엄마가 웃을 때, 숨을 고를 때, 부드럽게 쓰다듬을 때, 아가는 양수 속에서 작은 움직임으로 대답하고 있어요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 22
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 22)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w22-d1-cl-1', '오늘 배꼽 위까지 올라온 배를 한 번 만져보며, “여기까지 올라온 건 우리 둘이 함께 쌓아온 시간의 높이야”라고 마음속으로 말해보기.', '오늘 배꼽 위까지 올라온 배를 한 번 만져보며, “여기까지 올라온 건 우리 둘이 함께 쌓아온 시간의 높이야”라고 마음속으로 말해보기.', '{"items": [{"id": "w22-d1-cl-1", "label": "오늘 배꼽 위까지 올라온 배를 한 번 만져보며, “여기까지 올라온 건 우리 둘이 함께 쌓아온 시간의 높이야”라고 마음속으로 말해보기."}]}'::jsonb, 1, true),
    (1, 'w22-d1-cl-2', '진찰 때 기저부 높이와 체중 증가를 함께 기록해 두고, “나는 지금 건강하게 자라고 있는 중”이라는 사실을 눈으로 확인해 보기.', '진찰 때 기저부 높이와 체중 증가를 함께 기록해 두고, “나는 지금 건강하게 자라고 있는 중”이라는 사실을 눈으로 확인해 보기.', '{"items": [{"id": "w22-d1-cl-2", "label": "진찰 때 기저부 높이와 체중 증가를 함께 기록해 두고, “나는 지금 건강하게 자라고 있는 중”이라는 사실을 눈으로 확인해 보기."}]}'::jsonb, 2, true),
    (1, 'w22-d1-cl-3', '한 끼 식사를 준비할 때, “이건 키가 아닌 체중을 채워주는 시간”이라 생각하며, 탄수화물·단백질·지방을 균형 있게 담아보기.', '한 끼 식사를 준비할 때, “이건 키가 아닌 체중을 채워주는 시간”이라 생각하며, 탄수화물·단백질·지방을 균형 있게 담아보기.', '{"items": [{"id": "w22-d1-cl-3", "label": "한 끼 식사를 준비할 때, “이건 키가 아닌 체중을 채워주는 시간”이라 생각하며, 탄수화물·단백질·지방을 균형 있게 담아보기."}]}'::jsonb, 3, true),
    (2, 'w22-d2-cl-1', '샤워 후 3분 이내에 배·가슴·엉덩이·허벅지에 보습제나 바디오일을 충분히 발라, 당김과 가려움을 줄여주고, “이건 나와 아기를 위한 매일의 의식이야”라고 생각해 보기.', '샤워 후 3분 이내에 배·가슴·엉덩이·허벅지에 보습제나 바디오일을 충분히 발라, 당김과 가려움을 줄여주고, “이건 나와 아기를 위한 매일의 의식이야”라고 생각해 보기.', '{"items": [{"id": "w22-d2-cl-1", "label": "샤워 후 3분 이내에 배·가슴·엉덩이·허벅지에 보습제나 바디오일을 충분히 발라, 당김과 가려움을 줄여주고, “이건 나와 아기를 위한 매일의 의식이야”라고 생각해 보기."}]}'::jsonb, 1, true),
    (2, 'w22-d2-cl-2', '거울에 비친 튼살과 임신선을 보며, “이건 내가 널 품었다는 가장 솔직한 기록이야”라고 한 번만, 따뜻하게 바라봐 주기.', '거울에 비친 튼살과 임신선을 보며, “이건 내가 널 품었다는 가장 솔직한 기록이야”라고 한 번만, 따뜻하게 바라봐 주기.', '{"items": [{"id": "w22-d2-cl-2", "label": "거울에 비친 튼살과 임신선을 보며, “이건 내가 널 품었다는 가장 솔직한 기록이야”라고 한 번만, 따뜻하게 바라봐 주기."}]}'::jsonb, 2, true),
    (2, 'w22-d2-cl-3', '햇볕이 강한 날에는 모자·자외선 차단제를 챙겨, 기미와 피부 자극을 조금이라도 줄이는 작은 보호 루틴 만들어 보기.', '햇볕이 강한 날에는 모자·자외선 차단제를 챙겨, 기미와 피부 자극을 조금이라도 줄이는 작은 보호 루틴 만들어 보기.', '{"items": [{"id": "w22-d2-cl-3", "label": "햇볕이 강한 날에는 모자·자외선 차단제를 챙겨, 기미와 피부 자극을 조금이라도 줄이는 작은 보호 루틴 만들어 보기."}]}'::jsonb, 3, true),
    (3, 'w22-d3-cl-1', '잠들기 전, 오늘 하루 있었던 일을 아기에게 일기 쓰듯 말로 들려주기:', '잠들기 전, 오늘 하루 있었던 일을 아기에게 일기 쓰듯 말로 들려주기:', '{"items": [{"id": "w22-d3-cl-1", "label": "잠들기 전, 오늘 하루 있었던 일을 아기에게 일기 쓰듯 말로 들려주기:"}]}'::jsonb, 1, true),
    (3, 'w22-d3-cl-2', '“오늘 엄마는 ~~ 하루를 보냈어…”', '“오늘 엄마는 ~~ 하루를 보냈어…”', '{"items": [{"id": "w22-d3-cl-2", "label": "“오늘 엄마는 ~~ 하루를 보냈어…”"}]}'::jsonb, 2, true),
    (3, 'w22-d3-cl-3', '수면이 불편하다면 옆으로 누워 다리 사이·배 아래·허리 뒤에 베개를 받쳐 지지해 보고, 자신에게 가장 편안한 베개 조합을 찾아보기.', '수면이 불편하다면 옆으로 누워 다리 사이·배 아래·허리 뒤에 베개를 받쳐 지지해 보고, 자신에게 가장 편안한 베개 조합을 찾아보기.', '{"items": [{"id": "w22-d3-cl-3", "label": "수면이 불편하다면 옆으로 누워 다리 사이·배 아래·허리 뒤에 베개를 받쳐 지지해 보고, 자신에게 가장 편안한 베개 조합을 찾아보기."}]}'::jsonb, 3, true),
    (3, 'w22-d3-cl-4', '내 마음이 편안해지는 음악을 하나 골라, 너무 크지 않은 볼륨으로 틀어두고, 배를 쓰다듬으며 함께 듣는 시간을 가져보기(꼭 클래식일 필요는 없어요).', '내 마음이 편안해지는 음악을 하나 골라, 너무 크지 않은 볼륨으로 틀어두고, 배를 쓰다듬으며 함께 듣는 시간을 가져보기(꼭 클래식일 필요는 없어요).', '{"items": [{"id": "w22-d3-cl-4", "label": "내 마음이 편안해지는 음악을 하나 골라, 너무 크지 않은 볼륨으로 틀어두고, 배를 쓰다듬으며 함께 듣는 시간을 가져보기(꼭 클래식일 필요는 없어요)."}]}'::jsonb, 4, true),
    (4, 'w22-d4-cl-1', '오늘 식단에 섬유질이 풍부한 음식(과일, 채소, 통곡물, 콩류)을 한 가지씩 꼭 넣어 보기.', '오늘 식단에 섬유질이 풍부한 음식(과일, 채소, 통곡물, 콩류)을 한 가지씩 꼭 넣어 보기.', '{"items": [{"id": "w22-d4-cl-1", "label": "오늘 식단에 섬유질이 풍부한 음식(과일, 채소, 통곡물, 콩류)을 한 가지씩 꼭 넣어 보기."}]}'::jsonb, 1, true),
    (4, 'w22-d4-cl-2', '변비가 있다면 물을 조금씩 자주 마시고, “하루에 한 번은 가볍게 걷기”를 목표로 정해서 장운동을 부드럽게 도와주기.', '변비가 있다면 물을 조금씩 자주 마시고, “하루에 한 번은 가볍게 걷기”를 목표로 정해서 장운동을 부드럽게 도와주기.', '{"items": [{"id": "w22-d4-cl-2", "label": "변비가 있다면 물을 조금씩 자주 마시고, “하루에 한 번은 가볍게 걷기”를 목표로 정해서 장운동을 부드럽게 도와주기."}]}'::jsonb, 2, true),
    (4, 'w22-d4-cl-3', '속쓰림이 심한 날에는, 어떤 음식을 먹고 더 불편했는지 간단히 메모해 보고, 성가신 음식들을 한동안 줄여보는 작은 실험을 해보기.', '속쓰림이 심한 날에는, 어떤 음식을 먹고 더 불편했는지 간단히 메모해 보고, 성가신 음식들을 한동안 줄여보는 작은 실험을 해보기.', '{"items": [{"id": "w22-d4-cl-3", "label": "속쓰림이 심한 날에는, 어떤 음식을 먹고 더 불편했는지 간단히 메모해 보고, 성가신 음식들을 한동안 줄여보는 작은 실험을 해보기."}]}'::jsonb, 3, true),
    (5, 'w22-d5-cl-1', '파트너나 가족에게 배 위에 손을 살짝 올려 달라고 부탁하고, 함께 느껴지는 태동에 “지금 이 순간, 우리 셋(또는 우리 가족 전체)이 연결되어 있구나”를 느껴보기.', '파트너나 가족에게 배 위에 손을 살짝 올려 달라고 부탁하고, 함께 느껴지는 태동에 “지금 이 순간, 우리 셋(또는 우리 가족 전체)이 연결되어 있구나”를 느껴보기.', '{"items": [{"id": "w22-d5-cl-1", "label": "파트너나 가족에게 배 위에 손을 살짝 올려 달라고 부탁하고, 함께 느껴지는 태동에 “지금 이 순간, 우리 셋(또는 우리 가족 전체)이 연결되어 있구나”를 느껴보기."}]}'::jsonb, 1, true),
    (5, 'w22-d5-cl-2', '다리가 붓거나 무거울 때는, 다리를 심장보다 높게 올린 상태로 10–15분 쉬어 주며, 발목 돌리기·까치발 들기 같은 작은 움직임도 함께 해보기.', '다리가 붓거나 무거울 때는, 다리를 심장보다 높게 올린 상태로 10–15분 쉬어 주며, 발목 돌리기·까치발 들기 같은 작은 움직임도 함께 해보기.', '{"items": [{"id": "w22-d5-cl-2", "label": "다리가 붓거나 무거울 때는, 다리를 심장보다 높게 올린 상태로 10–15분 쉬어 주며, 발목 돌리기·까치발 들기 같은 작은 움직임도 함께 해보기."}]}'::jsonb, 2, true),
    (5, 'w22-d5-cl-3', '잠들기 전 종아리 스트레칭과 따뜻한 샤워 혹은 족욕을 하고, 칼슘·칼륨·마그네슘이 포함된 간식(따뜻한 우유, 바나나 등)을 가볍게 먹어보는 습관 들이기.', '잠들기 전 종아리 스트레칭과 따뜻한 샤워 혹은 족욕을 하고, 칼슘·칼륨·마그네슘이 포함된 간식(따뜻한 우유, 바나나 등)을 가볍게 먹어보는 습관 들이기.', '{"items": [{"id": "w22-d5-cl-3", "label": "잠들기 전 종아리 스트레칭과 따뜻한 샤워 혹은 족욕을 하고, 칼슘·칼륨·마그네슘이 포함된 간식(따뜻한 우유, 바나나 등)을 가볍게 먹어보는 습관 들이기."}]}'::jsonb, 3, true),
    (6, 'w22-d6-cl-1', '오늘 하루 동안 브래지어 착용감을 살펴보고, 너무 조이거나 불편하지 않은지 점검해 보기. 필요하다면 임산부용·수유용 브래지어로 교체 고려하기.', '오늘 하루 동안 브래지어 착용감을 살펴보고, 너무 조이거나 불편하지 않은지 점검해 보기. 필요하다면 임산부용·수유용 브래지어로 교체 고려하기.', '{"items": [{"id": "w22-d6-cl-1", "label": "오늘 하루 동안 브래지어 착용감을 살펴보고, 너무 조이거나 불편하지 않은지 점검해 보기. 필요하다면 임산부용·수유용 브래지어로 교체 고려하기."}]}'::jsonb, 1, true),
    (6, 'w22-d6-cl-2', '샤워 후, 타월로 유두를 과하게 문지르기보다 부드럽게 눌러 닦고, 몽고메리 분비선에서 분비물이 나올 경우에는 굳이 닦아내지 말고 보호막 역할을 하도록 두기.', '샤워 후, 타월로 유두를 과하게 문지르기보다 부드럽게 눌러 닦고, 몽고메리 분비선에서 분비물이 나올 경우에는 굳이 닦아내지 말고 보호막 역할을 하도록 두기.', '{"items": [{"id": "w22-d6-cl-2", "label": "샤워 후, 타월로 유두를 과하게 문지르기보다 부드럽게 눌러 닦고, 몽고메리 분비선에서 분비물이 나올 경우에는 굳이 닦아내지 말고 보호막 역할을 하도록 두기."}]}'::jsonb, 2, true),
    (6, 'w22-d6-cl-3', '가슴·어깨·승모근의 뻐근함을 풀어주기 위해, 가벼운 스트레칭이나 온찜질하기.', '가슴·어깨·승모근의 뻐근함을 풀어주기 위해, 가벼운 스트레칭이나 온찜질하기.', '{"items": [{"id": "w22-d6-cl-3", "label": "가슴·어깨·승모근의 뻐근함을 풀어주기 위해, 가벼운 스트레칭이나 온찜질하기."}]}'::jsonb, 3, true),
    (7, 'w22-d7-cl-1', '손목이 저리거나 아프다면, 작업 중간중간 손·손목 스트레칭을 하고, 손목을 과하게 구부리는 자세(키보드·핸드폰 각도 등)를 잠깐씩이라도 교정해 보기.', '손목이 저리거나 아프다면, 작업 중간중간 손·손목 스트레칭을 하고, 손목을 과하게 구부리는 자세(키보드·핸드폰 각도 등)를 잠깐씩이라도 교정해 보기.', '{"items": [{"id": "w22-d7-cl-1", "label": "손목이 저리거나 아프다면, 작업 중간중간 손·손목 스트레칭을 하고, 손목을 과하게 구부리는 자세(키보드·핸드폰 각도 등)를 잠깐씩이라도 교정해 보기."}]}'::jsonb, 1, true),
    (7, 'w22-d7-cl-2', '“힘들다”는 마음이 들 때마다 ‘정말 잘하고 있어.’를 속으로 덧붙여 주기.', '“힘들다”는 마음이 들 때마다 ‘정말 잘하고 있어.’를 속으로 덧붙여 주기.', '{"items": [{"id": "w22-d7-cl-2", "label": "“힘들다”는 마음이 들 때마다 ‘정말 잘하고 있어.’를 속으로 덧붙여 주기."}]}'::jsonb, 2, true),
    (7, 'w22-d7-cl-3', '출산 준비 수업·온라인 강의 ·출산 사진 촬영 등, 앞으로의 시간을 더 알차게 해 줄 것 같은 것들을 하나 골라, 정보를 찾아보거나 메모장에 정리해 보기.', '출산 준비 수업·온라인 강의 ·출산 사진 촬영 등, 앞으로의 시간을 더 알차게 해 줄 것 같은 것들을 하나 골라, 정보를 찾아보거나 메모장에 정리해 보기.', '{"items": [{"id": "w22-d7-cl-3", "label": "출산 준비 수업·온라인 강의 ·출산 사진 촬영 등, 앞으로의 시간을 더 알차게 해 줄 것 같은 것들을 하나 골라, 정보를 찾아보거나 메모장에 정리해 보기."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 22)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w22-d1-q-1', '“내 몸이 키워낸 이 28cm의 작은 사람을 떠올리면, 가장 먼저 드는 감정은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w22-d1-q-2', '“앞으로 체중이 빠르게 늘어날 아기를 위해, 오늘 내가 해 줄 수 있는 작은 한 가지는 무엇일까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w22-d2-q-1', '“내 몸에 남을지도 모르는 이 작은 선과 무늬들을, 나중에 어떻게 기억하고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w22-d2-q-2', '“아기가 태어난 뒤, 이 무늬들을 보여주며 들려주고 싶은 이야기 한 가지를 떠올려 본다면 무엇일까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w22-d3-q-1', '“지금 아기에게 가장 자주 들려주고 싶은 나의 목소리는 어떤 톤과 어떤 말일까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w22-d3-q-2', '“어른이 된 아이가 ‘엄마의 목소리’를 떠올릴 때, 나는 어떤 느낌으로 기억되었으면 하나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w22-d4-q-1', '“아기와 함께 나눌 ‘우리 집의 건강 메뉴’는 어떤 메뉴 일까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w22-d4-q-2', '“지금 내 식단 중에서, 아기에게 꼭 물려주고 싶은 식습관이 있다면 말해볼까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w22-d5-q-1', '“오늘 내가 느낀 태동 중 가장 인상 깊었던 순간은 언제였나요? 그때 나는 어떤 활동을 하고 있었나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w22-d5-q-2', '“다른 사람이 내 배 위에서 아기의 움직임을 느낀다면 나는 어떤 감정이 드나요? (뭉클함, 쑥스러움, 실감, 두려움 등)”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w22-d6-q-1', '“뱃속의 아이를 위해 내 몸 모두 준비하고 있는 것을 느끼나요? 나는 내 가슴과 상반신을 어떤 마음으로 바라보고 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w22-d6-q-2', '“내가 아이를 안고 먹이는 장면을 상상해 본다면, 그 시간의 나는 어떤 표정·자세·마음을 가진 엄마일까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w22-d7-q-1', '“요즘 나를 가장 지치게 만드는 건 무엇인가요? 그 안에서 내가 ‘내 편이 되어줄 수 있는 부분’은 어디인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w22-d7-q-2', '“나를 품었던 나의 엄마도 이런 어려움을 겪었다고 생각하면, 나는 그때의 엄마에게 어떤 말을 들려주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 23 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  23,
  '23주차 발달 정보',
  '임신 23주 태아는 머리부터 발끝까지 약 12.0–12.1인치(약 30cm 안팎)로, 자몽 크기 정도에 해당하고, 몸무게는 약 30cm (약 450–650g) 정도로 자랐어요. 22주 때 “이제부터는 살을 붙일 준비를 하고 있다”고 했는데, 23주에 들어서면서는 정말로 키보다 ‘무게’가 더 빠르게 늘어나는 시기로, 앞으로 지방이 빠르게 축적되며 점점 더 통통하고 아기다운 모습이 되어갑니다.',
  '자궁저 높이가 치골에서 자궁 상단까지 약 20–25cm 정도로 측정되며, 이는 점점 커지는 아기와 양수, 태반의 크기를 그대로 반영해요. 자궁의 무게는 약 1.5kg 정도까지 늘어나 있고, 임신 전보다 대략 5–6kg 정도 체중이 증가해 있을 수 있으며, 한 주에 약 250–300g 정도씩 꾸준히 늘어나는 경우가 많습니다.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '23주 1일차',
  '{"items": ["임신 23주 태아는 머리부터 발끝까지 약 12.0–12.1인치(약 30cm 안팎)로, 자몽 크기 정도에 해당하고, 몸무게는 약 30cm (약 450–650g) 정도로 자랐어요.", "22주 때 “이제부터는 살을 붙일 준비를 하고 있다”고 했는데, 23주에 들어서면서는 정말로 키보다 ‘무게’가 더 빠르게 늘어나는 시기로, 앞으로 지방이 빠르게 축적되며 점점 더 통통하고 아기다운 모습이 되어갑니다."]}'::jsonb,
  '{"items": ["자궁저 높이가 치골에서 자궁 상단까지 약 20–25cm 정도로 측정되며, 이는 점점 커지는 아기와 양수, 태반의 크기를 그대로 반영해요.", "자궁의 무게는 약 1.5kg 정도까지 늘어나 있고, 임신 전보다 대략 5–6kg 정도 체중이 증가해 있을 수 있으며, 한 주에 약 250–300g 정도씩 꾸준히 늘어나는 경우가 많습니다.", "커진 자궁과 혈액량 증가는 골반 속 정맥을 압박해 허벅지·종아리·외음부 주변에 정맥류가 생기기 쉬운 상태를 만들고, 푸르고 꼬불꼬불한 혈관이 도드라져 보일 수 있어요."]}'::jsonb,
  '아가는 지난주보다 더 무거운 작은 자몽이 되었어요. 이번 주에도 열심히 살을 찌워볼게요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 23
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '23주 2일차',
  '{"items": ["23주에는 태아의 뇌 신경세포가 빠르게 성장하고 인지 기능이 활발해지면서, 엄마의 감정 상태에 따라 움직임이 달라지는 모습이 관찰된다고 알려져 있어요.", "이제 아기는 엄마 혈액 속의 음식 성분과 자극을 어느 정도 “구별”하는 단계에 있으며, 미각과 후각, 뇌 발달이 함께 이루어지면서 엄마가 어떤 하루를 보냈는지, 몸의 리듬과 감정의 파동을 몸으로 느끼고 있는 중입니다."]}'::jsonb,
  '{"items": ["‘임신 뇌(브레인 포그)’라고 불리는 건망증·집중력 저하는 수면 부족·호르몬 변화·스트레스 등이 복합적으로 작용해 나타나는 증상으로, “왜 이렇게 깜빡깜빡하지?” 느끼는 것 자체가 아주 흔한 경험이에요.", "에스트로겐·프로게스테론과 신체 변화가 겹치면서, 행복·설렘과 동시에 두려움·불안·짜증·눈물이 뒤섞인 복잡한 감정을 느끼는 것도 자연스러운 과정입니다."]}'::jsonb,
  '엄마가 숨을 고르고 웃으면, 아가도 양수 속에서 살짝 힘을 빼고 흔들리며 같이 쉬어요. 엄마의 하루가 곧 아가의 하루예요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 23
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '23주 3일차',
  '{"items": ["23주 아기는 엄마가 먹는 음식에 따라 달라지는 양수의 맛을 느끼며, 하루 약 400mL 정도의 양수를 마시고 삼키는 연습을 하는 것으로 추정돼요.", "아기의 소화관에서는 실제 음식 대신 양수가 지나가지만, 연동운동(소화관이 파도처럼 수축·이완하며 내용을 밀어내는 운동)을 시작해 소화 시스템을 본격적으로 연습하고 있어요."]}'::jsonb,
  '{"items": ["자궁이 장을 눌러 복부 팽만·변비가 심해지기 쉽고, 그 결과 치질(치핵)이 생기거나 악화되기 좋은 시기예요.", "자궁이 위를 밀어 올리고, 식도 괄약근이 느슨해져 속쓰림·소화불량이 쉽게 생기며, 임신 중기 후반으로 갈수록 이런 증상은 더 잦아질 수 있어요."]}'::jsonb,
  '엄마가 오늘 먹은 음식들은 아가에게 작은 파도처럼 다가와요. 달콤함, 담백함, 따뜻함… 아가는 양수를 마시며 엄마의 식탁을 천천히 배워가는 중이에요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 23
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '23주 4일차',
  '{"items": ["지금까지 나비가 날갯짓하는 듯한 태동이 느껴졌다면, 23주 무렵부터는 부드러운 발차기·작은 잽·굴러가는 듯한 움직임으로 점점 더 힘 있고 분명한 태동이 느껴지기 쉬워요.", "이제는 배 위에서 아기의 움직임이 겉으로 보일 만큼 커져, 얇은 옷 위로도 ‘불룩’ 하는 미묘한 움직임이 보일 수 있어요."]}'::jsonb,
  '{"items": ["지면서 흉곽이 확장되고, 자궁이 위로 자라 횡격막과 폐를 눌러 갈비뼈 통증과 숨가쁨을 느끼기 쉬운 시기예요.", "골반뼈와 인대가 느슨해지고 척추에 부담이 커지면서 요통·골반 통증·다리 저림을 경험할 수 있고, 오래 서 있거나 많이 걸을수록 더 심해질 수 있어요."]}'::jsonb,
  '아가는 예전엔 나비처럼 살랑거렸다면, 이제는 조금 더 힘을 내서 톡톡, 쿵쿵 발로 인사하고 있어요. ‘나 여기 있어요’ 하고 알려주고 싶어져요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 23
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '23주 5일차',
  '{"items": ["23주 현재 자궁 안에는 약 0.5L 정도의 양수가 있고, 아기는 이 속에서 자유롭게 방향을 바꾸고 발로 차고 구부렸다 펴며, 더 다양한 자세로 공간을 활용하고 있어요.", "지금은 아직 아기가 움직이기 넉넉한 공간이 남아 있지만, 앞으로 아기가 더 커질수록 이 공간이 점점 좁아지고, 태동의 양상도 조금씩 달라질 수 있습니다."]}'::jsonb,
  '{"items": ["배 중앙에 세로로 나타나는 어두운 수직선, 흑선(임신선)이 더욱 또렷해질 수 있고, 이는 대부분의 임산부가 임신 중기 즈음 경험하는 흔한 변화예요.", "피부가 늘어나고 체액이 바뀌면서 배·가슴 피부가 건조하고 가렵거나 따끔거릴 수 있고, 얼굴에는 어두운 반점이나 기미가 생기며 피부가 더 기름져 보이기도 합니다."]}'::jsonb,
  '아가는 지금은 아직 양수 속에서 넓게 헤엄칠 수 있지만, 곧 더 통통해지면 이 집이 조금씩 작게 느껴질지도 몰라요. 그러니까 지금 이 자유로운 움직임을 같이 기억해 줘요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 23
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '23주 6일차',
  '{"items": ["폐가 여전히 미성숙하지만, 아기가 자궁 안에서 양수를 들이마시는 것처럼 가슴과 횡격막을 움직이며 호흡 연습을 하고 있어요.", "아직 위험하지만, 23주에 태어난 아기는 신생아 중환자실의 집중 치료를 통해 생존할 가능성이 조금씩 생기기 시작하는 주수로 여겨지며, 하루하루 엄마 뱃속에서 머무는 시간이 길어질수록 생존 확률과 후유증 감소 가능성이 더 높아집니다."]}'::jsonb,
  '{"items": ["유방의 정맥이 더 두드러져 보이고, 유륜은 점점 더 어두워지며, 유륜에 있는 작은 돌기(몽고메리 분비선)가 더 뚜렷해 보일 수 있어요.", "일부 임산부는 유방에서 약간의 초유(진하고 노란빛의 첫 우유)가 새어 나오는 경험을 하는데, 아기가 태어난 뒤 처음 먹게 되는 고단백·항체가 풍부한 소중한 우유예요."]}'::jsonb,
  '아가는 속에서 숨 쉬는 연습을 하며 ‘바깥 세상’에 갈 준비를 조금씩 하고 있어요. 아직은 너무 작아서 조금만 더, 엄마 몸 안에 머무를 수 있으면 좋겠어요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 23
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '23주 7일차',
  '{"items": ["이번 주 동안 아기는 자몽만 한 크기에서, 키는 조금씩·무게는 훨씬 빠르게 늘어나는 시기로 들어섰고, 지방이 급격히 축적되면서 더욱 통통하고 아기다운 모습에 가까워지고 있어요.", "뇌와 감각, 폐와 소화기관, 췌장까지 쉼 없이 연습과 성숙을 거듭하며, 엄마의 목소리·음악·생활 소리에 맞춰 움직임을 달리하고, 일정한 수면–각성 패턴을 가지기 시작하는 주수이기도 합니다."]}'::jsonb,
  '{"items": ["임신 전보다 체중이 5–6kg 정도 늘어 있을 수 있는 시점으로, 앞으로도 매주 약 250–300g씩 꾸준히 증가하는 것이 일반적이에요.", "보험·재정·보육 계획 같은 현실적인 고민이 함께 떠오르기 쉽고, 아기를 키우는 데 드는 비용과 삶의 변화에 대한 걱정으로 마음이 무거워지기도 합니다."]}'::jsonb,
  '아가는 살이 조금 더 붙고, 엄마 목소리와 감정에 맞춰 몸을 움직이는 연습을 많이 했어요. 나름의 분주한 하루를 보내고 있어요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 23
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 23)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w23-d1-cl-1', '오늘 거울 앞에서 배를 한 번 살펴보고, “이 높이는 지난 23주 동안 내가 아기랑 함께 쌓아 올린 시간과 노력의 높이야”라고 마음속으로 한 번 말해보기.', '오늘 거울 앞에서 배를 한 번 살펴보고, “이 높이는 지난 23주 동안 내가 아기랑 함께 쌓아 올린 시간과 노력의 높이야”라고 마음속으로 한 번 말해보기.', '{"items": [{"id": "w23-d1-cl-1", "label": "오늘 거울 앞에서 배를 한 번 살펴보고, “이 높이는 지난 23주 동안 내가 아기랑 함께 쌓아 올린 시간과 노력의 높이야”라고 마음속으로 한 번 말해보기."}]}'::jsonb, 1, true),
    (1, 'w23-d1-cl-2', '진찰 때마다 나의 체중 변화를 메모장이나 앱에 기록하고, 숫자를 보며 “내 몸과 아기가 계획대로 잘 자라고 있구나”를 확인해 보기.', '진찰 때마다 나의 체중 변화를 메모장이나 앱에 기록하고, 숫자를 보며 “내 몸과 아기가 계획대로 잘 자라고 있구나”를 확인해 보기.', '{"items": [{"id": "w23-d1-cl-2", "label": "진찰 때마다 나의 체중 변화를 메모장이나 앱에 기록하고, 숫자를 보며 “내 몸과 아기가 계획대로 잘 자라고 있구나”를 확인해 보기."}]}'::jsonb, 2, true),
    (1, 'w23-d1-cl-3', '다리·허벅지 혈관이 도드라져 보인다면, 하루 중 10–15분 정도는 다리를 심장보다 높게 올리고 쉬는 시간을 만들어, 정맥류와 붓기를 조금이나마 덜어주기.', '다리·허벅지 혈관이 도드라져 보인다면, 하루 중 10–15분 정도는 다리를 심장보다 높게 올리고 쉬는 시간을 만들어, 정맥류와 붓기를 조금이나마 덜어주기.', '{"items": [{"id": "w23-d1-cl-3", "label": "다리·허벅지 혈관이 도드라져 보인다면, 하루 중 10–15분 정도는 다리를 심장보다 높게 올리고 쉬는 시간을 만들어, 정맥류와 붓기를 조금이나마 덜어주기."}]}'::jsonb, 3, true),
    (1, 'w23-d1-cl-4', '“지난주 22주와 비교했을 때, 자몽만큼 자란 지금의 아기를 떠올리면 내 마음에 가장 먼저 떠오르는 감정은 무엇인가요?”', '“지난주 22주와 비교했을 때, 자몽만큼 자란 지금의 아기를 떠올리면 내 마음에 가장 먼저 떠오르는 감정은 무엇인가요?”', '{"items": [{"id": "w23-d1-cl-4", "label": "“지난주 22주와 비교했을 때, 자몽만큼 자란 지금의 아기를 떠올리면 내 마음에 가장 먼저 떠오르는 감정은 무엇인가요?”"}]}'::jsonb, 4, true),
    (1, 'w23-d1-cl-5', '“체중계 숫자를 볼 때 ‘아기와 자궁이 자라는 무게’라고 바라본다면 오늘 내 마음은 어떻게 달라질 수 있을까요?”', '“체중계 숫자를 볼 때 ‘아기와 자궁이 자라는 무게’라고 바라본다면 오늘 내 마음은 어떻게 달라질 수 있을까요?”', '{"items": [{"id": "w23-d1-cl-5", "label": "“체중계 숫자를 볼 때 ‘아기와 자궁이 자라는 무게’라고 바라본다면 오늘 내 마음은 어떻게 달라질 수 있을까요?”"}]}'::jsonb, 5, true),
    (2, 'w23-d2-cl-1', '아기와 함께 느끼고 있을 오늘 하루의 감정을 한 단어라도 메모장에 적어보기.', '아기와 함께 느끼고 있을 오늘 하루의 감정을 한 단어라도 메모장에 적어보기.', '{"items": [{"id": "w23-d2-cl-1", "label": "아기와 함께 느끼고 있을 오늘 하루의 감정을 한 단어라도 메모장에 적어보기."}]}'::jsonb, 1, true),
    (2, 'w23-d2-cl-2', '중요한 일을 자꾸 잊는 자신을 탓하기보다, 메모·알람·체크리스트를 적극적으로 도구로 삼아, “지금 임신 중이라서 더 많은 도움이 필요할 뿐이야”라고 다독여 보기.', '중요한 일을 자꾸 잊는 자신을 탓하기보다, 메모·알람·체크리스트를 적극적으로 도구로 삼아, “지금 임신 중이라서 더 많은 도움이 필요할 뿐이야”라고 다독여 보기.', '{"items": [{"id": "w23-d2-cl-2", "label": "중요한 일을 자꾸 잊는 자신을 탓하기보다, 메모·알람·체크리스트를 적극적으로 도구로 삼아, “지금 임신 중이라서 더 많은 도움이 필요할 뿐이야”라고 다독여 보기."}]}'::jsonb, 2, true),
    (2, 'w23-d2-cl-3', '오늘 내가 느꼈던 감정 중 가장 힘들었던 것 하나와 가장 고마웠던 것 하나를 떠올려, 아기에게 “엄마는 오늘 이런 하루를 보냈어”라고 조용히 이야기해 보기.', '오늘 내가 느꼈던 감정 중 가장 힘들었던 것 하나와 가장 고마웠던 것 하나를 떠올려, 아기에게 “엄마는 오늘 이런 하루를 보냈어”라고 조용히 이야기해 보기.', '{"items": [{"id": "w23-d2-cl-3", "label": "오늘 내가 느꼈던 감정 중 가장 힘들었던 것 하나와 가장 고마웠던 것 하나를 떠올려, 아기에게 “엄마는 오늘 이런 하루를 보냈어”라고 조용히 이야기해 보기."}]}'::jsonb, 3, true),
    (3, 'w23-d3-cl-1', '오늘 식단에 섬유질이 풍부한 과일·채소·통곡물·콩류를 한 가지 이상 꼭 넣어보고, 물도 작은 컵 기준으로 1–2잔 더 의식적으로 마셔 보기.', '오늘 식단에 섬유질이 풍부한 과일·채소·통곡물·콩류를 한 가지 이상 꼭 넣어보고, 물도 작은 컵 기준으로 1–2잔 더 의식적으로 마셔 보기.', '{"items": [{"id": "w23-d3-cl-1", "label": "오늘 식단에 섬유질이 풍부한 과일·채소·통곡물·콩류를 한 가지 이상 꼭 넣어보고, 물도 작은 컵 기준으로 1–2잔 더 의식적으로 마셔 보기."}]}'::jsonb, 1, true),
    (3, 'w23-d3-cl-2', '속쓰림이 있다면, 어떤 음식을 먹었을 때 더 심해지는지 간단한 “음식 일기”를 써 보고, 튀김·매운 음식·탄산·카페인·감귤류·기름진 음식의 빈도를 잠시 줄여보는 작은 실험을 해보기.', '속쓰림이 있다면, 어떤 음식을 먹었을 때 더 심해지는지 간단한 “음식 일기”를 써 보고, 튀김·매운 음식·탄산·카페인·감귤류·기름진 음식의 빈도를 잠시 줄여보는 작은 실험을 해보기.', '{"items": [{"id": "w23-d3-cl-2", "label": "속쓰림이 있다면, 어떤 음식을 먹었을 때 더 심해지는지 간단한 “음식 일기”를 써 보고, 튀김·매운 음식·탄산·카페인·감귤류·기름진 음식의 빈도를 잠시 줄여보는 작은 실험을 해보기."}]}'::jsonb, 2, true),
    (3, 'w23-d3-cl-3', '변비나 치질로 화장실이 두려운 날에는, 억지로 참지 말고 짧은 산책·배 마사지·따뜻한 물 한 잔으로 장을 천천히 깨워 준 뒤, 여유 있는 시간에 화장실을 가보는 루틴을 만들어 보기.', '변비나 치질로 화장실이 두려운 날에는, 억지로 참지 말고 짧은 산책·배 마사지·따뜻한 물 한 잔으로 장을 천천히 깨워 준 뒤, 여유 있는 시간에 화장실을 가보는 루틴을 만들어 보기.', '{"items": [{"id": "w23-d3-cl-3", "label": "변비나 치질로 화장실이 두려운 날에는, 억지로 참지 말고 짧은 산책·배 마사지·따뜻한 물 한 잔으로 장을 천천히 깨워 준 뒤, 여유 있는 시간에 화장실을 가보는 루틴을 만들어 보기."}]}'::jsonb, 3, true),
    (4, 'w23-d4-cl-1', '오늘은 가장 편한 수면자세를 찾아보는 날로 정하고, 옆으로 누워 다리 사이·배 아래·허리 뒤에 베개를 받쳐봤을 때 어디가 특히 편한지 몸의 반응을 느껴보기.', '오늘은 가장 편한 수면자세를 찾아보는 날로 정하고, 옆으로 누워 다리 사이·배 아래·허리 뒤에 베개를 받쳐봤을 때 어디가 특히 편한지 몸의 반응을 느껴보기.', '{"items": [{"id": "w23-d4-cl-1", "label": "오늘은 가장 편한 수면자세를 찾아보는 날로 정하고, 옆으로 누워 다리 사이·배 아래·허리 뒤에 베개를 받쳐봤을 때 어디가 특히 편한지 몸의 반응을 느껴보기."}]}'::jsonb, 1, true),
    (4, 'w23-d4-cl-2', '갈비뼈나 허리가 당길 때, 무조건 참기보다 5분만이라도 자세를 바꿔 앉거나 서서 가볍게 옆구리·허리 스트레칭 해주기.', '갈비뼈나 허리가 당길 때, 무조건 참기보다 5분만이라도 자세를 바꿔 앉거나 서서 가볍게 옆구리·허리 스트레칭 해주기.', '{"items": [{"id": "w23-d4-cl-2", "label": "갈비뼈나 허리가 당길 때, 무조건 참기보다 5분만이라도 자세를 바꿔 앉거나 서서 가볍게 옆구리·허리 스트레칭 해주기."}]}'::jsonb, 2, true),
    (4, 'w23-d4-cl-3', '오늘 하루 중 가장 크게 느껴진 태동 순간을 메모해 두고, 그때 무엇을 하고 있었는지·어떤 감정이었는지 함께 적어둬서 작은 ‘태동 일기’의 첫 페이지를 만들어 보기.', '오늘 하루 중 가장 크게 느껴진 태동 순간을 메모해 두고, 그때 무엇을 하고 있었는지·어떤 감정이었는지 함께 적어둬서 작은 ‘태동 일기’의 첫 페이지를 만들어 보기.', '{"items": [{"id": "w23-d4-cl-3", "label": "오늘 하루 중 가장 크게 느껴진 태동 순간을 메모해 두고, 그때 무엇을 하고 있었는지·어떤 감정이었는지 함께 적어둬서 작은 ‘태동 일기’의 첫 페이지를 만들어 보기."}]}'::jsonb, 3, true),
    (5, 'w23-d5-cl-1', '샤워 후 3분 이내에 배·가슴·엉덩이·허벅지에 무향의 보습제나 바디오일을 부드럽게 발라, 당김과 가려움을 줄여주기.', '샤워 후 3분 이내에 배·가슴·엉덩이·허벅지에 무향의 보습제나 바디오일을 부드럽게 발라, 당김과 가려움을 줄여주기.', '{"items": [{"id": "w23-d5-cl-1", "label": "샤워 후 3분 이내에 배·가슴·엉덩이·허벅지에 무향의 보습제나 바디오일을 부드럽게 발라, 당김과 가려움을 줄여주기."}]}'::jsonb, 1, true),
    (5, 'w23-d5-cl-2', '거울 속 흑선과 튼살을 보며, “이 선과 무늬는 내가 너를 품었던 시간을 내 몸이 기억하는 방식이야”라고 한 번만이라도 따뜻하게 바라봐 주기.', '거울 속 흑선과 튼살을 보며, “이 선과 무늬는 내가 너를 품었던 시간을 내 몸이 기억하는 방식이야”라고 한 번만이라도 따뜻하게 바라봐 주기.', '{"items": [{"id": "w23-d5-cl-2", "label": "거울 속 흑선과 튼살을 보며, “이 선과 무늬는 내가 너를 품었던 시간을 내 몸이 기억하는 방식이야”라고 한 번만이라도 따뜻하게 바라봐 주기."}]}'::jsonb, 2, true),
    (5, 'w23-d5-cl-3', '가려움이 심하거나 노란빛 피부·짙은 갈색 소양감이 동반된다면, “괜찮겠지” 하고 넘기지 말고 진료 예약 메모를 남겨, 간·피부질환 여부를 한 번 확인해 보기.', '가려움이 심하거나 노란빛 피부·짙은 갈색 소양감이 동반된다면, “괜찮겠지” 하고 넘기지 말고 진료 예약 메모를 남겨, 간·피부질환 여부를 한 번 확인해 보기.', '{"items": [{"id": "w23-d5-cl-3", "label": "가려움이 심하거나 노란빛 피부·짙은 갈색 소양감이 동반된다면, “괜찮겠지” 하고 넘기지 말고 진료 예약 메모를 남겨, 간·피부질환 여부를 한 번 확인해 보기."}]}'::jsonb, 3, true),
    (6, 'w23-d6-cl-1', '오늘 브래지어 착용감과 어깨·등의 무게감을 점검해 보고, 필요하다면 지지력이 좋은 임산부용·수유용 브래지어로 교체를 고민해 보기.', '오늘 브래지어 착용감과 어깨·등의 무게감을 점검해 보고, 필요하다면 지지력이 좋은 임산부용·수유용 브래지어로 교체를 고민해 보기.', '{"items": [{"id": "w23-d6-cl-1", "label": "오늘 브래지어 착용감과 어깨·등의 무게감을 점검해 보고, 필요하다면 지지력이 좋은 임산부용·수유용 브래지어로 교체를 고민해 보기."}]}'::jsonb, 1, true),
    (6, 'w23-d6-cl-2', '샤워 후에는 유두를 세게 문지르기보다 부드럽게 눌러 닦고, 몽고메리 분비선에서 나오는 분비물은 가능한 한 그대로 두어 보호막 역할을 하게 해주기.', '샤워 후에는 유두를 세게 문지르기보다 부드럽게 눌러 닦고, 몽고메리 분비선에서 나오는 분비물은 가능한 한 그대로 두어 보호막 역할을 하게 해주기.', '{"items": [{"id": "w23-d6-cl-2", "label": "샤워 후에는 유두를 세게 문지르기보다 부드럽게 눌러 닦고, 몽고메리 분비선에서 나오는 분비물은 가능한 한 그대로 두어 보호막 역할을 하게 해주기."}]}'::jsonb, 2, true),
    (6, 'w23-d6-cl-3', '“지금 내가 할 수 있는 건 내 몸을 잘 돌보고, 오늘 하루를 무사히 보내는 것”이라는 문장을 마음속에 한 번 천천히 되뇌어 보기.', '“지금 내가 할 수 있는 건 내 몸을 잘 돌보고, 오늘 하루를 무사히 보내는 것”이라는 문장을 마음속에 한 번 천천히 되뇌어 보기.', '{"items": [{"id": "w23-d6-cl-3", "label": "“지금 내가 할 수 있는 건 내 몸을 잘 돌보고, 오늘 하루를 무사히 보내는 것”이라는 문장을 마음속에 한 번 천천히 되뇌어 보기."}]}'::jsonb, 3, true),
    (7, 'w23-d7-cl-1', '오늘은 보험·재정·보육 준비 중 하나를 골라, 10–20분만이라도 정보를 찾아보고 메모해 보기.', '오늘은 보험·재정·보육 준비 중 하나를 골라, 10–20분만이라도 정보를 찾아보고 메모해 보기.', '{"items": [{"id": "w23-d7-cl-1", "label": "오늘은 보험·재정·보육 준비 중 하나를 골라, 10–20분만이라도 정보를 찾아보고 메모해 보기."}]}'::jsonb, 1, true),
    (7, 'w23-d7-cl-2', '“모든 걸 한 번에 다 결정해야 한다”는 부담 대신, 오늘 내가 할 수 있는 건 “질문을 하나 더 알아보는 것” 뿐이라고 스스로에게 허락해 주기.', '“모든 걸 한 번에 다 결정해야 한다”는 부담 대신, 오늘 내가 할 수 있는 건 “질문을 하나 더 알아보는 것” 뿐이라고 스스로에게 허락해 주기.', '{"items": [{"id": "w23-d7-cl-2", "label": "“모든 걸 한 번에 다 결정해야 한다”는 부담 대신, 오늘 내가 할 수 있는 건 “질문을 하나 더 알아보는 것” 뿐이라고 스스로에게 허락해 주기."}]}'::jsonb, 2, true),
    (7, 'w23-d7-cl-3', '자기 전에, 이 한 주 동안 내 몸과 마음이 버텨낸 것들을 떠올려 보고, “그래도 여기까지 온 나, 정말 잘하고 있어”라는 문장을 내 이름을 넣어 조용히 불러주기.', '자기 전에, 이 한 주 동안 내 몸과 마음이 버텨낸 것들을 떠올려 보고, “그래도 여기까지 온 나, 정말 잘하고 있어”라는 문장을 내 이름을 넣어 조용히 불러주기.', '{"items": [{"id": "w23-d7-cl-3", "label": "자기 전에, 이 한 주 동안 내 몸과 마음이 버텨낸 것들을 떠올려 보고, “그래도 여기까지 온 나, 정말 잘하고 있어”라는 문장을 내 이름을 넣어 조용히 불러주기."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 23)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (2, 'w23-d2-q-1', '“우리 아기가 함께 나의 감정을 느끼고 있다고 할때, 내 감정 중 혹시라도 아기에게 영향이 갈까 걱정되는 감정이 있나요? 편안하게 털어놔주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w23-d2-q-2', '“내가 힘들다고 느낄 때, 어떤 방법으로 그 감정을 해소하면 좋을지 함께 고민해볼까요? 임신 전 그 감정이 들 때 어떻게 주로 해결했나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w23-d3-q-1', '“지금 내 식습관 중 아기에게 물려주고 싶지 않은 식습관에 대해 이야기 해볼까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w23-d3-q-2', '“임신을 계기로 그 식습관을 고친다면 어떻게 고쳐보고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w23-d4-q-1', '“오늘 하루 동안 내가 느낀 태동 중 가장 강하게 느낀 움직임이 있었나요? 그 움직임을 비유해보세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w23-d4-q-2', '“배 속에서 자라고 있음을 어렴풋이 느껴왔으나, 이제부턴 아기의 움직임이 겉으로 보이기 시작할겁니다. 이 사실은 나에게 어떤 감정과 실감을 가져다주나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w23-d5-q-1', '“내 몸에 남을지도 모르는 이 작은 선들과 무늬들을, 나는 나중에 어떻게 기억하고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w23-d5-q-2', '“아기가 어느 날 ‘엄마 배에 이 자국은 뭐야?’라고 물어본다면, 나는 어떤 이야기를 들려주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w23-d6-q-1', '“오늘은 보호받음과 관련하여 이야기를 나눠봅시다. 두려운 순간 누군가 나를 보호해줬다는 기억이 있다면 들려주세요. 그때 그 사람은 나에게 어떤 존재였나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w23-d6-q-2', '“아이가 세상을 두려워하지 않도록, 혹은 엄마의 보호 안에서 안전하게 세상을 배우기 위해서 어떤 엄마가 되어주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w23-d7-q-1', '“23주까지 온 지금, ‘임신 전의 나’와 ‘지금의 나’를 나란히 떠올려본다면, 어떤 점이 가장 많이 달라졌나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w23-d7-q-2', '“아기가 태어나서 10년 뒤, 오늘의 내가 준비해 둔 재정·보육·마음의 준비들이 아이에게 어떤 힘이 되어주었으면 하나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 24 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  24,
  '24주차 발달 정보',
  '태아는 머리부터 발끝까지 약 32cm 정도로 자라, 옥수수 크기로 비유되고, 몸무게는 약 600–700g 정도예요.',
  '24주가 되면 자궁은 무려 축구공 정도 크기로 커져 있고, 자궁의 꼭대기(자궁저)는 배꼽 위까지 올라와 있는 경우가 많아요. 기저부 높이는 치골에서 자궁 상단까지 약 22–26cm 정도로 측정되며, 의료진은 이 수치를 통해 아기 성장과 자궁 크기를 함께 확인합니다.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '24주 1일차',
  '{"items": ["태아는 머리부터 발끝까지 약 32cm 정도로 자라, 옥수수 크기로 비유되고, 몸무게는 약 600–700g 정도예요."]}'::jsonb,
  '{"items": ["24주가 되면 자궁은 무려 축구공 정도 크기로 커져 있고, 자궁의 꼭대기(자궁저)는 배꼽 위까지 올라와 있는 경우가 많아요.", "기저부 높이는 치골에서 자궁 상단까지 약 22–26cm 정도로 측정되며, 의료진은 이 수치를 통해 아기 성장과 자궁 크기를 함께 확인합니다.", "임신 전과 비교하면 평균 6–7kg 정도 체중이 늘어 있을 수 있어요."]}'::jsonb,
  '아가는 이제 옥수수만큼 자랐어요. 지난주보다 몸무게도 조금 더 무거워졌고, 더 포동포동해질 거예요. 엄마의 하루가 곧 아가의 몸을 만드는 재료가 된다고 생각해 주세요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 24
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '24주 2일차',
  '{"items": ["아기의 피부는 여전히 얇고 약간 투명하지만, 작은 모세혈관이 점점 더 많이 형성되면서 반투명하던 피부가 점차 불투명해지고, 신선한 분홍색 빛을 띠기 시작해요.", "피부는 아직 쭈글쭈글하지만, 지난 주와 마찬가지로 몸 속 지방이 축적되기 시작하면서 앞으로 더 팽팽하고 탄탄해질 준비를 하고 있고, 출생 직전까지 체중 증가를 위해 지방 조직이 꾸준히 발달합니다."]}'::jsonb,
  '{"items": ["호르몬 변화·피지 분비 증가·혈류 증가가 합쳐져 얼굴·등·가슴에 여드름·트러블이 생기기 쉽고, T존이 번들거리거나 모공이 도드라져 보일 수도 있어요.", "호르몬 변화로 멜라닌 생성이 증가하면서 얼굴·팔·이마·윗입술 등에 기미가 생기거나 진해질 수 있고, 배·가슴·허벅지에는 튼살이 더 또렷해질 수 있습니다."]}'::jsonb,
  '아가의 피부는 이제 조금씩 분홍빛이 돌고, 얼굴 위 털이 아직은 연필로 스케치한듯 희미하지만, 엄마가 아가를 품는 동안 조금씩 선명해질 거예요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 24
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '24주 3일차',
  '{"items": ["아기의 폐에서 가장 작은 끝 가지에 있는 호흡낭(폐포)들이 성장하고 분지하면서, 산소와 이산화탄소 교환을 위한 표면적을 더 많이 확보해 가는 단계에 들어요.", "폐 안에는 작은 공기주머니가 호흡 시 계속 열려 있도록 도와주는 계면활성제가 나타나기 시작하지만, 아직 양과 기능이 충분히 성숙한 상태는 아니어서 “연습 중”이라고 보는 것이 맞아요."]}'::jsonb,
  '{"items": ["아기는 숨쉬기 연습을 하고 있지만, 엄마는 자궁이 계속 위로 자라면서 눌러, 폐가 잘 확장되지 않아 가벼운 숨가쁨·호흡곤란·가슴 답답함을 느끼기 쉬운 시기예요.", "산소 요구량이 증가하고, 프로게스테론이 호흡 중추에 영향을 미쳐 “예전보다 숨이 가쁜 느낌”이 쉽게 들 수 있어요."]}'::jsonb,
  '아가의 폐는 아직 미숙하지만, 양수 속에서 숨 쉬는 연습을 계속 하고 있어요. 언젠가 엄마 품 밖에서 숨을 쉴 날을 기다리고 있답니다.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 24
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '24주 4일차',
  '{"items": ["감각 체계가 매우 민감해져, 아기는 접촉·움직임·소리 등의 자극에 더 뚜렷하게 반응하고, 특히 큰 소리를 들으면 움찔하는 놀람 반사가 발달합니다.", "양수의 맛을 통해 신맛·쓴맛·짠맛·단맛을 구별할 정도로 미각이 발달했고, 엄마의 혈액을 통해 전달되는 영양분과 맛의 차이를 경험하면서, 어느 정도 “좋아하는 자극”과 “낯선 자극”을 구분하기 시작해요."]}'::jsonb,
  '{"items": ["24주 전후에는 식욕이 크게 증가해 “예전보다 훨씬 자주 배가 고픈 느낌”이 드는 것이 자연스러운 변화예요.", "일반적인 필요 열량에 비해 임신 2분기에는 하루 약 350kcal 정도가 더 필요할 수 있는데, 이는 대략 공깃밥 한 공기 정도에 해당하는 양이에요."]}'::jsonb,
  '아가는 요즘 좋아하는 소리와 맛이 생기고 있어요. 엄마가 노래를 들려줄 때, 아가는 양수 속에서 작은 움직임으로 ‘좋아!’라고 대답하고 있어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 24
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '24주 5일차',
  '{"items": ["양수가 더 많아져서 아기는 자궁 안에서 손과 발을 자유롭게 움직이고, 물구나무를 서듯 엉덩이와 발을 위로 올리거나, 가로·비스듬한 자세로 몸의 방향을 수시로 바꾸며 놉니다.", "아직은 자궁 공간이 비교적 넉넉해, 똑바로 선 자세·비스듬한 자세·가로 자세 등 다양한 방향으로 돌 수 있고, 발차기와 잽이 느껴지는 위치에 따라 엄마도 “오늘은 오른쪽 위쪽에서 노는구나” 정도는 짐작할 수 있게 돼요."]}'::jsonb,
  '{"items": ["자궁이 더 무거워지고, 릴랙신이라는 호르몬이 인대와 관절을 느슨하게 만들면서, 관절과 인대가 예전보다 쉽게 다칠 수 있는 시기예요.", "허리가 앞으로 과도하게 휘고, 엉덩이를 쭉 내민 “오리걸음” 같은 자세를 오래 유지하면 허리·골반·등에 부담이 커져 통증이 심해질 수 있어요."]}'::jsonb,
  '엄마가 걸으면 아가는 엄마에게 몸을 맡겨 살랑살랑 흔들리고, 엄마가 멈춰 누우면 ‘이제 아가가 움직일 차례구나!’ 하면서 발로 톡톡, 몸을 쭉쭉 뻗어봐요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 24
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '24주 6일차',
  '{"items": ["아기는 계속 지방을 축적해 나가며, 이 지방은 체온 조절·에너지 저장·대사에 중요한 역할을 하게 되고, 출생 후 체온을 유지하는 데 큰 도움이 됩니다.", "점점 더 통통해지는 만큼, 근육과 관절, 신경도 함께 발달해 태동이 더 힘 있고 규칙적으로 느껴질 수 있어요."]}'::jsonb,
  '{"items": ["임신 24주쯤에는 유방이 더 커지고 단단해지며, 유륜과 유두가 더 어두워지고 진해져, 아기가 출생 후 유두를 찾고 빨기 쉬운 모습으로 변화해요.", "커진 자궁이 위와 장·방광을 압박하면서, 소화불량·속쓰림·복부 팽만·변비·치질, 그리고 배뇨 횟수 증가나 가벼운 요실금 증상이 더 뚜렷하게 느껴질 수 있어요."]}'::jsonb,
  '아가는 요즘 몸 구석구석에 작은 담요처럼 지방을 조금씩 덮고 있어요. 나중에 엄마 품 밖으로 나가더라도 너무 춥지 않도록 한층 한층 담요를 덮어야겠어요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 24
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '24주 7일차',
  '{"items": ["이 한 주 동안 아기는 반투명하던 피부가 점차 불투명해지고 분홍빛을 띠기 시작했고, 지방이 더 많이 쌓이며 통통해졌으며, 머리카락과 눈썹·속눈썹이 한층 더 자라 ‘아기 얼굴’을 거의 완성한 상태가 되었어요."]}'::jsonb,
  '{"items": ["이제 자궁이 축구공 크기까지 커지고, 체중은 임신 전보다 6–7kg 정도 증가해 있는 경우가 많아, 몸의 변화가 마음에도 더 실감되는 시기예요.", "임신성 당뇨 선별검사와 함께, 나의 식습관·체중·요오드·철분·칼슘 상태에 대해 의료진과 구체적으로 상의하기 좋은 시기예요. 아직 백일해 예방접종을 하지 않았다면, 다음 진료 때 의료진과 접종 시기·필요성을 꼭 상의해 보는 것이 좋습니다."]}'::jsonb,
  '엄마가 웃고, 걱정하고, 쉬는 모든 순간이 아가가 잘 클 수 있도록 돕고 있어요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 24
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 24)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w24-d1-cl-1', '오늘 거울 앞에서 배꼽 위로 올라온 배를 한 번 쓰다듬으며, “축구공만 한 자궁 안에 옥수수만 한 네가 들어 있구나” 하고 마음속으로 인사해 보기.', '오늘 거울 앞에서 배꼽 위로 올라온 배를 한 번 쓰다듬으며, “축구공만 한 자궁 안에 옥수수만 한 네가 들어 있구나” 하고 마음속으로 인사해 보기.', '{"items": [{"id": "w24-d1-cl-1", "label": "오늘 거울 앞에서 배꼽 위로 올라온 배를 한 번 쓰다듬으며, “축구공만 한 자궁 안에 옥수수만 한 네가 들어 있구나” 하고 마음속으로 인사해 보기."}]}'::jsonb, 1, true),
    (1, 'w24-d1-cl-2', '체중을 메모장이나 앱에 기록해 두고, 숫자를 보며 “지금 내 몸과 아기는 계획대로 잘 자라고 있구나”를 눈으로 확인해 보기.', '체중을 메모장이나 앱에 기록해 두고, 숫자를 보며 “지금 내 몸과 아기는 계획대로 잘 자라고 있구나”를 눈으로 확인해 보기.', '{"items": [{"id": "w24-d1-cl-2", "label": "체중을 메모장이나 앱에 기록해 두고, 숫자를 보며 “지금 내 몸과 아기는 계획대로 잘 자라고 있구나”를 눈으로 확인해 보기."}]}'::jsonb, 2, true),
    (1, 'w24-d1-cl-3', '중심이 흔들릴 수 있는 시기이니, 급하게 방향 전환하기보다 걸음을 반 박자 느리게, 계단·지하철·욕실 바닥에서는 항상 난간·손잡이를 잡는 습관 들이기.', '중심이 흔들릴 수 있는 시기이니, 급하게 방향 전환하기보다 걸음을 반 박자 느리게, 계단·지하철·욕실 바닥에서는 항상 난간·손잡이를 잡는 습관 들이기.', '{"items": [{"id": "w24-d1-cl-3", "label": "중심이 흔들릴 수 있는 시기이니, 급하게 방향 전환하기보다 걸음을 반 박자 느리게, 계단·지하철·욕실 바닥에서는 항상 난간·손잡이를 잡는 습관 들이기."}]}'::jsonb, 3, true),
    (2, 'w24-d2-cl-1', '자극적이지 않은 보습제와 SPF 30 이상 자외선 차단제를 챙겨 바르며, “이건 내 피부가 아기를 품어내는 동안 지켜줄 작은 방패야”라고 마음속으로 말해 보기.', '자극적이지 않은 보습제와 SPF 30 이상 자외선 차단제를 챙겨 바르며, “이건 내 피부가 아기를 품어내는 동안 지켜줄 작은 방패야”라고 마음속으로 말해 보기.', '{"items": [{"id": "w24-d2-cl-1", "label": "자극적이지 않은 보습제와 SPF 30 이상 자외선 차단제를 챙겨 바르며, “이건 내 피부가 아기를 품어내는 동안 지켜줄 작은 방패야”라고 마음속으로 말해 보기."}]}'::jsonb, 1, true),
    (2, 'w24-d2-cl-2', '여드름이 생겼다고 조급한 마음에 강한 각질 제거제·미백 제품·레티노이드 계열 제품을 사용하기보다, 임신 중 사용 가능한지 의료진·약사에게 꼭 확인하고, 기본적인 세안·보습에 조금 더 충실해 보기.', '여드름이 생겼다고 조급한 마음에 강한 각질 제거제·미백 제품·레티노이드 계열 제품을 사용하기보다, 임신 중 사용 가능한지 의료진·약사에게 꼭 확인하고, 기본적인 세안·보습에 조금 더 충실해 보기.', '{"items": [{"id": "w24-d2-cl-2", "label": "여드름이 생겼다고 조급한 마음에 강한 각질 제거제·미백 제품·레티노이드 계열 제품을 사용하기보다, 임신 중 사용 가능한지 의료진·약사에게 꼭 확인하고, 기본적인 세안·보습에 조금 더 충실해 보기."}]}'::jsonb, 2, true),
    (3, 'w24-d3-cl-1', '계단을 오르거나 평지를 걸을 때 예전보다 숨이 찬다면, “지금은 두 사람 분의 산소를 주고받는 중이야”라고 마음 속으로 말해주기.', '계단을 오르거나 평지를 걸을 때 예전보다 숨이 찬다면, “지금은 두 사람 분의 산소를 주고받는 중이야”라고 마음 속으로 말해주기.', '{"items": [{"id": "w24-d3-cl-1", "label": "계단을 오르거나 평지를 걸을 때 예전보다 숨이 찬다면, “지금은 두 사람 분의 산소를 주고받는 중이야”라고 마음 속으로 말해주기."}]}'::jsonb, 1, true),
    (3, 'w24-d3-cl-2', '오랫동안 서 있거나 허리를 꺾은 자세로 일하기보다, 하루 중 몇 번은 의식적으로 등을 기대고 깊게 숨을 쉬며 1–2분만 호흡 휴식을 가져보기.', '오랫동안 서 있거나 허리를 꺾은 자세로 일하기보다, 하루 중 몇 번은 의식적으로 등을 기대고 깊게 숨을 쉬며 1–2분만 호흡 휴식을 가져보기.', '{"items": [{"id": "w24-d3-cl-2", "label": "오랫동안 서 있거나 허리를 꺾은 자세로 일하기보다, 하루 중 몇 번은 의식적으로 등을 기대고 깊게 숨을 쉬며 1–2분만 호흡 휴식을 가져보기."}]}'::jsonb, 2, true),
    (3, 'w24-d3-cl-3', '숨이 몹시 차거나, 가슴 통증·지속적인 기침·한쪽 다리 통증·심한 두통이 동반된다면 즉시 병원이나 의료진에 연락해야 하는 신호라는 것을 메모해 두기.', '숨이 몹시 차거나, 가슴 통증·지속적인 기침·한쪽 다리 통증·심한 두통이 동반된다면 즉시 병원이나 의료진에 연락해야 하는 신호라는 것을 메모해 두기.', '{"items": [{"id": "w24-d3-cl-3", "label": "숨이 몹시 차거나, 가슴 통증·지속적인 기침·한쪽 다리 통증·심한 두통이 동반된다면 즉시 병원이나 의료진에 연락해야 하는 신호라는 것을 메모해 두기."}]}'::jsonb, 3, true),
    (4, 'w24-d4-cl-1', '정제 설탕이 많은 스낵 대신 단백질·섬유질·건강한 지방이 함께 들어있는 간식(예: 견과류+과일, 요거트+과일)으로 바꿔보기.', '정제 설탕이 많은 스낵 대신 단백질·섬유질·건강한 지방이 함께 들어있는 간식(예: 견과류+과일, 요거트+과일)으로 바꿔보기.', '{"items": [{"id": "w24-d4-cl-1", "label": "정제 설탕이 많은 스낵 대신 단백질·섬유질·건강한 지방이 함께 들어있는 간식(예: 견과류+과일, 요거트+과일)으로 바꿔보기."}]}'::jsonb, 1, true),
    (4, 'w24-d4-cl-2', '다음 정기검진 일정이 잡혀 있다면, 메모장에 “임신성 당뇨 검사 ·요오드 상태에 대해 물어볼 것”이라고 적어 두고, 의료진에게 나의 식단과 걱정을 솔직하게 나눠 보기.', '다음 정기검진 일정이 잡혀 있다면, 메모장에 “임신성 당뇨 검사 ·요오드 상태에 대해 물어볼 것”이라고 적어 두고, 의료진에게 나의 식단과 걱정을 솔직하게 나눠 보기.', '{"items": [{"id": "w24-d4-cl-2", "label": "다음 정기검진 일정이 잡혀 있다면, 메모장에 “임신성 당뇨 검사 ·요오드 상태에 대해 물어볼 것”이라고 적어 두고, 의료진에게 나의 식단과 걱정을 솔직하게 나눠 보기."}]}'::jsonb, 2, true),
    (4, 'w24-d4-cl-3', '고기가 잘 소화되지 않는다면, DHA가 풍부한 생선이나 흰살 생선, 계란 등으로 단백질의 일부를 대체해 보며, “이건 나와 아기를 위한 선택”이라고 떠올려 보기.', '고기가 잘 소화되지 않는다면, DHA가 풍부한 생선이나 흰살 생선, 계란 등으로 단백질의 일부를 대체해 보며, “이건 나와 아기를 위한 선택”이라고 떠올려 보기.', '{"items": [{"id": "w24-d4-cl-3", "label": "고기가 잘 소화되지 않는다면, DHA가 풍부한 생선이나 흰살 생선, 계란 등으로 단백질의 일부를 대체해 보며, “이건 나와 아기를 위한 선택”이라고 떠올려 보기."}]}'::jsonb, 3, true),
    (5, 'w24-d5-cl-1', '전신 거울 앞에 서서, 귀–어깨–골반–발목이 대략 한 줄로 서 있는지 살펴보고, 엉덩이를 과하게 뒤로 빼기보다 배에 힘을 살짝만 주고 자세를 잡아 보기.', '전신 거울 앞에 서서, 귀–어깨–골반–발목이 대략 한 줄로 서 있는지 살펴보고, 엉덩이를 과하게 뒤로 빼기보다 배에 힘을 살짝만 주고 자세를 잡아 보기.', '{"items": [{"id": "w24-d5-cl-1", "label": "전신 거울 앞에 서서, 귀–어깨–골반–발목이 대략 한 줄로 서 있는지 살펴보고, 엉덩이를 과하게 뒤로 빼기보다 배에 힘을 살짝만 주고 자세를 잡아 보기."}]}'::jsonb, 1, true),
    (5, 'w24-d5-cl-2', '운동을 할 때는 갑작스러운 방향 전환·점프·몸 비틀기를 피하고, 걷기·임산부 요가·수영·가벼운 근력 운동처럼 부드러운 움직임을 선택하기.', '운동을 할 때는 갑작스러운 방향 전환·점프·몸 비틀기를 피하고, 걷기·임산부 요가·수영·가벼운 근력 운동처럼 부드러운 움직임을 선택하기.', '{"items": [{"id": "w24-d5-cl-2", "label": "운동을 할 때는 갑작스러운 방향 전환·점프·몸 비틀기를 피하고, 걷기·임산부 요가·수영·가벼운 근력 운동처럼 부드러운 움직임을 선택하기."}]}'::jsonb, 2, true),
    (5, 'w24-d5-cl-3', '다리가 무겁거나 붓는 날에는, 하루 중 10–15분이라도 다리를 심장보다 높게 올려 두고 쉬면서, 발목 돌리기·까치발 들기 같은 작은 움직임을 해주기.', '다리가 무겁거나 붓는 날에는, 하루 중 10–15분이라도 다리를 심장보다 높게 올려 두고 쉬면서, 발목 돌리기·까치발 들기 같은 작은 움직임을 해주기.', '{"items": [{"id": "w24-d5-cl-3", "label": "다리가 무겁거나 붓는 날에는, 하루 중 10–15분이라도 다리를 심장보다 높게 올려 두고 쉬면서, 발목 돌리기·까치발 들기 같은 작은 움직임을 해주기."}]}'::jsonb, 3, true),
    (6, 'w24-d6-cl-1', '브래지어를 벗었을 때 가슴과 어깨, 겨드랑이의 느낌을 잠깐 살펴보고, 조이지 않고 잘 받쳐주는 임산부용·수유용 브래지어가 맞는지 확인해 보기.', '브래지어를 벗었을 때 가슴과 어깨, 겨드랑이의 느낌을 잠깐 살펴보고, 조이지 않고 잘 받쳐주는 임산부용·수유용 브래지어가 맞는지 확인해 보기.', '{"items": [{"id": "w24-d6-cl-1", "label": "브래지어를 벗었을 때 가슴과 어깨, 겨드랑이의 느낌을 잠깐 살펴보고, 조이지 않고 잘 받쳐주는 임산부용·수유용 브래지어가 맞는지 확인해 보기."}]}'::jsonb, 1, true),
    (6, 'w24-d6-cl-2', '소화가 불편하다면 한 번에 많이 먹는 식사 대신, 하루 5–6번의 잦지만 양은 적은식사를 시도해보고, 식사 후 바로 눕지 않으려고 해보기.', '소화가 불편하다면 한 번에 많이 먹는 식사 대신, 하루 5–6번의 잦지만 양은 적은식사를 시도해보고, 식사 후 바로 눕지 않으려고 해보기.', '{"items": [{"id": "w24-d6-cl-2", "label": "소화가 불편하다면 한 번에 많이 먹는 식사 대신, 하루 5–6번의 잦지만 양은 적은식사를 시도해보고, 식사 후 바로 눕지 않으려고 해보기."}]}'::jsonb, 2, true),
    (6, 'w24-d6-cl-3', '기침할 때·웃을 때·재채기할 때 소변이 새는 느낌이 든다면, 골반저 근육을 위한 케겔 운동을 시작해 보고, 증상이 심하거나 불편하면 의료진과 상의해 보기.', '기침할 때·웃을 때·재채기할 때 소변이 새는 느낌이 든다면, 골반저 근육을 위한 케겔 운동을 시작해 보고, 증상이 심하거나 불편하면 의료진과 상의해 보기.', '{"items": [{"id": "w24-d6-cl-3", "label": "기침할 때·웃을 때·재채기할 때 소변이 새는 느낌이 든다면, 골반저 근육을 위한 케겔 운동을 시작해 보고, 증상이 심하거나 불편하면 의료진과 상의해 보기."}]}'::jsonb, 3, true),
    (7, 'w24-d7-cl-1', '이번 진료를 앞두고 있다면, 메모장에 다음 항목을 적어 보기:
① 임신성 당뇨에 대해 물어보기
② 요오드·철분·칼슘 보충 필요 여부
③ 최근 느끼는 기분 변화·수면 상태를 기록하기”', '이번 진료를 앞두고 있다면, 메모장에 다음 항목을 적어 보기:
① 임신성 당뇨에 대해 물어보기
② 요오드·철분·칼슘 보충 필요 여부
③ 최근 느끼는 기분 변화·수면 상태를 기록하기”', '{"items": [{"id": "w24-d7-cl-1", "label": "이번 진료를 앞두고 있다면, 메모장에 다음 항목을 적어 보기:\n① 임신성 당뇨에 대해 물어보기\n② 요오드·철분·칼슘 보충 필요 여부\n③ 최근 느끼는 기분 변화·수면 상태를 기록하기”"}]}'::jsonb, 1, true),
    (7, 'w24-d7-cl-2', '제대혈 은행에 대해 간단히 검색해보기.', '제대혈 은행에 대해 간단히 검색해보기.', '{"items": [{"id": "w24-d7-cl-2", "label": "제대혈 은행에 대해 간단히 검색해보기."}]}'::jsonb, 2, true),
    (7, 'w24-d7-cl-3', '출산 계획을 간단히 적어 보기: “분만 시 곁에 있어줬으면 하는 사람, 통증 조절에 대해 바라는 점, 출산 후 아기를 안는 방식, 모유수유 의향” 등을 적어두고, 다음 진료나 파트너와의 대화에서 나눌 준비를 해 보기.', '출산 계획을 간단히 적어 보기: “분만 시 곁에 있어줬으면 하는 사람, 통증 조절에 대해 바라는 점, 출산 후 아기를 안는 방식, 모유수유 의향” 등을 적어두고, 다음 진료나 파트너와의 대화에서 나눌 준비를 해 보기.', '{"items": [{"id": "w24-d7-cl-3", "label": "출산 계획을 간단히 적어 보기: “분만 시 곁에 있어줬으면 하는 사람, 통증 조절에 대해 바라는 점, 출산 후 아기를 안는 방식, 모유수유 의향” 등을 적어두고, 다음 진료나 파트너와의 대화에서 나눌 준비를 해 보기."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 24)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w24-d1-q-1', '“임신 전의 내 몸과 비교했을 때, 지금 축구공만 한 자궁과 6–7kg의 변화는 나에게 어떤 감정(뿌듯함, 낯섦, 불안, 감사)을 주고 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w24-d1-q-2', '“이 무게와 부피의 변화가 ‘아기를 키우는 무게’라고 바라본다면, 오늘 내 몸을 대하는 태도는 조금 달라질 수 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w24-d2-q-1', '“나중에 임신 후 나와 같은 변화를 경험할 친구가 여드름이나 임신선과 같은 변화에 속상해한다면 어떤 말을 전해주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w24-d2-q-2', '“그럼에도 불구하고 임신을 하지 않고선 경험할 수 없는 감정과 변화가 있다면 정리해볼까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w24-d3-q-1', '“하루 중 가장 숨이 가쁜 활동을 하는 때는 언제인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w24-d3-q-2', '“지금 숨쉬기 연습하고 있는 아기는 언젠간 큰 울음을 터뜨리며 세상을 향해 큰 숨을 내쉴거예요. 엄마는 그 울음소리를 듣게 되는 그 날 어떤 감정이 들 것 같나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w24-d4-q-1', '“내가 아기에게 가장 많이 들려주고 싶은 소리는 무엇인가요? (나의 웃음소리, 특정 음악, 기도, 자연의 소리 등)”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w24-d4-q-2', '“앞으로 내 식단을 ‘나를 위한 다이어트’가 아니라 ‘아기와 나를 함께 튼튼하게 하는 식습관’으로 본다면, 오늘 바꾸고 싶은 한 가지는 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w24-d5-q-1', '“요즘 내 배 속 아기가 가장 자주 움직이는 위치는 어디인가요? (오른쪽 위, 왼쪽 아래 등) 그 위치가 느껴질 때 어떤 기분이 드나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w24-d5-q-2', '“내 몸의 관절과 인대가 느슨해지고 있다는 사실은 엄마의 몸이 조금 더 조심스러워져야함을 의미합니다. 나는 운동·일하기·쉬기 방식을 어떻게 조금 바꿔주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w24-d6-q-1', '지난 주와 다른 ‘엄마가 되어가는 나의 몸’이 느껴지나요? 혹은 지난주와 비슷하다고 생각되나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w24-d6-q-2', '엄마 품에 안겨 모유수유를 하는 아기를 상상하며, 어떤 말을 해주고싶나요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w24-d7-q-1', '“24주까지 온 지금, ‘임신 전의 나’와 ‘지금의 나’를 나란히 세워본다면, 가장 많이 달라진 점은 무엇인가요? (몸, 마음, 가치관, 인간관계 모두 포함해서)”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w24-d7-q-2', '“혹시 어떤 결정들(검사, 예방접종, 재정·제대혈·출산 계획)이 아직 막막하게 느껴진다면, 그 안에서 ‘오늘 내가 한 발짝만 내디뎌 보고 싶은 부분’은 어디인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 25 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  25,
  '25주차 발달 정보',
  '25주 태아는 머리부터 발끝까지 길이 약 34–35cm, 몸무게가 벌써 700–750g 정도로, 단호박 크기와 비슷한 수준까지 자랐어요. 피부는 아직 주름져 있고 살이 더 붙어야 하지만, 피하지방이 계속 축적되면서 마른 모습에서 부드럽고 통통한 “아기 살”로 변하는 중이에요.',
  '자궁은 축구공 크기까지 자라서 위로만이 아니라 옆으로도 확장되며, 배꼽 위까지 올라와 배가 확연히 불러 보이는 시기예요. 체중 증가 폭이 매주 딱 고르게 유지되기보다는, 수분 저류 등으로 들쭉날쭉할 수 있어, 어떤 주는 더 많이, 어떤 주는 덜 느는 느낌이 들기도 합니다.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '25주 1일차',
  '{"items": ["25주 태아는 머리부터 발끝까지 길이 약 34–35cm, 몸무게가 벌써 700–750g 정도로, 단호박 크기와 비슷한 수준까지 자랐어요.", "피부는 아직 주름져 있고 살이 더 붙어야 하지만, 피하지방이 계속 축적되면서 마른 모습에서 부드럽고 통통한 “아기 살”로 변하는 중이에요."]}'::jsonb,
  '{"items": ["자궁은 축구공 크기까지 자라서 위로만이 아니라 옆으로도 확장되며, 배꼽 위까지 올라와 배가 확연히 불러 보이는 시기예요.", "체중 증가 폭이 매주 딱 고르게 유지되기보다는, 수분 저류 등으로 들쭉날쭉할 수 있어, 어떤 주는 더 많이, 어떤 주는 덜 느는 느낌이 들기도 합니다."]}'::jsonb,
  '아가는 지금 단호박만큼 자랐어요. 엄마가 챙겨주는 음식 하나하나가 아가의 볼살과 허벅지 살이 되는 중이에요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 25
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '25주 2일차',
  '{"items": ["머리카락이 더 자라서, 이제는 색과 질감을 어느 정도 구분할 수 있을 만큼 뚜렷해지고, 몸 전체에도 솜털과 체모가 늘어나고 있어요.", "눈꺼풀은 위·아래로 분리되어 완전히 형성되었고, 눈을 뜨고 감는 동작을 할 수 있으며, 홍채 색은 아직 보이지 않아도 이미 유전정보에 의해 결정된 상태예요."]}'::jsonb,
  '{"items": ["배와 유방, 엉덩이 주변 피부가 급격히 늘어나면서 희거나 붉고 보라색을 띠는 임신선이 점점 더 눈에 띌 수 있어요.", "임신 호르몬과 혈류 증가 덕분에 머리카락이 평소보다 덜 빠져, 그 어느 때보다 풍성하고 두껍고 윤기 있어 보이지만, 추가 모발은 출산 후 다시 빠지는 경우가 많습니다."]}'::jsonb,
  '아가의 머리카락은 이제 조금 더 진해지고, 속눈썹도 제법 자랐어요. 언젠가 엄마가 빗겨줄 머리와 마주칠 눈동자를 준비하는 중이에요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 25
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '25주 3일차',
  '{"items": ["손과 발, 손가락 구조는 이미 완전히 형성되어 있고, 이제는 주변에 잡히는 것이 있으면 실제로 잡으려는 시도를 해요.", "탯줄이 손 근처로 오면 잡으려 하고, 손가락이나 턱이 입 근처에 닿으면 반사적으로 얼굴을 그쪽으로 돌려 빠는 동작을 하는데, 이는 이후 모유수유 시 젖꼭지를 찾는 능력과 자연스럽게 연결됩니다."]}'::jsonb,
  '{"items": ["자궁이 커지면서 갈비뼈, 등, 가슴, 엉덩이, 배 양옆에 통증이 생기기 쉬운 시기로, 임신 호르몬이 인대와 근육을 이완시키는 것도 통증에 기여해요.", "계속 늘어나는 체중과 배로 척추가 더 휘어지고 등 근육이 긴장해 허리 통증이 심해지기 쉽고, 쌍둥이 임신일수록 이런 통증이 더 흔합니다."]}'::jsonb,
  '아가는 요즘 탯줄을 잡아당겨 보기도 하고, 손가락이 입 근처로 오면 꿀꺽 빨아보려고 해요. 아직은 우연이지만, 모유를 찾는 연습을 미리 하고 있는 셈이죠.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 25
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '25주 4일차',
  '{"items": ["활동기에는 발로 차고, 구르고, 몸을 내밀고 뻗는 움직임이 많지만, 휴식할 때는 머리를 숙이고 무릎을 몸 쪽으로 당긴 채 동그랗게 웅크린 자세, 우리가 떠올리는 그 “아기 포즈”로 쉽니다."]}'::jsonb,
  '{"items": ["임신 주수가 쌓이면서, 자궁이 방광·위·장까지 더 많이 눌러, 소변을 자주 보게 되고 소화불량·속쓰림·복부 팽만·가스를 자주 경험할 수 있어요.", "자궁이 단단해졌다가 다시 풀리는 브릭스톤 힉스 수축(가진통)이 25주 무렵부터 더 자주 느껴질 수 있으며, 이 연습 수축은 보통 자궁경부를 열지 않고 출산 예행연습처럼 작용합니다."]}'::jsonb,
  '아가는 놀 땐 세게 차고, 쉴 땐 몸을 작게 만들어 웅크려요. 언젠가 엄마 품에서 그대로 다시 웅크릴 포즈를, 지금 양수 속에서 자꾸만 연습하고 있어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 25
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '25주 5일차',
  '{"items": ["심장 박동은 이제 청진기뿐 아니라, 배에 귀를 대어 들을 수 있을 정도로 뚜렷해요.", "청력이 더 발달해 엄마·아빠 목소리와 주변 소리를 듣고, 어떤 음악이나 말소리에 더 강하게 반응하는지 차이가 나타나기도 해요."]}'::jsonb,
  '{"items": ["혈액량이 최대 50%까지 증가하고 심박수도 빨라져, 갑자기 일어날 때 어지러움이나 ‘심장이 두근거리는 느낌’을 경험하기 쉽습니다.", "얼굴·손·발이 약간 붓는 것은 흔한 수분 저류 현상이지만, 의사는 자간전증 여부를 확인하기 위해 정기적으로 혈압과 부종 양상을 체크해야 해요."]}'::jsonb,
  '아가와 아빠가 배에 귀를 대고 말을 걸면, 아가는 그 소리를 물과 살을 통과해 듣고 있어요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 25
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '25주 6일차',
  '{"items": ["양수 속에서 더 자주 입을 벌려 양수를 마시고, 소화관을 움직이며 소화기관 훈련을 계속하는 중이에요.", "아기는 스스로 양수에 소변을 보고, 이 소변이 양수의 대부분을 이루며, 양수는 아기를 쿠션처럼 감싸 충격을 줄이고 일정한 온도를 유지해 줍니다."]}'::jsonb,
  '{"items": ["브락스톤 힉스 수축(가진통)은 자궁이 단단해졌다가 풀리는 느낌으로, 25주 무렵부터 더 자주 느껴질 수 있고, 주수가 늘수록 강도가 조금씩 세질 수 있어요.", "이 가진통은 보통 규칙적이지 않고, 강도가 점점 세지 않으며, 자궁경부를 열지 않는 생리적 현상입니다."]}'::jsonb,
  '아가는 매일 양수를 마시고 소변을 보면서, 몸으로 작은 순환을 만들고 있어요. 언젠가 엄마 품에서 진짜로 할 일들을 준비하고 있어요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 25
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '25주 7일차',
  '{"items": ["단호박·적양배추만 한 크기(34–35cm, 700–750g)까지 자라며 계속 지방을 키워나갔고, 피부는 더 분홍빛·선홍빛을 띠며, 머리카락과 솜털이 늘고, 눈꺼풀이 완전 형성되어 눈을 깜빡입니다,", "손가락으로 탯줄을 잡고, 입 주변 자극에 반응해 빠는 동작을 하며, 동그랗게 웅크려 쉬는 “아기 포즈”를 연습하는 등 우리가 떠올리는 진짜 아기다운 모습에 한 걸음 더 가까워졌어요."]}'::jsonb,
  '{"items": ["배는 위로만이 아니라 옆으로도 퍼지며, 자궁이 커지면서 갈비뼈·등·골반 통증·다리 경련·부종·속쓰림·변비 같은 증상이 함께 느껴질 수 있어요.", "불편함과 피로, 수면 부족, 출산·육아·직장에 대한 걱정이 겹치면서 감정 기복과 불안이 커질 수 있지만, 많은 임산부가 겪는 매우 자연스러운 반응이에요."]}'::jsonb,
  '아가는 이번 주 동안 더 눈을 깜빡이고, 탯줄을 잡고, 동그랗게 웅크리는 법을 배웠어요. 엄마가 하루하루 버텨 준 덕분에, 아가도 하루하루 성장하고 있어요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 25
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 25)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w25-d1-cl-1', '거울 앞에서 배를 옆·앞에서 번갈아 보며, “위로만이 아니라 옆으로도 자라난 이 배 안에, 단호박만 한 네가 있구나” 하고 배를 한 번 쓰다듬어 보기.', '거울 앞에서 배를 옆·앞에서 번갈아 보며, “위로만이 아니라 옆으로도 자라난 이 배 안에, 단호박만 한 네가 있구나” 하고 배를 한 번 쓰다듬어 보기.', '{"items": [{"id": "w25-d1-cl-1", "label": "거울 앞에서 배를 옆·앞에서 번갈아 보며, “위로만이 아니라 옆으로도 자라난 이 배 안에, 단호박만 한 네가 있구나” 하고 배를 한 번 쓰다듬어 보기."}]}'::jsonb, 1, true),
    (1, 'w25-d1-cl-2', '몸무게가 급하게 느는 것 같아 불안해진다면, 체중 그래프를 한 달 단위로 보면서 “들쭉날쭉해도 전체적으로는 잘 가고 있다”는 흐름을 확인해 보기.', '몸무게가 급하게 느는 것 같아 불안해진다면, 체중 그래프를 한 달 단위로 보면서 “들쭉날쭉해도 전체적으로는 잘 가고 있다”는 흐름을 확인해 보기.', '{"items": [{"id": "w25-d1-cl-2", "label": "몸무게가 급하게 느는 것 같아 불안해진다면, 체중 그래프를 한 달 단위로 보면서 “들쭉날쭉해도 전체적으로는 잘 가고 있다”는 흐름을 확인해 보기."}]}'::jsonb, 2, true),
    (1, 'w25-d1-cl-3', '오늘 밤, 잘 눕기 전에 배 위에 손을 올리고 “이번 주에는 주당 50g씩 네가 더 무거워질 예정이구나, 그 무게를 내가 같이 들어줄게”라고 마음속으로 말해 보기.', '오늘 밤, 잘 눕기 전에 배 위에 손을 올리고 “이번 주에는 주당 50g씩 네가 더 무거워질 예정이구나, 그 무게를 내가 같이 들어줄게”라고 마음속으로 말해 보기.', '{"items": [{"id": "w25-d1-cl-3", "label": "오늘 밤, 잘 눕기 전에 배 위에 손을 올리고 “이번 주에는 주당 50g씩 네가 더 무거워질 예정이구나, 그 무게를 내가 같이 들어줄게”라고 마음속으로 말해 보기."}]}'::jsonb, 3, true),
    (2, 'w25-d2-cl-1', '샤워 후 몸에 생긴 임신선과 배 둘레를 보며, “이 선과 둥근 배는 네가 자라며 남긴 연필 자국이야”라고 한 번만 따뜻하게 바라보고, 보습제를 천천히 바르는 시간 자체를 작은 의식처럼 가져보기.', '샤워 후 몸에 생긴 임신선과 배 둘레를 보며, “이 선과 둥근 배는 네가 자라며 남긴 연필 자국이야”라고 한 번만 따뜻하게 바라보고, 보습제를 천천히 바르는 시간 자체를 작은 의식처럼 가져보기.', '{"items": [{"id": "w25-d2-cl-1", "label": "샤워 후 몸에 생긴 임신선과 배 둘레를 보며, “이 선과 둥근 배는 네가 자라며 남긴 연필 자국이야”라고 한 번만 따뜻하게 바라보고, 보습제를 천천히 바르는 시간 자체를 작은 의식처럼 가져보기."}]}'::jsonb, 1, true),
    (2, 'w25-d2-cl-2', '얼굴 트러블이 신경 쓰인다면, 강한 미백·필링 제품보다 순한 세안·보습·자외선 차단에 집중하고, 새로운 화장품은 임신 중 사용 가능 여부를 꼭 확인해 보기.', '얼굴 트러블이 신경 쓰인다면, 강한 미백·필링 제품보다 순한 세안·보습·자외선 차단에 집중하고, 새로운 화장품은 임신 중 사용 가능 여부를 꼭 확인해 보기.', '{"items": [{"id": "w25-d2-cl-2", "label": "얼굴 트러블이 신경 쓰인다면, 강한 미백·필링 제품보다 순한 세안·보습·자외선 차단에 집중하고, 새로운 화장품은 임신 중 사용 가능 여부를 꼭 확인해 보기."}]}'::jsonb, 2, true),
    (2, 'w25-d2-cl-3', '오늘 머리를 빗으면서, 풍성해진 머리카락을 만지며 “나도, 너도, 지금 함께 자라고 있다”라고 마음속으로 말해 보기.', '오늘 머리를 빗으면서, 풍성해진 머리카락을 만지며 “나도, 너도, 지금 함께 자라고 있다”라고 마음속으로 말해 보기.', '{"items": [{"id": "w25-d2-cl-3", "label": "오늘 머리를 빗으면서, 풍성해진 머리카락을 만지며 “나도, 너도, 지금 함께 자라고 있다”라고 마음속으로 말해 보기."}]}'::jsonb, 3, true),
    (3, 'w25-d3-cl-1', '일어나거나 돌아누울 때, 양쪽 다리를 모은 채로 움직이고, 다리를 크게 벌리거나 한쪽 다리에 체중을 실어 비틀지 않도록 신경 써 보기.', '일어나거나 돌아누울 때, 양쪽 다리를 모은 채로 움직이고, 다리를 크게 벌리거나 한쪽 다리에 체중을 실어 비틀지 않도록 신경 써 보기.', '{"items": [{"id": "w25-d3-cl-1", "label": "일어나거나 돌아누울 때, 양쪽 다리를 모은 채로 움직이고, 다리를 크게 벌리거나 한쪽 다리에 체중을 실어 비틀지 않도록 신경 써 보기."}]}'::jsonb, 1, true),
    (3, 'w25-d3-cl-2', '오래 서 있어야 하는 날에는 중간중간 의자에 앉아 골반을 앞뒤로 천천히 기울이며, 허리와 골반 주변 근육의 긴장을 풀어주기.', '오래 서 있어야 하는 날에는 중간중간 의자에 앉아 골반을 앞뒤로 천천히 기울이며, 허리와 골반 주변 근육의 긴장을 풀어주기.', '{"items": [{"id": "w25-d3-cl-2", "label": "오래 서 있어야 하는 날에는 중간중간 의자에 앉아 골반을 앞뒤로 천천히 기울이며, 허리와 골반 주변 근육의 긴장을 풀어주기."}]}'::jsonb, 2, true),
    (3, 'w25-d3-cl-3', '허리·골반 통증이 심해 일상생활이 힘들다면, 골반 지지 벨트·물리치료·자세 교정 등 도움 받을 방법이 있는지 의료진과 상의해보기.', '허리·골반 통증이 심해 일상생활이 힘들다면, 골반 지지 벨트·물리치료·자세 교정 등 도움 받을 방법이 있는지 의료진과 상의해보기.', '{"items": [{"id": "w25-d3-cl-3", "label": "허리·골반 통증이 심해 일상생활이 힘들다면, 골반 지지 벨트·물리치료·자세 교정 등 도움 받을 방법이 있는지 의료진과 상의해보기."}]}'::jsonb, 3, true),
    (4, 'w25-d4-cl-1', '하루에 한 번은 손을 배 위에 올려놓고, 단단해졌다가 부드러워지는 자궁의 변화를 느끼며 “아, 지금 가진통이구나. 내 몸이 출산 연습을 하고 있네” 하고 차분히 인식해 보기.', '하루에 한 번은 손을 배 위에 올려놓고, 단단해졌다가 부드러워지는 자궁의 변화를 느끼며 “아, 지금 가진통이구나. 내 몸이 출산 연습을 하고 있네” 하고 차분히 인식해 보기.', '{"items": [{"id": "w25-d4-cl-1", "label": "하루에 한 번은 손을 배 위에 올려놓고, 단단해졌다가 부드러워지는 자궁의 변화를 느끼며 “아, 지금 가진통이구나. 내 몸이 출산 연습을 하고 있네” 하고 차분히 인식해 보기."}]}'::jsonb, 1, true),
    (4, 'w25-d4-cl-2', '변비와 치질 예방을 위해, 물을 자주 마시고(하루 10잔 전후 목표), 섬유질이 풍부한 채소·통곡물·과일을 식사 때마다 한 가지 이상 포함해 보기.', '변비와 치질 예방을 위해, 물을 자주 마시고(하루 10잔 전후 목표), 섬유질이 풍부한 채소·통곡물·과일을 식사 때마다 한 가지 이상 포함해 보기.', '{"items": [{"id": "w25-d4-cl-2", "label": "변비와 치질 예방을 위해, 물을 자주 마시고(하루 10잔 전후 목표), 섬유질이 풍부한 채소·통곡물·과일을 식사 때마다 한 가지 이상 포함해 보기."}]}'::jsonb, 2, true),
    (4, 'w25-d4-cl-3', '가슴앓이·속쓰림이 심한 날에는, 늦은 밤 과한 야식 대신 소량의 간식으로 교체하고, 식사 후 바로 눕지 않고 상체를 살짝 세운 채 쉬어보기.', '가슴앓이·속쓰림이 심한 날에는, 늦은 밤 과한 야식 대신 소량의 간식으로 교체하고, 식사 후 바로 눕지 않고 상체를 살짝 세운 채 쉬어보기.', '{"items": [{"id": "w25-d4-cl-3", "label": "가슴앓이·속쓰림이 심한 날에는, 늦은 밤 과한 야식 대신 소량의 간식으로 교체하고, 식사 후 바로 눕지 않고 상체를 살짝 세운 채 쉬어보기."}]}'::jsonb, 3, true),
    (5, 'w25-d5-cl-1', '남편에게 배 위에 귀를 대고 심장 소리를 들어보거나, 손을 올려 아기의 움직임을 함께 느껴보자고 부탁해 보기. “아빠 태담·가족 태담”을 통해 모두가 아기와 연결되는 시간을 가져보기.', '남편에게 배 위에 귀를 대고 심장 소리를 들어보거나, 손을 올려 아기의 움직임을 함께 느껴보자고 부탁해 보기. “아빠 태담·가족 태담”을 통해 모두가 아기와 연결되는 시간을 가져보기.', '{"items": [{"id": "w25-d5-cl-1", "label": "남편에게 배 위에 귀를 대고 심장 소리를 들어보거나, 손을 올려 아기의 움직임을 함께 느껴보자고 부탁해 보기. “아빠 태담·가족 태담”을 통해 모두가 아기와 연결되는 시간을 가져보기."}]}'::jsonb, 1, true),
    (5, 'w25-d5-cl-2', '다리·발·발목 붓기가 심해지는 저녁에는, 다리를 심장보다 높게 올려 10–15분 쉬면서, 발목 돌리기·종아리 마사지로 순환을 도와주기.', '다리·발·발목 붓기가 심해지는 저녁에는, 다리를 심장보다 높게 올려 10–15분 쉬면서, 발목 돌리기·종아리 마사지로 순환을 도와주기.', '{"items": [{"id": "w25-d5-cl-2", "label": "다리·발·발목 붓기가 심해지는 저녁에는, 다리를 심장보다 높게 올려 10–15분 쉬면서, 발목 돌리기·종아리 마사지로 순환을 도와주기."}]}'::jsonb, 2, true),
    (5, 'w25-d5-cl-3', '갑작스러운 심한 두통·눈앞이 번쩍이는 증상·얼굴·손의 과도한 부기·심한 갈비뼈 통증등 ‘병원에 연락해야 할 징후’를 메모해두기.', '갑작스러운 심한 두통·눈앞이 번쩍이는 증상·얼굴·손의 과도한 부기·심한 갈비뼈 통증등 ‘병원에 연락해야 할 징후’를 메모해두기.', '{"items": [{"id": "w25-d5-cl-3", "label": "갑작스러운 심한 두통·눈앞이 번쩍이는 증상·얼굴·손의 과도한 부기·심한 갈비뼈 통증등 ‘병원에 연락해야 할 징후’를 메모해두기."}]}'::jsonb, 3, true),
    (6, 'w25-d6-cl-1', '가진통이 올 때 시계를 보며, “규칙적인가? 강도가 점점 세지는가? 휴식·수분·자세 변경 후에도 계속되는가?”를 체크해 보고, 조산 징후와 어떻게 다른지 감각을 익혀 보기.', '가진통이 올 때 시계를 보며, “규칙적인가? 강도가 점점 세지는가? 휴식·수분·자세 변경 후에도 계속되는가?”를 체크해 보고, 조산 징후와 어떻게 다른지 감각을 익혀 보기.', '{"items": [{"id": "w25-d6-cl-1", "label": "가진통이 올 때 시계를 보며, “규칙적인가? 강도가 점점 세지는가? 휴식·수분·자세 변경 후에도 계속되는가?”를 체크해 보고, 조산 징후와 어떻게 다른지 감각을 익혀 보기."}]}'::jsonb, 1, true),
    (6, 'w25-d6-cl-2', '다음 정기검진 전까지, 메모장에 아래 항목을 정리해 보기:
“① 임신성 당뇨검사 결과·질문
② 최근 가진통·복통·질분비물 변화 기록”', '다음 정기검진 전까지, 메모장에 아래 항목을 정리해 보기:
“① 임신성 당뇨검사 결과·질문
② 최근 가진통·복통·질분비물 변화 기록”', '{"items": [{"id": "w25-d6-cl-2", "label": "다음 정기검진 전까지, 메모장에 아래 항목을 정리해 보기:\n“① 임신성 당뇨검사 결과·질문\n② 최근 가진통·복통·질분비물 변화 기록”"}]}'::jsonb, 2, true),
    (6, 'w25-d6-cl-3', '출산 후 아기방(같은 방, 다른 침대)을 할지 생각해 보고, 아기 침대 위치·안전한 수면 환경·기저귀 갈이 동선 등을 간단히 스케치해 보기.', '출산 후 아기방(같은 방, 다른 침대)을 할지 생각해 보고, 아기 침대 위치·안전한 수면 환경·기저귀 갈이 동선 등을 간단히 스케치해 보기.', '{"items": [{"id": "w25-d6-cl-3", "label": "출산 후 아기방(같은 방, 다른 침대)을 할지 생각해 보고, 아기 침대 위치·안전한 수면 환경·기저귀 갈이 동선 등을 간단히 스케치해 보기."}]}'::jsonb, 3, true),
    (7, 'w25-d7-cl-1', '아기 침대·기저귀 교환대·수유 공간을 어디에 둘지, 집 구조를 대략 그려보며 “우리 집에 아기가 들어오는 동선”을 상상해 보기.', '아기 침대·기저귀 교환대·수유 공간을 어디에 둘지, 집 구조를 대략 그려보며 “우리 집에 아기가 들어오는 동선”을 상상해 보기.', '{"items": [{"id": "w25-d7-cl-1", "label": "아기 침대·기저귀 교환대·수유 공간을 어디에 둘지, 집 구조를 대략 그려보며 “우리 집에 아기가 들어오는 동선”을 상상해 보기."}]}'::jsonb, 1, true),
    (7, 'w25-d7-cl-2', '남편과 함께 가볍게 대화해 보고, “대략의 그림”을 나눠 보기.
① 출산 후 누가 언제까지 쉴 수 있는지(휴가·육아휴직·단기보험)
② 외부 도움(조리원, 산후도우미, 가족)의 가능성', '남편과 함께 가볍게 대화해 보고, “대략의 그림”을 나눠 보기.
① 출산 후 누가 언제까지 쉴 수 있는지(휴가·육아휴직·단기보험)
② 외부 도움(조리원, 산후도우미, 가족)의 가능성', '{"items": [{"id": "w25-d7-cl-2", "label": "남편과 함께 가볍게 대화해 보고, “대략의 그림”을 나눠 보기.\n① 출산 후 누가 언제까지 쉴 수 있는지(휴가·육아휴직·단기보험)\n② 외부 도움(조리원, 산후도우미, 가족)의 가능성"}]}'::jsonb, 2, true),
    (7, 'w25-d7-cl-3', '나는 ‘병원에 연락해야 할 징후’를 알고 있고, 나와 아기를 위해 도움을 요청할 수 있다”는 문장을 마음속으로 여러 번 되뇌어 보기.', '나는 ‘병원에 연락해야 할 징후’를 알고 있고, 나와 아기를 위해 도움을 요청할 수 있다”는 문장을 마음속으로 여러 번 되뇌어 보기.', '{"items": [{"id": "w25-d7-cl-3", "label": "나는 ‘병원에 연락해야 할 징후’를 알고 있고, 나와 아기를 위해 도움을 요청할 수 있다”는 문장을 마음속으로 여러 번 되뇌어 보기."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 25)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w25-d1-q-1', '“단호박만 한 크기가 된 지금, 처음 임신 사실을 알았던 그날의 나와 비교했을 때 내가 가장 많이 달라진 점은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w25-d1-q-2', '“앞으로 매주 50g씩 더 무거워질 아기를 위해, 오늘 내가 내 몸에게 해줄 수 있는 작은 배려 하나는 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w25-d2-q-1', '“엄마를 여기까지 자라게 한 사람들은 누구였나요? 그들의 말 한마디, 손길 하나가 엄마의 삶에 어떤 ‘뿌리’가 되어 주었는지 떠올려보세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w25-d2-q-2', '“이제 엄마는 누군가의 ‘뿌리’가 되어가고 있습니다. 아기가 세상을 살아갈 때 기대어 쉴 수 있는 뿌리가 되기 위해, 어떤 마음을 간직하고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w25-d3-q-1', '“요즘 자주 느끼는 통증은 주로 어느 부위인가요? 그 통증을 ‘버텨야 할 적’이 아니라 ‘몸이 보내는 도움 요청’으로 본다면, 나는 오늘 무엇을 바꿔보고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w25-d3-q-2', '“지금까지 쉽게 놓지 못하고 꽉 쥐고 살아온 것이 있나요? 그것은 사람일 수도, 감정일 수도, 꿈일 수도 있어요. 그것을 쥐고 있던 이유가 무엇이었는지 그 경험에 대해 들려주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w25-d4-q-1', '“아기가 동그랗게 웅크려 쉬는 모습을 떠올리며, 오늘 나도 몸을 동그랗게 말고 쉴 수 있는 시간을 조금 마련해 줄 수 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w25-d4-q-2', '“이제 엄마의 몸과 마음을 편하게 하는 루틴이 생겼을 것 같아요. 어떤 방법으로 휴식할 때 가장 편안한가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w25-d5-q-1', '“지금까지 내가 경험해 온 ‘아빠’의 모습은 어떤 모습이었나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w25-d5-q-2', '“나의 남편이 아빠가 되어가고 있음을 느끼는 때가 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w25-d6-q-1', '“지금까지의 삶에서, 모든 것을 계획하려다 오히려 힘들어졌던 순간이 있었나요? 반대로, 내려놓고 흐름에 맡겼을 때 길이 열렸던 경험이 있다면 아기에게 들려주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w25-d6-q-2', '“엄마의 의지와는 달리 아기만의 속도와 길이 있다는 사실을 받아들이는 순간 어떤 감정이 드나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w25-d7-q-1', '“엄마는 앞으로 아기를 어떤 마음으로, 어떤 온기로 보호하고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w25-d7-q-2', '“작은 아기가 태어나면 그 정도 크기일까요? 어쩌면 더 작을지도 모르죠! 작은 아기가 웅크려 자는 모습을 상상하며 어떤 감상이 드는지 알려주세요. ”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 26 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  26,
  '26주차 발달 정보',
  '머리부터 발끝까지 약 35–36cm 정도로, 양상추 크기와 비슷하고, 몸무게는 대략 750–900g 정도예요. 임신 주수는 절반을 훌쩍 넘겼지만, 아기는 지금보다 3배 이상 더 무거워질 예정이고, 앞으로 남은 주수 동안 지방과 근육을 채우며 통통한 몸을 완성해 갈 거예요.',
  '자궁 저부는 배꼽 위 약 2.5인치 정도까지 올라와 있고, 배는 매주 약 0.5인치씩 계속 커지면서 돌출돼 보여요. 임신이 진행되면서 무게중심이 앞으로 쏠려 균형 감각이 떨어지고, 예전에는 금방 걸어가던 버스 정류장까지가 지금은 더 힘들고 시간이 오래 걸릴 수 있어요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '26주 1일차',
  '{"items": ["머리부터 발끝까지 약 35–36cm 정도로, 양상추 크기와 비슷하고, 몸무게는 대략 750–900g 정도예요.", "임신 주수는 절반을 훌쩍 넘겼지만, 아기는 지금보다 3배 이상 더 무거워질 예정이고, 앞으로 남은 주수 동안 지방과 근육을 채우며 통통한 몸을 완성해 갈 거예요."]}'::jsonb,
  '{"items": ["자궁 저부는 배꼽 위 약 2.5인치 정도까지 올라와 있고, 배는 매주 약 0.5인치씩 계속 커지면서 돌출돼 보여요.", "임신이 진행되면서 무게중심이 앞으로 쏠려 균형 감각이 떨어지고, 예전에는 금방 걸어가던 버스 정류장까지가 지금은 더 힘들고 시간이 오래 걸릴 수 있어요."]}'::jsonb,
  '아가는 1kg을 향해 가고 있어요. 앞으로 몇 달 동안 아가는 지금보다 세 배 이상 더 무거워질 거라서, 엄마 배 안은 점점 아가로 꽉 차게 될 거예요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 26
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '26주 2일차',
  '{"items": ["폐 속의 폐포가 계속 발달하면서, 태아는 양수를 소량 들이마시고 내쉬는 방식으로 호흡 연습을 하고 있어요.", "이제 콧구멍도 열려 코로 양수를 빨아들이며 호흡을 연습하고, 폐에서는 공기주머니가 붕 뜨고 가라앉을 때 서로 달라붙지 않도록 해주는 계면활성제를 만들어 내기 시작했어요."]}'::jsonb,
  '{"items": ["자궁이 커지면서 갈비뼈를 위로 밀어내 맨 아래 갈비뼈가 바깥쪽으로 휘어져, 갈비뼈 주변 통증이 잘 생겨요.", "자궁저가 높아지면서 위장과 장기를 위로 압박해, 식후 포만감·속쓰림·구역·트림·복부팽만이 더 쉽게 나타날 수 있습니다."]}'::jsonb,
  '아가는 지금 물 속에서 숨 쉬는 연습을 하고 있어요. 아직은 엄마 배 안에서 더 자라야, 밖에서도 힘껏 숨을 쉴 수 있어요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 26
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '26주 3일차',
  '{"items": ["뇌가 더욱 발달해 지각과 운동을 관장하는 부위가 자라고, 몸 전체를 조금씩 더 잘 컨트롤할 수 있게 돼요.", "깨어 있을 때는 강한 태동이 느껴지고, 잘 때는 움직임이 거의 느껴지지 않아 “갑자기 조용해졌다?” 싶을 때는 아기가 잠들어 있는 경우가 많아요."]}'::jsonb,
  '{"items": ["피로와 생각할 일이 많아지면서 열쇠를 자주 잃어버리거나, 방금 하려던 일을 잊어버리는 ‘임신 뇌’ 현상을 경험할 수 있어요.", "불안·우울·감정 기복이 함께 느껴질 수 있고, 특히 아기 건강·출산·경제·직장에 대한 걱정이 머릿속을 떠나지 않아 더 피곤하게 느껴질 수 있어요."]}'::jsonb,
  '아가는 이제 낮과 밤, 깨어 있음과 잠드는 연습을 하고 있어요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 26
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '26주 4일차',
  '{"items": ["26주 무렵 눈꺼풀이 처음으로 열리기 시작해 눈을 뜨고 주변을 둘러볼 수 있어요.", "빛과 어둠, 단순한 모양까지 구별할 수 있을 정도로 시각 자극을 처리하는 뇌 영역과의 연결이 발달하고, 강한 햇빛이 엄마 배 쪽으로 비치면 태아가 놀라거나 깨어 태동이 증가할 수 있습니다."]}'::jsonb,
  '{"items": ["태아 성장과 함께 배·가슴·허벅지 피부가 빠르게 늘어나면서 튼살이 나타나거나 더 뚜렷해질 수 있어요.", "튼살 부위나 전체 피부가 가렵고, 에스트로겐 증가로 밤에 잠을 못 이룰 정도의 전신 가려움이 생길 수도 있습니다."]}'::jsonb,
  '아가는 이제 눈을 조금씩 뜨고, 어둡고 밝은 것을 느끼기 시작했어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 26
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '26주 5일차',
  '{"items": ["청력은 거의 완전히 발달해, 엄마·아빠의 목소리와 주변 소리를 잘 들을 수 있어요.", "큰 소리에 놀라 움직임이 갑자기 증가하거나, 음악에 맞춰 리듬감 있게 움직이는 모습을 보이기도 하고, 소리에 반응하면 태아의 심박수가 빨라지고 호흡·움직임 패턴이 변하는 것이 관찰됩니다."]}'::jsonb,
  '{"items": ["혈압이 약간 상승하는 것이 정상 범위 안에서 나타날 수 있지만, 갑작스럽거나 심한 상승은 임신성 고혈압·자간전증의 신호가 될 수 있어 주의가 필요해요.\n얼굴·손·발의 부종은 흔하지만, 갑작스럽고 심한 부기, 체중 급증, 시야 흐림, 깨질 듯한 두통, 갈비뼈 아래 통증이 함께 나타나면 전자간증 의심 소견으로 즉시 의료진에게 연락해야 합니다."]}'::jsonb,
  '아가는 엄마와 아빠 목소리를 들으면서, 이 세상에서 가장 먼저 익숙해질 소리를 미리 저장하고 있어요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 26
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '26주 6일차',
  '{"items": ["입과 입 주변 신경이 발달해 촉감에 매우 민감해지고, 젖을 빠는 데 필요한 ‘빨기’ 동작을 익혀 엄지손가락을 빠는 행동도 보입니다.", "입 주변이나 손가락이 입 근처에 닿으면, 아기는 고개를 그쪽으로 돌려 빠는 동작을 연습하며, 이는 출생 후 모유·젖병을 찾는 능력으로 이어져요."]}'::jsonb,
  '{"items": ["커진 자궁이 직장을 누르고 장운동이 느려져, 변비가 악화되고 힘주어 배변하는 습관과 함께 치질(항문정맥류)이 생기거나 악화될 수 있어요.", "임신 중에는 잇몸이 붓고 쉽게 피가 나거나 치은염이 생기기 쉬워, 정기적인 치과 검진과 치료가 중요해요."]}'::jsonb,
  '아가는 지금 손가락을 입에 가져다 대고 빨아 보는 연습을 하고 있어요. 아직은 장난 같지만, 언젠가 엄마 품에서 우는 대신 젖을 찾을 수 있게 해주는 연습이에요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 26
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '26주 7일차',
  '{"items": ["자궁 안에 몸을 쭉 뻗고 움직일 공간이 있지만, 앞으로 지금보다 3배 이상 더 무거워질 예정이며, 뇌가 더 발달해 수면·각성 패턴을 만들고, 눈꺼풀을 열어 빛과 어둠을 구별해요.", "청력이 거의 완전히 발달해 음악과 목소리에 반응하고, 엄마의 항체를 받아들이며, 입 주변 촉감에 민감해져 빨기·고개 돌리기 연습을 하고 있어요."]}'::jsonb,
  '{"items": ["임산부의 약 60%가 허리 통증을 경험해, 수면이나 일상생활에 어려움을 느낄 수 있고, 자궁이 늘어나면서 옆구리·사타구니 쪽이 찌릿하게 아픈 통증을 겪기도 합니다.", "브랙스턴 힉스 수축(가진통)이 더 자주 느껴지고, 물을 마시거나 자세를 바꾸면 완화되지만, 규칙적이고 강도가 점점 세지면 조산 신호일 수 있어요."]}'::jsonb,
  '아가는 밖으로 나갈 준비를 조금씩 하고 있지만, 아직은 엄마 배 안에서 더 크고 싶어요. 그러니 우리, 조금만 더 같이 견뎌요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 26
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 26)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w26-d1-cl-1', '오늘 거울 앞에서 옆·앞에서 번갈아 배를 보며, “이만큼 올라온 자궁 안에 900g에 가까운 네가 자라고 있구나” 하고 배를 천천히 쓰다듬어 보기.', '오늘 거울 앞에서 옆·앞에서 번갈아 배를 보며, “이만큼 올라온 자궁 안에 900g에 가까운 네가 자라고 있구나” 하고 배를 천천히 쓰다듬어 보기.', '{"items": [{"id": "w26-d1-cl-1", "label": "오늘 거울 앞에서 옆·앞에서 번갈아 배를 보며, “이만큼 올라온 자궁 안에 900g에 가까운 네가 자라고 있구나” 하고 배를 천천히 쓰다듬어 보기."}]}'::jsonb, 1, true),
    (1, 'w26-d1-cl-2', '주 1회 정도, 체중과 허리둘레를 같은 시간대에 체크해 두고, 숫자 하나에 과도하게 흔들리기보다 한 달 단위의 전체 흐름을 보는 연습 해보기.', '주 1회 정도, 체중과 허리둘레를 같은 시간대에 체크해 두고, 숫자 하나에 과도하게 흔들리기보다 한 달 단위의 전체 흐름을 보는 연습 해보기.', '{"items": [{"id": "w26-d1-cl-2", "label": "주 1회 정도, 체중과 허리둘레를 같은 시간대에 체크해 두고, 숫자 하나에 과도하게 흔들리기보다 한 달 단위의 전체 흐름을 보는 연습 해보기."}]}'::jsonb, 2, true),
    (1, 'w26-d1-cl-3', '집 밖을 나설 때 “지금 내 무게중심은 평소보다 앞에 있다”는 걸 한 번 떠올리고, 계단·지하철 손잡이·에스컬레이터 손잡이를 의식적으로 잡는 습관 들이기.', '집 밖을 나설 때 “지금 내 무게중심은 평소보다 앞에 있다”는 걸 한 번 떠올리고, 계단·지하철 손잡이·에스컬레이터 손잡이를 의식적으로 잡는 습관 들이기.', '{"items": [{"id": "w26-d1-cl-3", "label": "집 밖을 나설 때 “지금 내 무게중심은 평소보다 앞에 있다”는 걸 한 번 떠올리고, 계단·지하철 손잡이·에스컬레이터 손잡이를 의식적으로 잡는 습관 들이기."}]}'::jsonb, 3, true),
    (2, 'w26-d2-cl-1', '식사량을 3번 크게 먹기보다 5–6번으로 나누어 소량씩 먹어 보고, 속쓰림·더부룩함이 줄어드는지 몸의 반응을 관찰해 보기.', '식사량을 3번 크게 먹기보다 5–6번으로 나누어 소량씩 먹어 보고, 속쓰림·더부룩함이 줄어드는지 몸의 반응을 관찰해 보기.', '{"items": [{"id": "w26-d2-cl-1", "label": "식사량을 3번 크게 먹기보다 5–6번으로 나누어 소량씩 먹어 보고, 속쓰림·더부룩함이 줄어드는지 몸의 반응을 관찰해 보기."}]}'::jsonb, 1, true),
    (2, 'w26-d2-cl-2', '기름지고 매운 음식, 산성·지방이 많은 음식, 카페인과 당분이 높은 음료(탄산음료·에너지 드링크 등)를 조금 줄여보며, 어떤 음식이 특히 속을 괴롭게 하는 “트리거 음식”인지 적어보기.', '기름지고 매운 음식, 산성·지방이 많은 음식, 카페인과 당분이 높은 음료(탄산음료·에너지 드링크 등)를 조금 줄여보며, 어떤 음식이 특히 속을 괴롭게 하는 “트리거 음식”인지 적어보기.', '{"items": [{"id": "w26-d2-cl-2", "label": "기름지고 매운 음식, 산성·지방이 많은 음식, 카페인과 당분이 높은 음료(탄산음료·에너지 드링크 등)를 조금 줄여보며, 어떤 음식이 특히 속을 괴롭게 하는 “트리거 음식”인지 적어보기."}]}'::jsonb, 2, true),
    (2, 'w26-d2-cl-3', '숨이 찰 때 잠깐 멈춰 서서 천천히 코로 들이마시고 입으로 내쉬는 심호흡 5회를 하며 “내 폐와 아기 폐 둘 다 지금 연습 중이야”라고 떠올려 보기.', '숨이 찰 때 잠깐 멈춰 서서 천천히 코로 들이마시고 입으로 내쉬는 심호흡 5회를 하며 “내 폐와 아기 폐 둘 다 지금 연습 중이야”라고 떠올려 보기.', '{"items": [{"id": "w26-d2-cl-3", "label": "숨이 찰 때 잠깐 멈춰 서서 천천히 코로 들이마시고 입으로 내쉬는 심호흡 5회를 하며 “내 폐와 아기 폐 둘 다 지금 연습 중이야”라고 떠올려 보기."}]}'::jsonb, 3, true),
    (3, 'w26-d3-cl-1', '오늘 해야 할 일을 머릿속에만 담아 두지 말고, 간단한 체크리스트로 적어두고 하나씩 표시해 보기.', '오늘 해야 할 일을 머릿속에만 담아 두지 말고, 간단한 체크리스트로 적어두고 하나씩 표시해 보기.', '{"items": [{"id": "w26-d3-cl-1", "label": "오늘 해야 할 일을 머릿속에만 담아 두지 말고, 간단한 체크리스트로 적어두고 하나씩 표시해 보기."}]}'::jsonb, 1, true),
    (3, 'w26-d3-cl-2', '아기 태동이 활발한 시간대(예: 밤 10–11시, 아침 등)를 2–3일 기록해 두고, “아기가 깨어있는 패턴”과 내 수면패턴이 크게 충돌하지 않도록 취침 시간을 조금 조정해 보기.', '아기 태동이 활발한 시간대(예: 밤 10–11시, 아침 등)를 2–3일 기록해 두고, “아기가 깨어있는 패턴”과 내 수면패턴이 크게 충돌하지 않도록 취침 시간을 조금 조정해 보기.', '{"items": [{"id": "w26-d3-cl-2", "label": "아기 태동이 활발한 시간대(예: 밤 10–11시, 아침 등)를 2–3일 기록해 두고, “아기가 깨어있는 패턴”과 내 수면패턴이 크게 충돌하지 않도록 취침 시간을 조금 조정해 보기."}]}'::jsonb, 2, true),
    (3, 'w26-d3-cl-3', '자기 전, 불을 살짝 낮추고 핸드폰을 멀찍이 둔 뒤, 5분만 눈을 감고 오늘 있었던 가장 고마운 일 한 가지를 떠올리며 호흡과 마음을 함께 눕혀 주기.', '자기 전, 불을 살짝 낮추고 핸드폰을 멀찍이 둔 뒤, 5분만 눈을 감고 오늘 있었던 가장 고마운 일 한 가지를 떠올리며 호흡과 마음을 함께 눕혀 주기.', '{"items": [{"id": "w26-d3-cl-3", "label": "자기 전, 불을 살짝 낮추고 핸드폰을 멀찍이 둔 뒤, 5분만 눈을 감고 오늘 있었던 가장 고마운 일 한 가지를 떠올리며 호흡과 마음을 함께 눕혀 주기."}]}'::jsonb, 3, true),
    (4, 'w26-d4-cl-1', '샤워 후 배·가슴·허벅지를 천천히 보습하면서, 튼살을 “망가진 피부”가 아니라 “아기가 자라며 남긴 성장의 기록”으로 바라보는 연습을 한 번 해보기.', '샤워 후 배·가슴·허벅지를 천천히 보습하면서, 튼살을 “망가진 피부”가 아니라 “아기가 자라며 남긴 성장의 기록”으로 바라보는 연습을 한 번 해보기.', '{"items": [{"id": "w26-d4-cl-1", "label": "샤워 후 배·가슴·허벅지를 천천히 보습하면서, 튼살을 “망가진 피부”가 아니라 “아기가 자라며 남긴 성장의 기록”으로 바라보는 연습을 한 번 해보기."}]}'::jsonb, 1, true),
    (4, 'w26-d4-cl-2', '얼굴에는 무거운 메이크업보다 자외선 차단제+기초 보습에 집중하고, 햇볕이 강한 시간에는 모자·양산·선글라스를 활용해 기미 악화를 줄여 보기.', '얼굴에는 무거운 메이크업보다 자외선 차단제+기초 보습에 집중하고, 햇볕이 강한 시간에는 모자·양산·선글라스를 활용해 기미 악화를 줄여 보기.', '{"items": [{"id": "w26-d4-cl-2", "label": "얼굴에는 무거운 메이크업보다 자외선 차단제+기초 보습에 집중하고, 햇볕이 강한 시간에는 모자·양산·선글라스를 활용해 기미 악화를 줄여 보기."}]}'::jsonb, 2, true),
    (4, 'w26-d4-cl-3', '침구·잠옷은 가볍고 땀 흡수가 잘 되는 소재로 바꾸고, 심한 가려움이 계속되면 언제부터, 어느 부위가, 어느 정도인지 메모해 둔 뒤 진료 시 꼭 이야기하기.', '침구·잠옷은 가볍고 땀 흡수가 잘 되는 소재로 바꾸고, 심한 가려움이 계속되면 언제부터, 어느 부위가, 어느 정도인지 메모해 둔 뒤 진료 시 꼭 이야기하기.', '{"items": [{"id": "w26-d4-cl-3", "label": "침구·잠옷은 가볍고 땀 흡수가 잘 되는 소재로 바꾸고, 심한 가려움이 계속되면 언제부터, 어느 부위가, 어느 정도인지 메모해 둔 뒤 진료 시 꼭 이야기하기."}]}'::jsonb, 3, true),
    (5, 'w26-d5-cl-1', '오늘 5–10분 정도, 조용한 음악이나 좋아하는 노래를 틀어 놓고 배를 부드럽게 쓰다듬으며, 아기의 움직임 변화를 천천히 느껴보기.', '오늘 5–10분 정도, 조용한 음악이나 좋아하는 노래를 틀어 놓고 배를 부드럽게 쓰다듬으며, 아기의 움직임 변화를 천천히 느껴보기.', '{"items": [{"id": "w26-d5-cl-1", "label": "오늘 5–10분 정도, 조용한 음악이나 좋아하는 노래를 틀어 놓고 배를 부드럽게 쓰다듬으며, 아기의 움직임 변화를 천천히 느껴보기."}]}'::jsonb, 1, true),
    (5, 'w26-d5-cl-2', '집에 혈압계가 있다면, 아침이나 저녁 일정한 시간에 혈압을 재고 기록해 두기. 이상 수치·증상이 느껴질 때 기록하고, 의료진과 상의하기.', '집에 혈압계가 있다면, 아침이나 저녁 일정한 시간에 혈압을 재고 기록해 두기. 이상 수치·증상이 느껴질 때 기록하고, 의료진과 상의하기.', '{"items": [{"id": "w26-d5-cl-2", "label": "집에 혈압계가 있다면, 아침이나 저녁 일정한 시간에 혈압을 재고 기록해 두기. 이상 수치·증상이 느껴질 때 기록하고, 의료진과 상의하기."}]}'::jsonb, 2, true),
    (5, 'w26-d5-cl-3', '“지금 내 앞에 올 이 아이는 어떤 한 사람일까?”를 일기에 적어보며 감정을 천천히 정리해 보기.', '“지금 내 앞에 올 이 아이는 어떤 한 사람일까?”를 일기에 적어보며 감정을 천천히 정리해 보기.', '{"items": [{"id": "w26-d5-cl-3", "label": "“지금 내 앞에 올 이 아이는 어떤 한 사람일까?”를 일기에 적어보며 감정을 천천히 정리해 보기."}]}'::jsonb, 3, true),
    (6, 'w26-d6-cl-1', '변비·치질 예방을 위해, 과일·채소·통곡물을 충분히 포함한 고섬유 식단을 유지하고, 하루 총 물 섭취량을 8–10잔 정도로 맞춰 보기.', '변비·치질 예방을 위해, 과일·채소·통곡물을 충분히 포함한 고섬유 식단을 유지하고, 하루 총 물 섭취량을 8–10잔 정도로 맞춰 보기.', '{"items": [{"id": "w26-d6-cl-1", "label": "변비·치질 예방을 위해, 과일·채소·통곡물을 충분히 포함한 고섬유 식단을 유지하고, 하루 총 물 섭취량을 8–10잔 정도로 맞춰 보기."}]}'::jsonb, 1, true),
    (6, 'w26-d6-cl-2', '다음 진료 전까지 “혈당 검사 결과, 최근 간식·음식 패턴, 가족력(당뇨·고혈압 등)”을 메모해 두고, 임신성 당뇨·고혈압 관리에 대해 궁금한 점을 질문 리스트로 정리해 가기.', '다음 진료 전까지 “혈당 검사 결과, 최근 간식·음식 패턴, 가족력(당뇨·고혈압 등)”을 메모해 두고, 임신성 당뇨·고혈압 관리에 대해 궁금한 점을 질문 리스트로 정리해 가기.', '{"items": [{"id": "w26-d6-cl-2", "label": "다음 진료 전까지 “혈당 검사 결과, 최근 간식·음식 패턴, 가족력(당뇨·고혈압 등)”을 메모해 두고, 임신성 당뇨·고혈압 관리에 대해 궁금한 점을 질문 리스트로 정리해 가기."}]}'::jsonb, 2, true),
    (6, 'w26-d6-cl-3', '치과 예약을 잡아 잇몸 상태·충치 여부를 점검하고, 필요한 치료가 있다면 산부인과·치과와 상의해 임신 중 가능 범위 안에서 진행하기.', '치과 예약을 잡아 잇몸 상태·충치 여부를 점검하고, 필요한 치료가 있다면 산부인과·치과와 상의해 임신 중 가능 범위 안에서 진행하기.', '{"items": [{"id": "w26-d6-cl-3", "label": "치과 예약을 잡아 잇몸 상태·충치 여부를 점검하고, 필요한 치료가 있다면 산부인과·치과와 상의해 임신 중 가능 범위 안에서 진행하기."}]}'::jsonb, 3, true),
    (7, 'w26-d7-cl-1', '가벼운 유산소 운동(걷기·수영)과 부드러운 스트레칭, 산전 요가·호흡연습을 통해 허리·골반 통증과 불안을 완화하기.', '가벼운 유산소 운동(걷기·수영)과 부드러운 스트레칭, 산전 요가·호흡연습을 통해 허리·골반 통증과 불안을 완화하기.', '{"items": [{"id": "w26-d7-cl-1", "label": "가벼운 유산소 운동(걷기·수영)과 부드러운 스트레칭, 산전 요가·호흡연습을 통해 허리·골반 통증과 불안을 완화하기."}]}'::jsonb, 1, true),
    (7, 'w26-d7-cl-2', '지금 시기가 여행(베이비문)을 떠나기 가장 좋고, 더 지나면 장거리 이동이 어려워질 수 있는 시기이므로, 의사와 상의해 무리가 되지 않는 범위에서 여행 계획해보기.', '지금 시기가 여행(베이비문)을 떠나기 가장 좋고, 더 지나면 장거리 이동이 어려워질 수 있는 시기이므로, 의사와 상의해 무리가 되지 않는 범위에서 여행 계획해보기.', '{"items": [{"id": "w26-d7-cl-2", "label": "지금 시기가 여행(베이비문)을 떠나기 가장 좋고, 더 지나면 장거리 이동이 어려워질 수 있는 시기이므로, 의사와 상의해 무리가 되지 않는 범위에서 여행 계획해보기."}]}'::jsonb, 2, true),
    (7, 'w26-d7-cl-3', '미술 전시·공원 풍경·사진집 등 “아름다운 것”을 눈에 담는 시간을 일부러 만들고, 집에서는 좋아하는 그림을 천천히 감상하며 마음을 가라앉혀 보기.', '미술 전시·공원 풍경·사진집 등 “아름다운 것”을 눈에 담는 시간을 일부러 만들고, 집에서는 좋아하는 그림을 천천히 감상하며 마음을 가라앉혀 보기.', '{"items": [{"id": "w26-d7-cl-3", "label": "미술 전시·공원 풍경·사진집 등 “아름다운 것”을 눈에 담는 시간을 일부러 만들고, 집에서는 좋아하는 그림을 천천히 감상하며 마음을 가라앉혀 보기."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 26)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w26-d1-q-1', '“지금 엄마의 몸과 마음에 찾아온 ‘생명의 무게’는 어떤 느낌인가요? 이 무거움은 엄마에게 어떤 의미로 남게 될까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w26-d1-q-2', '“아기가 태어난 이후의 삶을 떠올려볼 때, 엄마는 어떤 균형을 지키며 살아가고 싶나요? 사랑과 자유, 보호와 기다림 사이에서 어떤 중심을 지키고 싶은지 말해보세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w26-d2-q-1', '“조용한 곳에서 천천히 숨을 쉬며 배에 집중해 보세요. 들숨과 날숨에 맞춰 배 안의 아기가 함께 움직이는 느낌이 있나요? 그 순간 엄마는 무엇을 느끼나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w26-d2-q-2', '“가장 편안하게 숨 쉬어졌던 장소는 어디였나요? 침대, 샤워하는 순간, 산책길, 누군가의 품… 그 장면을 떠올리며 지금도 같은 숨을 쉬어보세요. 어떤 느낌이 드나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w26-d3-q-1', '“최근에 잊으면 안되는 중요한 사건이나 사실을 잠시 잊었던 적이 있었나요? 그 경험에 대해 들려주세요,”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w26-d3-q-2', '“건망증이 아니라, 새로운 생명을 품기 위해 기억이 비워지고 있다고 생각한다면, 그 빈자리에 가장 먼저 추억이 들어오길 바라나요? 아기를 품고 있는 이 기간 중 기억하고 싶은 추억이 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w26-d4-q-1', '“혼자일 때, 아무에게도 말하지 못하고 조용히 견뎌야 했던 ‘어둠의 시간’이 있나요? 그 어둠은 지금의 나에게 무엇을 남겨주었나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w26-d4-q-2', '“아기가 살아가다 빛뿐 아니라 어둠도 마주하게 될 텐데, 그 어둠 속에서 길을 잃지 않도록 어떤 ‘빛’의 말을 전해주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w26-d5-q-1', '“아기의 청력이 거의 발달했으니, 엄마의 가장 따뜻한 목소리로 지금의 마음을 전해줄까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w26-d5-q-2', '“엄마가 이 아이에게 진짜 바라는 것은 무엇인가요? 어떤 삶을 살아가길 바라나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w26-d6-q-1', '“아기가 엄지손가락을 빠는 모습을 상상해 보니, 내 마음에는 어떤 감정이 먼저 떠오르나요? 그 감정에 한 줄 말을 붙인다면 무엇일까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w26-d6-q-2', '“내가 임신성 당뇨나 치아·잇몸 문제를 두려움만으로 피하지 않고, ‘준비된 정보’로 마주하기 위해 오늘 할 수 있는 작은 행동 하나는 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w26-d7-q-1', '“임신 기간 중 처음에는 받아들이기 어려웠지만, 자연스럽게 ‘나의 일부’가 된 일이 있나요? 그 적응의 과정에서 엄마는 어떤 다짐을 했는지 들려주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w26-d7-q-2', '“임신 전에는 중요하게 여기지 않았지만, 요즘 들어 예민해진 감정이 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 27 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  27,
  '27주차 발달 정보',
  '임신 27주 아기는 머리부터 발끝까지 약 35~36.6cm, 약 14.25~14.41인치 정도로, 허니듀 멜론·콜리플라워 한 통 크기에 비유돼요. 몸무게는 약 907g~1kg 전후 정도이고, 앞으로 몇 주 동안 특히 체중이 약 3배 정도까지 크게 증가하면서 자궁 밖에서 생존할 수 있을 만큼 체력과 체지방을 빠르게 채워 갈 예정이에요.',
  '지금쯤이면 임신 전보다 약 7~10kg 정도 체중이 늘어났을 수 있고, 단태 임신의 전체 권장 체중 증가는 대략 약 11~16kg 정도로 제시돼요. 자궁저 높이가 올라가고 배가 앞으로 많이 나와 몸의 무게중심이 앞쪽으로 쏠리면서, 걷고 앉고 일어나는 자세가 예전 같지 않고, 가끔은 몸이 “어색하고 서툴다”는 느낌을 줄 수 있어요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '27주 1일차',
  '{"items": ["임신 27주 아기는 머리부터 발끝까지 약 35~36.6cm, 약 14.25~14.41인치 정도로, 허니듀 멜론·콜리플라워 한 통 크기에 비유돼요.", "몸무게는 약 907g~1kg 전후 정도이고, 앞으로 몇 주 동안 특히 체중이 약 3배 정도까지 크게 증가하면서 자궁 밖에서 생존할 수 있을 만큼 체력과 체지방을 빠르게 채워 갈 예정이에요."]}'::jsonb,
  '{"items": ["지금쯤이면 임신 전보다 약 7~10kg 정도 체중이 늘어났을 수 있고, 단태 임신의 전체 권장 체중 증가는 대략 약 11~16kg 정도로 제시돼요.", "자궁저 높이가 올라가고 배가 앞으로 많이 나와 몸의 무게중심이 앞쪽으로 쏠리면서, 걷고 앉고 일어나는 자세가 예전 같지 않고, 가끔은 몸이 “어색하고 서툴다”는 느낌을 줄 수 있어요."]}'::jsonb,
  '아가는 지금 콜리플라워만 한 크기에 거의 1kg에 가까워졌어요. 앞으로 몇 주 동안은 지금 몸무게의 세 배까지도 자라날 거예요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 27
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '27주 2일차',
  '{"items": ["폐포 주변의 혈관 수가 크게 늘어나고, 이 혈관들이 나중에 산소를 흡수하고 이산화탄소를 내보내는 역할을 하게 돼요.", "아직 완전히 성숙하진 않았지만, 27주에 태어난 아기는 인공호흡기 등 의학적 도움을 받으면 생존 가능성이 매우 높을 정도로 폐 기능이 발달한 상태예요."]}'::jsonb,
  '{"items": ["자궁이 더 커지면서 위를 위로 밀어 올리고, 프로게스테론이 소화관 운동을 느리게 해 복부 팽만·변비·속쓰림·소화불량이 쉽고 자주 생깁니다.", "위와 식도 사이의 판막이 느슨해져 위산이 역류하기 쉬워져, 매운 음식·기름진 음식·산성 음식·카페인이 많은 음료 후에는 타는 듯한 가슴앓이가 심해질 수 있어요.", "임신이 진행될수록 릴랙신(relaxin) 같은 호르몬이 인대와 관절을 느슨하게 만들어, 발목 삐끗, 허리 삐끗 같은 부상 위험이 커질수 있어요."]}'::jsonb,
  '아가는 지금 숨 쉬는 연습을 매일 하고 있어요. 그래도 아직은 엄마 배 안이 가장 안전한 집이에요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 27
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '27주 3일차',
  '{"items": ["아기의 뇌는 예전처럼 매끈한 표면이 아니라, 주름이 하나둘 생기는 진짜 ‘아기 뇌’의 모습을 갖춰 가고 있어요.", "뇌뿐 아니라 척수·말초신경으로 이어지는 신경계 전체가 더 정교해지면서, 움직임과 감각 반응, 근육 긴장도(톤)가 점점 더 섬세해집니다."]}'::jsonb,
  '{"items": ["체중 증가로 좌골신경이 눌리면 허리에서 엉덩이, 다리 뒤쪽으로 이어지는 방사통이 나타날 수 있어요. 엉덩이·허벅지 뒤가 쑤시거나 당길 수 있어요.", "하체 혈관과 근육에 부담이 커지고, 밤에는다리에 쥐(야간 다리 경련)가 잘 나며, 특히 종아리가 번갈아 딱딱해지면서 잠에서 깨는 경험이 많아질 수 있어요."]}'::jsonb,
  '아가의 뇌에는 이제 작은 주름들이 생기기 시작했어요. 몸 전체를 움직이고 느끼는 회로가 점점 더 복잡해지고 있고, 아가도 언젠가 울고 웃을 준비를 차근차근 하는 중이에요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 27
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '27주 4일차',
  '{"items": ["눈꺼풀이 열리고 닫히는 기능이 더 정교해져, 아기는 실제로 눈을 뜨고 빛과 어둠, 기본적인 형태를 구별할 수 있을 정도로 시력이 발달해요.", "강한 빛(여름 직사광선, 핸드폰 플래시 등)이 배 쪽으로 비치면 아기가 놀라거나 깨어나 태동이 많아질 정도로 빛에 민감해져요.다만 일부러 강한 빛을 오래 비추는 건 아기에게 스트레스가 될 수 있으니 피하는 것이 좋아요."]}'::jsonb,
  '{"items": ["임신 호르몬의 영향으로 머리카락은 두껍고 풍성해지고, 빠지는 양은 줄어들지만, 얼굴·팔·배 등 몸의 털이 더 굵고 많이 나는 느낌을 받을 수 있어요.", "배 가운데 임신선은 더 진해지고, 복부·가슴·허벅지 피부가 빨리 늘어나면서 튼살이 생길 수 있고, 얼굴에는 기미가 생기며, 피부는 모공이 막히기 쉬워져요."]}'::jsonb,
  '아기는 이제 어둠과 빛의 차이를 느끼고 있어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 27
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '27주 5일차',
  '{"items": ["27주 아기는 손 움직임이 더 활발해져, 엄지손가락을 빨며 스스로 진정하기도 하고, 이 과정이 뺨과 턱 근육을 강화하는 데 도움을 줍니다.", "엄마가 활동을 멈추고 쉬거나 자려고 할 때 더 활동적인 경향이 있어, 저녁·밤 시간에 아기가 더 많이 차고 구르는 ‘밤샘 말썽쟁이’ 같은 패턴을 보이기도 해요."]}'::jsonb,
  '{"items": ["자궁과 아기의 무게가 방광을 누르고, 골반저 근육이 이완되면서 기침·재채기·웃을 때 소변이 새는 요실금이 흔해질 수 있어요.", "35세 이상, 과체중, 이전 질식 분만 경험, 가족력, 특정 만성질환이 있는 경우 임신 중 요실금 위험이 더 높고, 출산 후에도 더 오래 지속될 수 있어요."]}'::jsonb,
  '아기는 엄마가 누워 쉬려고 할 때 더 많이 움직이는 모습을 보여요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 27
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '27주 6일차',
  '{"items": ["배 안에서 느껴지는 작고 규칙적인 딸꾹딸꾹하는 움직임은 태아의 딸꾹질일 가능성이 크며, 보통 몇 분 정도 지속되고 완전히 정상적인 현상이에요.", "태아는 깨어 있을 때와 잘 때가 점점 더 구분되는 수면·각성 패턴에 적응하고 있으며, 엄마가 쉬려고 할 때 더 활동적인 모습을 보일 수 있어요."]}'::jsonb,
  '{"items": ["임신 3분기로 들어가면 산전 진료 간격이 대략 28~36주까지는 2주에 한 번, 이후에는 주 1회 정도로 더 촘촘해지고, 매 방문마다 혈압·체중·소변검사·아기 심장박동 청진·자궁저 높이 측정이 이루어져요.", "지금은 3분기의 문 앞에 서 있는 시기라, 다음 주부터는 “마지막 삼분기”라는 생각이 더 현실감 있게 다가올 수 있어요."]}'::jsonb,
  '아기는 가끔 배 안에서 ‘딸꾹딸꾹’하는 소리를 내는데, 이는 호흡과 연하 연습 과정이에요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 27
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '27주 7일차',
  '{"items": ["이르지만 이 시기에 세상으로 나오게 될 시.의학적 도움을 받으면 생존 가능성이 매우 높은 수준까지 폐 기능을 끌어올렸고, 뇌에는 주름이 생기기 시작했으며, 척수·말초신경까지 포함한 신경계 전체가 정교해지면서, 이미 울 수 있을 만큼의 근육 긴장과 엄지 빠는 자기위로까지 연습하고 있어요."]}'::jsonb,
  '{"items": ["지금쯤이면 체중은 임신 전보다 7~10kg 정도 증가해 있고, 전체 임신 기간 동안 권장되는 체중 증가는 대략 11~16kg 정도예요.", "방광·골반저에 가해지는 압력과 근육 이완으로 요실금이 더 잦아질 수 있고, 소화기 압박과 호르몬 변화로 속쓰림·변비·위장 장애도 계속될 수 있는 시기예요.", "다음 주면 본격적인 3분기, 산전 진료 간격이 더 촘촘해지고(대략 2주마다) 아기의 성장과 엄마의 건강을 더 자주 확인하게 되는 단계로 들어가요."]}'::jsonb,
  '아기는 이번 주에 더 무거워지고, 더 똑똑해지고, 더 예민해졌어요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 27
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 27)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w27-d1-cl-1', '몸무게와 허리 둘레를 체크한 뒤 숫자 자체를 평가하기보다 “이 숫자만큼 아기·양수·태반·혈액·근육이 함께 늘어났구나” 하고 의미를 다시 정의해 보기.', '몸무게와 허리 둘레를 체크한 뒤 숫자 자체를 평가하기보다 “이 숫자만큼 아기·양수·태반·혈액·근육이 함께 늘어났구나” 하고 의미를 다시 정의해 보기.', '{"items": [{"id": "w27-d1-cl-1", "label": "몸무게와 허리 둘레를 체크한 뒤 숫자 자체를 평가하기보다 “이 숫자만큼 아기·양수·태반·혈액·근육이 함께 늘어났구나” 하고 의미를 다시 정의해 보기."}]}'::jsonb, 1, true),
    (1, 'w27-d1-cl-2', '계단·대중교통 이용할 때 난간·손잡이를 일부러 잡는 습관 들이기.', '계단·대중교통 이용할 때 난간·손잡이를 일부러 잡는 습관 들이기.', '{"items": [{"id": "w27-d1-cl-2", "label": "계단·대중교통 이용할 때 난간·손잡이를 일부러 잡는 습관 들이기."}]}'::jsonb, 2, true),
    (1, 'w27-d1-cl-3', '허리를 지지하기 위한 임신벨트에 대해 알아보세요. 골반통증과 허리통증을 줄이는데 도움을 받을 수 있어요.', '허리를 지지하기 위한 임신벨트에 대해 알아보세요. 골반통증과 허리통증을 줄이는데 도움을 받을 수 있어요.', '{"items": [{"id": "w27-d1-cl-3", "label": "허리를 지지하기 위한 임신벨트에 대해 알아보세요. 골반통증과 허리통증을 줄이는데 도움을 받을 수 있어요."}]}'::jsonb, 3, true),
    (2, 'w27-d2-cl-1', '수유에 필요한 몇가지 물건들과 수유 연습에 필요한 물건에 대해 찾아보세요.', '수유에 필요한 몇가지 물건들과 수유 연습에 필요한 물건에 대해 찾아보세요.', '{"items": [{"id": "w27-d2-cl-1", "label": "수유에 필요한 몇가지 물건들과 수유 연습에 필요한 물건에 대해 찾아보세요."}]}'::jsonb, 1, true),
    (2, 'w27-d2-cl-2', '장 시간 서 있거나 걷는 날에는, 돌아와서 허리·골반을 무리하게 젖히지 말고 무릎을 약간 굽힌 편안한 자세로 서서 가벼운 스트레칭 해주기.', '장 시간 서 있거나 걷는 날에는, 돌아와서 허리·골반을 무리하게 젖히지 말고 무릎을 약간 굽힌 편안한 자세로 서서 가벼운 스트레칭 해주기.', '{"items": [{"id": "w27-d2-cl-2", "label": "장 시간 서 있거나 걷는 날에는, 돌아와서 허리·골반을 무리하게 젖히지 말고 무릎을 약간 굽힌 편안한 자세로 서서 가벼운 스트레칭 해주기."}]}'::jsonb, 2, true),
    (2, 'w27-d2-cl-3', '요가·필라테스 영상 중임산부용 동작 위주로 따라 하고, 갑자기 방향을 바꾸는 동작·점프 동작은 피하기.', '요가·필라테스 영상 중임산부용 동작 위주로 따라 하고, 갑자기 방향을 바꾸는 동작·점프 동작은 피하기.', '{"items": [{"id": "w27-d2-cl-3", "label": "요가·필라테스 영상 중임산부용 동작 위주로 따라 하고, 갑자기 방향을 바꾸는 동작·점프 동작은 피하기."}]}'::jsonb, 3, true),
    (3, 'w27-d3-cl-1', '잠들기 전, 발목 돌리기·종아리 스트레칭·발가락을 몸 쪽으로 당기는 동작을 3~5분만이라도 꾸준히 해 보기.', '잠들기 전, 발목 돌리기·종아리 스트레칭·발가락을 몸 쪽으로 당기는 동작을 3~5분만이라도 꾸준히 해 보기.', '{"items": [{"id": "w27-d3-cl-1", "label": "잠들기 전, 발목 돌리기·종아리 스트레칭·발가락을 몸 쪽으로 당기는 동작을 3~5분만이라도 꾸준히 해 보기."}]}'::jsonb, 1, true),
    (3, 'w27-d3-cl-2', '다리 통증이 심한 날은, 뜨거운 물보다는 미지근한 물에 족욕 후 부드러운 종아리 마사지로 마무리하고, 너무 조이는 양말·레깅스는 피하기.', '다리 통증이 심한 날은, 뜨거운 물보다는 미지근한 물에 족욕 후 부드러운 종아리 마사지로 마무리하고, 너무 조이는 양말·레깅스는 피하기.', '{"items": [{"id": "w27-d3-cl-2", "label": "다리 통증이 심한 날은, 뜨거운 물보다는 미지근한 물에 족욕 후 부드러운 종아리 마사지로 마무리하고, 너무 조이는 양말·레깅스는 피하기."}]}'::jsonb, 2, true),
    (3, 'w27-d3-cl-3', '좌골신경통이 심할 땐, 한쪽 다리에 체중을 싣고 오래 서 있지 말고, 의자에 앉을 때는 엉덩이를 깊숙이 넣고 허리를 곧게 세운 뒤 작은 쿠션으로 허리 뒷부분을 받쳐 주기.', '좌골신경통이 심할 땐, 한쪽 다리에 체중을 싣고 오래 서 있지 말고, 의자에 앉을 때는 엉덩이를 깊숙이 넣고 허리를 곧게 세운 뒤 작은 쿠션으로 허리 뒷부분을 받쳐 주기.', '{"items": [{"id": "w27-d3-cl-3", "label": "좌골신경통이 심할 땐, 한쪽 다리에 체중을 싣고 오래 서 있지 말고, 의자에 앉을 때는 엉덩이를 깊숙이 넣고 허리를 곧게 세운 뒤 작은 쿠션으로 허리 뒷부분을 받쳐 주기."}]}'::jsonb, 3, true),
    (4, 'w27-d4-cl-1', '체모가 신경 쓰일 땐, “내 몸이 호르몬의 도움으로 아기를 지키려고 더 열심히 일하는 중”이라는 사실을 떠올리며, 필요하다면 왁싱·면도 등 물리적 방법만 선택하기.', '체모가 신경 쓰일 땐, “내 몸이 호르몬의 도움으로 아기를 지키려고 더 열심히 일하는 중”이라는 사실을 떠올리며, 필요하다면 왁싱·면도 등 물리적 방법만 선택하기.', '{"items": [{"id": "w27-d4-cl-1", "label": "체모가 신경 쓰일 땐, “내 몸이 호르몬의 도움으로 아기를 지키려고 더 열심히 일하는 중”이라는 사실을 떠올리며, 필요하다면 왁싱·면도 등 물리적 방법만 선택하기."}]}'::jsonb, 1, true),
    (4, 'w27-d4-cl-2', '외출 시에는 자외선 차단제·모자·양산을 챙겨, 기미와 색소침착을 조금이라도 줄이고, 무거운 메이크업보다 순한 클렌징+보습에 집중해 피부를 쉬게 해 주기.', '외출 시에는 자외선 차단제·모자·양산을 챙겨, 기미와 색소침착을 조금이라도 줄이고, 무거운 메이크업보다 순한 클렌징+보습에 집중해 피부를 쉬게 해 주기.', '{"items": [{"id": "w27-d4-cl-2", "label": "외출 시에는 자외선 차단제·모자·양산을 챙겨, 기미와 색소침착을 조금이라도 줄이고, 무거운 메이크업보다 순한 클렌징+보습에 집중해 피부를 쉬게 해 주기."}]}'::jsonb, 2, true),
    (4, 'w27-d4-cl-3', '의도적으로 자극적인 음식 대신, 속이 편한 한 끼를 선택해 보기.', '의도적으로 자극적인 음식 대신, 속이 편한 한 끼를 선택해 보기.', '{"items": [{"id": "w27-d4-cl-3", "label": "의도적으로 자극적인 음식 대신, 속이 편한 한 끼를 선택해 보기."}]}'::jsonb, 3, true),
    (5, 'w27-d5-cl-1', '화장실을 의도적으로 조금 더 자주 가기. 소변을 너무 오래 참지 않고 자주 비워 주는 것이 요로감염·요실금 악화를 줄이는 데 도움이 돼요.', '화장실을 의도적으로 조금 더 자주 가기. 소변을 너무 오래 참지 않고 자주 비워 주는 것이 요로감염·요실금 악화를 줄이는 데 도움이 돼요.', '{"items": [{"id": "w27-d5-cl-1", "label": "화장실을 의도적으로 조금 더 자주 가기. 소변을 너무 오래 참지 않고 자주 비워 주는 것이 요로감염·요실금 악화를 줄이는 데 도움이 돼요."}]}'::jsonb, 1, true),
    (5, 'w27-d5-cl-2', '케겔 운동을 오늘 3번만이라도 해 보기: 숨을 들이마시고 내쉰 뒤, 질·항문 주변 근육을 3~5초간 조였다가 풀기를 10회씩.', '케겔 운동을 오늘 3번만이라도 해 보기: 숨을 들이마시고 내쉰 뒤, 질·항문 주변 근육을 3~5초간 조였다가 풀기를 10회씩.', '{"items": [{"id": "w27-d5-cl-2", "label": "케겔 운동을 오늘 3번만이라도 해 보기: 숨을 들이마시고 내쉰 뒤, 질·항문 주변 근육을 3~5초간 조였다가 풀기를 10회씩."}]}'::jsonb, 2, true),
    (5, 'w27-d5-cl-3', '“오늘은 꼭 낮잠을 20~30분이라도 잔다”처럼, 피로를 무시하지 않고 의도적으로 쉬는 목표를 한 가지 정해 보기.', '“오늘은 꼭 낮잠을 20~30분이라도 잔다”처럼, 피로를 무시하지 않고 의도적으로 쉬는 목표를 한 가지 정해 보기.', '{"items": [{"id": "w27-d5-cl-3", "label": "“오늘은 꼭 낮잠을 20~30분이라도 잔다”처럼, 피로를 무시하지 않고 의도적으로 쉬는 목표를 한 가지 정해 보기."}]}'::jsonb, 3, true),
    (6, 'w27-d6-cl-1', '아기 움직임이 활발한 시간대에 10회의 태동이 감지되는데 얼마나 걸리는지 기록해 보기. 평소 패턴을 알아두면 이상 징후를 빨리 알아차리는 데 도움이 돼요.', '아기 움직임이 활발한 시간대에 10회의 태동이 감지되는데 얼마나 걸리는지 기록해 보기. 평소 패턴을 알아두면 이상 징후를 빨리 알아차리는 데 도움이 돼요.', '{"items": [{"id": "w27-d6-cl-1", "label": "아기 움직임이 활발한 시간대에 10회의 태동이 감지되는데 얼마나 걸리는지 기록해 보기. 평소 패턴을 알아두면 이상 징후를 빨리 알아차리는 데 도움이 돼요."}]}'::jsonb, 1, true),
    (6, 'w27-d6-cl-2', '다음 산전 진료 전까지 “궁금한 점·걱정되는 증상·출산과 3분기에 대해 묻고 싶은 것”을 메모장에 적어두었다가, 진료 때 꺼내 보기.', '다음 산전 진료 전까지 “궁금한 점·걱정되는 증상·출산과 3분기에 대해 묻고 싶은 것”을 메모장에 적어두었다가, 진료 때 꺼내 보기.', '{"items": [{"id": "w27-d6-cl-2", "label": "다음 산전 진료 전까지 “궁금한 점·걱정되는 증상·출산과 3분기에 대해 묻고 싶은 것”을 메모장에 적어두었다가, 진료 때 꺼내 보기."}]}'::jsonb, 2, true),
    (6, 'w27-d6-cl-3', '혈압계가 있다면, 일주일에 2~3번 동일한 시간대에 혈압을 재고 기록해 두기. 갑작스런 상승·이상한 증상이 동반되면 바로 연락해야 할 기준을 의료진에게 미리 물어두면 더 안심이 돼요.', '혈압계가 있다면, 일주일에 2~3번 동일한 시간대에 혈압을 재고 기록해 두기. 갑작스런 상승·이상한 증상이 동반되면 바로 연락해야 할 기준을 의료진에게 미리 물어두면 더 안심이 돼요.', '{"items": [{"id": "w27-d6-cl-3", "label": "혈압계가 있다면, 일주일에 2~3번 동일한 시간대에 혈압을 재고 기록해 두기. 갑작스런 상승·이상한 증상이 동반되면 바로 연락해야 할 기준을 의료진에게 미리 물어두면 더 안심이 돼요."}]}'::jsonb, 3, true),
    (7, 'w27-d7-cl-1', '3분기를 앞두고, 내가 출산하고자 계획하고 있는 병원에서 어떤 서비스를 제공하는지에 대해 알아보기.', '3분기를 앞두고, 내가 출산하고자 계획하고 있는 병원에서 어떤 서비스를 제공하는지에 대해 알아보기.', '{"items": [{"id": "w27-d7-cl-1", "label": "3분기를 앞두고, 내가 출산하고자 계획하고 있는 병원에서 어떤 서비스를 제공하는지에 대해 알아보기."}]}'::jsonb, 1, true),
    (7, 'w27-d7-cl-2', '3분기(28주~)부터는 산전진료 일정이 어떻게 변경되는지 알아보기.', '3분기(28주~)부터는 산전진료 일정이 어떻게 변경되는지 알아보기.', '{"items": [{"id": "w27-d7-cl-2", "label": "3분기(28주~)부터는 산전진료 일정이 어떻게 변경되는지 알아보기."}]}'::jsonb, 2, true),
    (7, 'w27-d7-cl-3', '경고 신호 메모 만들기: 심한 두통·시야 흐림·갑작스러운 부종·규칙적이고 강해지는 수축·질 출혈·양수 의심·호흡곤란 등이 있으면 바로 병원에 연락해야 한다는 문장을, 휴대폰 메모·냉장고·다이어리에 적어 두고 가족과도 공유하기.', '경고 신호 메모 만들기: 심한 두통·시야 흐림·갑작스러운 부종·규칙적이고 강해지는 수축·질 출혈·양수 의심·호흡곤란 등이 있으면 바로 병원에 연락해야 한다는 문장을, 휴대폰 메모·냉장고·다이어리에 적어 두고 가족과도 공유하기.', '{"items": [{"id": "w27-d7-cl-3", "label": "경고 신호 메모 만들기: 심한 두통·시야 흐림·갑작스러운 부종·규칙적이고 강해지는 수축·질 출혈·양수 의심·호흡곤란 등이 있으면 바로 병원에 연락해야 한다는 문장을, 휴대폰 메모·냉장고·다이어리에 적어 두고 가족과도 공유하기."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 27)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w27-d1-q-1', '“내 몸이 7~10kg이나 더 무거워지는 동안에도 버텨 준 것들을 떠올려 본다면, 오늘 내 몸에게 건네고 싶은 한 마디는 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w27-d1-q-2', '“아기가 앞으로 3배 더 무거워질 예정이라는 사실을 생각하며, 아기를 안았을 때 어떤 느낌일까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w27-d2-q-1', '“처음으로 물속에 몸을 맡겼던 순간을 기억하나요? 그때의 두려움과 설렘은 지금의 엄마에게 어떤 경험으로 남아 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w27-d2-q-2', '“아기가 앞으로 세상이라는 물속을 헤쳐 나갈 때, 엄마는 어떤 방식의 ‘수영’을 알려주고 싶나요? 빠르게 나아가는 법, 아니면 잠시 떠서 쉬는 법?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w27-d3-q-1', '“처음에는 어렵고 버거웠지만, 여러 번 반복하면서 점점 익숙해지고 단단해졌다고 느낀 일이 있나요? 그 과정에서 무엇을 배우게 되었나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w27-d3-q-2', '“아기가 앞으로 지치지 않고 자라기 위해, 어떤 방식의 ‘단단함’을 전해주고 싶나요? 그 단단함은 부드러움과 어떻게 어울려야 할까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w27-d4-q-1', '“내 피부와 털의 변화를 볼 때, 나는 나를 어떻게 평가하고 있나요? 그 평가 대신, ‘이 몸이 덕분에 아기가 안전하다’는 관점에서 다시 바라본다면 어떤 말이 떠오르나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w27-d4-q-2', '“아기가 빛에 민감해진 지금, 아기에게 보여주고 싶은 색은 어떤 색인가요? 지금의 계절과 관련해서 대답해봅시다. 봄, 여름, 가을, 겨울 중 어떤 색을 보여주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w27-d5-q-1', '“내가 자려고 누웠을 때 아기가 더 많이 움직이는 걸 느끼면, 나는 보통 어떤 느낌이 드나요? 그 느낌을 ‘방해’가 아닌 ‘오늘 하루의 마지막 인사’라고 받아들인다면, 무엇이 달라질까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w27-d5-q-2', '“요실금·피로·수면 부족으로 힘든 나에게, 미래의 나는 어떤 위로의 말을 건넬까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w27-d6-q-1', '“지금까지의 삶을 하나의 긴 여행이라고 한다면, 가장 인상 깊었던 풍경은 무엇이었나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w27-d6-q-2', '“지금까지의 삶을 하나의 긴 여행이라고 한다면, 나는 지금 어떤 길에 있나요? 기쁜 길, 외로운 길, 혹은 조용한 길 중 어떤 장면이 떠오르나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w27-d7-q-1', '“힘든 순간에도 이상하게 버티고, 다시 웃고, 다시 일어섰던 경험이 있나요? 그때 엄마를 움직이게 했던 생명력은 어디에서 왔다고 느껴지나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w27-d7-q-2', '“엄마는 어떤 방식으로 자기 자신을 지키고 아기를 지키고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 28 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  28,
  '28주차 발달 정보',
  '임신 28주 아기는 머리부터 발끝까지 약 37~40cm, 몸무게는 약 1kg을 넘기기 시작해서 1,000~1,200g 정도예요. 큰 가지 정도의 크기로 비유되곤 해요.',
  '이제 공식적으로 임신 3분기가 시작되면서, 산전 진료 간격이 보통 28~36주까지는 2주마다, 이후에는 주 1회로 더 자주진료를 받아야 하는 경우가 많아요. 앞으로 몇 주 동안은 아기가 더 빨리 자라기 때문에,엄마가 “와, 내가 정말 임신 막바지구나”를 온몸으로 느낄 만큼 피로감·불편감·통증이 늘어날 수 있어요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '28주 1일차',
  '{"items": ["임신 28주 아기는 머리부터 발끝까지 약 37~40cm, 몸무게는 약 1kg을 넘기기 시작해서 1,000~1,200g 정도예요.", "큰 가지 정도의 크기로 비유되곤 해요."]}'::jsonb,
  '{"items": ["이제 공식적으로 임신 3분기가 시작되면서, 산전 진료 간격이 보통 28~36주까지는 2주마다, 이후에는 주 1회로 더 자주진료를 받아야 하는 경우가 많아요.", "앞으로 몇 주 동안은 아기가 더 빨리 자라기 때문에,엄마가 “와, 내가 정말 임신 막바지구나”를 온몸으로 느낄 만큼 피로감·불편감·통증이 늘어날 수 있어요."]}'::jsonb,
  '아기는 이제 큰 가지 하나만큼 자랐으며, 몸무게도 1kg을 훌쩍 넘어서고 있어요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 28
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '28주 2일차',
  '{"items": ["28주부터 3분기 동안 아기의 뇌 무게는 약 3배 정도까지 증가하고, 대뇌 표면에는 더 깊고 복잡한 주름이 생기면서 인지 능력과 감각 처리 능력이 향상돼요.", "청각·후각·촉각은 이미 꽤 발달하여 실제로 기능하고 있고, 시각도 계속 성숙 중이라 빛과 어둠, 일부 형태를 구별할 수 있어요."]}'::jsonb,
  '{"items": ["자궁은 이제 배꼽과 명치 사이쯤까지 올라와 흉곽을 밀어 올리고, 심장·폐·위가 함께 눌려 숨이 차고, 속이 더부룩하고, 속쓰림이 잘 생길 수 있어요.", "폐와 횡격막의 공간이 줄어들어 계단만 올라가도 숨이 가쁘고, 조금만 움직여도 “예전보다 훨씬 힘들다”고 느끼기 쉬운 시기예요."]}'::jsonb,
  '아기의 뇌는 지금 세 배를 향해 달려가는 중이에요. 귀와 코, 피부는 이미 바깥세상을 연습하고 있고, 눈도 조금씩 빛과 어둠을 구분해요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 28
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '28주 3일차',
  '{"items": ["28주 무렵 태아의 폐는 호흡이 가능할 정도로 상당히 발달했지만, 여전히 공기가 아닌 양수를 들이마시고 내쉬는 ‘호흡 연습’을 계속하고 있어요.", "이 과정에서 자주 나타나는 것이 태아 딸꾹질로, 엄마는 배에서 느껴지는 작고 규칙적인 “톡톡”거림으로 이를 느끼게 돼요."]}'::jsonb,
  '{"items": ["임신 3분기에는 발목·발·손·얼굴에 부종이 흔하게 생기고, 특히 더운 날씨나 오래 서·앉아 있는 날에는 부기가 더 심해질 수 있어요.", "대부분은 임신으로 인한 정상적인 수분 저류지만, 갑작스럽고 심한 붓기, 얼굴·손 부종, 두통·시야 흐림·상복부 통증이 동반되면 자간전증의 신호일 수 있어 꼭 진료가 필요해요."]}'::jsonb,
  '아기가 딸꾹딸꾹 하는 것은 숨 쉬는 연습을 하고 있다는 신호예요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 28
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '28주 4일차',
  '{"items": ["28주부터 태반을 통해 엄마로부터 항체를 본격적으로 흡수하기 시작하면서, 태아 면역 체계 발달의 첫 번째 큰 단계가 시작돼요.", "이 항체들은 아기가 세상에 나왔을 때 감염으로부터 방어막이 되어 줄 뿐 아니라, 아기 스스로 항체를 만들어 내도록 면역 시스템을 ‘훈련’시키는 역할도 합니다."]}'::jsonb,
  '{"items": ["탈수, 많이 서 있던 날, 과한 활동, 한 자세로 오래 앉아 있음 등이 브랙스턴 힉스 수축(가진통)을 더 자주 느끼게 하는 요인일 수 있어요.", "이상하게 생생한 꿈, 출산·육아에 대한 불안이 반영된 꿈, 성적인 꿈 등이 자주 나타날 수 있는데, 이는 호르몬 변화와 수면 중단, 임신에 대한 감정이 뒤섞인 자연스러운 현상으로 보고돼요."]}'::jsonb,
  '아기는 요즘 엄마에게서 보이지 않는 방패를 선물 받고 있어요. 엄마가 싸워서 얻은 면역을 조금씩 나누어 받으면서, 세상에 나갈 준비를 하고 있어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 28
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '28주 5일차',
  '{"items": ["28주 아기의 뇌와 자율신경계는 심장 박동, 호흡 운동, 체온 조절 같은 비자발적 기능을 조율하는 힘을 점점 더 키워가고 있어요.", "깨어 있을 때와 잘 때가 구분된 수면 패턴을 가지며, REM 수면(빠른 안구 운동)도 나타나 아기가 꿈을 꾸고 있을 가능성이 있다고 여겨져요."]}'::jsonb,
  '{"items": ["임신 3분기에는 가슴에서 노란빛 액체(초유, colostrum)가 브라나 옷에 작게 묻어날 수 있어요. 초유는 항체와 영양소가 매우 풍부해 ‘액체 금’이라고 불릴 정도로 아기에게 소중한 첫 모유예요.", "호르몬 변화로 피부 발진·가벼운 두드러기가 생기거나, 코 점막 혈관이 약해져 코피가 더 쉽게 나는 것도 흔한 변화예요."]}'::jsonb,
  '아기는 이제 어느 정도 스스로 숨쉬는 연습을 하고, 심장박동 리듬도 지켜 가며, 잠도 깊게 자고 얕게 자는 패턴을 연습하는 중이에요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 28
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '28주 6일차',
  '{"items": ["28주에 태어난 아기는 신생아 중환자실에서 호흡 보조·인큐베이터·집중 치료를 받으면 생존 가능성이 꽤 높은 수준이에요.", "하지만 폐와 면역·체온조절 능력은 여전히 더 성숙해야 하므로, 지금은 “살 수 있다”가 아니라덜 위험하게 살 수 있다”에 가까운 단계예요. 그래서 엄마 배 속에서 조금이라도 더 오래 있는 것이 아기에게는 여전히 가장 큰 보호예요."]}'::jsonb,
  '{"items": ["임신 후반에는 임신성 당뇨가 발견되기 쉬운 시기로, 비만·임신 전 BMI 30 이상 등은 위험을 높여요.", "임신성 당뇨가 진단되더라도, 많은 경우 식이조절과 운동으로 혈당을 관리할 수 있고, 오히려 식사를 거르면 저혈당·폭식·혈당 변동이 커져 좋지 않기 때문에, “조금씩 규칙적으로 먹는 것”이 중요해요."]}'::jsonb,
  '아기는 12주 뒤에 만나게 될 예정이며, 함께 할 수 있는 만큼 이 안의 시간을 채워 가고 싶어 해요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 28
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '28주 7일차',
  '{"items": ["가지만 한 크기(약 37~40cm, 1,000~1,200g)로 자라났고, 형태 발달보다 몸무게와 피하지방을 채우는 성장 단계에 들어서 통통하고 매끈한 신생아 모습에 더 가까워졌으며, 청각·후각·촉각·시각·자율신경계를 정교하게 다듬었어요."]}'::jsonb,
  '{"items": ["28주부터는 아기가 더 크고 힘이 세져 발길질·구르기·돌기가 더 뚜렷해지고, 파트너도 배 위에 손을 얹으면 아기의 움직임을 느낄 수 있어요.", "3분기에는태동횟수를 시작하는 것이 권장돼요. 하루 중 아기가 가장 활발한 시간대에, 10번의 움직임을 느끼는 데 걸리는 시간을 재어 기록하는 방식으로, 보통 2시간 이내에 10회 이상 느끼는 것이 일반적인 기준이에요.", "자궁·아기의 무게가 골반저를 계속 눌러 요실금이 흔해지는 시기라, 골반저 근육 강화 운동(케겔 운동)이 중요해요."]}'::jsonb,
  '아기는 귀, 코, 피부, 눈으로 세상을 미리 느끼고 있고, 엄마를 통해 방패도 만들고 있어요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 28
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 28)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w28-d1-cl-1', '다음 산전 진료일과 3분기를 시작하며,궁금한 점을 적어두기. (진료가 2주 간격으로 자주 잡히기 시작하는 단계라는 것도 함께 적어두면 좋아요.)', '다음 산전 진료일과 3분기를 시작하며,궁금한 점을 적어두기. (진료가 2주 간격으로 자주 잡히기 시작하는 단계라는 것도 함께 적어두면 좋아요.)', '{"items": [{"id": "w28-d1-cl-1", "label": "다음 산전 진료일과 3분기를 시작하며,궁금한 점을 적어두기. (진료가 2주 간격으로 자주 잡히기 시작하는 단계라는 것도 함께 적어두면 좋아요.)"}]}'::jsonb, 1, true),
    (1, 'w28-d1-cl-2', '하루 식단을 돌아보며, 세 끼에 더해 작은 간식 2~3번(견과류·과일·요거트 등)을 채우는 방식으로 450kcal를 나누어 채워보기.', '하루 식단을 돌아보며, 세 끼에 더해 작은 간식 2~3번(견과류·과일·요거트 등)을 채우는 방식으로 450kcal를 나누어 채워보기.', '{"items": [{"id": "w28-d1-cl-2", "label": "하루 식단을 돌아보며, 세 끼에 더해 작은 간식 2~3번(견과류·과일·요거트 등)을 채우는 방식으로 450kcal를 나누어 채워보기."}]}'::jsonb, 2, true),
    (1, 'w28-d1-cl-3', '오늘의 몸무게를 기록하고, 변화 양상을 확인하기.', '오늘의 몸무게를 기록하고, 변화 양상을 확인하기.', '{"items": [{"id": "w28-d1-cl-3", "label": "오늘의 몸무게를 기록하고, 변화 양상을 확인하기."}]}'::jsonb, 3, true),
    (2, 'w28-d2-cl-1', '계단이나 언덕은 일부러 속도를 줄이고, 중간중간 숨 고르기 스탑을 허용해 주기. “예전처럼” 걷지 못한다고 자책하지 않기.', '계단이나 언덕은 일부러 속도를 줄이고, 중간중간 숨 고르기 스탑을 허용해 주기. “예전처럼” 걷지 못한다고 자책하지 않기.', '{"items": [{"id": "w28-d2-cl-1", "label": "계단이나 언덕은 일부러 속도를 줄이고, 중간중간 숨 고르기 스탑을 허용해 주기. “예전처럼” 걷지 못한다고 자책하지 않기."}]}'::jsonb, 1, true),
    (2, 'w28-d2-cl-2', '의자에서 일어날 때는 허리를 먼저 세우지 말고, 엉덩이를 뒤로 빼며 상체를 약간 앞으로 숙이는 ‘힙 힌지’ 자세로 일어나기. 허리에 실리는 부담을 줄여줘요.', '의자에서 일어날 때는 허리를 먼저 세우지 말고, 엉덩이를 뒤로 빼며 상체를 약간 앞으로 숙이는 ‘힙 힌지’ 자세로 일어나기. 허리에 실리는 부담을 줄여줘요.', '{"items": [{"id": "w28-d2-cl-2", "label": "의자에서 일어날 때는 허리를 먼저 세우지 말고, 엉덩이를 뒤로 빼며 상체를 약간 앞으로 숙이는 ‘힙 힌지’ 자세로 일어나기. 허리에 실리는 부담을 줄여줘요."}]}'::jsonb, 2, true),
    (2, 'w28-d2-cl-3', '식사 후 바로 눕지 않고, 상체를 약간 세운 상태로 20~30분 앉아 있거나 기대어 쉬기. 속쓰림·숨참이 조금 줄어드는지 관찰해 보기.', '식사 후 바로 눕지 않고, 상체를 약간 세운 상태로 20~30분 앉아 있거나 기대어 쉬기. 속쓰림·숨참이 조금 줄어드는지 관찰해 보기.', '{"items": [{"id": "w28-d2-cl-3", "label": "식사 후 바로 눕지 않고, 상체를 약간 세운 상태로 20~30분 앉아 있거나 기대어 쉬기. 속쓰림·숨참이 조금 줄어드는지 관찰해 보기."}]}'::jsonb, 3, true),
    (3, 'w28-d3-cl-1', '오늘부터 불편한 증상이 심해질 때마다, “언제, 어디가, 얼마나, 어떤 느낌으로” 불편했는지 짧게 메모해 두기. 다음 진료 때 자간전증·부종·두통 등을 설명할 때 큰 도움이 돼요.', '오늘부터 불편한 증상이 심해질 때마다, “언제, 어디가, 얼마나, 어떤 느낌으로” 불편했는지 짧게 메모해 두기. 다음 진료 때 자간전증·부종·두통 등을 설명할 때 큰 도움이 돼요.', '{"items": [{"id": "w28-d3-cl-1", "label": "오늘부터 불편한 증상이 심해질 때마다, “언제, 어디가, 얼마나, 어떤 느낌으로” 불편했는지 짧게 메모해 두기. 다음 진료 때 자간전증·부종·두통 등을 설명할 때 큰 도움이 돼요."}]}'::jsonb, 1, true),
    (3, 'w28-d3-cl-2', '장시간 앉아 있을 때는 1시간마다 일어나서 3~5분 정도 다리 스트레칭·간단한 걷기를 하여 부종·정맥 압박을 풀어주기.', '장시간 앉아 있을 때는 1시간마다 일어나서 3~5분 정도 다리 스트레칭·간단한 걷기를 하여 부종·정맥 압박을 풀어주기.', '{"items": [{"id": "w28-d3-cl-2", "label": "장시간 앉아 있을 때는 1시간마다 일어나서 3~5분 정도 다리 스트레칭·간단한 걷기를 하여 부종·정맥 압박을 풀어주기."}]}'::jsonb, 2, true),
    (3, 'w28-d3-cl-3', '치질·변비 예방을 위해, 오늘 하루 물한잔 더 마시기', '치질·변비 예방을 위해, 오늘 하루 물한잔 더 마시기', '{"items": [{"id": "w28-d3-cl-3", "label": "치질·변비 예방을 위해, 오늘 하루 물한잔 더 마시기"}]}'::jsonb, 3, true),
    (4, 'w28-d4-cl-1', '아기에게 씌워줄 귀여운 모자와 아기를 감싸줄 포대기 천을 찾아보기.', '아기에게 씌워줄 귀여운 모자와 아기를 감싸줄 포대기 천을 찾아보기.', '{"items": [{"id": "w28-d4-cl-1", "label": "아기에게 씌워줄 귀여운 모자와 아기를 감싸줄 포대기 천을 찾아보기."}]}'::jsonb, 1, true),
    (4, 'w28-d4-cl-2', '오늘 밤은 “이상한 꿈”을 꿨다면 그 속에 담긴 나의 걱정을 찾아보고, 내 마음의 메시지로 해석해 보기.', '오늘 밤은 “이상한 꿈”을 꿨다면 그 속에 담긴 나의 걱정을 찾아보고, 내 마음의 메시지로 해석해 보기.', '{"items": [{"id": "w28-d4-cl-2", "label": "오늘 밤은 “이상한 꿈”을 꿨다면 그 속에 담긴 나의 걱정을 찾아보고, 내 마음의 메시지로 해석해 보기."}]}'::jsonb, 2, true),
    (4, 'w28-d4-cl-3', '오늘은 아기를 만날 그날에 대해 조금 더 구체적으로 상상해보기.', '오늘은 아기를 만날 그날에 대해 조금 더 구체적으로 상상해보기.', '{"items": [{"id": "w28-d4-cl-3", "label": "오늘은 아기를 만날 그날에 대해 조금 더 구체적으로 상상해보기."}]}'::jsonb, 3, true),
    (5, 'w28-d5-cl-1', '브라 안쪽에 작은 노란 얼룩이 보이면, 초유임을 알아채기, 필요하다면 수유 패드 사용 시작해 보기.', '브라 안쪽에 작은 노란 얼룩이 보이면, 초유임을 알아채기, 필요하다면 수유 패드 사용 시작해 보기.', '{"items": [{"id": "w28-d5-cl-1", "label": "브라 안쪽에 작은 노란 얼룩이 보이면, 초유임을 알아채기, 필요하다면 수유 패드 사용 시작해 보기."}]}'::jsonb, 1, true),
    (5, 'w28-d5-cl-2', '코피가 나면 눕지 말고 앉아서, 코를 콧구멍 위에서 10~15분 정도 눌러 지혈하고, 코 위에 차가운 찜질을 대기. 자주 반복되면 진료 때 꼭 이야기하기.', '코피가 나면 눕지 말고 앉아서, 코를 콧구멍 위에서 10~15분 정도 눌러 지혈하고, 코 위에 차가운 찜질을 대기. 자주 반복되면 진료 때 꼭 이야기하기.', '{"items": [{"id": "w28-d5-cl-2", "label": "코피가 나면 눕지 말고 앉아서, 코를 콧구멍 위에서 10~15분 정도 눌러 지혈하고, 코 위에 차가운 찜질을 대기. 자주 반복되면 진료 때 꼭 이야기하기."}]}'::jsonb, 2, true),
    (5, 'w28-d5-cl-3', '가려운 발진·붉은 구진이 나타나면 사진을 찍어두고, 다음 진료에서 보여줄 수 있도록 기록 남기기. 심한 가려움·수포·발열이 동반되면 조기에 상담하기.', '가려운 발진·붉은 구진이 나타나면 사진을 찍어두고, 다음 진료에서 보여줄 수 있도록 기록 남기기. 심한 가려움·수포·발열이 동반되면 조기에 상담하기.', '{"items": [{"id": "w28-d5-cl-3", "label": "가려운 발진·붉은 구진이 나타나면 사진을 찍어두고, 다음 진료에서 보여줄 수 있도록 기록 남기기. 심한 가려움·수포·발열이 동반되면 조기에 상담하기."}]}'::jsonb, 3, true),
    (6, 'w28-d6-cl-1', '임신성 당뇨가 있든 없든 끼니를 거르지 않고, 정해진 시간에 탄수화물·단백질·지방이 섞인 식사를 조금씩 나눠 먹는 연습을 해 보기.', '임신성 당뇨가 있든 없든 끼니를 거르지 않고, 정해진 시간에 탄수화물·단백질·지방이 섞인 식사를 조금씩 나눠 먹는 연습을 해 보기.', '{"items": [{"id": "w28-d6-cl-1", "label": "임신성 당뇨가 있든 없든 끼니를 거르지 않고, 정해진 시간에 탄수화물·단백질·지방이 섞인 식사를 조금씩 나눠 먹는 연습을 해 보기."}]}'::jsonb, 1, true),
    (6, 'w28-d6-cl-2', '집에 어린아이·고양이·반려동물이 있다면, 만지거나 변을 처리한 후 손 20초 이상 씻기.', '집에 어린아이·고양이·반려동물이 있다면, 만지거나 변을 처리한 후 손 20초 이상 씻기.', '{"items": [{"id": "w28-d6-cl-2", "label": "집에 어린아이·고양이·반려동물이 있다면, 만지거나 변을 처리한 후 손 20초 이상 씻기."}]}'::jsonb, 2, true),
    (6, 'w28-d6-cl-3', '아로마 향을 맡으러 가보기. 세나 잎·라즈베리 잎처럼 자궁 수축을 촉진할 수 있는 허브는 36주 이전에는 피하기.', '아로마 향을 맡으러 가보기. 세나 잎·라즈베리 잎처럼 자궁 수축을 촉진할 수 있는 허브는 36주 이전에는 피하기.', '{"items": [{"id": "w28-d6-cl-3", "label": "아로마 향을 맡으러 가보기. 세나 잎·라즈베리 잎처럼 자궁 수축을 촉진할 수 있는 허브는 36주 이전에는 피하기."}]}'::jsonb, 3, true),
    (7, 'w28-d7-cl-1', '조용한 시간에 누워(또는 편안히 앉아서) 태동을 세어보기. 아기가 10번 움직이는 데 걸리는 시간을 적어보기.', '조용한 시간에 누워(또는 편안히 앉아서) 태동을 세어보기. 아기가 10번 움직이는 데 걸리는 시간을 적어보기.', '{"items": [{"id": "w28-d7-cl-1", "label": "조용한 시간에 누워(또는 편안히 앉아서) 태동을 세어보기. 아기가 10번 움직이는 데 걸리는 시간을 적어보기."}]}'::jsonb, 1, true),
    (7, 'w28-d7-cl-2', '케겔 운동: 숨을 내쉰 뒤, 질·항문 주변 근육을 5초간 조여 올렸다가 5초 쉬는 동작 10회를 아침·저녁 한 번씩 해 보기.', '케겔 운동: 숨을 내쉰 뒤, 질·항문 주변 근육을 5초간 조여 올렸다가 5초 쉬는 동작 10회를 아침·저녁 한 번씩 해 보기.', '{"items": [{"id": "w28-d7-cl-2", "label": "케겔 운동: 숨을 내쉰 뒤, 질·항문 주변 근육을 5초간 조여 올렸다가 5초 쉬는 동작 10회를 아침·저녁 한 번씩 해 보기."}]}'::jsonb, 2, true),
    (7, 'w28-d7-cl-3', '아기를 만날 그날에 대해 구체적으로 상상해보기', '아기를 만날 그날에 대해 구체적으로 상상해보기', '{"items": [{"id": "w28-d7-cl-3", "label": "아기를 만날 그날에 대해 구체적으로 상상해보기"}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 28)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w28-d1-q-1', '“28주동안 가지만큼 키워낸 나의 몸에게 오늘 어떤 말을 해주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w28-d1-q-2', '“첫 번째 시작이 ‘용기’, 두 번째가 ‘의지’였다면, 세 번째 시작에는 어떤 마음이 담겨야 할까요? 두려움, 기대, 평온 중 어떤 감정이 더 크게 다가오나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w28-d2-q-1', '“아기가 자라며생각을 넓혀가고 깊어질 때, 어떤 방식으로 ‘생각하는 아이’가 되길 바라나요? 사고를 넓히는 힘을 키워주기 위해 어떤 질문을 자주 해줄 예정인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w28-d2-q-2', '“새로운 것을 배우고, 이해하고, 받아들이는 순간마다 뇌의 주름은 더 깊어지고 넓어진다고 합니다. 최근에 엄마의 생각을 가장 확장시킨 순간은 언제였나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w28-d3-q-1', '“살아오면서, 무언가를 시작하기 전 수없이 연습해 보았던 순간이 있나요? 그리고 실제로 그 첫 무대에 섰을 때, 그때의 감상은 어떤가요? 연습과 비슷했나요, 혹은 달랐나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w28-d3-q-2', '“첫 무대에서 넘어지거나, 실수하거나, 울어버린다 해도 그 경험은 전부가 아니고 일부일테죠, 그때 엄마는 아기에게어떤 것을 알려주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w28-d4-q-1', '“요즘 자주 꾸는 꿈이나 반복되는 장면이 있다면, 그 꿈이 나에게 전하고 싶은 메시지는 무엇 같나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w28-d4-q-2', '“지금의 나는, 나도 모르는 사이에 누군가의 싸움 덕분에 여기까지 안전하게 성장할 수 있었습니다. 엄마가 이미 이어받고 있는 ‘보이지 않는 방어’가 있다면 그것은 어떤 것일까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w28-d5-q-1', '“내 아이를 위해 다짐하고 있는 ‘나만의 돌봄 방식’이 있나요? 그 돌봄의 중심에는 어떤 가치가 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w28-d5-q-2', '“모유 수유에 대해 기대되는 마음과 동시에 부담이나 두려움이 있다면, 그것은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w28-d6-q-1', '“당뇨나 체중에 대한 설명을 들을 때, 나는 나를 얼마나 엄격하게 대하나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w28-d6-q-2', '“아기가 내 항체와 백신의 도움을 받아 세상을 견딜 준비를 하는 것처럼, 나도 앞으로의 육아를 견디기 위해 어떤 도움과 지지를 미리 준비해 두고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w28-d7-q-1', '“아직 12주가량 시간이 더 있어야 하겠지만 3분기의 시작은 출산을 향한 세 번째 계단에 올라섰음을 의미해요. 아직 이를 수 있지만 어렴풋이 출산을 떠올릴 때 가장 먼저 떠오르는 감정은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w28-d7-q-2', '“출산을 떠올릴 때, ‘어떻게 지지받고 싶을까’에 초점을 맞춘다면, 나는 누구에게 어떤 역할을 부탁하고 싶나요? 엄마, 남편, 친구 등 떠오르는 사람을 생각해볼까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 29 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  29,
  '29주차 발달 정보',
  '임신 29주 아기는 땅콩 호박, 맥북 프로 정도의 크기로, 머리부터 발끝까지 약 38.6~39cm, 몸무게는 약 1.2~1.38kg 정도예요. 자궁 안 공간이 점점 좁아지고 있지만, 여전히 발로 차고, 밀고, 스트레칭하고, 손으로 잡는 동작은 아주 활발하게 하고 있어요.',
  '3분기에는 매주 약 450g 정도씩 체중이 증가할 수 있고, 지금까지 대략 엄마의 체중은 8.6~11.3kg 정도 늘어났을 수 있어요. 자궁이 급격히 자라면서 폐를 위로 밀어올려 숨이 가빠지고, 조금만 걸어도 숨이 차는 느낌이 더 자주 나타날 수 있어요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '29주 1일차',
  '{"items": ["임신 29주 아기는 땅콩 호박, 맥북 프로 정도의 크기로, 머리부터 발끝까지 약 38.6~39cm, 몸무게는 약 1.2~1.38kg 정도예요.", "자궁 안 공간이 점점 좁아지고 있지만, 여전히 발로 차고, 밀고, 스트레칭하고, 손으로 잡는 동작은 아주 활발하게 하고 있어요."]}'::jsonb,
  '{"items": ["3분기에는 매주 약 450g 정도씩 체중이 증가할 수 있고, 지금까지 대략 엄마의 체중은 8.6~11.3kg 정도 늘어났을 수 있어요.", "자궁이 급격히 자라면서 폐를 위로 밀어올려 숨이 가빠지고, 조금만 걸어도 숨이 차는 느낌이 더 자주 나타날 수 있어요."]}'::jsonb,
  '아기는 이곳이 조금씩 좁아지고 있지만, 여전히 힘껏 차고, 몸을 쭉 뻗으며, 엄마 배 안에서 나름대로 운동을 열심히 하고 있어요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 29
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '29주 2일차',
  '{"items": ["아기의 뼈는 점점 더 단단해지면서, 매일 약 250mg의 칼슘을 골격에 축적하고 있어요.", "신경계 주변에 보호막(마이엘린)이 형성되기 시작하고, 이 보호막 형성은 출생 이후에도 계속 이어지며, 아기의 신경 신호 전달을 빠르고 안정되게 도와줘요."]}'::jsonb,
  '{"items": ["아기가 자라날수록, 엄마 몸에서도 칼슘과 마그네슘, 비타민 D·K의 충분한 공급이 더 중요해져요.", "자궁이 크고 체중이 늘면서 관절과 인대가 이완되어 전신 통증과 균형감각 저하가 나타날 수 있어, 평소보다 넘어짐에 특히 더 주의해야 해요."]}'::jsonb,
  '매일매일 엄마의 영양분이 아기에게 건너와, 앞으로 걸을 수 있고, 넘어져도 다시 일어날 수 있는 튼튼한 몸을 만들어 주고 있어요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 29
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '29주 3일차',
  '{"items": ["29주에는 눈꺼풀이 완전히 형성되어 아기가 눈을 뜨고 감기 시작하고, 자궁 밖에서 들어오는 밝은 빛의 방향을 따라 얼굴을 돌릴 수 있어요."]}'::jsonb,
  '{"items": ["자궁이 방광과 위를 압박하고, 아기가 밤에 더 활발하게 움직이면서 수면 장애와 불면이 잦아져요.", "밤에는 빈뇨·야간 배뇨가 증가해 2~3번 이상 깨는 일이 흔하지만, 그렇다고 해서 물 섭취를 과도하게 줄이면 탈수·변비·두통이 더 심해질 수 있어서, 자기 전 1~2시간만 조절하는 것이 좋아요."]}'::jsonb,
  '아기는 이제 눈을 깜박일 수 있어요. 배 밖에서 들어오는 빛이 느껴지면, 얼굴을 그쪽으로 살짝 돌려 보기도 해요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 29
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '29주 4일차',
  '{"items": ["아기의 피부는 피하지방과 지방세포가 늘어나면서 더 두껍고 불투명해지고, 이전의 쭈글쭈글한 모습에서 점점 통통하고 아기다운 피부로 변해 가고 있어요.", "지금까지 온몸 가득 피부를 두껍게 싸서 보호하던 태지(vernix)는 조금씩 사라지기 시작하고, 대신 털(배냇털)은 더 두꺼워져 아기의 몸을 감싸게 돼요."]}'::jsonb,
  '{"items": ["혈액량이 늘어나고 커진 자궁이 혈관을 압박하면서, 어지럼증·실신 느낌·저혈압 또는 저혈당 증상이 나타날 수 있어요.", "임신 후기에는 빈혈(특히 철분 부족성 빈혈) 위험이 높아지며, 피로감·무기력·숨참·어지럼증이 더 심해질 수 있어요."]}'::jsonb,
  '아기의 몸이 통통해지고 있어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 29
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '29주 5일차',
  '{"items": ["아기의 움직임은 여전히 매우 활발해서, 강한 발차기, 밀어내기, 공중제비 같은 움직임을 자주 느낄 수 있어요.", "출산을 준비하기 위해 머리를 아래로 두는 두위자세를 취하기 시작하는 경우가 많고, 지금은 약 25%가 아직 머리를 위에 두고 놀지만 만삭에 가까워질수록 대부분 두위로 자리잡게 돼요."]}'::jsonb,
  '{"items": ["자궁이 커지고 인대·관절이 이완되면서, 요통·엉덩이 통증·골반 통증이 자주 나타나고, 하복부나 옆구리가 찌릿하게 아플 수 있어요.", "커진 자궁과 소화기관 압박, 장운동 저하로 속쓰림, 가스, 복부 팽만, 변비, 치질 등이 한꺼번에 찾아오기 쉬운 시기예요. 신체적으로 힘든 시간일 수 있어요."]}'::jsonb,
  '아기는 요즘 거꾸로 돌아 눕는 연습을 하고 있어요. 자궁 안이 점점 좁아지지만, 여전히 발로 찰 힘은 충분해서, 가끔은 엄마가 ‘아야!’ 할 만큼 세게 밀어 보기도 해요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 29
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '29주 6일차',
  '{"items": ["태반을 통해 전달되는 항체의 양이 점점 더 늘어나, 아기의 면역체계는 출생 후를 대비하여 방어력을 차곡차곡 쌓아가고 있어요."]}'::jsonb,
  '{"items": ["임신 후기에는 긴장·불안·설렘이 뒤섞인 감정 변화가 더 뚜렷해질 수 있어요. “잘할 수 있을까?”라는 생각과 “빨리 보고 싶다”는 마음이 번갈아 밀려올 수 있죠.", "이 시기는 아기 용품, 출산 준비물, 산후조리 환경을 하나씩 정리하며 현실적인 준비와 정서적인 준비를 동시에 진행하는 시기예요."]}'::jsonb,
  '아기가 엄마에게서 받는 영양분은 세상에 나갔을 때 조금 덜 위험하게 부딪히고 넘어질 수 있도록 도와줄 거예요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 29
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '29주 7일차',
  '{"items": ["땅콩버터만한 크기(약 38.6~39cm, 1.2~1.38kg)로 자라났고, 매일 약 250mg의 칼슘을 뼈와 치아에 축적하며 골격을 더 단단하게 만들고, 빛을 향해 고개를 돌리고 잠든 얼굴에 작은 미소를 지을 정도로 감각과 뇌 기능을 키웠어요."]}'::jsonb,
  '{"items": ["아기의 딸꾹질은 작고 리드미컬한 움직임으로 느껴질 수 있으며, 정상적인 현상이고 폐 성숙과 뇌-횡격막 연결 형성에 도움이 될 수 있다는 연구도 있어요.", "3분기에는 체중 증가, 혈관 압박, 빈혈·저혈당, 혈압 변화로 인해 어지럼증·실신 느낌·두통이 나타날 수 있어서, 스스로의 몸 신호를 잘 관찰하는 것이 중요해요."]}'::jsonb,
  '이번 주 아기는 무겁고 단단해지고, 더 생각이 많아진 아기가 되었어요. 아직 엄마 배 속에서 해야 할 연습이 많지만, 하나하나 해내고 있어요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 29
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 29)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w29-d1-cl-1', '산모 수첩에, “29주 이후 진료 일정”을 적어 두기: 29주부터는 보통 2주에 1번, 36주 이후에는 주 1회 진료가 예정된다는 점을 적어두면 마음이 조금 더 준비돼요.', '산모 수첩에, “29주 이후 진료 일정”을 적어 두기: 29주부터는 보통 2주에 1번, 36주 이후에는 주 1회 진료가 예정된다는 점을 적어두면 마음이 조금 더 준비돼요.', '{"items": [{"id": "w29-d1-cl-1", "label": "산모 수첩에, “29주 이후 진료 일정”을 적어 두기: 29주부터는 보통 2주에 1번, 36주 이후에는 주 1회 진료가 예정된다는 점을 적어두면 마음이 조금 더 준비돼요."}]}'::jsonb, 1, true),
    (1, 'w29-d1-cl-2', '몸무게를 재면서 단순히 숫자만 보지 말고, 그 안에 아기·양수·태반·혈액·조직이 함께 포함되어 있다는 사실을 떠올리며, “수고했어”라는 말을 내 몸에게 한 번 건네 보기.', '몸무게를 재면서 단순히 숫자만 보지 말고, 그 안에 아기·양수·태반·혈액·조직이 함께 포함되어 있다는 사실을 떠올리며, “수고했어”라는 말을 내 몸에게 한 번 건네 보기.', '{"items": [{"id": "w29-d1-cl-2", "label": "몸무게를 재면서 단순히 숫자만 보지 말고, 그 안에 아기·양수·태반·혈액·조직이 함께 포함되어 있다는 사실을 떠올리며, “수고했어”라는 말을 내 몸에게 한 번 건네 보기."}]}'::jsonb, 2, true),
    (1, 'w29-d1-cl-3', '오늘 숨이 더 찼다면, 계단·언덕은 천천히, 중간에 한 번 쉬기를 기본으로 정해 보기.', '오늘 숨이 더 찼다면, 계단·언덕은 천천히, 중간에 한 번 쉬기를 기본으로 정해 보기.', '{"items": [{"id": "w29-d1-cl-3", "label": "오늘 숨이 더 찼다면, 계단·언덕은 천천히, 중간에 한 번 쉬기를 기본으로 정해 보기."}]}'::jsonb, 3, true),
    (2, 'w29-d2-cl-1', '오늘 식단에 칼슘과 마그네슘이 풍부한 음식을 한 가지씩 의도적으로 더 넣어보기: (칼슘 보충 우유·요거트·치즈, 두부·콩류, 멸치, 통밀빵, 견과류, 진녹색 채소) 등.', '오늘 식단에 칼슘과 마그네슘이 풍부한 음식을 한 가지씩 의도적으로 더 넣어보기: (칼슘 보충 우유·요거트·치즈, 두부·콩류, 멸치, 통밀빵, 견과류, 진녹색 채소) 등.', '{"items": [{"id": "w29-d2-cl-1", "label": "오늘 식단에 칼슘과 마그네슘이 풍부한 음식을 한 가지씩 의도적으로 더 넣어보기: (칼슘 보충 우유·요거트·치즈, 두부·콩류, 멸치, 통밀빵, 견과류, 진녹색 채소) 등."}]}'::jsonb, 1, true),
    (2, 'w29-d2-cl-2', '발목이나 허리,복부에 임신용 테이핑하는 방법 공부하기.', '발목이나 허리,복부에 임신용 테이핑하는 방법 공부하기.', '{"items": [{"id": "w29-d2-cl-2", "label": "발목이나 허리,복부에 임신용 테이핑하는 방법 공부하기."}]}'::jsonb, 2, true),
    (2, 'w29-d2-cl-3', '침대 근처에 안전하게 잡을 수 있는 곳이나 잠시 앉을 의자 공간을 만들어 두어 혹시 일어나다 어지러워도 넘어지지 않도록 준비하기.', '침대 근처에 안전하게 잡을 수 있는 곳이나 잠시 앉을 의자 공간을 만들어 두어 혹시 일어나다 어지러워도 넘어지지 않도록 준비하기.', '{"items": [{"id": "w29-d2-cl-3", "label": "침대 근처에 안전하게 잡을 수 있는 곳이나 잠시 앉을 의자 공간을 만들어 두어 혹시 일어나다 어지러워도 넘어지지 않도록 준비하기."}]}'::jsonb, 3, true),
    (3, 'w29-d3-cl-1', '낮 동안에는 자주 물을 마시되, 잠들기 1~2시간 전에는 물·카페인 음료를 조금 줄여 밤에 화장실을 가기 위해 깨어나는 횟수를 조절해 보기.', '낮 동안에는 자주 물을 마시되, 잠들기 1~2시간 전에는 물·카페인 음료를 조금 줄여 밤에 화장실을 가기 위해 깨어나는 횟수를 조절해 보기.', '{"items": [{"id": "w29-d3-cl-1", "label": "낮 동안에는 자주 물을 마시되, 잠들기 1~2시간 전에는 물·카페인 음료를 조금 줄여 밤에 화장실을 가기 위해 깨어나는 횟수를 조절해 보기."}]}'::jsonb, 1, true),
    (3, 'w29-d3-cl-2', '슬슬 왼쪽으로 눕는 자세를 “편하기 위한 선택”을 넘어, 아기에게도 더 좋은 자세라는 점을 기억하기: 왼쪽으로 누우면 엄마의 큰 혈관 압박이 줄어 태반과 아기로 가는 혈류가 더 좋아질 수 있어요.', '슬슬 왼쪽으로 눕는 자세를 “편하기 위한 선택”을 넘어, 아기에게도 더 좋은 자세라는 점을 기억하기: 왼쪽으로 누우면 엄마의 큰 혈관 압박이 줄어 태반과 아기로 가는 혈류가 더 좋아질 수 있어요.', '{"items": [{"id": "w29-d3-cl-2", "label": "슬슬 왼쪽으로 눕는 자세를 “편하기 위한 선택”을 넘어, 아기에게도 더 좋은 자세라는 점을 기억하기: 왼쪽으로 누우면 엄마의 큰 혈관 압박이 줄어 태반과 아기로 가는 혈류가 더 좋아질 수 있어요."}]}'::jsonb, 2, true),
    (3, 'w29-d3-cl-3', '잠들기 전, 복식 호흡(천천히 코로 들이마시고 긴 숨으로 입으로 내쉬기)을 5분 정도 해 보기.', '잠들기 전, 복식 호흡(천천히 코로 들이마시고 긴 숨으로 입으로 내쉬기)을 5분 정도 해 보기.', '{"items": [{"id": "w29-d3-cl-3", "label": "잠들기 전, 복식 호흡(천천히 코로 들이마시고 긴 숨으로 입으로 내쉬기)을 5분 정도 해 보기."}]}'::jsonb, 3, true),
    (4, 'w29-d4-cl-1', '갑자기 일어날 때는 서두르지 말고, 먼저 옆으로 돌아누운 다음 천천히 상체를 세우고, 그다음에 일어나기.', '갑자기 일어날 때는 서두르지 말고, 먼저 옆으로 돌아누운 다음 천천히 상체를 세우고, 그다음에 일어나기.', '{"items": [{"id": "w29-d4-cl-1", "label": "갑자기 일어날 때는 서두르지 말고, 먼저 옆으로 돌아누운 다음 천천히 상체를 세우고, 그다음에 일어나기."}]}'::jsonb, 1, true),
    (4, 'w29-d4-cl-2', '철분이 풍부한 음식(붉은 살코기, 간, 시금치, 콩류, 철분 강화 시리얼 등)과 비타민 C가 풍부한 음식(귤, 키위, 파프리카 등)을 함께 섭취해 철분 흡수를 돕기.', '철분이 풍부한 음식(붉은 살코기, 간, 시금치, 콩류, 철분 강화 시리얼 등)과 비타민 C가 풍부한 음식(귤, 키위, 파프리카 등)을 함께 섭취해 철분 흡수를 돕기.', '{"items": [{"id": "w29-d4-cl-2", "label": "철분이 풍부한 음식(붉은 살코기, 간, 시금치, 콩류, 철분 강화 시리얼 등)과 비타민 C가 풍부한 음식(귤, 키위, 파프리카 등)을 함께 섭취해 철분 흡수를 돕기."}]}'::jsonb, 2, true),
    (4, 'w29-d4-cl-3', '집 안에서 미끄러운 러그·선 정리, 야간 조명 설치 등을 통해 낙상 위험을 줄이는 환경을 만들기. 특히 새벽에 화장실 갈 때를 생각해서 발밑이 잘 보이도록 준비해 두기.', '집 안에서 미끄러운 러그·선 정리, 야간 조명 설치 등을 통해 낙상 위험을 줄이는 환경을 만들기. 특히 새벽에 화장실 갈 때를 생각해서 발밑이 잘 보이도록 준비해 두기.', '{"items": [{"id": "w29-d4-cl-3", "label": "집 안에서 미끄러운 러그·선 정리, 야간 조명 설치 등을 통해 낙상 위험을 줄이는 환경을 만들기. 특히 새벽에 화장실 갈 때를 생각해서 발밑이 잘 보이도록 준비해 두기."}]}'::jsonb, 3, true),
    (5, 'w29-d5-cl-1', '허리·골반 통증을 줄이기 위해, 앉았다 일어날 때 힙 힌지(엉덩이를 뒤로 빼고 상체를 살짝 숙인 상태에서 일어나기) 자세를 의식적으로 사용해 보기.', '허리·골반 통증을 줄이기 위해, 앉았다 일어날 때 힙 힌지(엉덩이를 뒤로 빼고 상체를 살짝 숙인 상태에서 일어나기) 자세를 의식적으로 사용해 보기.', '{"items": [{"id": "w29-d5-cl-1", "label": "허리·골반 통증을 줄이기 위해, 앉았다 일어날 때 힙 힌지(엉덩이를 뒤로 빼고 상체를 살짝 숙인 상태에서 일어나기) 자세를 의식적으로 사용해 보기."}]}'::jsonb, 1, true),
    (5, 'w29-d5-cl-2', '식사량을 줄이기보다는 한 번에 먹는 양을 줄이고, 자주·조금씩(소량 다회 식사) 먹는 방식으로 속쓰림과 복부 팽만을 줄여 보기.', '식사량을 줄이기보다는 한 번에 먹는 양을 줄이고, 자주·조금씩(소량 다회 식사) 먹는 방식으로 속쓰림과 복부 팽만을 줄여 보기.', '{"items": [{"id": "w29-d5-cl-2", "label": "식사량을 줄이기보다는 한 번에 먹는 양을 줄이고, 자주·조금씩(소량 다회 식사) 먹는 방식으로 속쓰림과 복부 팽만을 줄여 보기."}]}'::jsonb, 2, true),
    (5, 'w29-d5-cl-3', '변비·치질 완화를 위해, 물과 섬유질 섭취를 늘리고, 오래 앉아 있는 시간을 줄이며, 필요 시 의사와 상의해 좌욕·연고·완하제 사용을 고려하기.', '변비·치질 완화를 위해, 물과 섬유질 섭취를 늘리고, 오래 앉아 있는 시간을 줄이며, 필요 시 의사와 상의해 좌욕·연고·완하제 사용을 고려하기.', '{"items": [{"id": "w29-d5-cl-3", "label": "변비·치질 완화를 위해, 물과 섬유질 섭취를 늘리고, 오래 앉아 있는 시간을 줄이며, 필요 시 의사와 상의해 좌욕·연고·완하제 사용을 고려하기."}]}'::jsonb, 3, true),
    (6, 'w29-d6-cl-1', '시간을 내서 아기 용품 리스트를 한 번 정리해 보기.', '시간을 내서 아기 용품 리스트를 한 번 정리해 보기.', '{"items": [{"id": "w29-d6-cl-1", "label": "시간을 내서 아기 용품 리스트를 한 번 정리해 보기."}]}'::jsonb, 1, true),
    (6, 'w29-d6-cl-2', '내가 가게될 산후조리원에 대해 정보를 찾아보고, 어떤 서비스를 이용할지, 어떤 준비가 필요할 지 간단히 메모해 두기.', '내가 가게될 산후조리원에 대해 정보를 찾아보고, 어떤 서비스를 이용할지, 어떤 준비가 필요할 지 간단히 메모해 두기.', '{"items": [{"id": "w29-d6-cl-2", "label": "내가 가게될 산후조리원에 대해 정보를 찾아보고, 어떤 서비스를 이용할지, 어떤 준비가 필요할 지 간단히 메모해 두기."}]}'::jsonb, 2, true),
    (6, 'w29-d6-cl-3', '형제자매가 있다면, 아이의 연령에 맞게 “아기가 태어나면 일어날 변화”에 대해 미리 이야기해 보기.', '형제자매가 있다면, 아이의 연령에 맞게 “아기가 태어나면 일어날 변화”에 대해 미리 이야기해 보기.', '{"items": [{"id": "w29-d6-cl-3", "label": "형제자매가 있다면, 아이의 연령에 맞게 “아기가 태어나면 일어날 변화”에 대해 미리 이야기해 보기."}]}'::jsonb, 3, true),
    (7, 'w29-d7-cl-1', '태동 패턴을 한 번 기록해 보기: “언제 얼마나 자주 느꼈는지, 평소와 다른 점이 있는지”를 적어두면, 나중에 태동이 줄었을 때 비교 기준이 되어 줘요.', '태동 패턴을 한 번 기록해 보기: “언제 얼마나 자주 느꼈는지, 평소와 다른 점이 있는지”를 적어두면, 나중에 태동이 줄었을 때 비교 기준이 되어 줘요.', '{"items": [{"id": "w29-d7-cl-1", "label": "태동 패턴을 한 번 기록해 보기: “언제 얼마나 자주 느꼈는지, 평소와 다른 점이 있는지”를 적어두면, 나중에 태동이 줄었을 때 비교 기준이 되어 줘요."}]}'::jsonb, 1, true),
    (7, 'w29-d7-cl-2', '출산을 함께할 사람(배우자·가족·친구 등)에게 어떤 도움을 주면 좋을지 생각해보기.', '출산을 함께할 사람(배우자·가족·친구 등)에게 어떤 도움을 주면 좋을지 생각해보기.', '{"items": [{"id": "w29-d7-cl-2", "label": "출산을 함께할 사람(배우자·가족·친구 등)에게 어떤 도움을 주면 좋을지 생각해보기."}]}'::jsonb, 2, true),
    (7, 'w29-d7-cl-3', '오늘은 “위험 신호 리스트”를 한 번 정리해서 휴대폰 메모장에 옮겨두기: 규칙적으로 강해지는 복통·수축, 분홍·갈색 분비물 또는 양수 의심, 심한 두통·시야 흐림·상복부 통증, 태동 현저한 감소, 고열·실신·흉통·심한 어지럼증.', '오늘은 “위험 신호 리스트”를 한 번 정리해서 휴대폰 메모장에 옮겨두기: 규칙적으로 강해지는 복통·수축, 분홍·갈색 분비물 또는 양수 의심, 심한 두통·시야 흐림·상복부 통증, 태동 현저한 감소, 고열·실신·흉통·심한 어지럼증.', '{"items": [{"id": "w29-d7-cl-3", "label": "오늘은 “위험 신호 리스트”를 한 번 정리해서 휴대폰 메모장에 옮겨두기: 규칙적으로 강해지는 복통·수축, 분홍·갈색 분비물 또는 양수 의심, 심한 두통·시야 흐림·상복부 통증, 태동 현저한 감소, 고열·실신·흉통·심한 어지럼증."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 29)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w29-d1-q-1', '“나는 지금 내 몸의 변화를 바라보며 긍정적인 감정과 부정적인 감정에 대해 모두 속직하게 털어놔주세요. 어떤 감정이 드나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w29-d1-q-2', '“무거워진 몸으로 생명을 품어내고 있는 지금의 나를, 1년 후의 내가 본다면 어떤 말을 해 줄 것 같나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w29-d2-q-1', '“넘어지지 않기 위해 내 일상에서 하나만 바꾸자면, 나는 무엇을 가장 먼저 바꿀 수 있을까요? (걸음 속도, 신발, 집안 구조, 야간 조명…)"', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w29-d2-q-2', '“아기가 자라 처음 걷기 연습을 하다 넘어질 때, 엄마는 어떤 방식으로 ‘넘어지지 않게’ 돕고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w29-d3-q-1', '“빛을 향해 고개를 돌리는 아기를 떠올리며, 지금 내 삶에서 내가 조용히 고개를 돌려 바라보고 싶은 ‘빛’은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w29-d3-q-2', '“아기가 자라 엄마를 따라 고개를 돌려 무언가를 바라보게 될 때, 어떤 빛(희망)을 따라 보길 바라나요? 그 빛을 보여주기 위해 나는 어떤 삶을 살아야 할까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w29-d4-q-1', '“지금의 내 삶은 어떤 것들로 이루어져 있나요? 사랑, 책임, 꿈, 의무, 휴식 중 어느 영역이 가장 많은 자리를 차지하고 있고, 어떤 부분이 가장 부족하다고 느껴지나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w29-d4-q-2', '“임신 전이나 현재, 일이나 관계 혹은 건강, 가족과 개인 등 가치 사이에서 어느 한쪽에 더 무게를 실어왔던 적이 있나요? 알면서도 균형을 잃었던 당시(혹은 현재)의 삶은 어떤 가르침을 남겼나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w29-d5-q-1', '“아기가 태어나면 같이 하고싶은 운동이 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w29-d5-q-2', '“아기가 자라, 어떤 일을 두고 ‘정말 최악이야’라고 말할 때, 엄마는 그 상황을 어떻게 거꾸로 바라보는 시선을 전해주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w29-d6-q-1', '“최근 구매하고 싶어서 자주 들여다보는 아기용품이 있나요? 왜 그 용품에 자주 눈길이 가는 것 같나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w29-d6-q-2', '“지금 느끼는 불안·설렘·긴장 중에서, 오늘 내가 가장 알아주고 싶은 나의 감정은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w29-d7-q-1', '“한때 누군가의 딸이던 내가, 이제는 한 생명을 보호하는 엄마가 되어가고 있다는 사실을 실감하는 순간이 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w29-d7-q-2', '“딸로서 배운 사랑의 방식을 떠올리며, 나는 엄마로서 어떤 사랑의 방식을 배우게 하고 싶나요? 지금 떠오르는 다짐이 있다면 알려주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 30 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  30,
  '30주차 발달 정보',
  '임신 30주 아기는 머리부터 발끝까지 약 39~40cm, 몸무게는 약 1.3~1.6kg 정도로, 멜론이나 큰 양배추만 한 크기까지 자라났어요. 머리와 몸의 비율이 이제 신생아와 거의 비슷해져서, “모양은 거의 신생아인데 아직 조금 마르고 체구가 작은 상태”라고 이해하면 좋아요.',
  '30주가 되면 자궁이 배꼽보다 훨씬 위까지 올라와, 위·장·갈비뼈 아래와 폐를 동시에 밀어 올리기 때문에 갈비뼈 주변이 결리듯 아프고, 계단만 올라가도 숨이 훨씬 더 차게 느껴질 수 있어요. 피로감과 숨참, 때때로 어지러움과 두통이 함께 느껴진다면 철분결핍성 빈혈이 동반되었는지 확인할 필요가 있어요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '30주 1일차',
  '{"items": ["임신 30주 아기는 머리부터 발끝까지 약 39~40cm, 몸무게는 약 1.3~1.6kg 정도로, 멜론이나 큰 양배추만 한 크기까지 자라났어요.", "머리와 몸의 비율이 이제 신생아와 거의 비슷해져서, “모양은 거의 신생아인데 아직 조금 마르고 체구가 작은 상태”라고 이해하면 좋아요."]}'::jsonb,
  '{"items": ["30주가 되면 자궁이 배꼽보다 훨씬 위까지 올라와, 위·장·갈비뼈 아래와 폐를 동시에 밀어 올리기 때문에 갈비뼈 주변이 결리듯 아프고, 계단만 올라가도 숨이 훨씬 더 차게 느껴질 수 있어요.", "피로감과 숨참, 때때로 어지러움과 두통이 함께 느껴진다면 철분결핍성 빈혈이 동반되었는지 확인할 필요가 있어요."]}'::jsonb,
  '아기는 이제 멜론만 한 크기로 자라서, 작은 신생아처럼 보인대요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 30
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '30주 2일차',
  '{"items": ["30주 아기는 이제 눈을 크게 뜰 수 있을 정도의 시각 기능을 가지고 있고, 자궁 밖에서 들어오는 빛의 변화에 따라 눈을 뜨고 감는 반응을 보여요.", "아직 또렷하게 세상을 보는 것은 아니지만, 희미한 형태를 감지할 수 있고, 다음 주 무렵부터는 동공을 수축·확장하며 들어오는 빛의 양을 조절하는 연습을 시작하게 될 예정이에요."]}'::jsonb,
  '{"items": ["배가 커지고 숨이 차고 자주 소변이 마려워 밤에 여러 번 깨다 보니, 깊은 잠을 자기 어렵고 피로가 쉽게 쌓일 수 있어요.", "이 시기에는 특히 꿈이 이상할 만큼 생생하고 기묘한 내용으로 기억되기도 하는데, 이는 호르몬 변화와 출산·육아에 대한 불안, 기대가 뒤섞인 자연스러운 반응이에요."]}'::jsonb,
  '아기는 이제 눈을 크게 뜰 수 있어요. 배 밖에서 들어오는 희미한 빛이 느껴지면 살짝 눈을 떠 보기도 한답니다.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 30
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '30주 3일차',
  '{"items": ["손과 발은 완전히 형성되어 있고, 작은 손톱과 발톱이 자라 “초승달 같은 손톱”이 만들어지고 있어요. 언젠가 엄마 손가락을 꼭 쥐어 볼 그 손이 점점 더 준비되고 있어요."]}'::jsonb,
  '{"items": ["임신 호르몬과 혈류 증가의 영향으로 얼굴에 갈색 반점이 생기는 ‘임신의 가면’, 배꼽에서 치골까지 이어지는 짙은 임신선, 피부가 기름져 여드름이 나거나 배와 몸의 털이 늘어나는 변화를 경험할 수 있어요.", "유방·유두·외음부·하복부 피부색이 더 짙어지기도 하고, 일부 산모는 맑거나 노란색 초유가 조금씩 흘러나오는 것을 경험하기도 해요. 출산 후에는 이러한 색소 침착이 서서히 옅어지는 경우가 많아요."]}'::jsonb,
  '아기의 손 끝에는 작은 초승달 같은 손톱이 자라고 있어요. 언젠가 엄마 손을 꼭 잡을 날을 상상하며 잘 거예요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 30
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '30주 4일차',
  '{"items": ["30주 무렵부터 많은 태아가 출산에 대비해 머리를 아래로 향하는 자세(머리골반위)를 취하기 시작하며, 머리를 거꾸로 두고 있는 연습을 하고 있어요."]}'::jsonb,
  '{"items": ["자궁저가 배꼽보다 훨씬 위까지 올라와 갈비뼈와 폐를 밀어 올리기 때문에, 특히 앉아 있을 때나 식후에는 가슴이 답답하고 숨이 더 가쁘게 느껴질 수 있어요.", "만삭에 가까워지면 끈적한 점액 같은 분비물에 분홍빛·갈색빛·조금의 피가 섞여 나오는 ‘이슬’이 보이기도 하는데, 이는 진통·출산이 가까워지고 있음을 시사하는 신호예요."]}'::jsonb,
  '아기는 요즘 거꾸로 머리를 두는 연습을 하고 있어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 30
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '30주 5일차',
  '{"items": ["아기의 신경계와 근육이 충분히 발달해, 손가락 하나를 꽉 잡을 수 있을 만큼의 힘이 있고, 이제 통증도 느낄 수 있을 정도의 신경 발달도 이루어져 있어요."]}'::jsonb,
  '{"items": ["임신 말기에는 발·발목·다리·손이 붓는 것이 매우 흔한데, 커진 자궁이 골반정맥과 하대정맥을 눌러 혈액 흐름을 느리게 하고, 혈액이 말단에 고이면서 혈관 밖으로 체액이 스며 나오기 때문이에요.", "임신 중에는 호르몬 변화와 임신 유지에 필요한 체액 증가로 인해, 평소보다 약 1~3kg 정도의 수분을 더 품고 있게 되는 것이 자연스러운 변화예요. 부기 자체는 흔한 현상이지만, 손·얼굴이 갑자기 심하게 붓거나 한쪽 다리만 심하게 붓고 통증이 있으면 자간전증이나 심부정맥혈전증(DVT)의 신호일 수 있어요."]}'::jsonb,
  '아기는 작은 손으로 엄마 손가락을 꼭 잡을 준비도 하고 있어요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 30
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '30주 6일차',
  '{"items": ["아기는 여전히 탯줄과 태반을 통해 산소를 공급받지만, 이 시점부터는 횡격막이 움직이며 호흡하는 동작을 적극적으로 연습하고, 폐에서는 계면활성제를 더 많이 만들어 출생 후 숨을 쉴 준비를 계속하고 있어요."]}'::jsonb,
  '{"items": ["자궁이 배 앞쪽으로 밀어 올리면서, 평소 안으로 들어가 있던 배꼽이 평평해지거나 볼록하게 튀어나올 수 있어요.", "배꼽을 만졌을 때 예민한 감각이 느껴질 수 있고, 단순히 옷에 스치는 것만으로도 불편할 수 있어요."]}'::jsonb,
  '아기는 아직 엄마를 통해 숨을 쉬고 있지만, 폐와 횡격막은 조용히 호흡 연습을 하고 있어요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 30
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '30주 7일차',
  '{"items": ["아기는 머리부터 발끝까지 약 39~40cm, 몸무게 약 1.3~1.6kg 정도로 멜론이나 큰 양배추만 한 크기까지 자라났고, 머리와 몸의 비율이 신생아와 거의 비슷해졌어요. 이제는 “모양은 거의 신생아인데, 조금 마르고 체구가 작은 상태”라고 볼 수 있어요."]}'::jsonb,
  '{"items": ["자궁은 배꼽보다 훨씬 위까지 올라와 갈비뼈와 폐를 밀어 올리고, 속쓰림·숨참·소화불량·복부 팽만, 변비·치질, 허리·골반 통증 등 편하지 않은 시간이 될 수 있어요.", "발과 손, 다리·발목의 부기는 호르몬·체액 증가와 혈류 변화로 인해 자연스럽게 나타나는 현상이지만, 갑작스러운 심한 부기나 한쪽 다리만 붓고 아플 때는 의료진의 확인이 꼭 필요해요."]}'::jsonb,
  '이번 주 아기는 신생아와 닮은 모습에 한 걸음 더 가까워졌어요. 눈을 크게 뜨고 빛을 느끼고, 머리를 아래로 두는 연습도 하고 있어요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 30
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 30)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w30-d1-cl-1', '• 임신 후반부의 일상은 이미 큰 체력 소모를 요구한다는 점을 떠올리면서, 같은 일을 하더라도 이전보다 더 자주 쉬어가는 자신을 용기 있게 허락해 주세요.', '• 임신 후반부의 일상은 이미 큰 체력 소모를 요구한다는 점을 떠올리면서, 같은 일을 하더라도 이전보다 더 자주 쉬어가는 자신을 용기 있게 허락해 주세요.', '{"items": [{"id": "w30-d1-cl-1", "label": "• 임신 후반부의 일상은 이미 큰 체력 소모를 요구한다는 점을 떠올리면서, 같은 일을 하더라도 이전보다 더 자주 쉬어가는 자신을 용기 있게 허락해 주세요."}]}'::jsonb, 1, true),
    (1, 'w30-d1-cl-2', '• 계단이나 언덕을 오를 때, 예전의 속도를 기준으로 삼지 말고, 두 번에 한 번은 중간에 잠깐 멈춰 서서 숨을 고르는 ‘휴식 지점’을 정해 놓기.
• 철분·비타민C·칼슘이 포함된 한 끼를 직접 준비해 보세요. (쇠고기·간·달걀·시금치 같은 철분 식품에 브로콜리·케일·두부·요거트 같은 칼슘 식품을 더하고, 귤·키위·파프리카처럼 비타민 C가 풍부한 채소·과일을 곁들이면 철분이 더 잘 흡수되어 엄마의 피로와 어지러움을 줄이고 아기의 뇌·신경 발달에도 도움이 됩니다.)', '• 계단이나 언덕을 오를 때, 예전의 속도를 기준으로 삼지 말고, 두 번에 한 번은 중간에 잠깐 멈춰 서서 숨을 고르는 ‘휴식 지점’을 정해 놓기.
• 철분·비타민C·칼슘이 포함된 한 끼를 직접 준비해 보세요. (쇠고기·간·달걀·시금치 같은 철분 식품에 브로콜리·케일·두부·요거트 같은 칼슘 식품을 더하고, 귤·키위·파프리카처럼 비타민 C가 풍부한 채소·과일을 곁들이면 철분이 더 잘 흡수되어 엄마의 피로와 어지러움을 줄이고 아기의 뇌·신경 발달에도 도움이 됩니다.)', '{"items": [{"id": "w30-d1-cl-2", "label": "• 계단이나 언덕을 오를 때, 예전의 속도를 기준으로 삼지 말고, 두 번에 한 번은 중간에 잠깐 멈춰 서서 숨을 고르는 ‘휴식 지점’을 정해 놓기.\n• 철분·비타민C·칼슘이 포함된 한 끼를 직접 준비해 보세요. (쇠고기·간·달걀·시금치 같은 철분 식품에 브로콜리·케일·두부·요거트 같은 칼슘 식품을 더하고, 귤·키위·파프리카처럼 비타민 C가 풍부한 채소·과일을 곁들이면 철분이 더 잘 흡수되어 엄마의 피로와 어지러움을 줄이고 아기의 뇌·신경 발달에도 도움이 됩니다.)"}]}'::jsonb, 2, true),
    (2, 'w30-d2-cl-1', '• 오늘 평소보다 한 컵만 더 물 마시기. 피로감을 줄이고 어지러움·두통을 예방하는 가장 기본적인 방법은 “물과 균형 잡힌 식사”라는 사실을 기억해 주세요.
• 최근에 꾼 꿈이 이상하게 기억에 남는다면, 그 내용을 “내 꿈 공장이 과장해서 만든 드라마”라고 생각하고 수첩에 적어보기. 그 안에는 출산이나 엄마가 되는 일에 대한 나의 작은 불안이 살짝 숨어 있을 수 있답니다.
• 오늘은 병원 가방에서 한 가지 준비물을 선택해 실제로 넣어 보세요.', '• 오늘 평소보다 한 컵만 더 물 마시기. 피로감을 줄이고 어지러움·두통을 예방하는 가장 기본적인 방법은 “물과 균형 잡힌 식사”라는 사실을 기억해 주세요.
• 최근에 꾼 꿈이 이상하게 기억에 남는다면, 그 내용을 “내 꿈 공장이 과장해서 만든 드라마”라고 생각하고 수첩에 적어보기. 그 안에는 출산이나 엄마가 되는 일에 대한 나의 작은 불안이 살짝 숨어 있을 수 있답니다.
• 오늘은 병원 가방에서 한 가지 준비물을 선택해 실제로 넣어 보세요.', '{"items": [{"id": "w30-d2-cl-1", "label": "• 오늘 평소보다 한 컵만 더 물 마시기. 피로감을 줄이고 어지러움·두통을 예방하는 가장 기본적인 방법은 “물과 균형 잡힌 식사”라는 사실을 기억해 주세요.\n• 최근에 꾼 꿈이 이상하게 기억에 남는다면, 그 내용을 “내 꿈 공장이 과장해서 만든 드라마”라고 생각하고 수첩에 적어보기. 그 안에는 출산이나 엄마가 되는 일에 대한 나의 작은 불안이 살짝 숨어 있을 수 있답니다.\n• 오늘은 병원 가방에서 한 가지 준비물을 선택해 실제로 넣어 보세요."}]}'::jsonb, 1, true),
    (3, 'w30-d3-cl-1', '• 거울 앞에 섰을 때 가장 먼저 보이는 변화 하나를 골라, “이건 내가 엄마가 되기 위해 얻은 표시”라고 이름 붙여 보기.
• 배나 몸에 털이 늘어나 속상하다면, 지금 내 몸이 호르몬을 뿜어내가며 하고 있는 일을 생각해보기: “나의 몸은 오늘도 아기의 체온과 영양을 지키고 있다.”
• 초유 분비가 보인다면 속옷 안쪽에 수유 패드나 부드러운 거즈를 두기(브라 안쪽에 얇게 패드를 대어 옷이 젖는 것을 막고, 샤워 후에는 자극적이지 않은 보습제를 살짝 발라 피부를 보호해 주시면 좋습니다.)', '• 거울 앞에 섰을 때 가장 먼저 보이는 변화 하나를 골라, “이건 내가 엄마가 되기 위해 얻은 표시”라고 이름 붙여 보기.
• 배나 몸에 털이 늘어나 속상하다면, 지금 내 몸이 호르몬을 뿜어내가며 하고 있는 일을 생각해보기: “나의 몸은 오늘도 아기의 체온과 영양을 지키고 있다.”
• 초유 분비가 보인다면 속옷 안쪽에 수유 패드나 부드러운 거즈를 두기(브라 안쪽에 얇게 패드를 대어 옷이 젖는 것을 막고, 샤워 후에는 자극적이지 않은 보습제를 살짝 발라 피부를 보호해 주시면 좋습니다.)', '{"items": [{"id": "w30-d3-cl-1", "label": "• 거울 앞에 섰을 때 가장 먼저 보이는 변화 하나를 골라, “이건 내가 엄마가 되기 위해 얻은 표시”라고 이름 붙여 보기.\n• 배나 몸에 털이 늘어나 속상하다면, 지금 내 몸이 호르몬을 뿜어내가며 하고 있는 일을 생각해보기: “나의 몸은 오늘도 아기의 체온과 영양을 지키고 있다.”\n• 초유 분비가 보인다면 속옷 안쪽에 수유 패드나 부드러운 거즈를 두기(브라 안쪽에 얇게 패드를 대어 옷이 젖는 것을 막고, 샤워 후에는 자극적이지 않은 보습제를 살짝 발라 피부를 보호해 주시면 좋습니다.)"}]}'::jsonb, 1, true),
    (4, 'w30-d4-cl-1', '• 식사량을 줄이는 대신, 한 번에 먹는 양을 조금 줄이고, 횟수를 나누어 먹는 “소량·다회 식사”를 시도해 보기.
• 속옷을 갈아입을 때 분비물의 색·양을 하루에 한 번만 가볍게 확인해 보기.
(갈색 분비물인지, 선홍색 피가 섞여 있는지, 물처럼 흘러내리는 느낌이 있는지 살펴보는 것만으로도, 이슬·출혈·양막 파수를 구분하고 위험 신호를 빨리 알아차리는 데 큰 도움이 됩니다.)
• 혹시 선홍색 분비물이나 물 같은 분비물이 나오면 닦지 말고 깨끗한 패드·거즈에 받아 그대로 병원에 가져가세요.', '• 식사량을 줄이는 대신, 한 번에 먹는 양을 조금 줄이고, 횟수를 나누어 먹는 “소량·다회 식사”를 시도해 보기.
• 속옷을 갈아입을 때 분비물의 색·양을 하루에 한 번만 가볍게 확인해 보기.
(갈색 분비물인지, 선홍색 피가 섞여 있는지, 물처럼 흘러내리는 느낌이 있는지 살펴보는 것만으로도, 이슬·출혈·양막 파수를 구분하고 위험 신호를 빨리 알아차리는 데 큰 도움이 됩니다.)
• 혹시 선홍색 분비물이나 물 같은 분비물이 나오면 닦지 말고 깨끗한 패드·거즈에 받아 그대로 병원에 가져가세요.', '{"items": [{"id": "w30-d4-cl-1", "label": "• 식사량을 줄이는 대신, 한 번에 먹는 양을 조금 줄이고, 횟수를 나누어 먹는 “소량·다회 식사”를 시도해 보기.\n• 속옷을 갈아입을 때 분비물의 색·양을 하루에 한 번만 가볍게 확인해 보기.\n(갈색 분비물인지, 선홍색 피가 섞여 있는지, 물처럼 흘러내리는 느낌이 있는지 살펴보는 것만으로도, 이슬·출혈·양막 파수를 구분하고 위험 신호를 빨리 알아차리는 데 큰 도움이 됩니다.)\n• 혹시 선홍색 분비물이나 물 같은 분비물이 나오면 닦지 말고 깨끗한 패드·거즈에 받아 그대로 병원에 가져가세요."}]}'::jsonb, 1, true),
    (5, 'w30-d5-cl-1', '• 하루 중 한 번은 다리를 심장보다 높게 올려 10~15분 정도 쉬어 보기.', '• 하루 중 한 번은 다리를 심장보다 높게 올려 10~15분 정도 쉬어 보기.', '{"items": [{"id": "w30-d5-cl-1", "label": "• 하루 중 한 번은 다리를 심장보다 높게 올려 10~15분 정도 쉬어 보기."}]}'::jsonb, 1, true),
    (5, 'w30-d5-cl-2', '• 외출할 때는 한 사이즈 정도 여유 있는, 발이 편안한 신발을 선택하기.', '• 외출할 때는 한 사이즈 정도 여유 있는, 발이 편안한 신발을 선택하기.', '{"items": [{"id": "w30-d5-cl-2", "label": "• 외출할 때는 한 사이즈 정도 여유 있는, 발이 편안한 신발을 선택하기."}]}'::jsonb, 2, true),
    (5, 'w30-d5-cl-3', '• 아침에 한번, 저녁에 한번 양쪽 다리와 발의 부기 정도를 한 번씩 비교해 보기.
(두 다리의 부기 정도가 비슷한지, 한쪽만 유난히 붓거나 통증이 있는지 살펴보고, 이상이 느껴지면 바로 의료진에게 문의하세요.)', '• 아침에 한번, 저녁에 한번 양쪽 다리와 발의 부기 정도를 한 번씩 비교해 보기.
(두 다리의 부기 정도가 비슷한지, 한쪽만 유난히 붓거나 통증이 있는지 살펴보고, 이상이 느껴지면 바로 의료진에게 문의하세요.)', '{"items": [{"id": "w30-d5-cl-3", "label": "• 아침에 한번, 저녁에 한번 양쪽 다리와 발의 부기 정도를 한 번씩 비교해 보기.\n(두 다리의 부기 정도가 비슷한지, 한쪽만 유난히 붓거나 통증이 있는지 살펴보고, 이상이 느껴지면 바로 의료진에게 문의하세요.)"}]}'::jsonb, 3, true),
    (6, 'w30-d6-cl-1', '• 배꼽이 옷에 과하게 쓸리지 않도록 골반 위까지 오는 임부용 팬티나 부드러운 원단의 상의를 선택하기.', '• 배꼽이 옷에 과하게 쓸리지 않도록 골반 위까지 오는 임부용 팬티나 부드러운 원단의 상의를 선택하기.', '{"items": [{"id": "w30-d6-cl-1", "label": "• 배꼽이 옷에 과하게 쓸리지 않도록 골반 위까지 오는 임부용 팬티나 부드러운 원단의 상의를 선택하기."}]}'::jsonb, 1, true),
    (6, 'w30-d6-cl-2', '• 샤워 후 배꼽 주변을 부드럽게 눌러보며 만져지는 것은 없는지, 심한 통증이 느껴지는 부분이 없는지 확인해보기.', '• 샤워 후 배꼽 주변을 부드럽게 눌러보며 만져지는 것은 없는지, 심한 통증이 느껴지는 부분이 없는지 확인해보기.', '{"items": [{"id": "w30-d6-cl-2", "label": "• 샤워 후 배꼽 주변을 부드럽게 눌러보며 만져지는 것은 없는지, 심한 통증이 느껴지는 부분이 없는지 확인해보기."}]}'::jsonb, 2, true),
    (6, 'w30-d6-cl-3', '• “물이 샌 것 같다”는 느낌이 들었을 때 어떻게 행동할지 미리 머릿속으로 시뮬레이션해보기. (색·냄새를 살펴본 뒤, 의심이 되면 바로 병원에 전화해서 안내를 받으세요.)', '• “물이 샌 것 같다”는 느낌이 들었을 때 어떻게 행동할지 미리 머릿속으로 시뮬레이션해보기. (색·냄새를 살펴본 뒤, 의심이 되면 바로 병원에 전화해서 안내를 받으세요.)', '{"items": [{"id": "w30-d6-cl-3", "label": "• “물이 샌 것 같다”는 느낌이 들었을 때 어떻게 행동할지 미리 머릿속으로 시뮬레이션해보기. (색·냄새를 살펴본 뒤, 의심이 되면 바로 병원에 전화해서 안내를 받으세요.)"}]}'::jsonb, 3, true),
    (7, 'w30-d7-cl-1', '• 남편과 함께 “아기를 맞이할 차 안의 자리”를 한 번 같이 둘러보기. 카시트를 어디에 설치할지, 병원에서 돌아오는 길에 어떤걸 준비하면 좋을지 함께 대화해보세요.
• 반려동물이 있다면, 출산과 산후 첫 몇 주 동안 돌봄 방식을 어떻게 조정할지 간단한 계획을 세워보기.
• 오늘만큼은 아빠(또는 주 양육자)가 “태교 담당”이 되어도 좋아요. 동화 한 편 읽어주기, 배를 쓰다듬으며 인사하기', '• 남편과 함께 “아기를 맞이할 차 안의 자리”를 한 번 같이 둘러보기. 카시트를 어디에 설치할지, 병원에서 돌아오는 길에 어떤걸 준비하면 좋을지 함께 대화해보세요.
• 반려동물이 있다면, 출산과 산후 첫 몇 주 동안 돌봄 방식을 어떻게 조정할지 간단한 계획을 세워보기.
• 오늘만큼은 아빠(또는 주 양육자)가 “태교 담당”이 되어도 좋아요. 동화 한 편 읽어주기, 배를 쓰다듬으며 인사하기', '{"items": [{"id": "w30-d7-cl-1", "label": "• 남편과 함께 “아기를 맞이할 차 안의 자리”를 한 번 같이 둘러보기. 카시트를 어디에 설치할지, 병원에서 돌아오는 길에 어떤걸 준비하면 좋을지 함께 대화해보세요.\n• 반려동물이 있다면, 출산과 산후 첫 몇 주 동안 돌봄 방식을 어떻게 조정할지 간단한 계획을 세워보기.\n• 오늘만큼은 아빠(또는 주 양육자)가 “태교 담당”이 되어도 좋아요. 동화 한 편 읽어주기, 배를 쓰다듬으며 인사하기"}]}'::jsonb, 1, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 30)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w30-d1-q-1', '• “요즘의 나는, 하루를 버티는 것만으로도 이미 많은 운동을 해낸 ‘선수’에 가깝지 않았나요? 오늘 나 자신에게 건네주고 싶은 응원 멘트 한 줄을 적어본다면 무엇일까요?”
• “숨이 차고 몸이 무거운 오늘, 나는 ‘예전의 나’와 비교하면서 스스로를 몰아붙이고 있지는 않은가요? 나 스스로에게 어떤 말이 조금 더 따뜻하게 떠오르나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w30-d2-q-1', '• “최근에 기억나는 꿈 한 가지가 있다면, 그 꿈 속 나는 무엇을 걱정하고, 무엇을 기대하고 있던 것 같나요? 그 꿈을 통해 내 마음이 건네는 메시지는 무엇일까요?”
• “언젠가 아기가 막연한 불안으로 울음을 터뜨리거나 힘들어한다면, 엄마인 나는 어떤 마음으로 그 아이를 감싸주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w30-d3-q-1', '• “지금 내 몸에서 가장 낯설게 느껴지는 변화는 무엇인가요? 그 변화를 ‘이야기’라고 생각해 본다면, 그 이야기는 어떤 제목을 갖게 될까요?”
• “아이가 자라 언젠가 자신의 외모를 걱정하며 나에게 털어놓는 날이 온다면, 나는 지금의 경험을 바탕으로 어떤 말을 들려주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w30-d4-q-1', '“아기가 머리를 거꾸로 두고 세상에 나갈 준비를 하는 것처럼, 나 역시 삶의 방향을 살짝 바꾸어 보고 싶은 영역이 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w30-d4-q-2', '“자라는 아이에게 자연스럽게 찾아오는 몸의 변화를 기쁘게 받아들이기 위해서는 어떤 마음이 필요할까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w30-d5-q-1', '• “하루를 살아내는 동안, 내 몸을 가장 많이 지탱해주는 것은 결국 ‘두 발’이죠. 이 발이 가장 고단했고 한 걸음, 한 걸음이 무거웠던 순간이 기억나나요? 그때의 경험에 대해 들려주세요.', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w30-d5-q-2', '• “아기가 태어난 후로도 무거운 날이 찾아올 수 있겠죠? 지금의 경험을 바탕으로, 다시 흔들릴 때 어떤 방식으로 나 자신을 지켜줄 수 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w30-d6-q-1', '• “배꼽은 서로 이어져 있었다는 흔적이죠. 엄마의 몸과 아기의 몸이 한때 하나였다는 사실을 떠올릴 때, 마음 깊은 곳에서 어떤 감정이 올라오나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w30-d6-q-2', '• “언젠가 10개월 동안 연결되어 있던 배꼽이 떨어지는 순간을 맞이하게 되면, 그 작은 분리를 어떤 마음으로 바라보고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w30-d7-q-1', '• 아기를 품에 안고 차에 타는 그 순간, 창밖 풍경이 예전과 다르게 보일 것입니다. 그날 나는 어떤 감정이 가장 크게 밀려올까요?
• “그날, 품고 있는 작은 생명을 지키기 위해, 집으로 돌아가는 길 위에서 어떤 다짐을 하게 될까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 31 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  31,
  '31주차 발달 정보',
  '임신 31주 아기는 길이 약 40~41.8cm, 몸무게 약 1.5~1.75kg 정도로, 코코넛 크기까지 자라 있어요.',
  '자궁은 이제 배 안의 큰 부분을 차지하며, 자궁저부 높이는 약 25~28cm, 가슴뼈에서 약 7~8cm 아래까지 올라와 있어요. 그래서 똑바로 서 있을 때 발이 잘 보이지 않거나, 발을 내려다보려 몸을 굽히는 일이 점점 더 힘들어질 수 있어요. 배가 많이 나오고 체중이 늘면서 무게 중심이 앞으로 쏠려, 걸음걸이가 짧고 넓어지며 ‘뒤뚱뒤뚱 걷는 느낌’이 날 수 있어요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '31주 1일차',
  '{"items": ["임신 31주 아기는 길이 약 40~41.8cm, 몸무게 약 1.5~1.75kg 정도로, 코코넛 크기까지 자라 있어요."]}'::jsonb,
  '{"items": ["자궁은 이제 배 안의 큰 부분을 차지하며, 자궁저부 높이는 약 25~28cm, 가슴뼈에서 약 7~8cm 아래까지 올라와 있어요. 그래서 똑바로 서 있을 때 발이 잘 보이지 않거나, 발을 내려다보려 몸을 굽히는 일이 점점 더 힘들어질 수 있어요.", "배가 많이 나오고 체중이 늘면서 무게 중심이 앞으로 쏠려, 걸음걸이가 짧고 넓어지며 ‘뒤뚱뒤뚱 걷는 느낌’이 날 수 있어요."]}'::jsonb,
  '아가는 엄마 뱃속에서 열심히 커지고 있어요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 31
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '31주 2일차',
  '{"items": ["아기는 눈꺼풀이 완전히 형성되어 눈을 감고 뜨는 동작을 자연스럽게 할 수 있고, 동공은 들어오는 빛의 양에 따라 수축·확장하며 빛을 조절하는 연습을 하고 있어요.", "눈동자 색은 유전 정보에 따라 예쁘게 조합되는 중이지만, 최종적인 눈 색은 출생 후 몇 달에 걸쳐 서서히 자리 잡게 되요."]}'::jsonb,
  '{"items": ["임신 3분기에는 수면의 질이 떨어지고 불면이 흔해져서, 배·허리·골반의 불편함과 잦은 배뇨 때문에 밤에 여러 번 깨고 깊은 잠을 자기 어려울 수 있어요.", "자궁이 방광을 계속 눌러 소변을 자주 보는 것 자체는 정상적인 변화이지만, 배뇨 시 통증·심한 악취·탁한 소변·혈뇨·열·허리 통증이 동반되면 요로감염(UTI)일 수 있으므로 의료진과 꼭 상의해야 해요."]}'::jsonb,
  '아가는 언젠가 엄마 눈을 바라볼 날을 기다리며, 엄마 아빠의 눈동자 색을 조금씩 섞어 눈동자 색을 만들고 있어요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 31
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '31주 3일차',
  '{"items": ["아기의 폐는 아직 완전히 성숙하진 않았지만, 계면활성제를 충분히 만들어 폐포가 펴졌다 다시 오므라드는 과정이 자연스럽게 이루어질 정도의 기능을 갖추어, 이 시기에 태어난 아기도 의료진의 도움을 받으면 생존 가능성이 매우 높아요."]}'::jsonb,
  '{"items": ["자궁이 커지면서 배가 20~30초 정도 단단하게 뭉치는 느낌이 불규칙하게 느껴질 수 있는데, 이를 브랙스턴 힉스 수축(가진통)이라고 해요. 규칙적이지 않고, 점점 강해지지 않으며, 쉬면 가라앉는 경우가 많아요.", "수축이 규칙적으로 반복되고 간격이 점점 짧아지거나, 통증이 심해지며 질 출혈·양수 의심·복통이 동반되면 조산 신호일 수 있으므로 즉시 의료진과 상의해야 해요."]}'::jsonb,
  '아가는 혹시 조금 일찍 세상에 나가게 되더라도 숨을 쉴 수 있도록 조금 더 분주하게 준비하고 있어요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 31
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '31주 4일차',
  '{"items": ["아기의 움직임은 여전히 활발하지만, 자궁 속 공간이 점점 좁아지고 수면 주기가 뚜렷해져 하루 최대 15시간까지 잠을 자기 때문에, 예전처럼 잦은 움직임이 줄어든 것 같다는 느낌이 들 수 있습니다."]}'::jsonb,
  '{"items": ["임신 31주 이후에는 산전 진료 간격이 점점 짧아져, 보통 2주에 한 번 진료를 받다가, 만 36주 이후에는 주 1회 진료를 받게 돼요.", "고위험 임신(쌍둥이·임신성 당뇨·고혈압 등)이거나 의심 소견이 있는 경우, 의료진이 아기의 움직임·호흡·근긴장·심박동·양수량을 더 세심하게 살펴보기도 합니다."]}'::jsonb,
  '아가는 나름의 리듬을 가지고 자고 깨고를 반복하며 묵직하고 크게 움직이고 있어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 31
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '31주 5일차',
  '{"items": ["아기의 다섯 가지 감각은 거의 완전히 발달해 있어, 빛·소리·촉각 자극에 반응할 수 있고, 엄마와 파트너의 익숙한 목소리, 자주 들려주는 음악이나 단어는 태어난 뒤에도 아기에게 큰 위안이 되는 “익숙한 안심 신호”가 될 수 있어요."]}'::jsonb,
  '{"items": ["많은 임산부가 이 시기를 ‘임신 뇌’라고 부를 만큼 건망증과 멍한 느낌을 자주 경험해요. 냉장고에서 열쇠를 찾거나, 자신의 나이·약속 시간을 잠시 떠올리지 못하는 등, 주의가 분산되고 기억력이 떨어진 것 같은 느낌이 들 수 있어요.", "체중 증가와 자세 변화, 호르몬 영향 등으로 인해 허리 아래·골반·엉덩이·다리 뒤쪽으로 이어지는 허리 통증·좌골신경통이 심해지기도 해요."]}'::jsonb,
  '아가는 엄마 목소리, 웃음소리, 집 안의 작은 소리들까지 하나하나 머리속에 저장하는 중이에요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 31
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '31주 6일차',
  '{"items": ["아기는 여전히 양수 속에서 양수를 마시고 소변으로 배출하며, 양수 속에서 숨 쉬는 연습을 해요. 양수는 아기를 보호하는 완충 역할을 할 뿐 아니라, 폐와 소화기관 발달을 돕기 때문에, 이 시기에도 충분한 양이 유지되는 것이 중요해요."]}'::jsonb,
  '{"items": ["앞으로 9~10주 이내에 아기를 만나게 될 가능성이 크고, 때로는 계획보다 조금 더 일찍 출산이 시작되기도 해요. 그래서 31주는 출산·입원·산후조리 준비를 천천히 현실적으로 시작하기 좋은 시기예요.", "손톱과 발톱은 빨리 자라면서도 건조하고 잘 부러지는 상태가 되기 쉬워, 작은 자극에도 갈라지거나 깨질 수 있어요."]}'::jsonb,
  '아가는 가장 처음 만나게 될 바람이 따뜻한 봄바람일지, 시원한 가을 바람일지… 어떤 계절이든, 엄마가 준비해 줄 작은 옷과 담요 안에서 포근하게 안기고 싶어해요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 31
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '31주 7일차',
  '{"items": ["피부 아래로 지방이 쌓이며 통통해지고, 뇌는 마지막 삼 분기 동안 폭발적으로 성장해 체온 조절과 수면-각성 주기, 감각 기능을 담당할 준비를 하고 있어요.", "폐는 계면활성제를 충분히 만들 정도로 성숙해져, 31주에 조금 이르게 태어나더라도 의료진의 도움 아래 생존 가능성이 매우 높은 시기에 도달했습니다."]}'::jsonb,
  '{"items": ["자궁은 가슴뼈 아래까지 차오르며, 숨이 차고 식사량이 줄고, 속쓰림·소화불량·복부 팽만, 변비·치질, 허리·골반 통증까지 동시에 경험하는 시간이 될 수 있어요.", "잦은 배뇨와 수면 장애, 건망증, 감정 기복이 겹치면서 “몸도, 마음도, 머리도 예전 같지 않은 것 같다”는 느낌이 들 수 있지만, 임신 후기의 전형적인 변화예요."]}'::jsonb,
  '아가는 혹시 세상이 조금 일찍 열리더라도 숨을 쉴 수 있도록, 폐와 뇌도 부지런히 자라나고 있어요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 31
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 31)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w31-d1-cl-1', '계단이나 언덕길을 지나야 하는 상황이 있다면, 출발 전에 “중간 휴식 지점”을 하나 정해 두고, 그 지점에서 1~2분 정도 멈춰 서서 숨을 고른 뒤 다시 걸어가보기.', '계단이나 언덕길을 지나야 하는 상황이 있다면, 출발 전에 “중간 휴식 지점”을 하나 정해 두고, 그 지점에서 1~2분 정도 멈춰 서서 숨을 고른 뒤 다시 걸어가보기.', '{"items": [{"id": "w31-d1-cl-1", "label": "계단이나 언덕길을 지나야 하는 상황이 있다면, 출발 전에 “중간 휴식 지점”을 하나 정해 두고, 그 지점에서 1~2분 정도 멈춰 서서 숨을 고른 뒤 다시 걸어가보기."}]}'::jsonb, 1, true),
    (1, 'w31-d1-cl-2', '집에 있는 신발 중에서 가장 편안하고 앞이 넉넉한 신발을 골라 신어 보기.', '집에 있는 신발 중에서 가장 편안하고 앞이 넉넉한 신발을 골라 신어 보기.', '{"items": [{"id": "w31-d1-cl-2", "label": "집에 있는 신발 중에서 가장 편안하고 앞이 넉넉한 신발을 골라 신어 보기."}]}'::jsonb, 2, true),
    (1, 'w31-d1-cl-3', '식사 중 한 끼를 정해서, 평소 양의 70~80%만 담아 소량으로 나누어 먹기.', '식사 중 한 끼를 정해서, 평소 양의 70~80%만 담아 소량으로 나누어 먹기.', '{"items": [{"id": "w31-d1-cl-3", "label": "식사 중 한 끼를 정해서, 평소 양의 70~80%만 담아 소량으로 나누어 먹기."}]}'::jsonb, 3, true),
    (2, 'w31-d2-cl-1', '오늘 밤 자기 전에는, 임산부용 베개나 집에 있는 베개·쿠션을 이용해 머리·배·다리를 편하게 받쳐주는 자세를 한 번 만들어 보기.', '오늘 밤 자기 전에는, 임산부용 베개나 집에 있는 베개·쿠션을 이용해 머리·배·다리를 편하게 받쳐주는 자세를 한 번 만들어 보기.', '{"items": [{"id": "w31-d2-cl-1", "label": "오늘 밤 자기 전에는, 임산부용 베개나 집에 있는 베개·쿠션을 이용해 머리·배·다리를 편하게 받쳐주는 자세를 한 번 만들어 보기."}]}'::jsonb, 1, true),
    (2, 'w31-d2-cl-2', '잠들기 1~2시간 전에는 카페인이 들어간 커피·홍차·에너지 음료·탄산음료를 쉬어가기.', '잠들기 1~2시간 전에는 카페인이 들어간 커피·홍차·에너지 음료·탄산음료를 쉬어가기.', '{"items": [{"id": "w31-d2-cl-2", "label": "잠들기 1~2시간 전에는 카페인이 들어간 커피·홍차·에너지 음료·탄산음료를 쉬어가기."}]}'::jsonb, 2, true),
    (2, 'w31-d2-cl-3', '화장실을 다녀온 뒤에는, 소변의 색과 냄새를 한 번 의식적으로 확인해 보기.', '화장실을 다녀온 뒤에는, 소변의 색과 냄새를 한 번 의식적으로 확인해 보기.', '{"items": [{"id": "w31-d2-cl-3", "label": "화장실을 다녀온 뒤에는, 소변의 색과 냄새를 한 번 의식적으로 확인해 보기."}]}'::jsonb, 3, true),
    (3, 'w31-d3-cl-1', '배가 뭉치는 느낌이 들 때마다 시계를 한 번 같이 보는 연습을 해보기. (수축 간격이 규칙적인지, 점점 짧아지는지, 휴식을 취했을 때 가라앉는지를 간단히 기록해 두면, 가진통과 진진통을 구분하는 데 큰 도움이 됩니다.)', '배가 뭉치는 느낌이 들 때마다 시계를 한 번 같이 보는 연습을 해보기. (수축 간격이 규칙적인지, 점점 짧아지는지, 휴식을 취했을 때 가라앉는지를 간단히 기록해 두면, 가진통과 진진통을 구분하는 데 큰 도움이 됩니다.)', '{"items": [{"id": "w31-d3-cl-1", "label": "배가 뭉치는 느낌이 들 때마다 시계를 한 번 같이 보는 연습을 해보기. (수축 간격이 규칙적인지, 점점 짧아지는지, 휴식을 취했을 때 가라앉는지를 간단히 기록해 두면, 가진통과 진진통을 구분하는 데 큰 도움이 됩니다.)"}]}'::jsonb, 1, true),
    (3, 'w31-d3-cl-2', '배가 뭉치며 불편한 느낌이 들 때 깊은 복식호흡(코로 깊게 들이마시고, 입으로 천천히 내쉬기)을 반복하며 몸을 이완해 보기.', '배가 뭉치며 불편한 느낌이 들 때 깊은 복식호흡(코로 깊게 들이마시고, 입으로 천천히 내쉬기)을 반복하며 몸을 이완해 보기.', '{"items": [{"id": "w31-d3-cl-2", "label": "배가 뭉치며 불편한 느낌이 들 때 깊은 복식호흡(코로 깊게 들이마시고, 입으로 천천히 내쉬기)을 반복하며 몸을 이완해 보기."}]}'::jsonb, 2, true),
    (3, 'w31-d3-cl-3', '오래 기억나는 생생한 꿈이 있다면, 꿈의 의미를 깊게 해석하려 하기보다, “요즘 내 마음이 얼마나 많은 생각을 품고 있는지” 확인하는 시간으로 삼기.', '오래 기억나는 생생한 꿈이 있다면, 꿈의 의미를 깊게 해석하려 하기보다, “요즘 내 마음이 얼마나 많은 생각을 품고 있는지” 확인하는 시간으로 삼기.', '{"items": [{"id": "w31-d3-cl-3", "label": "오래 기억나는 생생한 꿈이 있다면, 꿈의 의미를 깊게 해석하려 하기보다, “요즘 내 마음이 얼마나 많은 생각을 품고 있는지” 확인하는 시간으로 삼기."}]}'::jsonb, 3, true),
    (4, 'w31-d4-cl-1', '오늘 하루 중 가장 조용한 시간을 골라, 1시간 동안 태동을 느끼며 “10번 움직이는 데 걸린 시간”을 기록해 보기. (아기의 수면·각성 리듬을 파악해 두면, 평소와 다른 태동 변화를 더 빨리 알아챌 수 있습니다.)', '오늘 하루 중 가장 조용한 시간을 골라, 1시간 동안 태동을 느끼며 “10번 움직이는 데 걸린 시간”을 기록해 보기. (아기의 수면·각성 리듬을 파악해 두면, 평소와 다른 태동 변화를 더 빨리 알아챌 수 있습니다.)', '{"items": [{"id": "w31-d4-cl-1", "label": "오늘 하루 중 가장 조용한 시간을 골라, 1시간 동안 태동을 느끼며 “10번 움직이는 데 걸린 시간”을 기록해 보기. (아기의 수면·각성 리듬을 파악해 두면, 평소와 다른 태동 변화를 더 빨리 알아챌 수 있습니다.)"}]}'::jsonb, 1, true),
    (4, 'w31-d4-cl-2', '다음 진료 전에, “통증 완화 방법에는 어떤 것들이 있는지, 조산 징후와 가진통을 어떻게 구분하는지” 같은 내용을 질문 목록으로 적어 두기.', '다음 진료 전에, “통증 완화 방법에는 어떤 것들이 있는지, 조산 징후와 가진통을 어떻게 구분하는지” 같은 내용을 질문 목록으로 적어 두기.', '{"items": [{"id": "w31-d4-cl-2", "label": "다음 진료 전에, “통증 완화 방법에는 어떤 것들이 있는지, 조산 징후와 가진통을 어떻게 구분하는지” 같은 내용을 질문 목록으로 적어 두기."}]}'::jsonb, 2, true),
    (4, 'w31-d4-cl-3', '산전 진료 일정 정확히 확인해두기.', '산전 진료 일정 정확히 확인해두기.', '{"items": [{"id": "w31-d4-cl-3", "label": "산전 진료 일정 정확히 확인해두기."}]}'::jsonb, 3, true),
    (5, 'w31-d5-cl-1', '오늘 해야 할 일을 가장 중요한 세 가지만 골라 메모해 보기.', '오늘 해야 할 일을 가장 중요한 세 가지만 골라 메모해 보기.', '{"items": [{"id": "w31-d5-cl-1", "label": "오늘 해야 할 일을 가장 중요한 세 가지만 골라 메모해 보기."}]}'::jsonb, 1, true),
    (5, 'w31-d5-cl-2', '허리와 골반 통증 완화를 위해, 출산을 대비한 임신 체조나 산전 요가 동작 중 쉬운 것 한 가지를 선택해 5분 정도 따라 해 보기.', '허리와 골반 통증 완화를 위해, 출산을 대비한 임신 체조나 산전 요가 동작 중 쉬운 것 한 가지를 선택해 5분 정도 따라 해 보기.', '{"items": [{"id": "w31-d5-cl-2", "label": "허리와 골반 통증 완화를 위해, 출산을 대비한 임신 체조나 산전 요가 동작 중 쉬운 것 한 가지를 선택해 5분 정도 따라 해 보기."}]}'::jsonb, 2, true),
    (5, 'w31-d5-cl-3', '모유수유·분유수유·혼합수유 중 어떤 방식을 우선 생각하고 있는지 떠올려 보고, 그에 맞는 용품을 메모해 보기.', '모유수유·분유수유·혼합수유 중 어떤 방식을 우선 생각하고 있는지 떠올려 보고, 그에 맞는 용품을 메모해 보기.', '{"items": [{"id": "w31-d5-cl-3", "label": "모유수유·분유수유·혼합수유 중 어떤 방식을 우선 생각하고 있는지 떠올려 보고, 그에 맞는 용품을 메모해 보기."}]}'::jsonb, 3, true),
    (6, 'w31-d6-cl-1', '아기가 태어날 계절에 필요한 옷과 속싸개·겉싸개·담요 종류를 간단히 목록으로 적어 보기.', '아기가 태어날 계절에 필요한 옷과 속싸개·겉싸개·담요 종류를 간단히 목록으로 적어 보기.', '{"items": [{"id": "w31-d6-cl-1", "label": "아기가 태어날 계절에 필요한 옷과 속싸개·겉싸개·담요 종류를 간단히 목록으로 적어 보기."}]}'::jsonb, 1, true),
    (6, 'w31-d6-cl-2', '집 안을 한 바퀴 돌며, 아기가 태어난 뒤 자주 머무를 공간(침실·거실·욕실)의 위험 요소 한두 가지를 찾아 표시해 보기. (전기 콘센트, 날카로운 모서리, 미끄러운 바닥 등은 간단한 안전용품으로 미리 대비할 수 있어요.)', '집 안을 한 바퀴 돌며, 아기가 태어난 뒤 자주 머무를 공간(침실·거실·욕실)의 위험 요소 한두 가지를 찾아 표시해 보기. (전기 콘센트, 날카로운 모서리, 미끄러운 바닥 등은 간단한 안전용품으로 미리 대비할 수 있어요.)', '{"items": [{"id": "w31-d6-cl-2", "label": "집 안을 한 바퀴 돌며, 아기가 태어난 뒤 자주 머무를 공간(침실·거실·욕실)의 위험 요소 한두 가지를 찾아 표시해 보기. (전기 콘센트, 날카로운 모서리, 미끄러운 바닥 등은 간단한 안전용품으로 미리 대비할 수 있어요.)"}]}'::jsonb, 2, true),
    (6, 'w31-d6-cl-3', '손·발톱이 잘 부러진다면, 오늘은 손·발톱을 적당한 길이로 정리한 뒤, 부드러운 보습제를 넉넉히 바르는 시간을 가져 보기.', '손·발톱이 잘 부러진다면, 오늘은 손·발톱을 적당한 길이로 정리한 뒤, 부드러운 보습제를 넉넉히 바르는 시간을 가져 보기.', '{"items": [{"id": "w31-d6-cl-3", "label": "손·발톱이 잘 부러진다면, 오늘은 손·발톱을 적당한 길이로 정리한 뒤, 부드러운 보습제를 넉넉히 바르는 시간을 가져 보기."}]}'::jsonb, 3, true),
    (7, 'w31-d7-cl-1', '남편과 함께 둘만의 데이트를 즐겨보기.(아기가 이 집의 구성원이 되는 날부터는 한동안 둘만의 데이트 시간이 없을지도 몰라요)', '남편과 함께 둘만의 데이트를 즐겨보기.(아기가 이 집의 구성원이 되는 날부터는 한동안 둘만의 데이트 시간이 없을지도 몰라요)', '{"items": [{"id": "w31-d7-cl-1", "label": "남편과 함께 둘만의 데이트를 즐겨보기.(아기가 이 집의 구성원이 되는 날부터는 한동안 둘만의 데이트 시간이 없을지도 몰라요)"}]}'::jsonb, 1, true),
    (7, 'w31-d7-cl-2', '이미 아이가 있다면, 오늘은 그 아이와 엄마, 단둘이 보내는 시간(산책, 간식 시간 등)을 만들고, 새로 올 생명을 위한 준비에 동참시켜보기.', '이미 아이가 있다면, 오늘은 그 아이와 엄마, 단둘이 보내는 시간(산책, 간식 시간 등)을 만들고, 새로 올 생명을 위한 준비에 동참시켜보기.', '{"items": [{"id": "w31-d7-cl-2", "label": "이미 아이가 있다면, 오늘은 그 아이와 엄마, 단둘이 보내는 시간(산책, 간식 시간 등)을 만들고, 새로 올 생명을 위한 준비에 동참시켜보기."}]}'::jsonb, 2, true),
    (7, 'w31-d7-cl-3', '지금 엄마 곁에 함께 있는 남편이나 아이에게 짧은 편지를 써 보며, 지금의 힘듦과 감사, 그리고 아기를 품고 있는 이 시간에 대해 어떻게 “함께” 기억하고 싶은지 적어 보기.', '지금 엄마 곁에 함께 있는 남편이나 아이에게 짧은 편지를 써 보며, 지금의 힘듦과 감사, 그리고 아기를 품고 있는 이 시간에 대해 어떻게 “함께” 기억하고 싶은지 적어 보기.', '{"items": [{"id": "w31-d7-cl-3", "label": "지금 엄마 곁에 함께 있는 남편이나 아이에게 짧은 편지를 써 보며, 지금의 힘듦과 감사, 그리고 아기를 품고 있는 이 시간에 대해 어떻게 “함께” 기억하고 싶은지 적어 보기."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 31)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w31-d1-q-1', '“최근에 배가 정말 커졌구나 실감한 적 있나요? 그 경험에 대해 들려주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w31-d1-q-2', '“요즘의 나는 예전만큼 빨리 걷지도, 자유롭게 몸을 쓰지도 못하죠. 그럼에도 지금의 내 몸으로 매일 해내고 있는 일들을 적어본다면, 어떤 목록이 만들어질까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w31-d2-q-1', '“만약 내가 꾼 꿈이, 내 마음이 만든 작은 영화라면 그 안에서 나는 무엇을 가장 두려워하거나, 무엇을 가장 기다리고 있었나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w31-d2-q-2', '“언젠가 아기가 밤에 울며 깨어날 때, 달래줘야 하는 날이 있을 거예요. 오늘 밤, 그 표정과 목소리로 나 자신에게 먼저 달래는 연습해 줄 수 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w31-d3-q-1', '“만약 아기가 조금 일찍 태어나게 된다면, 나는 어떤 마음의 준비를 더 해 두고 싶나요? 그때의 나를 지지해 줄 문장을 지금 미리 적어본다면 어떤 말이 될까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w31-d3-q-2', '“내가 통제할 수 없는 일들(출산 시기, 상황 등)을 마주할 때, 나는 어떤 방식으로 나 자신을 다독이고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w31-d4-q-1', '“요즘 겉으로 티 나지 않지만 내가 묵묵히 해내고 있는 것들을 적어본다면 무엇이 떠오르나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w31-d4-q-2', '“아기가 자신의 리듬을 찾아가듯, 각자의 리듬이 있어요. 먼 훗날 아기가 자신만의 속도로 삶의 여정을 가야 한다는 것을 깨닫는 순간이 올 거예요. 그 순간은 어떤 말을 해주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w31-d5-q-1', '• ‘임신 뇌’라고 불리는 이 건망증의 시간에도, 이상하게 더 잘 기억나는 것들이 있나요? 요즘 유난히 선명하게 남는 기억은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w31-d5-q-2', '• “아기도 자라면서 배우고 잊고, 실수하고 다시 시도할 거예요. 그때 나는 어떤 태도로 아이의 그 과정을 함께하고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w31-d6-q-1', '“아기가 태어날 계절만의 공기나 분위기 중에서 엄마가 좋아하는 점은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w31-d6-q-2', '“아기가 태어날 시기의 별자리를 떠올려 봐도 좋아요. 그 별자리가 가진 상징 중, 우리 아이에게 꼭 물려주고 싶은 성품이나 이야기가 있다면 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w31-d7-q-1', '“앞으로 9~10주 안에, 혹은 그보다 조금 빨리 아기를 만나게 될 수도 있다는 사실을 떠올릴 때, 지금의 나는 무엇이 가장 설레고, 무엇이 가장 두렵나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w31-d7-q-2', '“앞으로 우리 가족 안에 한 생명이 더해지는 만큼, 그 변화 속에서 꼭 지키고 싶은 우리 가족만의 분위기는 어떤 모습인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 32 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  32,
  '32주차 발달 정보',
  '아기는 머리부터 발끝까지 약 42cm 전후이고, 몸무게는 약 1.7~2kg 정도예요. 샐러리 크기라고 상상해도 좋아요.',
  '엄마 몸은 앞으로 약 4주 동안 주당 약 450g 정도 체중이 늘어날 수 있고, 아기 체중도 빠르게 증가해요. 그래서 몸의 중심이 더 앞으로 쏠리면서, 걸을 때 조금 더 뒤뚱뒤뚱 흔들리는 느낌이 드는 건 자연스러운 적응 과정이에요. 자궁 윗부분(자궁저)은 이제 배꼽에서 약 15cm 위까지 올라와 갈비뼈 바로 아래를 밀고 있어서, 위와 흉곽이 눌리며 속이 더부룩하고 계단을 오르거나 말하면서 걷기만 해도 숨이 찰 수 있어요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '32주 1일차',
  '{"items": ["아기는 머리부터 발끝까지 약 42cm 전후이고, 몸무게는 약 1.7~2kg 정도예요. 샐러리 크기라고 상상해도 좋아요."]}'::jsonb,
  '{"items": ["엄마 몸은 앞으로 약 4주 동안 주당 약 450g 정도 체중이 늘어날 수 있고, 아기 체중도 빠르게 증가해요. 그래서 몸의 중심이 더 앞으로 쏠리면서, 걸을 때 조금 더 뒤뚱뒤뚱 흔들리는 느낌이 드는 건 자연스러운 적응 과정이에요.", "자궁 윗부분(자궁저)은 이제 배꼽에서 약 15cm 위까지 올라와 갈비뼈 바로 아래를 밀고 있어서, 위와 흉곽이 눌리며 속이 더부룩하고 계단을 오르거나 말하면서 걷기만 해도 숨이 찰 수 있어요."]}'::jsonb,
  '아가는 이제 샐러리만 한 크기가 되었어요. 몸은 웬만큼 다 만들어져서, 앞으로는 튼튼하게 크고 살을 채우는 일에 집중할 거예요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 32
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '32주 2일차',
  '{"items": ["많은 아기들이 머리를 아래로 향하는 두위 자세를 취하기 시작해요. 질식 분만에 가장 이상적인 자세이고, 약 97%의 아기들은 스스로 머리를 아래로 돌게 돼요. 아직 36주 전이라, 만약 둔위나 횡위라고 해도 자세를 바꿀 시간은 충분해요."]}'::jsonb,
  '{"items": ["임신 호르몬은 골반 주변 인대와 관절을 느슨하게 만들어, 허리·엉덩이·골반 앞쪽에 통증을 유발하고, 몸을 움직일 때 관절이 ‘딱딱’ 소리가 나거나 어긋나는 느낌을 만들 수 있어요.", "아기가 점점 골반 쪽으로 내려오면서, 자궁 하부와 자궁경부 주변 신경을 압박해 사타구니·허벅지로 찌릿하게 퍼지는 통증을 경험할 수 있어요. 매우 날카롭고 깜짝 놀랄 만큼 아프지만, 보통 몇 초 안에 싹 사라지고, 규칙적이지 않아요."]}'::jsonb,
  '아가는 이제 천천히 머리를 아래로 돌려 보는 연습을 하고 있어요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 32
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '32주 3일차',
  '{"items": ["아기의 폐는 아직 완전히 성숙하지는 않았지만, 양수를 들이마시고 내쉬는 호흡 운동을 반복하면서, 자궁 밖에서 공기를 들이마시고 내쉬는 연습을 하고 있는 중이에요."]}'::jsonb,
  '{"items": ["자궁이 위와 흉곽을 밀어 올리면서 소화불량·복부 팽만·속쓰림·역류성 식도염이 흔해져요.", "하루 약 300kcal 정도의 추가 에너지가 필요해서, “식욕이 줄었다고 아예 안 먹는 것”보다는 단백질·탄수화물·건강한 지방을 섞은 소량 식사를 여러 번 나누어 먹는 전략이 도움이 됩니다."]}'::jsonb,
  '아가는 아직 공기가 아니라 양수를 들이마시고 내쉬지만, 언젠가 엄마 품에서 첫 숨을 쉬기 위해 차분히 연습 중이에요. 혹시 조금 일찍 만나게 되더라도, 잘 버티고 자라도록 열심히 준비할 거예요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 32
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '32주 4일차',
  '{"items": ["아기는 피부 밑에 피하지방을 빠르게 축적하고 있어요. 이 지방은 출생 후 체온을 유지하고 에너지를 공급하는, 아기에게 아주 중요한 저장고 역할을 해요.", "앞으로 몇 주 동안 약 1kg 정도의 지방이 더 쌓여, 자궁 밖 온도 변화에 적응할 준비를 하게 됩니다."]}'::jsonb,
  '{"items": ["남은 기간 동안 골격과 뼈를 더 튼튼하게 하는 과정이 이어져요. 이때 비타민 D는 칼슘과 인의 흡수·조절을 도와 태아의 뼈 성장을 도와주고, 아기가 출생 후 몇 달 동안 의지할 영양분을 축적하는 데도 중요해요.", "다리 경련, 허리 통증, 골반 통증, 두통, 변비, 복부 팽만 등 증상들을 한꺼번에 경험할 수 있어요."]}'::jsonb,
  '아가는 요즘 살도 차오르고, 뼈와 피를 튼튼하게 해 줄 영양들도 차곡차곡 모으는 중이에요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 32
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '32주 5일차',
  '{"items": ["아기의 청력은 이미 상당히 발달해 엄마의 말소리·음악·외부 소리에 반응할 수 있어요.", "갑작스러운 큰 소리에 깜짝 놀라는 반응을 보일 수 있고, 반복해서 들려주는 말·노래·소리는 아기가 주변 세상을 구분하고 이해하는 능력을 키우는 데 도움이 돼요."]}'::jsonb,
  '{"items": ["임신 3분기에는 에스트로겐과 프로게스테론이 최고조에 달하면서 점막으로 가는 혈류가 증가해, 잇몸이 붓고 피가 잘 나는 증상이 매우 흔하게 나타나요.", "다리·발·손·얼굴에 부종(부기)이 생기기 쉬워요. 손·발이 약간 붓는 정도는 흔한 변화지만, 얼굴·손의 갑작스럽고 심한 부종이나 발·발목 부기가 급격히 심해지는 경우는 자간전증의 경고 신호일 수 있어 꼭 확인이 필요해요."]}'::jsonb,
  '아가는 요즘 엄마 목소리와 집 안의 여러 소리를 차분히 듣는 중이에요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 32
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '32주 6일차',
  '{"items": ["아기가 빠르게 커지면서 자궁 안 공간은 점점 좁아져, 이전처럼 크게 ‘공중제비’를 돌기는 어렵지만, 발길질·밀치기·돌리는 움직임은 여전히 활발하게 느껴지는 시기예요."]}'::jsonb,
  '{"items": ["질 분비물이 이전보다 많고 끈적하게 느껴지는 것은 분만을 준비하면서 자궁경부가 더 많은 점액성 분비물을 만드는 자연스러운 변화일 수 있어요.", "다만, 분비물이 물처럼 묽고, 속옷이 젖을 정도로 계속 흐르는 느낌이 있다면 양수가 새는 것일 수 있어 산부인과에 바로 연락해야 합니다."]}'::jsonb,
  '아가는 이제 예전처럼 크게 뒤집어지기는 어렵지만, 여전히 나름의 리듬으로 발을 쭉 뻗고, 몸을 밀고, 엄마에게 ‘나 여기 있어요’라고 인사하고 있어요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 32
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '32주 7일차',
  '{"items": ["머리를 아래로 두는 두위 자세를 취하기 시작하고, 폐는 양수로 숨쉬기 연습을 하며, 피부 밑에는 지방이 쌓이고, 철분·칼슘·인 같은 미네랄과 함께 뼈와 몸을 튼튼히 하는 ‘저장고’를 채워가고 있어요."]}'::jsonb,
  '{"items": ["다리·골반·항문 주변에 정맥류가 잘 생기거나 악화될 수 있고, 치질도 정맥류의 한 형태로 가려움·불편감·쑤시는 느낌을 동반할 수 있어요. 오래 서 있기, 한 자세로 오래 앉아 있기, 다리 꼬는 습관은 정맥류를 더 악화시킬 수 있어 피하는 것이 좋아요.", "피부는 가려움, 튼살, 색소 침착, 피지 증가·여드름, 더 두꺼워 보이는 머리카락, 배와 유두 주변 색이 진해지는 등 여러 변화를 겪고 있어요."]}'::jsonb,
  '아가는 이번 주 머리를 아래로 돌려 갈 자리를 잡아 보고, 숨 쉬는 연습을 하고 있어요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 32
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 32)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w32-d1-cl-1', '소량씩 자주 먹기. (큰 한 끼 대신 조금씩 나누어 2번에 나눠 먹기, 기름진·매운 음식·너무 신 음식은 조금 덜어내기 등.)', '소량씩 자주 먹기. (큰 한 끼 대신 조금씩 나누어 2번에 나눠 먹기, 기름진·매운 음식·너무 신 음식은 조금 덜어내기 등.)', '{"items": [{"id": "w32-d1-cl-1", "label": "소량씩 자주 먹기. (큰 한 끼 대신 조금씩 나누어 2번에 나눠 먹기, 기름진·매운 음식·너무 신 음식은 조금 덜어내기 등.)"}]}'::jsonb, 1, true),
    (1, 'w32-d1-cl-2', '계단을 오르거나 조금만 걸어도 숨이 찰 때, “어떤 속도로 걸어야 내 몸이 편한지”를 기준으로 속도를 조절해 보기.', '계단을 오르거나 조금만 걸어도 숨이 찰 때, “어떤 속도로 걸어야 내 몸이 편한지”를 기준으로 속도를 조절해 보기.', '{"items": [{"id": "w32-d1-cl-2", "label": "계단을 오르거나 조금만 걸어도 숨이 찰 때, “어떤 속도로 걸어야 내 몸이 편한지”를 기준으로 속도를 조절해 보기."}]}'::jsonb, 2, true),
    (1, 'w32-d1-cl-3', '허리를 살짝 풀어주는 스트레칭(부드러운 옆구리 늘리기, 어깨 돌리기)을 3~5분 해보기.', '허리를 살짝 풀어주는 스트레칭(부드러운 옆구리 늘리기, 어깨 돌리기)을 3~5분 해보기.', '{"items": [{"id": "w32-d1-cl-3", "label": "허리를 살짝 풀어주는 스트레칭(부드러운 옆구리 늘리기, 어깨 돌리기)을 3~5분 해보기."}]}'::jsonb, 3, true),
    (2, 'w32-d2-cl-1', '번쩍이는 사타구니 통증이 느껴질 땐, 잠시 멈춰 서서 골반을 부드럽게 좌우로 흔들어 주거나, 한쪽 다리를 의자에 올린 상태에서 가볍게 골반 앞쪽을 스트레칭해 보기.', '번쩍이는 사타구니 통증이 느껴질 땐, 잠시 멈춰 서서 골반을 부드럽게 좌우로 흔들어 주거나, 한쪽 다리를 의자에 올린 상태에서 가볍게 골반 앞쪽을 스트레칭해 보기.', '{"items": [{"id": "w32-d2-cl-1", "label": "번쩍이는 사타구니 통증이 느껴질 땐, 잠시 멈춰 서서 골반을 부드럽게 좌우로 흔들어 주거나, 한쪽 다리를 의자에 올린 상태에서 가볍게 골반 앞쪽을 스트레칭해 보기."}]}'::jsonb, 1, true),
    (2, 'w32-d2-cl-2', '걷거나 일할 때 “한 번에 오래 서 있지 않기” 규칙을 만들어 보기. (예: 30~40분 서 있었다면 5분은 의자에 앉거나 벽에 기대어 골반·허리를 쉬게 하기)', '걷거나 일할 때 “한 번에 오래 서 있지 않기” 규칙을 만들어 보기. (예: 30~40분 서 있었다면 5분은 의자에 앉거나 벽에 기대어 골반·허리를 쉬게 하기)', '{"items": [{"id": "w32-d2-cl-2", "label": "걷거나 일할 때 “한 번에 오래 서 있지 않기” 규칙을 만들어 보기. (예: 30~40분 서 있었다면 5분은 의자에 앉거나 벽에 기대어 골반·허리를 쉬게 하기)"}]}'::jsonb, 2, true),
    (2, 'w32-d2-cl-3', '좌식 자세로 오래 앉아 있어야 한다면, 엉덩이 밑에 단단한 방석을 한 겹 깔고, 허리 뒤에는 작은 쿠션을 넣어 등과 골반을 지지하는 자세를 만들어 보기.', '좌식 자세로 오래 앉아 있어야 한다면, 엉덩이 밑에 단단한 방석을 한 겹 깔고, 허리 뒤에는 작은 쿠션을 넣어 등과 골반을 지지하는 자세를 만들어 보기.', '{"items": [{"id": "w32-d2-cl-3", "label": "좌식 자세로 오래 앉아 있어야 한다면, 엉덩이 밑에 단단한 방석을 한 겹 깔고, 허리 뒤에는 작은 쿠션을 넣어 등과 골반을 지지하는 자세를 만들어 보기."}]}'::jsonb, 3, true),
    (3, 'w32-d3-cl-1', '“배부르게 먹기” 대신 “속쓰림이 덜한 한 끼”를 목표로 삼아 보기.', '“배부르게 먹기” 대신 “속쓰림이 덜한 한 끼”를 목표로 삼아 보기.', '{"items": [{"id": "w32-d3-cl-1", "label": "“배부르게 먹기” 대신 “속쓰림이 덜한 한 끼”를 목표로 삼아 보기."}]}'::jsonb, 1, true),
    (3, 'w32-d3-cl-2', '잠자기 전 2~3시간에는 가능한 한 큰 식사를 피하고, 허기만 달랠 수 있는 가벼운 간식(예: 과일 몇 조각, 요거트 등)으로 마무리해 보기.', '잠자기 전 2~3시간에는 가능한 한 큰 식사를 피하고, 허기만 달랠 수 있는 가벼운 간식(예: 과일 몇 조각, 요거트 등)으로 마무리해 보기.', '{"items": [{"id": "w32-d3-cl-2", "label": "잠자기 전 2~3시간에는 가능한 한 큰 식사를 피하고, 허기만 달랠 수 있는 가벼운 간식(예: 과일 몇 조각, 요거트 등)으로 마무리해 보기."}]}'::jsonb, 2, true),
    (3, 'w32-d3-cl-3', '다음 진료 때 의료진에게 Tdap(백일해 포함), 독감, 필요 시 RSV 백신 접종 시기를 물어보는 질문을 메모해 두기.', '다음 진료 때 의료진에게 Tdap(백일해 포함), 독감, 필요 시 RSV 백신 접종 시기를 물어보는 질문을 메모해 두기.', '{"items": [{"id": "w32-d3-cl-3", "label": "다음 진료 때 의료진에게 Tdap(백일해 포함), 독감, 필요 시 RSV 백신 접종 시기를 물어보는 질문을 메모해 두기."}]}'::jsonb, 3, true),
    (4, 'w32-d4-cl-1', '식단에서 철분·칼슘·비타민 D가 들어 있는 음식 하나씩 추가하기.', '식단에서 철분·칼슘·비타민 D가 들어 있는 음식 하나씩 추가하기.', '{"items": [{"id": "w32-d4-cl-1", "label": "식단에서 철분·칼슘·비타민 D가 들어 있는 음식 하나씩 추가하기."}]}'::jsonb, 1, true),
    (4, 'w32-d4-cl-2', '햇빛이 너무 강하지 않은 시간에 짧은 산책을 하며 자연광을 조금 쬐고, 매일 10㎍ 비타민 D 보충제를 복용하는지 확인해 보기.', '햇빛이 너무 강하지 않은 시간에 짧은 산책을 하며 자연광을 조금 쬐고, 매일 10㎍ 비타민 D 보충제를 복용하는지 확인해 보기.', '{"items": [{"id": "w32-d4-cl-2", "label": "햇빛이 너무 강하지 않은 시간에 짧은 산책을 하며 자연광을 조금 쬐고, 매일 10㎍ 비타민 D 보충제를 복용하는지 확인해 보기."}]}'::jsonb, 2, true),
    (4, 'w32-d4-cl-3', '다리 경련과 통증이 자주 온다면, 자기 전 종아리·발바닥을 부드럽게 늘려주는 스트레칭을 3~5분 해보기.', '다리 경련과 통증이 자주 온다면, 자기 전 종아리·발바닥을 부드럽게 늘려주는 스트레칭을 3~5분 해보기.', '{"items": [{"id": "w32-d4-cl-3", "label": "다리 경련과 통증이 자주 온다면, 자기 전 종아리·발바닥을 부드럽게 늘려주는 스트레칭을 3~5분 해보기."}]}'::jsonb, 3, true),
    (5, 'w32-d5-cl-1', '양치할 때 “힘주어 세게 문지르기” 대신 “부드러운 칫솔로 천천히 쓸어주기”.', '양치할 때 “힘주어 세게 문지르기” 대신 “부드러운 칫솔로 천천히 쓸어주기”.', '{"items": [{"id": "w32-d5-cl-1", "label": "양치할 때 “힘주어 세게 문지르기” 대신 “부드러운 칫솔로 천천히 쓸어주기”."}]}'::jsonb, 1, true),
    (5, 'w32-d5-cl-2', '하루 중 여유가 되는 시간에 집 안이나 집 앞을 10~15분 정도 천천히 걷고, 돌아와서 발과 다리를 심장보다 살짝 높게 올려 5~10분 정도 쉬어 보기.', '하루 중 여유가 되는 시간에 집 안이나 집 앞을 10~15분 정도 천천히 걷고, 돌아와서 발과 다리를 심장보다 살짝 높게 올려 5~10분 정도 쉬어 보기.', '{"items": [{"id": "w32-d5-cl-2", "label": "하루 중 여유가 되는 시간에 집 안이나 집 앞을 10~15분 정도 천천히 걷고, 돌아와서 발과 다리를 심장보다 살짝 높게 올려 5~10분 정도 쉬어 보기."}]}'::jsonb, 2, true),
    (5, 'w32-d5-cl-3', '저녁에는 조용한 시간을 정해, 아기에게 말을 걸거나 노래를 한 곡 들려주는 시간을 만들어 보기.', '저녁에는 조용한 시간을 정해, 아기에게 말을 걸거나 노래를 한 곡 들려주는 시간을 만들어 보기.', '{"items": [{"id": "w32-d5-cl-3", "label": "저녁에는 조용한 시간을 정해, 아기에게 말을 걸거나 노래를 한 곡 들려주는 시간을 만들어 보기."}]}'::jsonb, 3, true),
    (6, 'w32-d6-cl-1', '하루 중 가장 조용한 시간을 골라, 1시간 동안 아기가 10번 움직이는 데 걸린 시간을 기록해 보기.', '하루 중 가장 조용한 시간을 골라, 1시간 동안 아기가 10번 움직이는 데 걸린 시간을 기록해 보기.', '{"items": [{"id": "w32-d6-cl-1", "label": "하루 중 가장 조용한 시간을 골라, 1시간 동안 아기가 10번 움직이는 데 걸린 시간을 기록해 보기."}]}'::jsonb, 1, true),
    (6, 'w32-d6-cl-2', '배가 단단해졌다 풀리는 느낌이 들 때마다, 수축이 시작된 시간을 간단히 적고, 자세를 바꾸거나 걷거나 쉬어본 후 30분~1시간 뒤에 어떻게 달라졌는지 확인해 보기. (규칙적이고 점점 간격이 짧아지는 수축, 통증이 강해지는 경우는 조산 여부 확인이 필요하다는 신호입니다.)', '배가 단단해졌다 풀리는 느낌이 들 때마다, 수축이 시작된 시간을 간단히 적고, 자세를 바꾸거나 걷거나 쉬어본 후 30분~1시간 뒤에 어떻게 달라졌는지 확인해 보기. (규칙적이고 점점 간격이 짧아지는 수축, 통증이 강해지는 경우는 조산 여부 확인이 필요하다는 신호입니다.)', '{"items": [{"id": "w32-d6-cl-2", "label": "배가 단단해졌다 풀리는 느낌이 들 때마다, 수축이 시작된 시간을 간단히 적고, 자세를 바꾸거나 걷거나 쉬어본 후 30분~1시간 뒤에 어떻게 달라졌는지 확인해 보기. (규칙적이고 점점 간격이 짧아지는 수축, 통증이 강해지는 경우는 조산 여부 확인이 필요하다는 신호입니다.)"}]}'::jsonb, 2, true),
    (6, 'w32-d6-cl-3', '자기 전에는 왼쪽으로 옆으로 누워, 다리 사이·배 밑·허리 뒤에 베개를 받친 자세를 시도해 보기.', '자기 전에는 왼쪽으로 옆으로 누워, 다리 사이·배 밑·허리 뒤에 베개를 받친 자세를 시도해 보기.', '{"items": [{"id": "w32-d6-cl-3", "label": "자기 전에는 왼쪽으로 옆으로 누워, 다리 사이·배 밑·허리 뒤에 베개를 받친 자세를 시도해 보기."}]}'::jsonb, 3, true),
    (7, 'w32-d7-cl-1', '남편과 함께 출산 장소(병원·센터 등), 분만 방식(질식 분만/계획 제왕절개), 분만실에 함께 있을 사람에 대해 구체적으로 이야기해기.', '남편과 함께 출산 장소(병원·센터 등), 분만 방식(질식 분만/계획 제왕절개), 분만실에 함께 있을 사람에 대해 구체적으로 이야기해기.', '{"items": [{"id": "w32-d7-cl-1", "label": "남편과 함께 출산 장소(병원·센터 등), 분만 방식(질식 분만/계획 제왕절개), 분만실에 함께 있을 사람에 대해 구체적으로 이야기해기."}]}'::jsonb, 1, true),
    (7, 'w32-d7-cl-2', '출산휴가·육아휴직, 산후조리원·산후도우미, 건강보험, 기본 육아·산후 용품이 어느 정도 준비되었는지 체크리스트를 만들어 보기.', '출산휴가·육아휴직, 산후조리원·산후도우미, 건강보험, 기본 육아·산후 용품이 어느 정도 준비되었는지 체크리스트를 만들어 보기.', '{"items": [{"id": "w32-d7-cl-2", "label": "출산휴가·육아휴직, 산후조리원·산후도우미, 건강보험, 기본 육아·산후 용품이 어느 정도 준비되었는지 체크리스트를 만들어 보기."}]}'::jsonb, 2, true),
    (7, 'w32-d7-cl-3', '아기가 태어난 뒤의 병원·집 방문 규칙에 대해서도 남편과 미리 나누어 보기. (예: “첫 2주는 가까운 가족만 짧게 방문”, “방문 시간 30분 이내”, “아기가 잠들어 있으면 깨우지 않기” 등.', '아기가 태어난 뒤의 병원·집 방문 규칙에 대해서도 남편과 미리 나누어 보기. (예: “첫 2주는 가까운 가족만 짧게 방문”, “방문 시간 30분 이내”, “아기가 잠들어 있으면 깨우지 않기” 등.', '{"items": [{"id": "w32-d7-cl-3", "label": "아기가 태어난 뒤의 병원·집 방문 규칙에 대해서도 남편과 미리 나누어 보기. (예: “첫 2주는 가까운 가족만 짧게 방문”, “방문 시간 30분 이내”, “아기가 잠들어 있으면 깨우지 않기” 등."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 32)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w32-d1-q-1', '“요즘의 내 몸은 예전보다 더 무겁고 숨이 차지만, 그만큼 누군가의 몸을 함께 만들어 주고 있죠. 지금의 건강한 몸이 아니었다면 절대 할 수 없었을 일은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w32-d1-q-2', '“앞으로 몇 주 동안 내 몸과 아기 몸이 함께 더 무거워질 거예요. 그 과정에서 나는, 나 자신에게 어떤 말투와 표정으로 ‘괜찮아, 잘하고 있어’라고 말해주고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w32-d2-q-1', '“아기가 스스로 머리를 아래로 향하게 되는 이 시기, 나 역시 내 삶의 중심을 어디에 두고 싶은지, 지금의 나는 어디를 ‘기준점’으로 두고 기대고 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w32-d2-q-2', '“갑자기 찌릿하고 들어오는 통증처럼, 내 마음도 가끔 예고 없이 아파질 때가 있죠. 그럴 때 나는 나에게 어떤 말과 어떤 손길을 건네줄 수 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w32-d3-q-1', '“내 숨이 가빠진다고 느껴질 때, 이 사실을 떠올리면 내 마음에는 어떤 변화가 생기나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w32-d3-q-2', '“요즘 나는 ‘배부르게 먹는 것’보다 ‘편안하게 먹는 것’을 더 신경 쓰고 있어요. 이 시기를 지나서도 내 삶에서 조금 덜어내고 싶어지는 과한 것들은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w32-d4-q-1', '“아기는 지금 자기 안에 필요한 것들을 차곡차곡 저장하고 있어요. 그렇다면 나에게 꼭 남겨 주고 싶은 자원은 무엇인지 떠올려 볼 수 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w32-d4-q-2', '“아이에게 ‘튼튼한 뼈’와 ‘충분한 영양’뿐 아니라, 어떤 마음의 자산을 물려주고 싶은가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w32-d5-q-1', '“아기가 지금 가장 많이 듣고 있는 소리는 무엇일까요? 앞으로 아기에게 가장 많이 들려주고 싶은 소리는 어떤 것인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w32-d5-q-2', '“요즘 내 몸이 보내는 신호들 중, 내가 자꾸 무시하고 지나치는 것은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w32-d6-q-1', '“아기는 점점 좁아지는 공간 안에서 자신만의 리듬으로 계속 움직이고 있어요. 엄마가 내 리듬을 지키기 위해 할 수 있는 작은 움직임은 무엇일까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w32-d6-q-2', '“내가 느끼는 배의 긴장과 이완, 아기의 발차기와 멈춤은 사실 우리가 함께 보내는 리듬이죠. 오늘 그 리듬을 음악에 비유한다면, 어떤 곡의 분위기와 닮았을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w32-d7-q-1', '“이제 정말 ‘곧이다’라는 느낌을 떠올릴 때, 나를 가장 설레게 하는 장면과 가장 두렵게 하는 장면은 각각 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w32-d7-q-2', '“아기가 태어난 뒤 첫 몇 주 동안, 나는 우리 가족과 주변 사람들에게 어떤 경계와 리듬을 부탁하고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 33 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  33,
  '33주차 발달 정보',
  '',
  '',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 34 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  34,
  '34주차 발달 정보',
  '아기는 머리부터 발끝까지 약 45cm, 17.8~17.84인치 정도로 자랐고, 몸무게는 약 2.2~2.4kg 정도라 멜론 크기에 비유될 만큼 제법 “큰 아기”가 되었어요.',
  '배가 앞으로 많이 나오면서 척추를 지지하는 근육이 늘어나고 약해져 허리 통증이 심해지기 쉬워요. 이런 요통은 흔하지만, 평소 없던 허리 통증이 갑자기 생기거나 통증이 점점 심해진다면 조기진통의 신호일 수 있어서 꼭 의료진과 상의해야 해요. 자궁이 커지면서 갈비뼈 아래까지 차오르다 보니 상복부가 답답하거나 숨이 차고, 배꼽이 툭 튀어나온 것처럼 보이기도 해요. “임신한 배”라는 느낌이 아주 분명해지는 시기에요.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '34주 1일차',
  '{"items": ["아기는 머리부터 발끝까지 약 45cm, 17.8~17.84인치 정도로 자랐고, 몸무게는 약 2.2~2.4kg 정도라 멜론 크기에 비유될 만큼 제법 “큰 아기”가 되었어요."]}'::jsonb,
  '{"items": ["배가 앞으로 많이 나오면서 척추를 지지하는 근육이 늘어나고 약해져 허리 통증이 심해지기 쉬워요. 이런 요통은 흔하지만, 평소 없던 허리 통증이 갑자기 생기거나 통증이 점점 심해진다면 조기진통의 신호일 수 있어서 꼭 의료진과 상의해야 해요.", "자궁이 커지면서 갈비뼈 아래까지 차오르다 보니 상복부가 답답하거나 숨이 차고, 배꼽이 툭 튀어나온 것처럼 보이기도 해요. “임신한 배”라는 느낌이 아주 분명해지는 시기에요."]}'::jsonb,
  '아가는 이제 거의 신생아와 비슷한 모습이에요. 따뜻한 지방을 차곡차곡 쌓으면서, 엄마 품 밖에서도 버틸 준비를 하고 있어요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 34
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '34주 2일차',
  '{"items": ["아기의 손톱은 이미 손끝까지 닿을 정도로 자라 있어서, 태어났을 때 작은 손톱으로 얼굴을 살짝 긁을 수도 있을 정도에요.", "발톱은 아직 발가락 끝까지 완전히 자라진 않았지만 계속 자라나는 중이에요."]}'::jsonb,
  '{"items": ["아기의 체중과 자세 변화로 골반·허리·사타구니·엉덩이·다리 쪽에 통증이 자주 찾아올 수 있어요. 관절과 인대가 이완되면서 골반 통증도 더 심해져 움직임이 제한될 정도로 불편할 수 있어요.", "자궁과 아기의 무게가 좌골신경을 눌러, 엉덩이에서 다리 뒤까지 쏘는 듯 흘러 내려가는 좌골신경통을 느끼는 임산부도 많아요. 오래 서 있기나 한쪽으로 체중을 싣는 자세가 이런 통증을 더 악화시킬 수 있으니 주의가 필요해요."]}'::jsonb,
  '아가의 손톱이 손끝까지 다 자랐어요. 엄마 손가락을 꼭 잡을 준비를 하나씩 하고 있어요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 34
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '34주 3일차',
  '{"items": ["아기는 소리·빛·촉각에 적극적으로 반응해서, 엄마의 목소리나 주변 대화, 틀어주는 음악에 몸을 움직이며 답하고 있어요. 청력이 많이 발달한 덕분에 지금 자주 듣는 소리를 나중에도 익숙하게 느낄 수 있어요."]}'::jsonb,
  '{"items": ["임신 호르몬(프로게스테론)과 활동량 감소, 자궁이 장을 눌러 장운동이 느려지면서 임산부의 약 절반이 변비를 경험해.요 변비가 계속되면 배가 더부룩하고 불편할 뿐 아니라 치질도 악화되기 쉬워요.", "혈액량 증가와 수분 저류로 체내 수분 분포가 달라지고, 몸이 힘들어 물을 충분히 마시지 못하면 변비가 더 심해질 수 있어서, 변비를 적극적으로 관리해야 한다는 점이 특히 중요해요."]}'::jsonb,
  '엄마가 말할 때, 음악을 켤 때, 아가는 귀 기울여 듣고 있어요. 나중에 밖에서 들어도 ‘이건 엄마 세상 소리구나’ 하고 금방 알아볼 거예요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 34
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '34주 4일차',
  '{"items": ["자궁 안 공간이 점점 좁아지면서 예전처럼 큰 회전 동작은 줄어들지만, 발차기·비틀기·팔꿈치로 밀어 올리는 듯한 강하고 분명한 태동은 더 또렷하게 느껴질 수 있어요."]}'::jsonb,
  '{"items": ["임신 중 정상적인 질 분비물은 맑거나 우윳빛이고, 냄새가 심하지 않으며, 가렵지 않은 상태에요. 임신 후반으로 갈수록 분비량이 늘어 속옷이 자주 축축해지는 느낌을 받을 수 있어요.", "양수낭이 터져 양수가 새는 경우(양막 파열)에는, 소변처럼 한 번에 나오고 멈추기보다 속옷이 계속 젖을 정도로 물이 새고, 맑거나 약간 노란색·거의 냄새가 없거나 약간 달콤한 향으로 느껴질 수 있어요."]}'::jsonb,
  '아가는 공간은 조금 좁아졌지만 여전히 ‘나 여기 있어요’라고 꾸준히 신호를 보내고 있어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 34
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '34주 5일차',
  '{"items": ["아기의 머리카락은 비교적 풍성하게 자라 있을 수 있고, 남아라면 복부에 있던 고환이 음낭 쪽으로 내려오는 과정에 있어 외성기도 명확하게 구분되는 시기에요."]}'::jsonb,
  '{"items": ["유두·유륜 색이 진해지고, 유방에서 노란빛 또는 맑은 액체가 조금씩 새어나올 수 있는데, 이것은 성숙한 모유가 아니라 단백질·항체가 풍부한 초유에요.", "발·발목·손·얼굴 부종이 흔하고 특히 저녁이나 더운 날에 심해지는데, 발볼이 넓어지고 발 길이가 길어져 신발 사이즈가 커지기도 해요. 어떤 변화는 출산 후에도 남을 수 있어요."]}'::jsonb,
  '아가는 점점 더 ‘나다운 모습’을 갖춰 가고 있어요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 34
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '34주 6일차',
  '{"items": ["아기는 자궁 안에서 듣고·보고·자고·호흡 연습을 하며, 뇌와 신경계가 빠르게 성숙하는 덕분에 수면과 각성 리듬이 어느 정도 자리 잡고 있어요."]}'::jsonb,
  '{"items": ["임신 중에는 호르몬 변화·혈류 증가·부종 등으로 귀가 먹먹하거나 이명·어지럼증·두통이 동반되는 청력 변화를 경험할 수 있어요. 대부분 일시적이지만, 증상이 심하거나 오래 지속되면 반드시 의료진에게 알려야 해요.", "임신 호르몬과 수분·피지 변화로 임신성 여드름이 생기기도 하는데, 레티노이드·하이드로퀴논·일부 경구약은 임신 중 안전하지 않을 수 있어 사용을 피하고, 다른 치료제는 의사 상담 후 사용하는 것이 좋아요."]}'::jsonb,
  '엄마의 웃음소리, 대화, 숨 쉬는 소리 하나하나가 아가에게는 ‘밖 세상 예고편’이에요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 34
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '34주 7일차',
  '{"items": ["이제 아기는 길이와 체중 면에서 거의 신생아에 가까운 모습이지만, 앞으로 남은 주 동안 지방·폐·면역이 더 완성되며 마지막 마무리를 해 나가게 돼요."]}'::jsonb,
  '{"items": ["자궁저 높이가 치골에서 32~36cm 정도까지 올라오면서 배는 충분히 앞으로 나와 있고, 일부 아기는 골반 쪽으로 더 내려오면서 속쓰림·호흡곤란은 줄어드는 대신 골반·회음부 압박감이 커질 수 있어요.", "누적된 피로와 수면 부족, 근육통 때문에 임신 초기때처럼 피곤함이 다시 심해지는 시기로, 과한 일정을 줄이고 휴식과 도움을 구하는 것이 중요한 “체력 관리의 고비”이기도 해요."]}'::jsonb,
  '아가는 이제 머리를 아래로 두고 세상을 향해 방향을 틀었어요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 34
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 34)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w34-d1-cl-1', '아기 성장에 대해 궁금한 점을 메모해 두었다가, 의사에게 직접 물어보며 내 몸과 아기 상태를 이해하려고 해 보기.', '아기 성장에 대해 궁금한 점을 메모해 두었다가, 의사에게 직접 물어보며 내 몸과 아기 상태를 이해하려고 해 보기.', '{"items": [{"id": "w34-d1-cl-1", "label": "아기 성장에 대해 궁금한 점을 메모해 두었다가, 의사에게 직접 물어보며 내 몸과 아기 상태를 이해하려고 해 보기."}]}'::jsonb, 1, true),
    (1, 'w34-d1-cl-2', '허리가 많이 당기고 아픈 날엔 오래 서 있거나 허리를 젖히는 자세를 피하고, 의자에 앉을 때 허리를 받쳐주는 쿠션을 사용해 척추 부담을 줄여주기.', '허리가 많이 당기고 아픈 날엔 오래 서 있거나 허리를 젖히는 자세를 피하고, 의자에 앉을 때 허리를 받쳐주는 쿠션을 사용해 척추 부담을 줄여주기.', '{"items": [{"id": "w34-d1-cl-2", "label": "허리가 많이 당기고 아픈 날엔 오래 서 있거나 허리를 젖히는 자세를 피하고, 의자에 앉을 때 허리를 받쳐주는 쿠션을 사용해 척추 부담을 줄여주기."}]}'::jsonb, 2, true),
    (1, 'w34-d1-cl-3', '상복부 답답함이 심하면 식사량을 줄이고 횟수를 늘려 먹고, 몸을 앞으로 약간 숙여 앉거나 옆으로 기대어 숨쉬기 편한 자세를 찾아보기.', '상복부 답답함이 심하면 식사량을 줄이고 횟수를 늘려 먹고, 몸을 앞으로 약간 숙여 앉거나 옆으로 기대어 숨쉬기 편한 자세를 찾아보기.', '{"items": [{"id": "w34-d1-cl-3", "label": "상복부 답답함이 심하면 식사량을 줄이고 횟수를 늘려 먹고, 몸을 앞으로 약간 숙여 앉거나 옆으로 기대어 숨쉬기 편한 자세를 찾아보기."}]}'::jsonb, 3, true),
    (2, 'w34-d2-cl-1', '골반·허리 통증이 심한 날에는 무거운 물건 들기, 허리를 비튼 채 몸을 돌리는 동작, 한 자세로 오래 앉아 있기 같은 동작을 의식적으로 줄여 보기.', '골반·허리 통증이 심한 날에는 무거운 물건 들기, 허리를 비튼 채 몸을 돌리는 동작, 한 자세로 오래 앉아 있기 같은 동작을 의식적으로 줄여 보기.', '{"items": [{"id": "w34-d2-cl-1", "label": "골반·허리 통증이 심한 날에는 무거운 물건 들기, 허리를 비튼 채 몸을 돌리는 동작, 한 자세로 오래 앉아 있기 같은 동작을 의식적으로 줄여 보기."}]}'::jsonb, 1, true),
    (2, 'w34-d2-cl-2', '따뜻한 찜질팩을 골반·허리 주변에 잠시 올려 두거나, 산전 요가·골반 기울이기 같은 가벼운 스트레칭으로 뭉친 근육을 풀어주기.', '따뜻한 찜질팩을 골반·허리 주변에 잠시 올려 두거나, 산전 요가·골반 기울이기 같은 가벼운 스트레칭으로 뭉친 근육을 풀어주기.', '{"items": [{"id": "w34-d2-cl-2", "label": "따뜻한 찜질팩을 골반·허리 주변에 잠시 올려 두거나, 산전 요가·골반 기울이기 같은 가벼운 스트레칭으로 뭉친 근육을 풀어주기."}]}'::jsonb, 2, true),
    (2, 'w34-d2-cl-3', '통증으로 일상·업무가 어렵게 느껴지면 혼자 참지 말고, 의사·조산사에게 통증 양상을 설명하고 근무 형태·업무 조정·보조기구 사용에 대해 함께 논의해 보기.', '통증으로 일상·업무가 어렵게 느껴지면 혼자 참지 말고, 의사·조산사에게 통증 양상을 설명하고 근무 형태·업무 조정·보조기구 사용에 대해 함께 논의해 보기.', '{"items": [{"id": "w34-d2-cl-3", "label": "통증으로 일상·업무가 어렵게 느껴지면 혼자 참지 말고, 의사·조산사에게 통증 양상을 설명하고 근무 형태·업무 조정·보조기구 사용에 대해 함께 논의해 보기."}]}'::jsonb, 3, true),
    (3, 'w34-d3-cl-1', '물을 의식적으로 자주 마시고, 잎채소·과일·통곡물·콩류 등 섬유질이 풍부한 음식을 식단에 꾸준히 포함시키기.', '물을 의식적으로 자주 마시고, 잎채소·과일·통곡물·콩류 등 섬유질이 풍부한 음식을 식단에 꾸준히 포함시키기.', '{"items": [{"id": "w34-d3-cl-1", "label": "물을 의식적으로 자주 마시고, 잎채소·과일·통곡물·콩류 등 섬유질이 풍부한 음식을 식단에 꾸준히 포함시키기."}]}'::jsonb, 1, true),
    (3, 'w34-d3-cl-2', '하루 중 짧은 산책이나 가벼운 움직임을 추가해 장운동을 돕고, 변의를 느낄 때는 너무 오래 참지 않기.', '하루 중 짧은 산책이나 가벼운 움직임을 추가해 장운동을 돕고, 변의를 느낄 때는 너무 오래 참지 않기.', '{"items": [{"id": "w34-d3-cl-2", "label": "하루 중 짧은 산책이나 가벼운 움직임을 추가해 장운동을 돕고, 변의를 느낄 때는 너무 오래 참지 않기."}]}'::jsonb, 2, true),
    (3, 'w34-d3-cl-3', '변비가 계속되고 배변 시 통증·출혈이 있거나 치질이 심해지면, “원래 그런가 보다” 넘기지 말고 변 연화제 사용 가능 여부 등 치료 방안을 의료진과 상의하기.', '변비가 계속되고 배변 시 통증·출혈이 있거나 치질이 심해지면, “원래 그런가 보다” 넘기지 말고 변 연화제 사용 가능 여부 등 치료 방안을 의료진과 상의하기.', '{"items": [{"id": "w34-d3-cl-3", "label": "변비가 계속되고 배변 시 통증·출혈이 있거나 치질이 심해지면, “원래 그런가 보다” 넘기지 말고 변 연화제 사용 가능 여부 등 치료 방안을 의료진과 상의하기."}]}'::jsonb, 3, true),
    (4, 'w34-d4-cl-1', '평소 질 분비물의 색·냄새·양을 기억해 두고, 갑작스런 변화나 악취·가려움·통증이 생기면 즉시 진료 예약하기.', '평소 질 분비물의 색·냄새·양을 기억해 두고, 갑작스런 변화나 악취·가려움·통증이 생기면 즉시 진료 예약하기.', '{"items": [{"id": "w34-d4-cl-1", "label": "평소 질 분비물의 색·냄새·양을 기억해 두고, 갑작스런 변화나 악취·가려움·통증이 생기면 즉시 진료 예약하기."}]}'::jsonb, 1, true),
    (4, 'w34-d4-cl-2', '갑자기 “오줌 싼 것 같아” 느껴질 만큼 흘러나오거나, 계속해서 속옷이 젖는 양수 누출이 의심되면 탐폰 대신 패드를 착용하고 바로 병원·조산사에 연락하기.', '갑자기 “오줌 싼 것 같아” 느껴질 만큼 흘러나오거나, 계속해서 속옷이 젖는 양수 누출이 의심되면 탐폰 대신 패드를 착용하고 바로 병원·조산사에 연락하기.', '{"items": [{"id": "w34-d4-cl-2", "label": "갑자기 “오줌 싼 것 같아” 느껴질 만큼 흘러나오거나, 계속해서 속옷이 젖는 양수 누출이 의심되면 탐폰 대신 패드를 착용하고 바로 병원·조산사에 연락하기."}]}'::jsonb, 2, true),
    (4, 'w34-d4-cl-3', '양막 파열 후에는 감염 위험이 커지므로, 의료진 안내 전까지 질에 손가락이나 이물질 넣지 않기, 탕 목욕 대신 샤워하기 등 감염 예방에 신경 쓰기.', '양막 파열 후에는 감염 위험이 커지므로, 의료진 안내 전까지 질에 손가락이나 이물질 넣지 않기, 탕 목욕 대신 샤워하기 등 감염 예방에 신경 쓰기.', '{"items": [{"id": "w34-d4-cl-3", "label": "양막 파열 후에는 감염 위험이 커지므로, 의료진 안내 전까지 질에 손가락이나 이물질 넣지 않기, 탕 목욕 대신 샤워하기 등 감염 예방에 신경 쓰기."}]}'::jsonb, 3, true),
    (5, 'w34-d5-cl-1', '브라 안에 수유패드를 넣어 유방에서 새어 나오는 초유를 편안하게 흡수하도록 하고, 피부가 짓무르지 않도록 샤워 후 부드럽게 말려주기.', '브라 안에 수유패드를 넣어 유방에서 새어 나오는 초유를 편안하게 흡수하도록 하고, 피부가 짓무르지 않도록 샤워 후 부드럽게 말려주기.', '{"items": [{"id": "w34-d5-cl-1", "label": "브라 안에 수유패드를 넣어 유방에서 새어 나오는 초유를 편안하게 흡수하도록 하고, 피부가 짓무르지 않도록 샤워 후 부드럽게 말려주기."}]}'::jsonb, 1, true),
    (5, 'w34-d5-cl-2', '부종이 심할 땐 다리를 심장보다 약간 높게 올려 쉬고, 너무 꽉 끼는 신발·양말 대신 발을 편안하게 해 주는 신발을 선택하기.', '부종이 심할 땐 다리를 심장보다 약간 높게 올려 쉬고, 너무 꽉 끼는 신발·양말 대신 발을 편안하게 해 주는 신발을 선택하기.', '{"items": [{"id": "w34-d5-cl-2", "label": "부종이 심할 땐 다리를 심장보다 약간 높게 올려 쉬고, 너무 꽉 끼는 신발·양말 대신 발을 편안하게 해 주는 신발을 선택하기."}]}'::jsonb, 2, true),
    (5, 'w34-d5-cl-3', '갑작스러운 체중 증가, 얼굴·손·눈 주변의 심한 부기, 두통·시야 흐림·상복부 통증이 느껴지면 “괜찮겠지” 하지 말고 바로 의료진에게 연락해 평가를 받기.', '갑작스러운 체중 증가, 얼굴·손·눈 주변의 심한 부기, 두통·시야 흐림·상복부 통증이 느껴지면 “괜찮겠지” 하지 말고 바로 의료진에게 연락해 평가를 받기.', '{"items": [{"id": "w34-d5-cl-3", "label": "갑작스러운 체중 증가, 얼굴·손·눈 주변의 심한 부기, 두통·시야 흐림·상복부 통증이 느껴지면 “괜찮겠지” 하지 말고 바로 의료진에게 연락해 평가를 받기."}]}'::jsonb, 3, true),
    (6, 'w34-d6-cl-1', '귀가 먹먹하거나 어지럽고 두통이 동반될 때는 갑자기 일어나지 말고, 잠시 앉아서 숨을 고른 뒤 물을 조금씩 마시며 증상을 관찰하기. 증상이 반복되면 진료 예약하기.', '귀가 먹먹하거나 어지럽고 두통이 동반될 때는 갑자기 일어나지 말고, 잠시 앉아서 숨을 고른 뒤 물을 조금씩 마시며 증상을 관찰하기. 증상이 반복되면 진료 예약하기.', '{"items": [{"id": "w34-d6-cl-1", "label": "귀가 먹먹하거나 어지럽고 두통이 동반될 때는 갑자기 일어나지 말고, 잠시 앉아서 숨을 고른 뒤 물을 조금씩 마시며 증상을 관찰하기. 증상이 반복되면 진료 예약하기."}]}'::jsonb, 1, true),
    (6, 'w34-d6-cl-2', '피부 변화가 신경 쓰일 때, 강한 화학 필링·자극적인 각질 제거는 피하고, 임신 중 사용 가능한 화장품인지 성분을 확인한 뒤 단순하고 순한 스킨케어 위주로 관리하기.', '피부 변화가 신경 쓰일 때, 강한 화학 필링·자극적인 각질 제거는 피하고, 임신 중 사용 가능한 화장품인지 성분을 확인한 뒤 단순하고 순한 스킨케어 위주로 관리하기.', '{"items": [{"id": "w34-d6-cl-2", "label": "피부 변화가 신경 쓰일 때, 강한 화학 필링·자극적인 각질 제거는 피하고, 임신 중 사용 가능한 화장품인지 성분을 확인한 뒤 단순하고 순한 스킨케어 위주로 관리하기."}]}'::jsonb, 2, true),
    (6, 'w34-d6-cl-3', '하루 중 마음이 조용해지는 시간을 정해, 좋아하는 음악이나 자연의 소리를 틀어두고 아기와 함께 듣는 “귀 태교 시간”을 가져보기.', '하루 중 마음이 조용해지는 시간을 정해, 좋아하는 음악이나 자연의 소리를 틀어두고 아기와 함께 듣는 “귀 태교 시간”을 가져보기.', '{"items": [{"id": "w34-d6-cl-3", "label": "하루 중 마음이 조용해지는 시간을 정해, 좋아하는 음악이나 자연의 소리를 틀어두고 아기와 함께 듣는 “귀 태교 시간”을 가져보기."}]}'::jsonb, 3, true),
    (7, 'w34-d7-cl-1', '하루 중 같은 시간대에 태동을 세는 습관을 유지하며, 2시간 동안 10회 미만으로 느껴지거나 평소와 다르게 조용한 날에는 바로 병원에 문의하기.', '하루 중 같은 시간대에 태동을 세는 습관을 유지하며, 2시간 동안 10회 미만으로 느껴지거나 평소와 다르게 조용한 날에는 바로 병원에 문의하기.', '{"items": [{"id": "w34-d7-cl-1", "label": "하루 중 같은 시간대에 태동을 세는 습관을 유지하며, 2시간 동안 10회 미만으로 느껴지거나 평소와 다르게 조용한 날에는 바로 병원에 문의하기."}]}'::jsonb, 1, true),
    (7, 'w34-d7-cl-2', '출산 가방·카시트 준비를 점검하고, 준비가 덜 된 부분(아기 옷, 엄마 속옷, 서류, 충전기 등)을 체크리스트로 정리해 한두 가지씩 채워 가기.', '출산 가방·카시트 준비를 점검하고, 준비가 덜 된 부분(아기 옷, 엄마 속옷, 서류, 충전기 등)을 체크리스트로 정리해 한두 가지씩 채워 가기.', '{"items": [{"id": "w34-d7-cl-2", "label": "출산 가방·카시트 준비를 점검하고, 준비가 덜 된 부분(아기 옷, 엄마 속옷, 서류, 충전기 등)을 체크리스트로 정리해 한두 가지씩 채워 가기."}]}'::jsonb, 2, true),
    (7, 'w34-d7-cl-3', '이번 주 내내 느꼈던 피로감과 통증 정도를 돌아보며, 다음 주 일정에서 과감히 줄이거나 다른 사람에게 부탁할 수 있는 일을 한 가지라도 정해보기.', '이번 주 내내 느꼈던 피로감과 통증 정도를 돌아보며, 다음 주 일정에서 과감히 줄이거나 다른 사람에게 부탁할 수 있는 일을 한 가지라도 정해보기.', '{"items": [{"id": "w34-d7-cl-3", "label": "이번 주 내내 느꼈던 피로감과 통증 정도를 돌아보며, 다음 주 일정에서 과감히 줄이거나 다른 사람에게 부탁할 수 있는 일을 한 가지라도 정해보기."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 34)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w34-d1-q-1', '“오늘 나의 배를 한 번 쓰다듬으면서, 이 안에 ‘멜론만 한’ 아기가 있다는 사실을 느껴본다면 어떤 기분이 드나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w34-d1-q-2', '“아기가 더 부드럽고 통통한 아기 피부를 만들어가는 이 시기에, 엄마 몸도 조금 더 따뜻하고 부드럽게 돌봐주기 위해 오늘 해줄 수 있는 작은 쉼은 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w34-d2-q-1', '“골반·허리가 아픈 오늘, 내 몸이 보내는 신호를 ‘참아야 할 것’이 아니라 ‘도와달라는 말’이라고 생각해 본다면, 나는 내 몸에게 어떤 말을 건네고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w34-d2-q-2', '“언젠가 아기가 많이 걷고 뛰어다닐 때, 웃으면서 들려줄 수 있는 이야기는 무엇일까요?', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w34-d3-q-1', '“아기가 처음 말할 때, 어떤 말을 듣고싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w34-d3-q-2', '“아기가 엄마의 목소리와 음악을 기억하고 있다는 사실을 떠올리면, 오늘 아기에게 들려주고 싶은 한마디 말 또는 한 곡의 노래는 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w34-d4-q-1', '“내 몸에서 나오는 분비물과 신호들을 조금 더 세심하게 바라본다면, 오늘 나는 내 몸에게 어떤 ‘안부 인사’를 건네고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w34-d4-q-2', '“혹시 양수가 터지거나 조기진통이 온다면, 나는 누구에게 가장 먼저 연락하고 어떤 도움을 받고 싶은지, 마음속으로 한 번 그려볼까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w34-d5-q-1', '“유방에서 새어 나오는 작은 초유 방울을 보며, ‘아기에게 줄 첫 선물’이라는 관점으로 바라본다면 내 마음은 어떻게 달라지나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w34-d5-q-2', '“오늘 내 발과 손의 부기를 살펴보면서, 내가 스스로에게 ‘조금 더 쉬어도 괜찮아’라고 허락해 줄 수 있는 시간은 언제일까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w34-d6-q-1', '“오늘 내 귀에 들어온 소리들 중, 아기에게도 들려주고 싶은 소리는 무엇이었나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w34-d6-q-2', '“거울 속 달라진 나의 얼굴과 배를 바라보며, ‘이 변화가 모두 너를 향한 준비였어’라고 속삭여 준다면, 내 마음의 무게는 조금 가벼워질 수 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w34-d7-q-1', '“이번 주 동안 가장 크게 느껴진 변화는 무엇이었나요? 그 변화가 ‘아기가 태어날 날이 가까워지고 있다’는 어떤 신호처럼 느껴지나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w34-d7-q-2', '“출산 가방과 카시트를 하나씩 준비하며, ‘우리가 곧 함께 집에 돌아올 길’을 상상해 본다면, 그 장면 안의 나는 어떤 표정으로 아기를 안고 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- ===== Week 35 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  35,
  '35주차 발달 정보',
  '머리부터 발끝까지 약 51cm, 몸무게는 3.4kg 안팎으로 작은 수박·호박만 한 크기입니다. 장기들은 거의 모두 완전히 성숙해서, 먹고·울고·숨 쉬고·발길질할 준비까지 끝난 상태입니다. 이제 엄마 뱃속 밖에서 스스로 기능할 수 있도록 돕는 폐·심장·소화기·신경계가 “실전 모드”로 들어가 있는 단계예요.',
  '40주는 ‘만삭’에 해당하고, 많은 가이드에서 “축하합니다 – 예정일에 도착하셨어요!”라고 표현합니다. 하지만 아직 진통이 없다고 해서 늦은 것도, 문제인 것도 아닙니다. 양수 파열은 영화같이 드라마틱하지 않을 수 있어요. 영화처럼 “와르르” 쏟아지는 경우도 있지만, 실제로는 이미 진통이 진행 중일 때 양수가 터지는 경우가 훨씬 더 많고, 진통 전에 먼저 터지는 경우는 전체의 15% 미만입니다.',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '35주 1일차',
  '{"items": ["머리부터 발끝까지 약 51cm, 몸무게는 3.4kg 안팎으로 작은 수박·호박만 한 크기입니다.", "장기들은 거의 모두 완전히 성숙해서, 먹고·울고·숨 쉬고·발길질할 준비까지 끝난 상태입니다. 이제 엄마 뱃속 밖에서 스스로 기능할 수 있도록 돕는 폐·심장·소화기·신경계가 “실전 모드”로 들어가 있는 단계예요."]}'::jsonb,
  '{"items": ["40주는 ‘만삭’에 해당하고, 많은 가이드에서 “축하합니다 – 예정일에 도착하셨어요!”라고 표현합니다. 하지만 아직 진통이 없다고 해서 늦은 것도, 문제인 것도 아닙니다.", "양수 파열은 영화같이 드라마틱하지 않을 수 있어요. 영화처럼 “와르르” 쏟아지는 경우도 있지만, 실제로는 이미 진통이 진행 중일 때 양수가 터지는 경우가 훨씬 더 많고, 진통 전에 먼저 터지는 경우는 전체의 15% 미만입니다."]}'::jsonb,
  '아가는 이제 완전히 ‘수박 사이즈’예요. 여기서 40주 동안 자라서, 이제 스스로 숨 쉬고 엄마 품에서 울 준비를 마쳤어요.',
  1,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 35
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 2, '35주 2일차',
  '{"items": ["대부분의 아기들은 태어난 지 하루 정도는 약간 보랏빛이 감도는 분홍색 피부를 가지고 태어납니다. 이 분홍빛은 피부 아래 보이는 붉은 혈관 때문이고, 혈액순환이 아직 성숙 중이라 손발이 며칠간 푸른 빛을 띨 수 있습니다."]}'::jsonb,
  '{"items": ["배·태반·양수·유방의 무게 때문에 허리에 부담이 가장 큰 시기라, 임산부의 60% 이상이 허리 통증을 경험합니다. 평소와 다른, 갑작스럽게 심해지는 허리 통증은 진통이 시작되는 신호일 수도 있어서, “기존에 있던 무거운 통증인지, 갑자기 리듬을 타는 통증인지”를 관찰하는 것이 중요합니다.", "아기의 머리가 골반에 서서히 내려오면서 일부 산모들은 몸이 가벼워지거나 숨쉬기 조금 편해졌다고 말하기도 해요."]}'::jsonb,
  '아가는 처음 만났을 때 피부가 조금 보랏빛이 돌고, 손발이 퍼래 보여도 괜찮아요.',
  2,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 35
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 3, '35주 3일차',
  '{"items": ["아기는 계속해서 머리카락과 손톱이 자라고 있습니다. 머리카락의 길이와 숱, 손톱 길이는 아이마다 다르지만, 어떤 아기들은 태어나자마자 제법 풍성한 머리와 긴 손톱을 자랑하기도 합니다."]}'::jsonb,
  '{"items": ["양수는 맑고 묽으며, 약간 달콤한 냄새가 나거나 거의 냄새가 없는 편입니다. 크림색·흰색의 끈적한 질 분비물, 노란색 소변과 헷갈릴 수 있어서, 액체의 색·냄새·질감을 함께 살피는 것이 중요합니다.", "진통 전에 먼저 양막이 터지는 경우를 PROM(조기 양막 파열)이라고 합니다. 이 경우 보통 24시간 이내에 자연 진통이 시작되지만, 그렇지 않으면 감염 예방을 위해 의료진이 진통을 유도하기도 합니다."]}'::jsonb,
  '아가가 태어나서 엄마 손을 꼭 쥘 때, 아가의 작은 손톱이 엄마 손바닥을 살짝 간지럽게 할 거예요.',
  3,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 35
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 4, '35주 4일차',
  '{"items": ["먹고·울고·숨 쉬고·발길질하며, 소리·빛·촉감에 반응하는 반사신경을 이미 잘 갖추고 있습니다. 눈을 깜빡이고, 고개를 돌리고, 손을 단단히 쥘 만큼 협응력도 발달해 있어, 실제 세상에서의 첫 상호작용을 준비하는 단계입니다."]}'::jsonb,
  '{"items": ["가진통은 보통 앞쪽 배에서 느껴지는 단단함, 약간의 불편감 정도라면, 진진통은 통증이 분명하고, 일정한 간격으로 찾아오면서 시간이 갈수록 더 강해지고 더 자주 옵니다. 누워 있거나, 목욕을 하거나, 긴장을 풀어도 계속되는 것이 특징입니다.", "아기가 골반으로 내려오면서 골반·엉덩이·사타구니 주변 압박감과 통증이 더 심해질 수 있습니다. 허리에서 시작해 배 앞으로 퍼지는 통증은 진통과 연결되는 경우가 많고, 기존 허리 통증과는 다른 리듬·강도를 보이기도 합니다."]}'::jsonb,
  '아가는 이제 엄마 목소리도 알고, 빛도 느끼고, 손도 꼭 쥘 수 있어요.',
  4,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 35
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 5, '35주 5일차',
  '{"items": ["40주가 지나도 많은 아기들은 여전히 자궁 안이 편안해서, 예정일을 며칠·일주일까지 넘기기도 합니다. 그동안도 아기는 머리카락과 손톱을 계속 자라게 하고, 폐와 뇌를 조금씩 더 다듬으며 ‘완벽한 출발’을 준비합니다."]}'::jsonb,
  '{"items": ["마음챙김과 간단한 명상하기. “아기가 준비되면 나올 것, 내 몸과 의료진이 함께 나와 아기를 지키고 있다”는 사실을 반복해서 떠올리며, 호흡에 집중하는 연습입니다.", "배와 허리 통증, 빈뇨, 불안 때문에 잠이 쉽게 오지 않을 수 있습니다. 이 시기의 불면은 매우 흔하고, 임신 후반 여성의 약 3분의 2가 겪는 증상이라고 알려져 있습니다."]}'::jsonb,
  '아가는 조금 늦는 것 같다면 조금 더 준비하고 있을 뿐이에요.',
  5,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 35
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 6, '35주 6일차',
  '{"items": ["아기는 이미 엄마의 목소리를 인지할 수 있고, 출생 후에도 자궁 안에서 듣던 그 목소리를 가장 편안하게 느끼게 됩니다."]}'::jsonb,
  '{"items": ["배가 호박만 한 크기로 자라면서 몸을 움직이기도 벅찰 수 있습니다. 걸음이 느려지고, 오래 서 있으면 골반과 허리가 금방 아플 수 있습니다.", "공간이 좁아져서 예전처럼 큰 발차기보다는 굽히고 밀고 누르는 둔한 움직임이 느껴질 수 있지만, “여전히 평소 같은 패턴으로 움직이고 있는지”는 계속 관찰해야 합니다. 움직임이 현저히 줄었다고 느껴지면 바로 연락하셔야 합니다."]}'::jsonb,
  '아가는 엄마와 아빠가 해주는 말들을 모두 듣고 있어요.',
  6,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 35
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 7, '35주 7일차',
  '{"items": ["40주가 지나도, 많은 의료진은 건강한 임신이라면 41주 정도까지 자연 진통을 기다리기도 합니다. 다만 예정일 이후에는 비스트레스 검사(NST)와 초음파를 통해 양수량·태동·심박수 등을 더 자주 확인하며, 필요 시 유도분만을 권할 수 있습니다."]}'::jsonb,
  '{"items": ["40주에 아직 진통이 없을 수도 있고, 그것은 아주 흔한 일입니다. 담당 의사는 NST와 초음파 결과를 보면서, 41주쯤 유도분만을 제안하기도 합니다.", "양수가 터졌는데 24시간 안에 진통이 시작되지 않거나, 자간전증·임신성 고혈압·당뇨·태반 문제 등에 따라 “빨리 아기를 만나는 편이 더 안전하다”고 판단되면, 진통 유도는 엄마와 아기를 위한 계획된 선택이 될 수 있습니다."]}'::jsonb,
  '아가는 이제 정말 거의 다 왔어요.',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 35
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 35)
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w35-d1-cl-1', '(병원으로 가야하는) 진통·양수 기준 다시 확인하기.', '(병원으로 가야하는) 진통·양수 기준 다시 확인하기.', '{"items": [{"id": "w35-d1-cl-1", "label": "(병원으로 가야하는) 진통·양수 기준 다시 확인하기."}]}'::jsonb, 1, true),
    (1, 'w35-d1-cl-2', '언제 병원에 연락할지: 5분 간격, 1분 이상 지속되는 수축이 1~2시간 이상 이어질 때, 양수가 터졌다고 느껴질 때, 선홍색 출혈이 계속될 때 등 “나만의 기준표”를 다시 정리해 두세요.', '언제 병원에 연락할지: 5분 간격, 1분 이상 지속되는 수축이 1~2시간 이상 이어질 때, 양수가 터졌다고 느껴질 때, 선홍색 출혈이 계속될 때 등 “나만의 기준표”를 다시 정리해 두세요.', '{"items": [{"id": "w35-d1-cl-2", "label": "언제 병원에 연락할지: 5분 간격, 1분 이상 지속되는 수축이 1~2시간 이상 이어질 때, 양수가 터졌다고 느껴질 때, 선홍색 출혈이 계속될 때 등 “나만의 기준표”를 다시 정리해 두세요."}]}'::jsonb, 2, true),
    (1, 'w35-d1-cl-3', '밤중에 양수가 터질 경우를 대비해 방수 매트리스 커버를 침대에 깔아두기.', '밤중에 양수가 터질 경우를 대비해 방수 매트리스 커버를 침대에 깔아두기.', '{"items": [{"id": "w35-d1-cl-3", "label": "밤중에 양수가 터질 경우를 대비해 방수 매트리스 커버를 침대에 깔아두기."}]}'::jsonb, 3, true),
    (1, 'w35-d1-cl-4', '거울을 보면서 “나는 놀라운 일을 해낼 수 있다” 같이 응원의 말을 소리 내어 말해 보기.', '거울을 보면서 “나는 놀라운 일을 해낼 수 있다” 같이 응원의 말을 소리 내어 말해 보기.', '{"items": [{"id": "w35-d1-cl-4", "label": "거울을 보면서 “나는 놀라운 일을 해낼 수 있다” 같이 응원의 말을 소리 내어 말해 보기."}]}'::jsonb, 4, true),
    (2, 'w35-d2-cl-1', '허리 통증 변화 기록하기. 허리 통증이 “전보다 더 심해졌는지, 규칙적으로 파도처럼 오는지” 메모 앱이나 수첩에 적어 보세요. 갑작스러운 강도 변화나 리듬이 느껴지면 수축 타이머를 함께 켜 두시는 것도 좋습니다.', '허리 통증 변화 기록하기. 허리 통증이 “전보다 더 심해졌는지, 규칙적으로 파도처럼 오는지” 메모 앱이나 수첩에 적어 보세요. 갑작스러운 강도 변화나 리듬이 느껴지면 수축 타이머를 함께 켜 두시는 것도 좋습니다.', '{"items": [{"id": "w35-d2-cl-1", "label": "허리 통증 변화 기록하기. 허리 통증이 “전보다 더 심해졌는지, 규칙적으로 파도처럼 오는지” 메모 앱이나 수첩에 적어 보세요. 갑작스러운 강도 변화나 리듬이 느껴지면 수축 타이머를 함께 켜 두시는 것도 좋습니다."}]}'::jsonb, 1, true),
    (2, 'w35-d2-cl-2', '가진통 vs 진진통 구분 연습하기. 배가 뭉칠 때마다 ☐ 통증이 있는지, ☐ 간격이 점점 좁아지는지, ☐ 쉬거나 물을 마셨을 때 줄어드는지 세 가지를 간단히 점검해 보세요.', '가진통 vs 진진통 구분 연습하기. 배가 뭉칠 때마다 ☐ 통증이 있는지, ☐ 간격이 점점 좁아지는지, ☐ 쉬거나 물을 마셨을 때 줄어드는지 세 가지를 간단히 점검해 보세요.', '{"items": [{"id": "w35-d2-cl-2", "label": "가진통 vs 진진통 구분 연습하기. 배가 뭉칠 때마다 ☐ 통증이 있는지, ☐ 간격이 점점 좁아지는지, ☐ 쉬거나 물을 마셨을 때 줄어드는지 세 가지를 간단히 점검해 보세요."}]}'::jsonb, 2, true),
    (2, 'w35-d2-cl-3', '허리 완화를 위한 부드러운 운동 해보기. 편안한 걷기, 부드러운 스트레칭, 따뜻한 샤워처럼 허리 부담을 줄여주는 활동을 하루에 10~20분만이라도 해보세요.', '허리 완화를 위한 부드러운 운동 해보기. 편안한 걷기, 부드러운 스트레칭, 따뜻한 샤워처럼 허리 부담을 줄여주는 활동을 하루에 10~20분만이라도 해보세요.', '{"items": [{"id": "w35-d2-cl-3", "label": "허리 완화를 위한 부드러운 운동 해보기. 편안한 걷기, 부드러운 스트레칭, 따뜻한 샤워처럼 허리 부담을 줄여주는 활동을 하루에 10~20분만이라도 해보세요."}]}'::jsonb, 3, true),
    (3, 'w35-d3-cl-1', '“양수 체크 3단계” 정리해두기. ① 색: 맑은 물 같은지, 분홍·노란 기운은 어떤지, ② 냄새: 거의 없거나 살짝 단내인지, 소변 냄새와 다른지, ③ 양: 갑자기 많은 양인지, 패드가 30분 내에 다시 젖는지 셋 중 하나라도 걱정되면 바로 전화할 수 있도록 번호를 눈에 띄는 곳에 붙여 두세요.', '“양수 체크 3단계” 정리해두기. ① 색: 맑은 물 같은지, 분홍·노란 기운은 어떤지, ② 냄새: 거의 없거나 살짝 단내인지, 소변 냄새와 다른지, ③ 양: 갑자기 많은 양인지, 패드가 30분 내에 다시 젖는지 셋 중 하나라도 걱정되면 바로 전화할 수 있도록 번호를 눈에 띄는 곳에 붙여 두세요.', '{"items": [{"id": "w35-d3-cl-1", "label": "“양수 체크 3단계” 정리해두기. ① 색: 맑은 물 같은지, 분홍·노란 기운은 어떤지, ② 냄새: 거의 없거나 살짝 단내인지, 소변 냄새와 다른지, ③ 양: 갑자기 많은 양인지, 패드가 30분 내에 다시 젖는지 셋 중 하나라도 걱정되면 바로 전화할 수 있도록 번호를 눈에 띄는 곳에 붙여 두세요."}]}'::jsonb, 1, true),
    (3, 'w35-d3-cl-2', '양수 의심 시 행동 계획 미리 써두기. “축축함을 느꼈을 때 ⇒ 샤워는 잠시 미루고 ⇒ 패드 착용 ⇒ 시간 체크 ⇒ 30분 후 상태 확인 ⇒ 의료진에 연락” 순서로 짧게 적어 두고, 파트너와 함께 공유해 두시면 좋습니다.', '양수 의심 시 행동 계획 미리 써두기. “축축함을 느꼈을 때 ⇒ 샤워는 잠시 미루고 ⇒ 패드 착용 ⇒ 시간 체크 ⇒ 30분 후 상태 확인 ⇒ 의료진에 연락” 순서로 짧게 적어 두고, 파트너와 함께 공유해 두시면 좋습니다.', '{"items": [{"id": "w35-d3-cl-2", "label": "양수 의심 시 행동 계획 미리 써두기. “축축함을 느꼈을 때 ⇒ 샤워는 잠시 미루고 ⇒ 패드 착용 ⇒ 시간 체크 ⇒ 30분 후 상태 확인 ⇒ 의료진에 연락” 순서로 짧게 적어 두고, 파트너와 함께 공유해 두시면 좋습니다."}]}'::jsonb, 2, true),
    (3, 'w35-d3-cl-3', '틈틈히 휴식을 챙겨주기. 좋아하는 프로그램을 보거나, 소설을 읽거나, 오랜 친구에게 전화를 걸거나, 늦잠을 자거나, 가능할 때 낮잠을 자세요.', '틈틈히 휴식을 챙겨주기. 좋아하는 프로그램을 보거나, 소설을 읽거나, 오랜 친구에게 전화를 걸거나, 늦잠을 자거나, 가능할 때 낮잠을 자세요.', '{"items": [{"id": "w35-d3-cl-3", "label": "틈틈히 휴식을 챙겨주기. 좋아하는 프로그램을 보거나, 소설을 읽거나, 오랜 친구에게 전화를 걸거나, 늦잠을 자거나, 가능할 때 낮잠을 자세요."}]}'::jsonb, 3, true),
    (4, 'w35-d4-cl-1', '수축이 느껴질 때마다 시작·끝 시간을 눌러 간격과 지속 시간을 기록하기. 4~5분 간격, 각 수축이 1분 이상, 1~2시간 이상 지속된다면 “병원 갈 준비” 신호로 생각해 보셔도 좋습니다.', '수축이 느껴질 때마다 시작·끝 시간을 눌러 간격과 지속 시간을 기록하기. 4~5분 간격, 각 수축이 1분 이상, 1~2시간 이상 지속된다면 “병원 갈 준비” 신호로 생각해 보셔도 좋습니다.', '{"items": [{"id": "w35-d4-cl-1", "label": "수축이 느껴질 때마다 시작·끝 시간을 눌러 간격과 지속 시간을 기록하기. 4~5분 간격, 각 수축이 1분 이상, 1~2시간 이상 지속된다면 “병원 갈 준비” 신호로 생각해 보셔도 좋습니다."}]}'::jsonb, 1, true),
    (4, 'w35-d4-cl-2', '눈을 감고 머리부터 발끝까지 몸을 한 번 훑으면서, 힘이 들어간 부위를 찾아 깊게 숨을 들이마시고 내쉬며 힘을 빼주는 연습을 지금 해두기. 통증이 올수록 온몸에 힘이 들어가기 쉽지만, 오히려 이완이 더 큰 도움이 됩니다.', '눈을 감고 머리부터 발끝까지 몸을 한 번 훑으면서, 힘이 들어간 부위를 찾아 깊게 숨을 들이마시고 내쉬며 힘을 빼주는 연습을 지금 해두기. 통증이 올수록 온몸에 힘이 들어가기 쉽지만, 오히려 이완이 더 큰 도움이 됩니다.', '{"items": [{"id": "w35-d4-cl-2", "label": "눈을 감고 머리부터 발끝까지 몸을 한 번 훑으면서, 힘이 들어간 부위를 찾아 깊게 숨을 들이마시고 내쉬며 힘을 빼주는 연습을 지금 해두기. 통증이 올수록 온몸에 힘이 들어가기 쉽지만, 오히려 이완이 더 큰 도움이 됩니다."}]}'::jsonb, 2, true),
    (4, 'w35-d4-cl-3', '준비해둔 출산가방 점검하기.', '준비해둔 출산가방 점검하기.', '{"items": [{"id": "w35-d4-cl-3", "label": "준비해둔 출산가방 점검하기."}]}'::jsonb, 3, true),
    (5, 'w35-d5-cl-1', '마음챙김 시간 5분 정하기. 하루 중 한 타임을 정해서, 핸드폰을 멀리 두고 “조용한 호흡 5분”만 해보세요.', '마음챙김 시간 5분 정하기. 하루 중 한 타임을 정해서, 핸드폰을 멀리 두고 “조용한 호흡 5분”만 해보세요.', '{"items": [{"id": "w35-d5-cl-1", "label": "마음챙김 시간 5분 정하기. 하루 중 한 타임을 정해서, 핸드폰을 멀리 두고 “조용한 호흡 5분”만 해보세요."}]}'::jsonb, 1, true),
    (5, 'w35-d5-cl-2', '30분 이상 누워도 잠이 오지 않으면, 억지로 뒤척이지 마시고 조용한 방으로 나와 책을 읽거나, 잔잔한 음악을 들으며 다시 졸릴 때까지 기다려 보기.', '30분 이상 누워도 잠이 오지 않으면, 억지로 뒤척이지 마시고 조용한 방으로 나와 책을 읽거나, 잔잔한 음악을 들으며 다시 졸릴 때까지 기다려 보기.', '{"items": [{"id": "w35-d5-cl-2", "label": "30분 이상 누워도 잠이 오지 않으면, 억지로 뒤척이지 마시고 조용한 방으로 나와 책을 읽거나, 잔잔한 음악을 들으며 다시 졸릴 때까지 기다려 보기."}]}'::jsonb, 2, true),
    (5, 'w35-d5-cl-3', '‘해야 할 일’보다 ‘할 수 있는 만큼’으로 줄이기. 출산 전에 꼭 해야 한다고 생각했던 일들을 나열해 본 뒤, 오늘은 그중 1~2개만 선택해서 해보세요. 나머지는 출산 후 천천히 해도 괜찮다는 걸 스스로에게 허용해 주세요.', '‘해야 할 일’보다 ‘할 수 있는 만큼’으로 줄이기. 출산 전에 꼭 해야 한다고 생각했던 일들을 나열해 본 뒤, 오늘은 그중 1~2개만 선택해서 해보세요. 나머지는 출산 후 천천히 해도 괜찮다는 걸 스스로에게 허용해 주세요.', '{"items": [{"id": "w35-d5-cl-3", "label": "‘해야 할 일’보다 ‘할 수 있는 만큼’으로 줄이기. 출산 전에 꼭 해야 한다고 생각했던 일들을 나열해 본 뒤, 오늘은 그중 1~2개만 선택해서 해보세요. 나머지는 출산 후 천천히 해도 괜찮다는 걸 스스로에게 허용해 주세요."}]}'::jsonb, 3, true),
    (6, 'w35-d6-cl-1', '파트너/가족과 ‘출발 시나리오’ 점검하기. 양수가 터지거나 규칙적인 진통이 시작되었을 때, 어떻게 병원까지 이동할 지, 병원까지의 동선, 짐을 어디에 두고 갈지를 다시 한 번 같이 점검해 두세요.', '파트너/가족과 ‘출발 시나리오’ 점검하기. 양수가 터지거나 규칙적인 진통이 시작되었을 때, 어떻게 병원까지 이동할 지, 병원까지의 동선, 짐을 어디에 두고 갈지를 다시 한 번 같이 점검해 두세요.', '{"items": [{"id": "w35-d6-cl-1", "label": "파트너/가족과 ‘출발 시나리오’ 점검하기. 양수가 터지거나 규칙적인 진통이 시작되었을 때, 어떻게 병원까지 이동할 지, 병원까지의 동선, 짐을 어디에 두고 갈지를 다시 한 번 같이 점검해 두세요."}]}'::jsonb, 1, true),
    (6, 'w35-d6-cl-2', '순산 호흡을 함께 연습하기. 몸이 무겁더라도 무리하지 않는 범위에서, 남편 도움을 받아 호흡법을 연습해 보세요. 출산 때 남편이 어떻게 도와줄지(손 잡아주기, 허리 마사지, 호흡 리듬 맞춰주기)를 미리 해보면 훨씬 마음이 놓입니다.', '순산 호흡을 함께 연습하기. 몸이 무겁더라도 무리하지 않는 범위에서, 남편 도움을 받아 호흡법을 연습해 보세요. 출산 때 남편이 어떻게 도와줄지(손 잡아주기, 허리 마사지, 호흡 리듬 맞춰주기)를 미리 해보면 훨씬 마음이 놓입니다.', '{"items": [{"id": "w35-d6-cl-2", "label": "순산 호흡을 함께 연습하기. 몸이 무겁더라도 무리하지 않는 범위에서, 남편 도움을 받아 호흡법을 연습해 보세요. 출산 때 남편이 어떻게 도와줄지(손 잡아주기, 허리 마사지, 호흡 리듬 맞춰주기)를 미리 해보면 훨씬 마음이 놓입니다."}]}'::jsonb, 2, true),
    (6, 'w35-d6-cl-3', '아기가 집에 온 시점부터 역할을 생각해보기. 누가 밥을 준비할지, 청소·빨래는 어떻게 나눌지, 아기 목욕·기저귀 교환은 어떻게 함께 할지 간단하게라도 이야기를 나누어, 엄마가 혼자 모든 부담을 짊어지지 않도록 미리 약속해 두면 좋습니다.', '아기가 집에 온 시점부터 역할을 생각해보기. 누가 밥을 준비할지, 청소·빨래는 어떻게 나눌지, 아기 목욕·기저귀 교환은 어떻게 함께 할지 간단하게라도 이야기를 나누어, 엄마가 혼자 모든 부담을 짊어지지 않도록 미리 약속해 두면 좋습니다.', '{"items": [{"id": "w35-d6-cl-3", "label": "아기가 집에 온 시점부터 역할을 생각해보기. 누가 밥을 준비할지, 청소·빨래는 어떻게 나눌지, 아기 목욕·기저귀 교환은 어떻게 함께 할지 간단하게라도 이야기를 나누어, 엄마가 혼자 모든 부담을 짊어지지 않도록 미리 약속해 두면 좋습니다."}]}'::jsonb, 3, true),
    (7, 'w35-d7-cl-1', '유도분만에 대해 질문 리스트 만들기. 유도 시 사용하는 방법(약물, 풍선, 막 박리 등)과 예상 소요 시간, 통증 조절 방법, 응급 상황 시 대처를 미리 적어 가셔서 의료진과 상의해 보세요.', '유도분만에 대해 질문 리스트 만들기. 유도 시 사용하는 방법(약물, 풍선, 막 박리 등)과 예상 소요 시간, 통증 조절 방법, 응급 상황 시 대처를 미리 적어 가셔서 의료진과 상의해 보세요.', '{"items": [{"id": "w35-d7-cl-1", "label": "유도분만에 대해 질문 리스트 만들기. 유도 시 사용하는 방법(약물, 풍선, 막 박리 등)과 예상 소요 시간, 통증 조절 방법, 응급 상황 시 대처를 미리 적어 가셔서 의료진과 상의해 보세요."}]}'::jsonb, 1, true),
    (7, 'w35-d7-cl-2', '‘출산 후’에 일어날 일 미리 읽어보기. 아기가 태어난 직후 받게 될 비타민 K 주사, 선별검사, 피부 접촉, 초기 수유 계획 등을 정리해두면, 막상 분만 후에도 조금 더 침착하게 상황을 받아들이는 데 도움이 됩니다.', '‘출산 후’에 일어날 일 미리 읽어보기. 아기가 태어난 직후 받게 될 비타민 K 주사, 선별검사, 피부 접촉, 초기 수유 계획 등을 정리해두면, 막상 분만 후에도 조금 더 침착하게 상황을 받아들이는 데 도움이 됩니다.', '{"items": [{"id": "w35-d7-cl-2", "label": "‘출산 후’에 일어날 일 미리 읽어보기. 아기가 태어난 직후 받게 될 비타민 K 주사, 선별검사, 피부 접촉, 초기 수유 계획 등을 정리해두면, 막상 분만 후에도 조금 더 침착하게 상황을 받아들이는 데 도움이 됩니다."}]}'::jsonb, 2, true),
    (7, 'w35-d7-cl-3', '오늘을 “마지막 임신날이라 생각하며 일기”로 남겨보기. “40주차의 나에게 해주고 싶은 말”, “아기에게 쓰는 한 줄 편지”, “기다림 속에서 알게 된 나의 강인함 한 가지”를 꼭 적어 두세요. 나중에 돌아보면 오늘의 마음이 큰 위로가 될 거예요.', '오늘을 “마지막 임신날이라 생각하며 일기”로 남겨보기. “40주차의 나에게 해주고 싶은 말”, “아기에게 쓰는 한 줄 편지”, “기다림 속에서 알게 된 나의 강인함 한 가지”를 꼭 적어 두세요. 나중에 돌아보면 오늘의 마음이 큰 위로가 될 거예요.', '{"items": [{"id": "w35-d7-cl-3", "label": "오늘을 “마지막 임신날이라 생각하며 일기”로 남겨보기. “40주차의 나에게 해주고 싶은 말”, “아기에게 쓰는 한 줄 편지”, “기다림 속에서 알게 된 나의 강인함 한 가지”를 꼭 적어 두세요. 나중에 돌아보면 오늘의 마음이 큰 위로가 될 거예요."}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 35)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w35-d1-q-1', '“40주 동안 내 몸이 해낸 일들을 떠올려본다면, 오늘 내 몸에게 어떤 말을 선물해주고 싶으신가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w35-d1-q-2', '“아기가 작은 수박만큼 자라난 지금, 아기를 처음 안아볼 때 꼭 해주고 싶은 첫 한마디는 무엇인가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w35-d2-q-1', '“내 몸의 가장 수고한 부분은 어디인가요? 그 부위에게 ‘고맙다’고 말해준다면 어떤 말까지 덧붙이고 싶으신가요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w35-d2-q-2', '“진진통이 시작됐을 때, 숨, 자세, 생각 중 한 가지를 골라 구체적으로 어떻게 해야할지 떠올려볼까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (3, 'w35-d3-q-1', '“양수가 터지는 순간에 대한 상상을 나만의 ‘대본’으로 바꿔본다면, 저는 어떤 순서로 누구에게 연락하고, 어떤 말을 들었을 때 가장 안심이 될 것 같나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (3, 'w35-d3-q-2', '“지금 ‘너무 걱정하고 있는 것’과 ‘충분히 준비된 것’은 각각 무엇인가요? 적어도 한 가지씩 적어보며, 나의 준비성을 다시 한 번 확인해 볼 수 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (4, 'w35-d4-q-1', '“요즘의 임신 여정도 한 번도 가보지 않은 길이잖아요. 그 길에서 특히 ‘여기는 좀 낯설다’고 느껴졌던 순간은 언제였나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (4, 'w35-d4-q-2', '“아기도 자라면서 처음 가보는 길을 많이 만나게 되겠죠. 그때 나는 어떤 마음으로 그 아이의 옆에서 함께 걷고 싶나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (5, 'w35-d5-q-1', '“임신이라는 여정 속에서도, 나만의 속도로 숨을 고르며 가야 하는 순간이 많죠. 그 시간들이 나에게 어떤 여유나 안정감을 다시 찾아주고 있나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (5, 'w35-d5-q-2', '“앞으로 아기와 함께 찾아올 분주함 속에서도 꼭 지키고 싶은 ‘나만의 리듬’이 있다면 무엇인가요? 하루 중 단 몇 분이라도 나를 다시 붙잡아줄 작은 습관이 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (6, 'w35-d6-q-1', '“아기가 태어난 후, 남편에게 가장 듣고 싶은 말은 무엇인가요? 그 말을 미리 적어두고, 언젠가 솔직하게 부탁해 보셔도 좋아요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (6, 'w35-d6-q-2', '“우리 가족이 ‘아기를 맞이하는 팀’이라면, 나는 어떤 역할을 하고 싶고, 남편은 어떤 역할을 해 주셨으면 하나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (7, 'w35-d7-q-1', '“만약 오늘이 임신 중 마지막 날이라면, 이 하루를 어떻게 보내고 싶으신가요? 쉬는 시간, 좋아하는 음식, 함께 있고 싶은 사람을 떠올려 보실 수 있을까요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (7, 'w35-d7-q-2', '“지난 40주 동안, 내 몸과 마음은 어디까지 성장했다고 느끼시나요? ‘엄마가 된 나’를 한 문장으로 표현해 본다면, 어떤 말이 떠오르시나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

COMMIT;
