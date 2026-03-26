-- Auto-generated from 임신 주수 별 발달정보 docx
-- Covers weeks: 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35

BEGIN;

-- ===== Week 5 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  5,
  '5주차 발달 정보',
  '아기의 크기는 참깨알만큼(약 2mm) 작지만, 심장이 단순한 형태로 형성되어 곧 뛰기 시작합니다.',
  '월경 예정일이 지나 임신 사실을 깨닫게 되는 시기입니다.; 호르몬 변화로 인해 심한 피로감을 느낄 수 있습니다.',
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
  '“엄마, 내 심장이 오늘부터 콩닥거리기 시작했어요!”',
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
  '“엄마, 내 작은 두뇌가 쑥쑥 자라나고 있어요!”',
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
  '“엄마, 내 몸속에 작은 기관들이 생기고 있어요. 숨 쉬고, 먹고, 자랄 준비 중이에요!”',
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
  '“엄마 뱃속이 나만의 아늑한 물침대 같아요!”',
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
  '“엄마, 나는 지금 폭풍처럼 자라고 있어요.”',
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
  '“엄마의 모든 소리와 감정이 나에게 재미있는 자극이 되고 있어요!”',
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
  '👶 아기의 말”: “엄마! 나 여기 있다는 증거를 보여줬어요. 엄마의 보살핌 덕분에 쑥쑥 클 거예요.”',
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
  '아기의 크기는 약 4~5mm, 작은 콩알 크기로 자랐어요.; 심장은 1분에 100~150번 정도 뛴답니다.',
  '유방이 더욱 커지고 단단해지며, 젖꼭지와 유륜의 색이 진해질 수 있어요.; 황체호르몬 때문에 잠이 쏟아지는 극심한 피로감을 느낄 수 있답니다.',
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
  '“엄마, 내 심장 소리 들었어요? 내가 여기서 콩닥콩닥 열심히 뛰고 있어요!”',
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
  '“엄마, 내 작은 머릿속에 똑똑한 세포들이 가득 생기고 있어요!”',
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
  '“엄마, 내 심장이 좌우로 나뉘었어요. 더 튼튼하게 엄마 품으로 갈 준비 중이에요!”',
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
  '“엄마, 나한테 작은 팔다리가 생겼어요! 이제 엄마한테 손 흔들어 줄 수 있어요.”',
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
  '“엄마, 내 보금자리가 더 넓어지고 있어요. 나는 여기서 튼튼하게 자라고 있어요!”',
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
  '“엄마, 나 이제 올챙이에서 사람 모습으로 변신하고 있어요!”',
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
  '👶 아기의 말”: “엄마! 나는 이제 가장 중요한 성장 단계를 끝내고 있어요. 이제부터는 더 튼튼하게 자랄 거예요.”',
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
  '아기의 크기는 약 1.3cm, 블루베리 크기만큼 자랐어요.; 단 1주일 만에 크기가 두 배로 커지는 급성장 기간을 보내고 있답니다!',
  '메스꺼움(입덧)이 최고조에 달했을 수 있어요.; 임신 중 심한 통증이나 출혈과 같은 주의해야 할 증상이 없는지 잘 살펴야 해요.',
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
  '“엄마, 나 이제 블루베리만큼 컸어요! 내 성장 속도 대단하죠?”',
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
  '“엄마, 내 작은 머릿속에서 똑똑한 세포들이 열심히 연결되고 있어요!”',
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
  '“엄마, 내 몸속에서 밥 먹을 준비를 하고 있어요! 엄마가 해주는 맛있는 음식이 기대돼요.”',
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
  '“엄마, 나 이제 세상을 볼 준비를 하고 있어요! 엄마를 가장 먼저 보고 싶어요.”',
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
  '“엄마, 내 얼굴이 점점 사람 모습을 갖춰가고 있어요. 기대해주세요!”',
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
  '“엄마, 나 이제 곧게 펴지고 있어요. 엄마 품에 안길 날을 기다리고 있어요.”',
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
  '👶 아기의 말”: “엄마! 나 배아기를 건강하게 졸업해요. 이제 쑥쑥 커서 엄마 만날 준비할게요!”',
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
  '아기의 크기는 약 1.6cm, 라즈베리 크기만큼 자랐어요.; 꼬리가 완전히 사라지고, 아기는 C자 형태에서 점차 직립하는 사람의 모습으로 변해가고 있답니다.',
  '자궁이 점점 커지면서 배가 약간 부풀어 오를 수 있어요.; 유방이 더 커지고 단단해지며 통증이 느껴질 수 있어요. 이는 모유 수유를 위해 몸이 준비하기 때문이에요.',
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
  '“엄마, 나 이제 꼬리 없어지고 사람처럼 보이려고 노력하고 있어요!”',
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
  '“엄마, 내 작은 팔다리가 길어지고 있어요. 곧 엄마에게 손을 뻗을 수 있을 거예요!”',
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
  '“엄마, 내 얼굴에 눈코입이 생길 자리가 잡히고 있어요. 엄마를 꼭 닮을 거예요!”',
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
  '“엄마, 내 작은 심장이 힘차게 뛰고 있어요! 나 이제 혼자 움직일 수도 있답니다.”',
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
  '“엄마, 내 다리가 길어지고 있어요! 조금 더 힘차게 움직여서 엄마에게 나를 보여줄게요.”',
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
  '“엄마, 내 눈이 빛을 느끼기 시작했어요! 엄마 목소리도 더 잘 들으려고 귀를 열고 있어요.”',
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
  '👶 아기의 말”: “엄마, 나만의 지문을 만들고있어요. 나중에 손도장 찍어줄게요!”',
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
  '아기의 크기는 약 2.3cm, 포도알 크기만큼 성장했어요.; 꼬리가 완전히 사라지고, 아기는 본격적인 ''태아'' 단계로 접어듭니다.',
  '자궁이 계속 커지면서 허리둘레가 늘어나는 것을 느낄 수 있어요.; 임신 호르몬(hCG)이 최고조에 달하는 시기로, 입덧이 이번 주에 가장 심할 수 있어요.',
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
  '“엄마, 나 이제 태아예요! 엄마 몸속에서 새로운 단계를 시작해요.”',
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
  '“엄마, 나 이제 주먹을 쥘 수 있어요. 곧 엄마 손을 잡아볼 수 있겠죠?”',
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
  '“엄마, 나 이제 고개를 조금 들 수 있어요. 엄마에게 서프라이즈로 보여줄게요!”',
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
  '“엄마, 내 몸속의 작은 공장들이 열심히 돌아가기 시작했어요. 나 이제 혼자서도 잘 해낼 준비를 하고 있어요.”',
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
  '“엄마, 나 이제 팔다리를 더 힘차게 움직일 수 있어요!”',
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
  '“엄마, 내 몸에서 머리카락이 될 자리가 생기고 있어요. 내 성별은 아직 비밀이에요!”',
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
  '👶 아기의 말”: “엄마, 나 이제부터 쑥쑥 자라서 엄마 품에 안길 준비를 할게요!”',
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
  '아기의 크기는 약 3.1cm, 딸기 크기만큼 성장했어요.; 팔꿈치를 처음으로 구부릴 수 있고, 손목도 형성되었으며 연골과 뼈도 자라고 있어요.',
  '입덧이 여전히 지속될 수 있지만, 이번 주를 기점으로 서서히 완화되기 시작하는 산모들이 많아요.; 자궁이 자몽 크기만큼 커지면서 아랫배가 뻐근하게 느껴질 수 있어요.',
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
  '“엄마, 나 이제 딸기만큼 컸어요! 내 손목도 돌릴 수 있는 능력자예요!”',
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
  '“엄마, 이제 내 손가락이 완벽하게 분리되었어요!”',
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
  '“엄마, 내 태반이 나를 열심히 키워주고 있어요. 나는 이제 성장에 집중할 거예요.”',
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
  '“엄마, 나 오늘 양수 속에서 운동했어요!”',
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
  '“엄마, 나 이제 물도 삼킬 수 있어요.”',
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
  '“엄마, 나 이제 튼튼한 뼈를 만들고 있어요. 똑똑한 뇌도 열심히 크고 있답니다!”',
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
  '👶 아기의 말”: “엄마, 나 이제 안전하고 튼튼해요!”',
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
  '아기의 크기는 약 4.1cm, 무화과(또는 라임) 크기만큼 성장했어요.; 유산 위험이 현저히 낮아지기 시작하며, 주요 장기 형성이 거의 마무리됩니다.',
  '입덧은 9~11주에 정점을 찍고 12~14주부터 크게 완화되기 시작해요.; 자궁이 골반 위로 올라오기 시작하며, 근육과 인대가 늘어나 복부 주변에 통증이 생길 수 있어요.',
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
  '“엄마, 나 이제 무화과만큼 컸어요! 위험한 시기를 넘기고 안전하게 자랄 거예요.”',
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
  '“엄마, 나 양수 속에서 뱅글뱅글 돌고 있어요! 엄마는 내 움직임을 느낄 수 있나요?”',
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
  '“엄마, 나 이제 소변도 만들 수 있어요. 내 몸속 기관들이 열심히 일하고 있답니다.”',
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
  '“엄마, 내 머릿속에서 복잡하고 신기한 일이 벌어지고 있어요.”',
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
  '“엄마, 내 작은 주먹을 쥐었다 폈다 할 수 있어요!”',
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
  '“엄마, 내 탯줄이 아주 튼튼해요. 엄마의 좋은 기운을 내가 듬뿍 받고 있답니다!”',
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
  '👶 아기의 말”: “엄마, 나 이제 성장 모드를 켰어요! 엄마가 주시는 영양분으로 쑥쑥 클 거예요.”',
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
  '아기의 크기는 약 5.4cm, 자두(또는 라임) 크기만큼 성장했어요.; 주요 장기, 뼈, 근육이 모두 자리를 잡아 완전한 형성을 이루었어요.',
  '유방이 점점 커지고 부드러워지며, 유두 색이 진해질 수 있어요.; 호르몬 변화로 피로감이 지속될 수 있어요.',
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
  '“엄마, 나 자두만큼 컸어요! 이제 더 튼튼하게 자랄 거예요.”',
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
  '“엄마, 이제 내 손가락이 따로따로 움직여요. 곧 엄마 손도 잡아볼 수 있겠죠?”',
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
  '“엄마, 내 얼굴이 점점 또렷해지고 있어요. 곧 귀여운 옆모습을 보여줄 수 있어요!”',
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
  '“엄마, 나 오늘 양수 속에서 운동했어요. 팔다리도 뻗고, 하품도 했답니다!”',
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
  '“엄마, 나 이제 물도 삼킬 수 있어요. 젖도 잘 먹을 준비를 하고 있어요.”',
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
  '“엄마, 이제 엄마 목소리의 울림을 느낄 수 있어요. 자주 이야기해 주세요!”',
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
  '👶 아기의 말”: “엄마, 힘든 초기를 건강하게 통과했어요! 이제 안정적인 중기로 함께 나아가요.”',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '13주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
    (2, 'w13-d2-cl-3', '잇몸 출혈이 있다면 부드러운 칫솔 사용하기', '잇몸 출혈이 있다면 부드러운 칫솔 사용하기', '{"items": [{"id": "w13-d2-cl-3", "label": "잇몸 출혈이 있다면 부드러운 칫솔 사용하기"}]}'::jsonb, 3, true)
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13)
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
    (1, 'w13-d1-q-1', '“작은 씨앗 크기에서 레몬 크기만큼 자란 아기를 떠올리며, 오늘은 감사에 대해 엄마의 생각을 들려주세요.살아오면서 엄마에게 가장 감사했던 사람은 누구였나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (1, 'w13-d1-q-2', '“작은 것에 감사를 느끼는 것이 왜 중요한가요?엄마의 생각을 들려주세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false),
    (2, 'w13-d2-q-1', '“오늘은 아기의 이목구비가 뚜렷해지고 있는 모습을 떠올리며, 엄마의 어떤 모습을 닮았으면 좋을 것 같나요?”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 1, false),
    (2, 'w13-d2-q-2', '“당신은 부모님의 어떤 모습을 닮았나요?외형적인 것도 좋고 성격적인 것도 한번 떠올려보세요.”', 'text', '편하게 적어 주세요.', '{}'::jsonb, 2, false)
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '14주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 14
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 15 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  15,
  '15주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '15주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 15
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 16 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  16,
  '16주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '16주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 16
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 17 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  17,
  '17주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '17주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 17
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '19주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 19
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 20 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  20,
  '20주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '20주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 20
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 21 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  21,
  '21주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '21주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 21
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 22 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  22,
  '22주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '22주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 22
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 23 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  23,
  '23주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '23주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 23
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 24 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  24,
  '24주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '24주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 24
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 25 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  25,
  '25주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '25주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 25
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 26 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  26,
  '26주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '26주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 26
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 27 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  27,
  '27주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '27주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 27
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 28 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  28,
  '28주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '28주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 28
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 29 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  29,
  '29주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '29주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 29
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 30 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  30,
  '30주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '30주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 30
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 31 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  31,
  '31주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '31주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 31
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 32 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  32,
  '32주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '32주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 32
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '34주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 34
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

-- ===== Week 35 =====

INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  35,
  '35주차 발달 정보',
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

INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, 1, '35주 1일차',
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
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
  '{"items": []}'::jsonb,
  '{"items": []}'::jsonb,
  '',
  7,
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = 35
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;

COMMIT;