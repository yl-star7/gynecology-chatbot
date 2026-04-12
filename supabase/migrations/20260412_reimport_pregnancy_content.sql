-- docx 전체 재임포트 + baby_message 3인칭 변환
-- 유산 시 아기 직접 말투가 상처가 될 수 있어 관찰자 시점으로 변경

BEGIN;

-- ===== Week 5 =====
UPDATE content.pregnancy_week_data SET baby_summary = '아기의 크기는 참깨알만큼(약 2mm) 작지만, 심장이 단순한 형태로 형성되어 곧 뛰기 시작합니다.', mother_summary = '월경 예정일이 지나 임신 사실을 깨닫게 되는 시기입니다.; 호르몬 변화로 인해 심한 피로감을 느낄 수 있습니다.', updated_at = timezone('utc', now()) WHERE week_number = 5;

-- 5주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 크기는 참깨알만큼(약 2mm) 작지만, 심장이 단순한 형태로 형성되어 곧 뛰기 시작합니다."]}'::jsonb, mother_changes_payload = '{"items": ["월경 예정일이 지나 임신 사실을 깨닫게 되는 시기입니다.", "호르몬 변화로 인해 심한 피로감을 느낄 수 있습니다."]}'::jsonb, baby_message = '아가는 심장이 오늘부터 콩닥거리기 시작했어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 5) AND day_number = 1;

-- 5주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 뇌와 척수가 될 신경관이 형성되기 시작하며, 이는 태아 발달의 가장 중요한 첫 단계입니다.", "신경관 결손을 막기 위해 엽산 섭취가 매우 중요해요."]}'::jsonb, mother_changes_payload = '{"items": ["유방이 부풀고 예민해지며, 젖꼭지에 통증이나 따끔거림을 느낄 수 있습니다.", "미열이 계속되어 감기 기운처럼 느껴질 수 있습니다."]}'::jsonb, baby_message = '아가는 작은 두뇌가 쑥쑥 자라나고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 5) AND day_number = 2;

-- 5주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 주요 기관인 간, 신장, 폐의 기초들이 빠르게 자리를 잡고 있어요.", "아기의 혈액 순환이 시작됩니다."]}'::jsonb, mother_changes_payload = '{"items": ["메스꺼움과 입덧이 시작될 수 있으며, 이는 하루 중 언제든 나타날 수 있습니다.", "호르몬 변화로 후각이 예민해지거나 평소 좋아하던 음식에 대한 혐오감이 생길 수 있습니다."]}'::jsonb, baby_message = '아가는 몸속에 작은 기관들이 생기고 있으며, 숨 쉬고, 먹고, 자랄 준비를 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 5) AND day_number = 3;

-- 5주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["태반과 혈관이 발달하며, 엄마와 아기를 연결하는 탯줄의 기초가 만들어지고 있어요.", "태아를 보호하는 양막 주머니와 양수가 형성되기 시작합니다."]}'::jsonb, mother_changes_payload = '{"items": ["커진 자궁이 방광을 압박하여 소변을 자주 보게 되는 빈뇨 증상이 나타납니다.", "소화가 느려지고 장 운동이 둔화되어 변비나 가스가 찰 수 있습니다."]}'::jsonb, baby_message = '아가는 엄마 뱃속의 아늑한 양수 속에서 편안히 지내고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 5) AND day_number = 4;

-- 5주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 작은 올챙이 모양을 하고 있어요.", "머리, 몸통, 그리고 곧 팔다리가 될 부분이 나타나기 시작합니다."]}'::jsonb, mother_changes_payload = '{"items": ["아랫배에 생리통과 비슷한 가벼운 경련이 느껴질 수 있습니다.", "자궁이 빠르게 확장하면서 가벼운 아랫배 당김이나 콕콕 쑤시는 듯한 느낌이 있을 수 있습니다.", "우윳빛의 질 분비물 양이 늘어날 수 있습니다."]}'::jsonb, baby_message = '아가는 지금 폭풍처럼 자라고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 5) AND day_number = 5;

-- 5주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["뇌와 척수, 혈관 발달이 더욱 빠르게 진행됩니다.", "신경 세포의 연결이 활발해집니다.", "얼굴의 윤곽, 눈, 귀의 형태가 생겨나기 시작합니다."]}'::jsonb, mother_changes_payload = '{"items": ["임신 호르몬(에스트로겐, 프로게스테론)의 급격한 증가로 인해 감정 기복이 심해져 짜증, 불안, 우울감이 쉽게 찾아올 수 있습니다."]}'::jsonb, baby_message = '엄마의 모든 소리와 감정이 아가에게 재미있는 자극이 되고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 5) AND day_number = 6;

-- 5주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["초음파 검진에서 아기집(임신낭)과 함께 난황을 확인할 수 있어요.", "난황은 태반이 완성되기 전까지 아기에게 영양분을 공급해요."]}'::jsonb, mother_changes_payload = '{"items": ["생리통보다 심한 복통이나 생리 양보다 많은 출혈이 있으면 유산의 징후일 수 있습니다.", "갑자기 입덧이나 증상이 사라지는 것도 주의해야 합니다."]}'::jsonb, baby_message = '아가는 초음파에서 작은 모습을 보여주기 시작했어요. 엄마의 보살핌 덕분에 쑥쑥 클 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 5) AND day_number = 7;

-- ===== Week 6 =====
UPDATE content.pregnancy_week_data SET baby_summary = '아기의 크기는 약 4~5mm, 작은 콩알 크기로 자랐어요.; 심장은 1분에 100~150번 정도 뛴답니다.', mother_summary = '유방이 더욱 커지고 단단해지며, 젖꼭지와 유륜의 색이 진해질 수 있어요.; 황체호르몬 때문에 잠이 쏟아지는 극심한 피로감을 느낄 수 있답니다.', updated_at = timezone('utc', now()) WHERE week_number = 6;

-- 6주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 크기는 약 4~5mm, 작은 콩알 크기로 자랐어요.", "심장은 1분에 100~150번 정도 뛴답니다."]}'::jsonb, mother_changes_payload = '{"items": ["유방이 더욱 커지고 단단해지며, 젖꼭지와 유륜의 색이 진해질 수 있어요.", "황체호르몬 때문에 잠이 쏟아지는 극심한 피로감을 느낄 수 있답니다."]}'::jsonb, baby_message = '아가는 심장 소리를 들려주며 여기서 콩닥콩닥 열심히 뛰고 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 6) AND day_number = 1;

-- 6주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["뇌와 척수를 이룰 신경 세포의 약 80%가 이 시기에 만들어지고 있어요.", "태아의 머리와 꼬리가 생겨나 올챙이처럼 보인답니다."]}'::jsonb, mother_changes_payload = '{"items": ["입덧 증세(메스꺼움, 구토)가 심해져 하루 종일 지속될 수 있어요.", "입안에서 구리 맛 같은 ''금속 맛''이 느껴져 불쾌할 수 있어요. 이는 에스트로겐 급증 때문이랍니다.", "자궁이 점차 커지면서 자궁 주변 인대가 늘어나 아랫배에 당김이나 묵직한 느낌이 들 수 있어요."]}'::jsonb, baby_message = '아가는 작은 머릿속에 똑똑한 세포들이 가득 생기고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 6) AND day_number = 2;

-- 6주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["심장이 좌심실과 우심실로 분리되는 등 복잡하게 발달하고 있어요.", "주요 장기(폐의 기관지, 간 등)의 분화가 빠르게 진행된답니다."]}'::jsonb, mother_changes_payload = '{"items": ["임신 호르몬의 영향으로 소화 속도가 느려져 가스, 붓기, 속 쓰림 증상을 흔히 경험할 수 있어요.", "질 분비물의 양이 늘어나 끈적한 유백색 분비물을 볼 수 있답니다."]}'::jsonb, baby_message = '아가는 심장이 좌우로 나뉘었어요. 더 튼튼하게 엄마 품으로 갈 준비 중이에요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 6) AND day_number = 3;

-- 6주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["팔과 다리가 될 부분이 짧은 지느러미처럼 솟아났어요.", "눈과 콧구멍은 검은 점처럼, 귀가 될 부분은 작은 구멍처럼 보이기 시작하며 얼굴 윤곽의 기초가 잡히고 있답니다."]}'::jsonb, mother_changes_payload = '{"items": ["커진 자궁이 방광을 압박하여 소변이 자주 마려운 빈뇨 증상이 심화될 수 있어요.", "아랫배가 콕콕 쑤시거나 당기는 가벼운 통증이 느껴질 수 있답니다.", "임신 초기의 흔한 증상인 두통이 나타날 수 있어요. 수면 부족, 탈수, 호르몬 변화 등이 주요 원인이랍니다."]}'::jsonb, baby_message = '아가는 작은 팔다리가 생겼어요! 이제 엄마에게 손 흔들어 줄 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 6) AND day_number = 4;

-- 6주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 얇고 투명한 막(양막)으로 감싸여 보호되고 있어요.", "아기는 이미 작은 혈관들을 가지고 있으며, 이 혈관들이 모여 탯줄을 이루기 시작해요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 호르몬의 변화로 피부에 트러블이 생기거나 흑피증(기미, 잡티)이 나타날 수 있어요.", "머리카락이 더 풍성하고 윤기 있게 변하는 증상도 나타날 수 있어요."]}'::jsonb, baby_message = '아가는 보금자리가 더 넓어지고 있으며, 여기서 튼튼하게 자라고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 6) AND day_number = 5;

-- 6주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 몸은 아직 C자 형태로 웅크려 있지만, 매우 빠르게 성장하고 있어요.", "눈꺼풀과 코끝이 생기기 시작하며, 귀 안팎의 구조가 발달한답니다."]}'::jsonb, mother_changes_payload = '{"items": ["호르몬 변화로 인해 감정 기복이 심해져 쉽게 짜증을 내거나 우울감을 느낄 수 있어요.", "호르몬 변화로 인해 감정이 예민해지거나 불안감을 느끼는 것은 이 시기에 매우 흔한 일이에요.", "변비나 치질 증상이 심화될 수 있으므로 주의가 필요하답니다."]}'::jsonb, baby_message = '아가는 올챙이에서 사람 모습으로 변신하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 6) AND day_number = 6;

-- 6주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["이 시기에는 필수적인 신체 구조들이 빠르게 발달하고 있어요.", "아기의 손과 발은 작은 주걱 모양으로 자라나고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["갑자기 임신 증상(입덧, 가슴 통증 등)이 사라지거나 생리 양보다 많은 출혈, 심한 통증이 있다면 주의해야 해요. 이는 유산을 의심해야 하는 주의 징후랍니다."]}'::jsonb, baby_message = '아가는 이제 가장 중요한 성장 단계를 끝내고 있어요. 이제부터는 더 튼튼하게 자랄 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 6) AND day_number = 7;

-- ===== Week 7 =====
UPDATE content.pregnancy_week_data SET baby_summary = '아기의 크기는 약 1.3cm, 블루베리 크기만큼 자랐어요.; 단 1주일 만에 크기가 두 배로 커지는 급성장 기간을 보내고 있답니다!', mother_summary = '메스꺼움(입덧)이 최고조에 달했을 수 있어요.; 임신 중 심한 통증이나 출혈과 같은 주의해야 할 증상이 없는지 잘 살펴야 해요.', updated_at = timezone('utc', now()) WHERE week_number = 7;

-- 7주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 크기는 약 1.3cm, 블루베리 크기만큼 자랐어요.", "단 1주일 만에 크기가 두 배로 커지는 급성장 기간을 보내고 있답니다!"]}'::jsonb, mother_changes_payload = '{"items": ["메스꺼움(입덧)이 최고조에 달했을 수 있어요.", "임신 중 심한 통증이나 출혈과 같은 주의해야 할 증상이 없는지 잘 살펴야 해요."]}'::jsonb, baby_message = '아가는 블루베리만큼 커졌어요! 성장 속도가 대단해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 7) AND day_number = 1;

-- 7주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 뇌가 놀랍게 발달하고 있어요.", "신경관이 닫히고 뇌는 전뇌, 중뇌, 후뇌 세 영역으로 나뉘며, 분당 약 25만 개의 세포가 증가한답니다."]}'::jsonb, mother_changes_payload = '{"items": ["소변이 더 자주 마려운 빈뇨 증상이 나타나요.", "기분 변화가 갑자기 심해져서 우울하거나 짜증날 수 있어요."]}'::jsonb, baby_message = '아가는 작은 머릿속에서 똑똑한 세포들이 열심히 연결되고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 7) AND day_number = 2;

-- 7주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 소화 시스템이 형성되기 시작했어요.", "위와 식도가 만들어지고, 간과 췌장도 발달을 시작한답니다."]}'::jsonb, mother_changes_payload = '{"items": ["소화기관의 변화로 속이 불편하거나 메스꺼움이 지속될 수 있어요.", "호르몬(프로게스테론)의 영향으로 장 운동이 느려져 가스나 더부룩함이 생길 수 있어요."]}'::jsonb, baby_message = '아가는 몸속에서 밥 먹을 준비를 하고 있어요! 엄마가 해주는 맛있는 음식이 기대돼요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 7) AND day_number = 3;

-- 7주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 시력을 유지하는 눈의 주요 부분들 (각막, 홍채, 동공, 수정체, 망막)이 발달하기 시작했어요.", "팔다리의 싹이 더 길어지고 있답니다."]}'::jsonb, mother_changes_payload = '{"items": ["후각이 극도로 예민해져서 구역질을 유발하는 냄새에 압도될 수 있어요.", "음식 혐오감이 나타나 예전에 좋아했던 음식이 갑자기 싫어질 수 있어요."]}'::jsonb, baby_message = '아가는 이제 세상을 볼 준비를 하고 있어요! 엄마를 가장 먼저 보고 싶어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 7) AND day_number = 4;

-- 7주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 작은 특징들인 눈, 코, 입, 귀가 점점 뚜렷해지고 있어요.", "눈꺼풀이 형성되어 눈을 부분적으로 덮기 시작한답니다."]}'::jsonb, mother_changes_payload = '{"items": ["침 분비량(군침)이 많아져서 불편함을 느낄 수 있어요.", "가슴이 눈에 띄게 커지고 피부가 늘어나면서 가려움을 느끼거나 튼살이 생길 수 있어요."]}'::jsonb, baby_message = '아가는 얼굴이 점점 사람 모습을 갖춰가고 있어요. 기대해주세요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 7) AND day_number = 5;

-- 7주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 척추와 뇌가 되는 신경관이 거의 닫히고 있어요.", "팔다리의 성장에 따라 팔꿈치와 무릎 관절도 형성되기 시작했어요."]}'::jsonb, mother_changes_payload = '{"items": ["피해야 할 음식 (날 것, 가공육, 고카페인 커피 등)이 많으니 주의해야 해요.", "임신 초기 산전 검사를 어떤 것으로 할지 결정해야 해요."]}'::jsonb, baby_message = '아가는 이제 곧게 펴지고 있어요. 엄마 품에 안길 날을 기다리고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 7) AND day_number = 6;

-- 7주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["모든 필수 장기가 형성되기 시작하며, 이제부터는 더욱 빠르게 성장할 거예요.", "태반은 아기에게 필요한 모든 것을 공급하기 위해 끊임없이 발달하고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁은 커지고 있지만 아직 배가 겉으로 나오지는 않았을 거예요."]}'::jsonb, baby_message = '아가는 배아기를 건강하게 졸업해요. 이제 쑥쑥 커서 엄마 만날 준비를 할 거예요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 7) AND day_number = 7;

-- ===== Week 8 =====
UPDATE content.pregnancy_week_data SET baby_summary = '아기의 크기는 약 1.6cm, 라즈베리 크기만큼 자랐어요.; 꼬리가 완전히 사라지고, 아기는 C자 형태에서 점차 직립하는 사람의 모습으로 변해가고 있답니다.', mother_summary = '자궁이 점점 커지면서 배가 약간 부풀어 오를 수 있어요.; 유방이 더 커지고 단단해지며 통증이 느껴질 수 있어요. 이는 모유 수유를 위해 몸이 준비하기 때문이에요.', updated_at = timezone('utc', now()) WHERE week_number = 8;

-- 8주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 크기는 약 1.6cm, 라즈베리 크기만큼 자랐어요.", "꼬리가 완전히 사라지고, 아기는 C자 형태에서 점차 직립하는 사람의 모습으로 변해가고 있답니다."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 점점 커지면서 배가 약간 부풀어 오를 수 있어요.", "유방이 더 커지고 단단해지며 통증이 느껴질 수 있어요. 이는 모유 수유를 위해 몸이 준비하기 때문이에요."]}'::jsonb, baby_message = '아가는 이제 꼬리가 없어지고 사람처럼 보이려고 노력하고 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 8) AND day_number = 1;

-- 8주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 팔은 이제 팔꿈치를 구부릴 수 있을 만큼 발달했어요.", "손가락과 발가락이 길어지고 있으며, 연골이 골세포와 관절로 대체되기 시작했어요."]}'::jsonb, mother_changes_payload = '{"items": ["입덧이 가장 심한 시기일 수 있으며, 구토와 메스꺼움이 하루 종일 지속되기도 해요.", "임신 호르몬의 영향으로 쉽게 피곤하고 나른함, 졸음이 올 수 있어요."]}'::jsonb, baby_message = '아가는 작은 팔다리가 길어지고 있어요. 곧 엄마에게 손을 뻗을 수 있을 거예요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 8) AND day_number = 2;

-- 8주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 얼굴 특징이 더욱 상세하게 나타나며, 눈꺼풀이 만들어지고 코가 오뚝해지기 시작해요.", "턱뼈가 자라 작은 입의 형태가 뚜렷해지고 두 개의 콧구멍도 보이게 된답니다."]}'::jsonb, mother_changes_payload = '{"items": ["임신 호르몬으로 인해 감정 기복이 심해져 짜증이나 두려움을 느낄 수 있어요.", "질 분비물의 양이 임신 전보다 늘어날 수 있어요."]}'::jsonb, baby_message = '아가는 얼굴에 눈코입이 생길 자리가 잡히고 있어요. 엄마를 꼭 닮을 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 8) AND day_number = 3;

-- 8주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 심장과 뇌가 더욱 복잡하게 발달하며 심박동을 초음파로 들을 수 있어요.", "뼈와 근육이 발달하면서 아기는 조금씩 움직일 수 있게 되었어요."]}'::jsonb, mother_changes_payload = '{"items": ["혈액량이 증가하면서 심장은 아기를 위해 분당 50% 더 많은 혈액을 펌프질합니다.", "자궁이 커지면서 방광을 압박하여 소변이 자주 마렵고 잔뇨감이 있을 수 있어요."]}'::jsonb, baby_message = '아가는 작은 심장이 힘차게 뛰고 있어요! 이제 혼자 움직일 수도 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 8) AND day_number = 4;

-- 8주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["연골이 골세포와 관절로 대체되기 시작하며, 다리가 더 길게 자라나요.", "아기의 몸 전체에 신경망이 퍼지면서, 초음파로 움직임을 확인할 수 있을 정도로 활발해져요."]}'::jsonb, mother_changes_payload = '{"items": ["복부 팽만감으로 인해 배가 살짝 나온 듯한 느낌을 받을 수 있어요.", "자궁이 커지면서 인대가 늘어나 생리통과 비슷한 경련이 느껴질 수 있는데, 이는 자연스러운 현상이에요."]}'::jsonb, baby_message = '아가는 다리가 길어지고 있어요. 조금 더 힘차게 움직여서 엄마에게 자신을 보여줄 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 8) AND day_number = 5;

-- 8주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 눈에 새로운 색소 세포가 생성되면서 눈빛이 점점 어두워지기 시작해요.", "외이(귀의 바깥 부분)의 형태가 갖춰지기 시작하고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["기미나 잡티가 늘어나는 등 얼굴빛이 어두워질 수 있어요.", "출혈이나 심한 경련이 있다면 즉시 의사에게 알려야 해요."]}'::jsonb, baby_message = '아가는 눈이 빛을 느끼기 시작했어요. 엄마 목소리도 더 잘 들으려고 귀를 열고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 8) AND day_number = 6;

-- 8주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 맛봉오리가 형성되기 시작하며, 호흡기도 발달하고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["유산의 위험이 비교적 높은 시기이므로 안정이 중요해요.", "아직 배가 부른 상태는 아니지만, 배가 약간 부풀어 오를 수 있어요."]}'::jsonb, baby_message = '아가는 자신만의 지문을 만들고 있어요. 나중에 손도장 찍어줄 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 8) AND day_number = 7;

-- ===== Week 9 =====
UPDATE content.pregnancy_week_data SET baby_summary = '아기의 크기는 약 2.3cm, 포도알 크기만큼 성장했어요.; 꼬리가 완전히 사라지고, 아기는 본격적인 ''태아'' 단계로 접어듭니다.', mother_summary = '자궁이 계속 커지면서 허리둘레가 늘어나는 것을 느낄 수 있어요.; 임신 호르몬(hCG)이 최고조에 달하는 시기로, 입덧이 이번 주에 가장 심할 수 있어요.', updated_at = timezone('utc', now()) WHERE week_number = 9;

-- 9주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 크기는 약 2.3cm, 포도알 크기만큼 성장했어요.", "꼬리가 완전히 사라지고, 아기는 본격적인 ''태아'' 단계로 접어듭니다."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 계속 커지면서 허리둘레가 늘어나는 것을 느낄 수 있어요.", "임신 호르몬(hCG)이 최고조에 달하는 시기로, 입덧이 이번 주에 가장 심할 수 있어요."]}'::jsonb, baby_message = '아가는 이제 태아예요. 엄마 몸속에서 새로운 단계를 시작해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 9) AND day_number = 1;

-- 9주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 손가락과 발가락이 더욱 뚜렷하게 분리되고, 작은 주먹을 쥘 수 있어요.", "무릎, 팔꿈치, 어깨, 발목, 손목 관절이 모두 작동하기 시작하며 더욱 활발하게 움직여요."]}'::jsonb, mother_changes_payload = '{"items": ["피로, 탈수, 카페인 중단, 수면 부족 등으로 두통이 나타날 수 있어요.", "자궁 확장과 골반 혈류 증가로 잦은 소변이 나타나요."]}'::jsonb, baby_message = '아가는 이제 주먹을 쥘 수 있어요. 곧 엄마 손을 잡아볼 수 있을 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 9) AND day_number = 2;

-- 9주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 머리가 몸통보다 여전히 크지만, 머리가 조금 더 둥글어지고 목도 발달하고 있어요.", "눈꺼풀이 형성되어 눈을 덮고 있으며, 눈에 색소가 생기기 시작해요."]}'::jsonb, mother_changes_payload = '{"items": ["가슴이 눈에 띄게 커지고 유방 통증이 심해질 수 있어요.", "소량의 출혈이나 생리통 같은 경련이 나타날 수 있으니 주의 깊게 관찰해야 해요."]}'::jsonb, baby_message = '아가는 이제 고개를 조금 들 수 있어요. 엄마에게 서프라이즈로 보여줄 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 9) AND day_number = 3;

-- 9주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 주요 내부 장기가 거의 제자리를 잡고 기능을 하기 시작해요.", "심장, 뇌, 폐, 신장 등 주요 장기가 계속해서 발달하고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 호르몬(에스트로겐, 프로게스테론)이 높아지면서 자궁으로 가는 혈류량이 증가해요.", "호르몬이 과다 분비되면서 극심한 피로감을 느낄 수 있어요."]}'::jsonb, baby_message = '아가는 몸속의 작은 공장들이 열심히 돌아가기 시작했어요. 이제 혼자서도 잘 해낼 준비를 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 9) AND day_number = 4;

-- 9주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 양막낭 안에서 자유롭게 움직이며, 심지어 엄지손가락을 빠는 동작도 해요.", "근육이 형성되기 시작하면서 아기의 움직임이 더욱 자유로워집니다."]}'::jsonb, mother_changes_payload = '{"items": ["복부 팽만감이 지속되고, 자궁이 두 배로 커지면서 배가 나온 듯한 느낌이 들 수 있어요.", "코막힘이 예상치 못한 증상으로 나타날 수 있어요. 임신 중에는 점액 분비가 증가하기 때문이에요."]}'::jsonb, baby_message = '아가는 이제 팔다리를 더 힘차게 움직일 수 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 9) AND day_number = 5;

-- 9주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 생식 기관이 형성되고 있지만, 초음파로 성별을 확인하기에는 아직 일러요.", "아기의 뼈대가 형성되기 시작하지만, 아직 뼈는 부드러운 상태예요."]}'::jsonb, mother_changes_payload = '{"items": ["잇몸이 예민해지고 염증이 생기기 쉬운 시기예요. 임신 호르몬이 잇몸을 민감하게 만들기 때문이에요.", "심박동이 확인된 후 유산 위험은 2~9%로 낮아지지만, 여전히 안정이 중요해요."]}'::jsonb, baby_message = '아가는 몸에서 머리카락이 될 자리가 생기고 있어요. 성별은 아직 비밀이에요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 9) AND day_number = 6;

-- 9주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 중요한 배아 기간을 지나 이제 덜 민감하고 더 안정된 발달 단계에 접어들었어요."]}'::jsonb, mother_changes_payload = '{"items": ["hCG 호르몬 수치가 이번 주 최고조에 달한 후, 서서히 완화되기 시작할 수 있어요.", "호르몬 변화로 머리카락이 굵어지거나 피부 변화가 나타날 수 있어요."]}'::jsonb, baby_message = '아가는 이제 쑥쑥 자라서 엄마 품에 안길 준비를 할 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 9) AND day_number = 7;

-- ===== Week 10 =====
UPDATE content.pregnancy_week_data SET baby_summary = '아기의 크기는 약 3.1cm, 딸기 크기만큼 성장했어요.; 팔꿈치를 처음으로 구부릴 수 있고, 손목도 형성되었으며 연골과 뼈도 자라고 있어요.', mother_summary = '입덧이 여전히 지속될 수 있지만, 이번 주를 기점으로 서서히 완화되기 시작하는 산모들이 많아요.; 자궁이 자몽 크기만큼 커지면서 아랫배가 뻐근하게 느껴질 수 있어요.', updated_at = timezone('utc', now()) WHERE week_number = 10;

-- 10주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 크기는 약 3.1cm, 딸기 크기만큼 성장했어요.", "팔꿈치를 처음으로 구부릴 수 있고, 손목도 형성되었으며 연골과 뼈도 자라고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["입덧이 여전히 지속될 수 있지만, 이번 주를 기점으로 서서히 완화되기 시작하는 산모들이 많아요.", "자궁이 자몽 크기만큼 커지면서 아랫배가 뻐근하게 느껴질 수 있어요."]}'::jsonb, baby_message = '아가는 이제 딸기만큼 컸어요! 손목도 돌릴 수 있는 능력자예요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 10) AND day_number = 1;

-- 10주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 손가락과 발가락이 완전히 분리되고, 손톱과 발톱이 아주 작게 자라나기 시작했어요.", "손가락 관절이 발달하며, 곧 주먹을 쥐는 동작도 할 수 있게 돼요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 호르몬의 영향으로 피부가 기름지거나 트러블이 생길 수 있어요.", "혈액량이 증가하면서 혈관이 도드라져 보이거나 거미줄 혈관이 생길 수 있어요."]}'::jsonb, baby_message = '아가는 이제 손가락이 완벽하게 분리되었어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 10) AND day_number = 2;

-- 10주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 이마는 발달하는 뇌 때문에 일시적으로 볼록해지고, 머리 크기가 몸의 절반 정도예요.", "중요 장기들이 제자리를 잡았으며, 뇌와 신경계는 더욱 정교하고 복잡하게 발달하고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["혈류 증가와 에스트로겐 증가로 투명하고 무취한 흰색 질 분비물이 늘어날 수 있어요.", "빈뇨가 계속될 수 있으며, 자궁이 커지면서 일상생활이 불편할 수 있어요."]}'::jsonb, baby_message = '아가는 태반이 자신을 열심히 키워주고 있어요. 이제 성장에 집중할 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 10) AND day_number = 3;

-- 10주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 양수 속에서 삼키기와 차기 연습을 하고 있어요.", "경련성 움직임이 나타나며, 초음파로 아기의 움직임을 확인할 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["체중 증가가 나타나기 시작하는 시기예요. 1~5파운드 정도 증가가 정상이에요.", "프로게스테론이 소화기관 근육을 이완시켜 속쓰림과 복부 팽만감이 생길 수 있어요."]}'::jsonb, baby_message = '아가는 오늘 양수 속에서 운동했어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 10) AND day_number = 4;

-- 10주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 양수를 삼키며 소화 기관을 연습하고, 빨기 반사도 준비하고 있어요.", "치아가 될 작은 세포 그룹이 턱뼈에서 형성되고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["아랫배에 당김이나 가벼운 통증이 있을 수 있어요. 이는 자궁이 커지면서 인대가 늘어나는 자연스러운 현상이에요.", "임신 호르몬의 영향으로 어지러움이나 현기증이 느껴질 수 있어요."]}'::jsonb, baby_message = '아가는 이제 물도 삼킬 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 10) AND day_number = 5;

-- 10주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["뼈와 연골이 전신에서 자라기 시작하며, 척수의 시냅스가 팔다리와 손가락 움직임을 가능하게 해요.", "귀가 연골 조직으로 발달하기 시작하고, 눈은 각막·홍채·동공·수정체·망막이 완전히 형성됐어요."]}'::jsonb, mother_changes_payload = '{"items": ["치아와 잇몸이 약해지고 염증이 생기기 쉬우니 주의해야 해요.", "철분 부족으로 인한 빈혈이나 현기증에 주의해야 해요. 철분 섭취량을 점검하세요."]}'::jsonb, baby_message = '아가는 이제 튼튼한 뼈를 만들고 있어요. 똑똑한 뇌도 열심히 크고 있답니다!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 10) AND day_number = 6;

-- 10주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["대부분의 기형은 임신 10주 이전에 결정되며, 12주말에는 유산 위험이 크게 줄어들어요.", "이 시기부터는 정확한 성별을 확인할 수 있는 생식 기관이 형성됩니다."]}'::jsonb, mother_changes_payload = '{"items": ["복부가 나오기 시작하며, 신축성 있는 허리밴드나 임부복 착용을 고려할 시기예요.", "감정 기복이 있을 수 있지만, 이제 감정이 점차 안정되기 시작하는 산모들도 많아요."]}'::jsonb, baby_message = '아가는 이제 안전하고 튼튼해요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 10) AND day_number = 7;

-- ===== Week 11 =====
UPDATE content.pregnancy_week_data SET baby_summary = '아기의 크기는 약 4.1cm, 무화과(또는 라임) 크기만큼 성장했어요.; 유산 위험이 현저히 낮아지기 시작하며, 주요 장기 형성이 거의 마무리됩니다.', mother_summary = '입덧은 9~11주에 정점을 찍고 12~14주부터 크게 완화되기 시작해요.; 자궁이 골반 위로 올라오기 시작하며, 근육과 인대가 늘어나 복부 주변에 통증이 생길 수 있어요.', updated_at = timezone('utc', now()) WHERE week_number = 11;

-- 11주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 크기는 약 4.1cm, 무화과(또는 라임) 크기만큼 성장했어요.", "유산 위험이 현저히 낮아지기 시작하며, 주요 장기 형성이 거의 마무리됩니다."]}'::jsonb, mother_changes_payload = '{"items": ["입덧은 9~11주에 정점을 찍고 12~14주부터 크게 완화되기 시작해요.", "자궁이 골반 위로 올라오기 시작하며, 근육과 인대가 늘어나 복부 주변에 통증이 생길 수 있어요."]}'::jsonb, baby_message = '아가는 이제 무화과만큼 컸어요! 위험한 시기를 넘기고 안전하게 자랄 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 11) AND day_number = 1;

-- 11주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 손가락으로 놀이를 하며 엄지손가락을 입에 넣을 수도 있어요.", "손가락과 발가락의 물갈퀴가 완전히 사라지고, 작은 손발톱과 모낭이 형성되고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["가스와 소화 불량이 지속될 수 있어요. 기름진 음식, 콩류 등 가스 유발 음식을 피하세요.", "혈액이 평소보다 최대 50% 더 많이 순환하면서 몸이 덥고 땀이 나며 어지러움을 느낄 수 있어요."]}'::jsonb, baby_message = '아가는 양수 속에서 뱅글뱅글 돌고 있어요! 엄마는 아가의 움직임을 느낄 수 있나요?', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 11) AND day_number = 2;

-- 11주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["모든 얼굴 뼈가 자리를 잡고, 귀가 보다 친숙한 형태를 갖추기 시작해요.", "간은 적혈구를 만들고, 신장은 소변을 생성하며, 췌장은 인슐린을 분비하기 시작해요."]}'::jsonb, mother_changes_payload = '{"items": ["빈뇨 증상이 다소 완화될 수 있어요. 자궁이 골반 위로 올라오면서 방광 압박이 일시적으로 줄어들기 때문이에요.", "감정 기복이 심해질 수 있어요. 요가 같은 심신 운동이 도움이 될 수 있어요."]}'::jsonb, baby_message = '아가는 이제 소변도 만들 수 있어요. 몸속 기관들이 열심히 일하고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 11) AND day_number = 3;

-- 11주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["뇌의 좌우 반구가 모두 발달하고 있어요. 좌뇌는 논리, 우뇌는 언어 처리를 담당하게 돼요.", "생식 기관이 발달하기 시작하지만, 초음파로 성별을 확인하기에는 아직 몇 주 더 걸려요."]}'::jsonb, mother_changes_payload = '{"items": ["질 분비물이 늘어날 수 있어요. 이는 자궁과 자궁경부의 분비물을 배출하는 자연스러운 현상이에요.", "두통, 현기증 등의 증상이 나타날 수 있으며, 이는 호르몬 변화와 혈액량 증가 때문이에요."]}'::jsonb, baby_message = '아가는 머릿속에서 복잡하고 신기한 일이 벌어지고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 11) AND day_number = 4;

-- 11주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 입을 벌리고 닫을 수 있으며, 주먹을 쥐는 동작도 할 수 있어요.", "치아 싹이 잇몸 아래에서 자라고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["앞으로 몇 주간 유방 및 유두 통증이 지속될 수 있어요. 이는 유선이 발달하는 자연스러운 과정이에요.", "심한 피로감이 지속될 수 있지만, 임신 2분기에 접어들면서 에너지가 돌아올 거예요."]}'::jsonb, baby_message = '아가는 작은 주먹을 쥐었다 폈다 할 수 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 11) AND day_number = 5;

-- 11주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["탯줄이 영양분을 공급하고 노폐물을 제거하는 역할을 하고 있어요.", "아기는 뱃속에서 활발하게 움직이지만, 태동은 16~22주경이 되어야 느낄 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["배 아래쪽 중앙에 어두운 선(linea nigra)이 나타날 수 있는데, 이는 호르몬 변화로 인한 정상적인 증상이에요.", "소화기관이 느려져 속쓰림이 나타날 수 있어요. 소량씩 자주 먹고 기름진 음식을 피하세요."]}'::jsonb, baby_message = '아가는 탯줄이 아주 튼튼해요. 엄마의 좋은 기운을 듬뿍 받고 있답니다!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 11) AND day_number = 6;

-- 11주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 앞으로 3주 안에 키가 약 두 배로 커질 예정이에요.", "태반이 난황낭의 역할을 이어받아 아기에게 영양을 공급하고 노폐물을 제거해요."]}'::jsonb, mother_changes_payload = '{"items": ["2주 후면 임신 2분기가 시작됩니다. 많은 여성들이 이 시기부터 생기가 돌고 활력을 되찾기 시작해요.", "호르몬이 점차 안정되면서 두통, 피로, 메스꺼움 등의 증상이 점차 완화되기 시작해요."]}'::jsonb, baby_message = '아가는 이제 성장 모드를 켰어요! 엄마가 주시는 영양분으로 쑥쑥 클 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 11) AND day_number = 7;

-- ===== Week 12 =====
UPDATE content.pregnancy_week_data SET baby_summary = '아기의 크기는 약 5.4cm, 자두(또는 라임) 크기만큼 성장했어요.; 주요 장기, 뼈, 근육이 모두 자리를 잡아 완전한 형성을 이루었어요.', mother_summary = '유방이 점점 커지고 부드러워지며, 유두 색이 진해질 수 있어요.; 호르몬 변화로 피로감이 지속될 수 있어요.', updated_at = timezone('utc', now()) WHERE week_number = 12;

-- 12주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 크기는 약 5.4cm, 자두(또는 라임) 크기만큼 성장했어요.", "주요 장기, 뼈, 근육이 모두 자리를 잡아 완전한 형성을 이루었어요."]}'::jsonb, mother_changes_payload = '{"items": ["유방이 점점 커지고 부드러워지며, 유두 색이 진해질 수 있어요.", "호르몬 변화로 피로감이 지속될 수 있어요."]}'::jsonb, baby_message = '아가는 자두만큼 컸어요! 이제 더 튼튼하게 자랄 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 12) AND day_number = 1;

-- 12주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 손가락과 발가락이 완전히 분리되어 주먹을 쥐거나 발가락을 오므릴 수 있어요.", "아주 작은 손발톱이 자라나고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["잦은 소변이 지속될 수 있어요.", "감정 기복이 심해질 수 있지만, 호르몬이 점차 안정되면서 나아질 거예요."]}'::jsonb, baby_message = '아가는 손가락이 이제 따로따로 움직여요. 곧 엄마 손도 잡아볼 수 있겠죠.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 12) AND day_number = 2;

-- 12주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 뇌가 빠르게 발달하고 반사 신경이 작동하기 시작해요.", "아기의 코와 턱이 뚜렷하게 드러나며 사람다운 얼굴 윤곽이 잡히기 시작해요."]}'::jsonb, mother_changes_payload = '{"items": ["배가 볼록해지기 시작하고 임부복이나 신축성 있는 옷이 필요해질 수 있어요.", "멜라닌 색소 증가로 기미(임신 마스크)가 생길 수 있어요."]}'::jsonb, baby_message = '아가는 얼굴이 점점 또렷해지고 있어요. 곧 귀여운 옆모습을 보여줄 수 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 12) AND day_number = 3;

-- 12주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["주요 장기, 뼈, 근육이 자리를 잡고 소화·비뇨·순환 시스템이 기능하기 시작해요.", "아기는 소량의 양수를 삼키며 폐호흡과 음식 섭취를 연습하고 소변도 배출해요."]}'::jsonb, mother_changes_payload = '{"items": ["두통과 어지러움이 나타날 수 있어요. 혈당 저하, 탈수, 호르몬 변화가 주요 원인이에요.", "출혈이 보이거나 복통을 동반한 출혈이라면 즉시 의사에게 알려야 해요."]}'::jsonb, baby_message = '아가는 양수 속에서 운동했어요. 팔다리도 뻗고, 하품도 했답니다!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 12) AND day_number = 4;

-- 12주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 장이 탯줄 쪽으로 돌출되었다가 곧 복벽이 닫히며 복부 안으로 들어가게 돼요.", "간이 적혈구를 만들어 내기 시작하며, 이제부터는 성장과 성숙에 집중해요."]}'::jsonb, mother_changes_payload = '{"items": ["혈류량 증가로 외음부가 푸른빛을 띠는 등의 혈관 변화가 나타날 수 있어요.", "체중 증가가 시작되며, 주당 약 250~300g 속도로 늘어나기 시작해요."]}'::jsonb, baby_message = '아가는 이제 물도 삼킬 수 있어요. 젖도 잘 먹을 준비를 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 12) AND day_number = 5;

-- 12주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["치아 싹 20개가 잇몸 아래에 자리하고 있고, 성기관도 형성되고 있어요.", "손가락에 촉각 패드가 발달하고 눈꺼풀의 미세한 움직임도 초음파로 확인할 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["피로감이 지속될 수 있어요. 이는 철분 부족과도 연관될 수 있으므로 철분 수치를 점검해보세요.", "투명한 질 분비물이 늘어날 수 있어요. 이는 질 감염을 예방하는 자연스러운 현상이에요.", "철분 부족으로 인한 빈혈이나 현기증에 주의해야 해요."]}'::jsonb, baby_message = '아가는 이제 엄마 목소리의 울림을 느낄 수 있어요. 자주 이야기해 주세요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 12) AND day_number = 6;

-- 12주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["임신 1분기가 끝나가며 아기는 뼈·근육·팔다리·장기를 모두 갖추어 완전한 형성을 이루었어요.", "이제 2분기부터는 각 장기와 조직이 빠르게 성장하고 성숙해지는 단계에 진입해요."]}'::jsonb, mother_changes_payload = '{"items": ["13주차부터 임신 2분기가 시작됩니다. 지금까지 잘 견뎌주신 엄마 몸에 감사해요!"]}'::jsonb, baby_message = '아가는 힘든 초기 단계를 건강하게 통과했어요! 이제 안정적인 중기로 함께 나아가요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 12) AND day_number = 7;

-- ===== Week 13 =====
UPDATE content.pregnancy_week_data SET baby_summary = '아기의 크기는 레몬만큼, 약 7.4cm / 81g이에요.', mother_summary = '입덧과 피로가 완화되며, 기운이 조금씩 돌아오기 시작해요. (1),; 가슴·배에 파란 정맥이 파랗게 드러날 수도 있어요.임신 중에는 혈액이 많이 필요해서 30~50%가량 혈액량이 증가하기 때문이에요.', updated_at = timezone('utc', now()) WHERE week_number = 13;

-- 13주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 크기는 레몬만큼, 약 7.4cm / 81g이에요."]}'::jsonb, mother_changes_payload = '{"items": ["입덧과 피로가 완화되며, 기운이 조금씩 돌아오기 시작해요. (1),", "가슴·배에 파란 정맥이 파랗게 드러날 수도 있어요.임신 중에는 혈액이 많이 필요해서 30~50%가량 혈액량이 증가하기 때문이에요.", "체중이 서서히 늘고, 자궁이 골반 밖으로 올라오면서 아랫배가 도드라질 수 있어요."]}'::jsonb, baby_message = '아가는 이제 레몬만큼 커졌어요. 여전히 머리가 더 무겁지만 몸도 점점 커지면서 아주 작은 아기처럼 엄마 배 속에서 크고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13) AND day_number = 1;

-- 13주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["두개골과 긴 뼈가 단단해지고, 치아 구조·손톱·발톱이 형성돼요.", "손목과 발목도 만들어집니다.", "눈은 머리 옆에서 앞으로 이동(2)해 제자리를 찾아가고, 얼굴 윤곽이 뚜렷해지고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 중기에 들어서면서 조금 편안해지지만,아직 초기의 증상이 바로 사라지지 않을 수 있고,불편한 증상도 나타날 수 있어요. (1),", "코막힘, 속쓰림, 잇몸 출혈 같은 불편감이 생길 수 있어요.(1)(3)  이는 혈액량 증가와 호르몬 변화 때문이며 대부분 정상이에요.(1)(3) 잇몸에 작은 출혈은 호르몬 영향이지만,통증이 심하거나 염증이 동반되면 검진 때 알려야 해요!", "속쓰림이 심하다면 식사 후 껌을 씹어 위산을 중화시켜보세요!그래도 증상이 나아지지 않는다면 위험하지 않은 속쓰림 약을 추천해드릴게요."]}'::jsonb, baby_message = '아가는 얼굴 윤곽이 두드러지고, 손목과 발목도 생기고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13) AND day_number = 2;

-- 13주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 양수를 삼키고 소변을 만들어 배출할 수 있어요..(1),", "삼킨 양수는 장에 모여 첫 대변인 ‘태변’을 이룹니다..(1),"]}'::jsonb, mother_changes_payload = '{"items": ["입덧이 줄어들며 식욕이 돌아오고, 체중이 늘기 시작해요.", "이제 본격적인 영양 관리가 필요해요 — 아기와 엄마 모두를 위한 시간이에요."]}'::jsonb, baby_message = '아가는 물을 삼키고 배변하는 연습을 해요. 세상에 나가서 잘 먹고 쉴 준비 중이에요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13) AND day_number = 3;

-- 13주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 양수 속에서 몸을 구부리고, 손과 발을 움직이며 운동 연습을 해요."]}'::jsonb, mother_changes_payload = '{"items": ["엄마의 가슴에서는 초유(colostrum)가 만들어지기 시작해요.", "이 시점부터 유방은 변화를 준비하는 거예요. 어쩌면 엄마의 가슴에서 아기를 위한 준비를 하기 위해 무거워질 수 있어요.(교과서)이는 출산 후 며칠간 아기에게 주는 첫 영양 공급원으로, 자연스러운 변화에요.", "엄마는 느낄 수 없지만 아기와 연결된 태반이 완전히 발달했어요."]}'::jsonb, baby_message = '아가는 양수 속에서 팔다리를 쭉 뻗었어요. 운동하는 기분이에요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13) AND day_number = 4;

-- 13주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 엄마 배 표면에 더 가까워지고,움직임이 활발해집니다."]}'::jsonb, mother_changes_payload = '{"items": ["감정이 한결 차분해지고, 정서적 안정감이 찾아옵니다.", "이 시기의 성생활은 대부분 안전하며, 부부 간 교감이 정서적으로 도움됩니다."]}'::jsonb, baby_message = '아가는 엄마의 배 바로 아래에서 심장이 콩닥콩닥 뛰고 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13) AND day_number = 5;

-- 13주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["성별을 구분 짓는 장기가 조금씩 뚜렷해지고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["초기 불편 증상은 줄고, 몸의 균형이 잡혀가요.", "체중과 감정의 변화를 꾸준히 관찰하는 시기에요"]}'::jsonb, baby_message = '아직은 이를지라도, 곧 성별을 알아볼 수 있을 거에요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13) AND day_number = 6;

-- 13주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["이번 주, 아기는 레몬 크기만큼 성장하며 눈·손·발·지문까지 세밀하게 발달했어요.", "양수를 삼키고 소변을 만들어내며, 태변을 저장할 준비를 마쳤답니다.", "이제 곧 14주차가 되면, 아기의 움직임이 더 활발해지고 태동에 가까운 변화를 보일 거예요."]}'::jsonb, mother_changes_payload = '{"items": ["초기의 피로감과 입덧이 사라지며 몸이 점점 안정되어가요.", "자궁이 커지면서 배가 조금 더 도드라지고, 옆으로 누워 자는 습관이 몸을 편안하게 해줄 거예요.", "체중이 증가하기 시작했지만 너무 빠르지 않게, 균형 잡힌 식단으로 관리해 주세요."]}'::jsonb, baby_message = '아가는 이번 주 정말 많이 컸어요. 곧 엄마에게 잘 자라고 있다는 신호를 보낼게요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13) AND day_number = 7;

-- ===== Week 14 =====
UPDATE content.pregnancy_week_data SET baby_summary = '아기의 길이는 약 8~9cm, 몸무게는 약 40~45g, 복숭아 크기예요.; 아기의 목이 길어지고, 얼굴 윤곽이 또렷해지며 사람다운 모습으로 변하고 있어요.', mother_summary = '자궁이 골반 밖으로 나오면서 아랫배가 살짝 볼록해지고 옷 맵시가 달라져요.; 복부압박으로 위가 눌리면서 속이 더부룩하거나 트림이 늘 수 있어요.', updated_at = timezone('utc', now()) WHERE week_number = 14;

-- 14주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 길이는 약 8~9cm, 몸무게는 약 40~45g, 복숭아 크기예요.", "아기의 목이 길어지고, 얼굴 윤곽이 또렷해지며 사람다운 모습으로 변하고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 골반 밖으로 나오면서 아랫배가 살짝 볼록해지고 옷 맵시가 달라져요.", "복부압박으로 위가 눌리면서 속이 더부룩하거나 트림이 늘 수 있어요.", "하늘을 보고 눕는 자세보단 왼쪽으로 눕는 습관을 들이면 좋아요."]}'::jsonb, baby_message = '아가는 엄마의 심장까지 조금씩 올라가고 싶어요. 아직은 멀지만 손을 뻗으면 엄마의 심장이 닿을 것 같아요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 14) AND day_number = 1;

-- 14주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 비장과 간이 각각 적혈구와 담즙을 만들어내며 활발히 일하고 있어요.", "작은 심장은 분당 150회 이상 뛰며 혈액을 온몸으로 보내요."]}'::jsonb, mother_changes_payload = '{"items": ["혈액량이 급격히 늘면서 심장이 더 열심히 일하고, 맥박이 빨라질 수 있어요.", "코피, 코막힘, 잇몸출혈이 생기기도 하는데 혈관이 확장된 자연스러운 현상이에요.", "혈류 증가로 피부 온도가 높아지고, 얼굴이 붉거나 정맥선이 드러날 수 있어요."]}'::jsonb, baby_message = '아가는 엄마의 심장과 함께 뛰어요. 아가의 심장은 엄청 빨리 뛰어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 14) AND day_number = 2;

-- 14주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 피부가 아직 얇지만, 부드러운 솜털(lanugo) 이 자라기 시작해요.", "이 털은 태어날 때까지 아기를 따뜻하게 감싸주는 역할을 해요."]}'::jsonb, mother_changes_payload = '{"items": ["혈류 증가로 땀이 많아지고 체온이 높게 느껴질 수 있어요.", "피부의 색소가 진해지며 유륜, 배 중앙선(리니아 니그라)이 점차 생겨나요. 몇주내로 이 선은뚜렷해질거에요.", "유방이 단단해지고 간혹 투명한 초유(colostrum) 이 맺힐 수 있어요."]}'::jsonb, baby_message = '아가는 몸에 따뜻한 외투가 생기고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 14) AND day_number = 3;

-- 14주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["태아의 갑상선이 기능을 시작하면서 스스로 호르몬을 만들어내요.", "내부 장기들이 거의 완성돼, 이제 성장을 위한 에너지를 모으는 시기예요."]}'::jsonb, mother_changes_payload = '{"items": ["입덧이 완화되고 피로감이 줄며, 정서적으로도 편안함을 느끼면서 여유가 생겨요.", "배가 조금 무거워지지만 안정감이 느껴지는 시기로, 대부분의 임신부가 “안정기”로 들어섰다고 말해요.", "프로게스테론 영향으로 변비가 생기기 쉬우니 수분과 지금부터 식단에 섬유질을 늘려야 해요."]}'::jsonb, baby_message = '아가는 몸속에서도 일이 시작됐어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 14) AND day_number = 4;

-- 14주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 눈꺼풀이 서로 붙어 눈을 감은 상태지만, 눈 안에서는 망막이 점점 발달하며 빛의 변화를 감지해요."]}'::jsonb, mother_changes_payload = '{"items": ["혈류가 늘어나 얼굴과 피부가 밝아 보이거나 붉게 보일 수 있어요.", "코피나 잇몸출혈, 코막힘은 여전히 흔해요. 불편할거에요.", "감정 기복이 줄면서도, 때로는 작은 일에도 눈물이 날 수 있어요."]}'::jsonb, baby_message = '아직 세상을 볼 수 없지만, 심장 소리는 느낄 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 14) AND day_number = 5;

-- 14주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 귀가 얼굴 양옆 자리로 이동하며 청력기관이 완성되는 중이에요.", "이제 곧 엄마의 심장 소리, 소화음, 그리고 목소리의 진동을 느낄 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["몸 전체 혈액순환이 활발해지며 손발이 따뜻해지거나 붓기가 생길 수 있어요.", "자궁이 커지면서 방광 압박으로 소변이 자주 마려워요.", "호르몬 영향으로 머리카락이 풍성해지거나 피부가 윤기 있게 보여요."]}'::jsonb, baby_message = '아가는 귀가 아직 만들어지고 있지만, 진동을 통해 엄마의 신호를 어렴풋이 느껴요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 14) AND day_number = 6;

-- 14주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["이번 주, 아기는 피부 아래 솜털이 자라고, 갑상선이 작동을 시작하며, 심장·간·비장 등 주요 장기가 본격적으로 일하기 시작했어요."]}'::jsonb, mother_changes_payload = '{"items": ["입덧이 줄고, 소화가 서서히 회복되며 에너지가 돌아와요.", "배가 조금 더 앞으로 나와 임신의 실감이 커지는 시기예요.", "감정의 균형이 서서히 잡히면서 아기를 떠올리는 시간이 늘어요."]}'::jsonb, baby_message = '아가는 이번 주 몸 안의 시계를 맞추고 있어요. 박자를 찾아가요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 14) AND day_number = 7;

-- ===== Week 15 =====
UPDATE content.pregnancy_week_data SET baby_summary = '태아의 키는 15cm정도 이고 몸무게는 115g으로 사과만큼 자랐어요.', mother_summary = '자궁이 커지면서 하복부·골반 당김이 잦아질 수 있어요.; 질 분비물(백대하) 이 증가하는데 감염 예방 작용을 해요(색·냄새·질감 이상 시 진료).', updated_at = timezone('utc', now()) WHERE week_number = 15;

-- 15주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["태아의 키는 15cm정도 이고 몸무게는 115g으로 사과만큼 자랐어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 커지면서 하복부·골반 당김이 잦아질 수 있어요.", "질 분비물(백대하) 이 증가하는데 감염 예방 작용을 해요(색·냄새·질감 이상 시 진료)."]}'::jsonb, baby_message = '아가는 사과만큼 자랐어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 15) AND day_number = 1;

-- 15주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 배를 통해 들어오는 빛에 민감해지고, 엄마의 심장 소리와 배에서 나는 꼬르륵 소리를 듣기를 시작해요. 엄마가 아기에게 보내는 음성이 닿을 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["저번주에 생겼던 변화가 이어져요.혈액량 증가와 점막 변화로 코막힘·코피가 흔해요.", "숨가쁨이 잠깐 느껴질 수 있어요."]}'::jsonb, baby_message = '아가는 오늘은 배를 통해 들어오는 불빛을 작게 느꼈어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 15) AND day_number = 2;

-- 15주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["온몸에 솜털이 자라면서 체온 유지 준비를 해요."]}'::jsonb, mother_changes_payload = '{"items": ["피부 가려움이 생길 수 있어요(특히 배·가슴).", "저번주에 생겼던 변화가 이어져요.유방·유선 발달로 묵직하고 민감해질 수 있어요."]}'::jsonb, baby_message = '아가는 자신이 만든 따뜻한 솜털 외투를 입었어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 15) AND day_number = 3;

-- 15주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["다리가 팔보다 길어지며 신체 비율이 더 ‘사람답게’ 균형을 찾아요.", "폐 발달이 시작되고, 아주 미세한 딸꾹질 같은 움직임이 있을 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["입덧이 줄고 식욕·에너지가 돌아오며 ‘안정기’ 느낌이 커져요(저번 주와 같이).", "엄마 배 아래의 작은 사람에게도 에너지를 전달해야하기 때문에 전보다 300칼로리정도 에너지 보충이 필요해요.3)"]}'::jsonb, baby_message = '아가는 몸의 균형이 맞춰지고 있어요. 한 걸음 더, 엄마에게 가까이.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 15) AND day_number = 4;

-- 15주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["눈썹· 속눈썹· 머리카락이 보이기 시작하지만 피부는 아직 얇고 반투명해요.", "팔다리와 관절을 활발히 움직이며 엄지 빨기·하품 같은 동작도 보여요."]}'::jsonb, mother_changes_payload = '{"items": ["배가 점점 도드라지기 시작하고(첫 임신은 더 늦게, 두번째임신은 더 일찍이겠지만) 이제 눈에 보이게 옷 핏이 달라져요.", "찌릿한 옆구리 통증을 느낄 수 있어요."]}'::jsonb, baby_message = '아가는 엄지를 빠는 동작도 연습했어요. 어쩌면 초음파 사진에서 엄지 빠는 모습을 들킬지도 몰라요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 15) AND day_number = 5;

-- 15주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["듣기 발달로 엄마의 심장·장 소리가 더 익숙해져요(저번 주와 같이).", "손가락을 쥐었다 폈다 하고 팔다리를 더 자주 뻗어요."]}'::jsonb, mother_changes_payload = '{"items": ["잇몸 출혈·민감이 흔해요(임신 치은염, 치과 진료는 안전).", "속쓰림/가스/소화불량이 생길 수 있어요."]}'::jsonb, baby_message = '아기는 손을 꼭 쥐는 연습을 하고 있어요. 곧 엄마 손을 잡을 그날을 상상하며.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 15) AND day_number = 6;

-- 15주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["초음파에서 뼈 윤곽(BPD 등 측정) 이 뚜렷하게 보일 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["이번주에는 에너지 회복·활동성 증가가 느껴지고, 배는 더 또렷해졌어요.", "필요한 경우 2분기 선별검사(MMS/쿼드), NIPT, 양수검사 등의 일정·선택을 의료진과 상의해요. 아기의 유전적 이상을 찾을 수 있는 중요한 검사에요."]}'::jsonb, baby_message = '아기는 이번 주 사과만큼 많이 자랐어요. 다음 주엔 더 성장한 모습으로 인사할 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 15) AND day_number = 7;

-- ===== Week 16 =====
UPDATE content.pregnancy_week_data SET baby_summary = '아기의 키는 18cm정도이고 몸무게는 150g정도에요.; 아기가 아보카도 크기로 자랐어요.', mother_summary = '자궁이 커지면서 둥근 인대 통증(찌릿한 옆구리/하복부 통증)이 나타날 수 있어요. 쉬면 빠르게 가라앉는 경우가 많아요.; 이번주에도 여전히 임신 호르몬과 순환 변화로 코막힘·코피·울혈감이 있을 수 있고, 정맥이 늘어나 정맥류가 보이기도 해요.', updated_at = timezone('utc', now()) WHERE week_number = 16;

-- 16주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 키는 18cm정도이고 몸무게는 150g정도에요.", "아기가 아보카도 크기로 자랐어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 커지면서 둥근 인대 통증(찌릿한 옆구리/하복부 통증)이 나타날 수 있어요. 쉬면 빠르게 가라앉는 경우가 많아요.", "이번주에도 여전히 임신 호르몬과 순환 변화로 코막힘·코피·울혈감이 있을 수 있고, 정맥이 늘어나 정맥류가 보이기도 해요."]}'::jsonb, baby_message = '아기는 오늘 두 손 안에 쏙 들어갈 아보카도만큼 자랐어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 16) AND day_number = 1;

-- 16주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["작은 태동(퀵닝)을 느낄 수 있는 시기에 들어섰어요. 보통 16–22주 사이에 시작되고, 첫 임신이  아닌 산모가 더 일찍 알아차리기도 해요."]}'::jsonb, mother_changes_payload = '{"items": ["가스·팽만감이 잦아질 수 있어요. 프로게스테론이 장운동을 늦춰서 생기는 변화예요.", "변비도 심해질 수 있어요."]}'::jsonb, baby_message = '아기는 물결처럼 살짝 스치는 신호를 보내고 있어요. 곧 더 분명해질 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 16) AND day_number = 2;

-- 16주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 얼굴 표정(미소·찡그림 등)을 짓기 시작하지만, 아직 근육 조절이 없어 ‘무작위’로 일어나요.", "귀의 작은 뼈가 형성되고, 엄마의 목소리를 듣고 인지하기 시작해요."]}'::jsonb, mother_changes_payload = '{"items": ["건망증이 생겼음을 느낄 수 있어요. 뚜렷한 원인이 있는 건 아니지만 스트레스·피로·호르몬 변화가 복합적으로 작용한 결과로 보고돼요.", "두통은 흔하지만, 2·3기에 심한 두통이 반복되면 자간전증 신호일 수 있어 확인이 필요해요."]}'::jsonb, baby_message = '아기는 엄마 소리를 들으며 가끔 미소 짓는 연습을 하고 있어요. 아직은 연습 중이라 우연이 많지만요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 16) AND day_number = 3;

-- 16주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["두피 모낭의 패턴이 형성돼요. 이 패턴은 평생 유지될 머리카락 자람의 ‘지도’가 돼요. 이렇게 만들어진 지도는 한번 만들어진 후로 새로 생기진 않아요."]}'::jsonb, mother_changes_payload = '{"items": ["소화불량·속쓰림이 있을 수 있어요. 자세·식사 패턴을 조절해 불편을 줄여보세요.", "지난주 변화와 마찬가지로 자궁이 커지며 복부/골반 당김이 이어질 수 있어요."]}'::jsonb, baby_message = '아기의 머리카락 지도가 그려지고 있어요. 언젠가 엄마가 쓰다듬어 줄 머리카락을 상상하며.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 16) AND day_number = 4;

-- 16주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 간기능이 발달하면서 이 시기부터 (16–18주) AFP(신경관 결손 선별)나, 상황에 따라 쿼드 스크린을 권할 수 있어요. 양수검사(15–20주)는 선택적 진단검사예요. (1)(3)중요한 검사인 만큼 병원에 방문하면 우리 아기에게 필요한지 꼭 확인해주세요."]}'::jsonb, mother_changes_payload = '{"items": ["산전 방문에서 혈압·소변(단백뇨) 확인으로 임신성 당뇨·자간전증 징후도 함께 살펴봐요.", "일상 활동은 가능하지만 낙상·복부 외상 위험 활동은 피해야 해요."]}'::jsonb, baby_message = '엄마가 준비해주는 검사는 아기와 엄마를 더 안전하게 지켜줘요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 16) AND day_number = 5;

-- 16주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["순환 기능이 활발해지고(자료에 따라 매일 수십 리터 규모의 혈액 운반으로 설명), 팔·손가락을 구부리고 맞잡고 주먹 쥐기 같은 동작이 늘어요."]}'::jsonb, mother_changes_payload = '{"items": ["임산부·수유부는비타민 D 보충 10 µg/일(=400 IU)가 권장돼요. 음식만으론 충분량 도달이 어려워서 비타민으로 보충해야해요.", "자궁이 커져서 하늘 보고 눕는 자세는 혈관을 눌러 저혈압까지 일으킬 수 있어요.이제 갑자기 일어나면 어지러울 수도 있답니다."]}'::jsonb, baby_message = '엄마의 하루가 아기의 피처럼 또르르 흐르며 아기를 크게 키워줘요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 16) AND day_number = 6;

-- 16주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["이번 주의 큰 변화는 ‘작은 태동’의 시작 시기에 들어섰다는 점과, 엄마 목소리를 듣고 인지하기 시작했다는 거예요. 표정을 짓지만 아직은 무작위라는 사실도 기억해봐요."]}'::jsonb, mother_changes_payload = '{"items": ["통증·가스/팽만·허리 통증 같은 2기 증상이 이어질 수 있어요.", "윤기나는 피부와 모발, 얼굴에 갈색 반점이 생길 수도 있어요내 몸이 임신 중기에 적응 중이라는 신호예요."]}'::jsonb, baby_message = '아기는 이번 주 엄마의 소리에 조금씩 반응하며, 아주 작은 인사도 보냈어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 16) AND day_number = 7;

-- ===== Week 17 =====
UPDATE content.pregnancy_week_data SET baby_summary = '아기는 키 약 20 cm, 몸무게 약 180 g으로 자라가고, 배 크기만큼 자랐어요.', mother_summary = '자궁이 더 올라와 배가 눈에 띄기 시작하고 허리선이 사라진 느낌이 들 수 있어요.; 이제 진짜 ‘임신부의 몸’이 보이기 시작하죠. 주변에서 축하받는 기쁨도 있지만 낯설게 느껴질 수도 있어요.', updated_at = timezone('utc', now()) WHERE week_number = 17;

-- 17주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 키 약 20 cm, 몸무게 약 180 g으로 자라가고, 배 크기만큼 자랐어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 더 올라와 배가 눈에 띄기 시작하고 허리선이 사라진 느낌이 들 수 있어요.", "이제 진짜 ‘임신부의 몸’이 보이기 시작하죠. 주변에서 축하받는 기쁨도 있지만 낯설게 느껴질 수도 있어요."]}'::jsonb, baby_message = '아기는 오늘 작은 손에 꼭 안길 순무/샐러리만큼 자랐어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 17) AND day_number = 1;

-- 17주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 골격이 연골이 뼈로 바뀌는 중이에요."]}'::jsonb, mother_changes_payload = '{"items": ["탯줄이 더 튼튼하고 굵게 자라며 영양·산소를 전해요.", "칼슘·철분·비타민 D 섭취가 중요한 시기예요. 엄마의 칼슘 섭취는 아기 뼈(엄마 뼈 포함)에 도움을 주고, 고혈압·자간전증 위험 감소에도 연결돼요."]}'::jsonb, baby_message = '아기의 뼈가 튼튼해지고 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 17) AND day_number = 2;

-- 17주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["피부를 감싸는태지가 형성되기 시작해요.", "땀샘 발달이 시작되고, 피부층은 다음 주쯤 더 갖춰져요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 중기엔 윤기 나는 머리카락·기름진 피부·얼굴 갈색 반점(기미)이 나타날 수 있어요.", "가려운 피부·튼살이 흔해요. 보습이 도움 되지만 완전 예방은 어려워요."]}'::jsonb, baby_message = '아기는 지난번에 입었던 솜털 외투 위로 태지 외투가 생기고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 17) AND day_number = 3;

-- 17주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 빛과 어둠을 인지해요.아가는 따뜻하고 밝은쪽으로 옮겨가요.", "이제 소리를 인식하고 반응할 수 있어요.시끄러운 소리에 놀라 움찔할 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 많이 커져서 이제 잘때도 옆으로 누워서 자야해요.", "임신 중 시력 변화(흐림·건조) 생길 수 있어요. 단순 흐림이 아닌 복시 등 심한 증상이 있다면 상담하세요."]}'::jsonb, baby_message = '아기는 엄마 배 바깥의 세상의 소리와 빛을 느끼고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 17) AND day_number = 4;

-- 17주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["지난주에 이어 작은 태동(퀵닝)을 느낄 수도, 아직 못 느낄 수도 있는 시기예요(16–22주).", "아기의 심장은 하루에 약 100파인트를 펌핑할 만큼 강하게 일해요."]}'::jsonb, mother_changes_payload = '{"items": ["호르몬 변화로 인해 이상한 꿈이나 불안/감정 기복이 늘 수 있어요. 필요하면 의료진과 상의해요.", "자궁이 많이 커져서 안전벨트가 자궁을 압박할 수 있어요."]}'::jsonb, baby_message = '아기는 신호를 보내고 있어요. 아직 미약하지만 곧 더 강하게 신호를 보낼 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 17) AND day_number = 5;

-- 17주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["피하지방이 쌓이기 시작하며 점점 포동포동해져요."]}'::jsonb, mother_changes_payload = '{"items": ["‘둥지 본능’이 올라와 출산 계획·아기방 인테리어를 둘러보고 있진 않으신가요?", "변비/팽만이 이어질 수 있고, 빈혈이 의심되면 철분 보충에 대해 상담해요."]}'::jsonb, baby_message = '아기는 엄마의 사랑을 먹고 자라며 통통하게 지방을 찌우고 있어요. 점점 귀여워지고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 17) AND day_number = 6;

-- 17주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["이번 주의 큰 변화로 작은 태동의 시작 가능성, 골격이 뼈로 단단해짐, 피하지방 형성, 빛·소리 반응을 다시 떠올려요."]}'::jsonb, mother_changes_payload = '{"items": ["배가 더 눈에 띄고(허리선 변화), 피부·머리카락의 윤기, 가려움/튼살 관리는 계속해요.", "수면은 옆으로, 현기증 땐 바로 쉬기!"]}'::jsonb, baby_message = '아기는 빛과 목소리를 느끼고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 17) AND day_number = 7;

-- ===== Week 19 =====
UPDATE content.pregnancy_week_data SET baby_summary = '오늘 아기는 키 약 24–25cm, 몸무게 약 270–300g, 손에 쥘 수 있는 석류 하나 크기만큼 자랐어요.(1),; 손가락과 발가락에는 영원히 변하지 않을 지문과 발자국 무늬가 드디어 완성되었어요. 일란성 쌍둥이도 서로 다른, 오직 자기만의 무늬예요.', mother_summary = '자궁의 끝부분이 배꼽 근처까지 올라와 배가 더 ‘임산부 배’처럼 둥글게 보이기 시작해요.; 체형에 따라 어떤 사람은 배가 많이 나온 것 같고, 어떤 사람은 덜 나온 것처럼 보여서 걱정되기도 하지만, 의사가 아기 성장과 체중 증가를 괜찮다고 한다면 배 모양과 크기 차이는 전부 정상 범위예요.(1),', updated_at = timezone('utc', now()) WHERE week_number = 19;

-- 19주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["오늘 아기는 키 약 24–25cm, 몸무게 약 270–300g, 손에 쥘 수 있는 석류 하나 크기만큼 자랐어요.(1),", "손가락과 발가락에는 영원히 변하지 않을 지문과 발자국 무늬가 드디어 완성되었어요. 일란성 쌍둥이도 서로 다른, 오직 자기만의 무늬예요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁의 끝부분이 배꼽 근처까지 올라와 배가 더 ‘임산부 배’처럼 둥글게 보이기 시작해요.", "체형에 따라 어떤 사람은 배가 많이 나온 것 같고, 어떤 사람은 덜 나온 것처럼 보여서 걱정되기도 하지만, 의사가 아기 성장과 체중 증가를 괜찮다고 한다면 배 모양과 크기 차이는 전부 정상 범위예요.(1),"]}'::jsonb, baby_message = '아기는 이제 세상 어디에도 없는 나만의 무늬가 생겼어요. 엄마 품에 안길 날을 기다리며 조용히 준비하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 19) AND day_number = 1;

-- 19주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기 뇌에서는 후각·미각·청각·시각·촉각을 담당하는 영역이 분주하게 연결되고 있어요. 오감의 회로가 하나씩 켜지는 시기예요.", "아기는 양수 속에서 삼키고, 빨고, 움직이며 세상을 느끼는 연습을 하고 있어요. 자주 듣는 엄마·아빠 목소리를 뇌가 기억해 두기 시작해요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 자라며 골반과 연결된 인대가 늘어나면서, 사타구니에서 시작해 엉덩이 위쪽까지 찌릿한 둥근 인대 통증이 느껴질 수 있어요.", "이 통증은 보통 짧고 금세 지나가며, 갑자기 움직이거나 자세를 바꿀 때 더 잘 느껴질 수 있어요.", "하지만 휴식을 취해도 사라지지 않는 강한 경련성 통증이 계속되거나, 발열·어지럼증·상복부 압통이 함께 있다면 의료진과 꼭 상의해야 해요."]}'::jsonb, baby_message = '아기는 이제 엄마 목소리가 점점 더 익숙해지고 있어요. 목소리를 자주 들려주세요. 나중에 태어났을 때, ‘아, 이 목소리 알아!’ 하고 미소 지을 수 있게요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 19) AND day_number = 2;

-- 19주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기 폐의 작은 기관지들이 더 멀리 뻗어나가고, 말단에 작은 호흡 주머니들이 더 촘촘하게 자라며 아기의 폐가 산소를 받아들일 준비를 하고 있어요.", "갈색 지방이라는 것이 형성되기 시작해요. 이 지방은 태어난 뒤 몸을 따뜻하게 지키고 에너지와 혈당·인슐린을 조절하는 데 중요한 역할을 하게 될 거예요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 중에는 평소보다 더 많은 산소가 필요해져, 계단을 조금만 올라가도 숨이 찬 느낌이 들 수 있어요.", "시간이 갈수록 커지는 자궁이 가슴을 누르며, 가만히 앉아있을 때도 답답하거나 숨이 짧게 느껴질 수 있어요.", "혈압이 예전보다 살짝 낮아질 수 있어 갑자기 일어날 때 어지럽거나 눈앞이 흐려지는 경험을 할 수도 있어요."]}'::jsonb, baby_message = '아기는 아직 엄마처럼 폐로 숨을 쉬진 않지만 언젠가 엄마 품에서 처음 숨을 들이쉴 그날을 상상하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 19) AND day_number = 3;

-- 19주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 피부는 아직 얇고 투명해서 혈관이 비쳐 붉게 보이지만, 그 위를 감싸는 버닉스, 우리나라 말로는 태지라고 불리는 크림같은 보호막이 완성되어가고 있어요.", "이 태지는 아기의 피부를 보호하고 수분을 지켜주며, 해로운 박테리아로부터도 지켜주고 폐와 소화관이 발달하는 데도 도움을 준다고 알려져 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 호르몬과 색소 변화 때문에, 윗입술·뺨·이마에 기미(‘산모의 가면’)가 생기거나 유두·겨드랑이·허벅지 안쪽 피부가 더 어두워질 수 있어요.", "배꼽에서 치골까지 이어지는 임신선이 점점 뚜렷해지고 있어요.", "얼굴·어깨·팔에는 작은 붉은 실핏줄 얼룩(거미 모반)이 보일 수 있는데, 대부분은 혈관·호르몬 변화로 생기는 자연스러운 변화예요."]}'::jsonb, baby_message = '아기 피부 위에 하얀 외투가 입혀지고 있어요. 엄마 품으로 나갈 때까지 아기를 따뜻하게 지켜줄 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 19) AND day_number = 4;

-- 19주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 자주 몸을 뒤집고, 발로 차고, 비틀면서 근육과 신경을 단련하고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 중기에는 다리 경련이 자주 생길 수 있는데, 체중 증가, 부종, 근육에 가해지는 부담과 관련된 것으로 여겨져요.", "밤중이나 새벽에 종아리가 갑자기 ‘꽉’ 뭉치거나, 한동안 발을 딛기 힘들 정도로 당기는 느낌이 들 수 있어요.", "발목·발, 손가락이 약간 붓는 것도 흔한 변화라, 오래 서 있거나 앉아 있으면 더 심해질 수 있어요."]}'::jsonb, baby_message = '엄마가 느끼는 “금붕어가 살랑거리는 느낌”은 점점 더 뚜렷해져, 나중엔 분명한 발차기와 회전으로 느껴지게 될 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 19) AND day_number = 5;

-- 19주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 귀 구조(외·중·내이)가 정교하게 발달해, 자궁 속에서 들리는 심장 박동, 혈류 소리, 장 운동 소리 등을 듣기 시작했어요.", "기억력을 담당하는 뇌가 발달해, 자주 듣는 엄마·아빠 목소리를 기억할 수 있는 단계라고 해요."]}'::jsonb, mother_changes_payload = '{"items": ["혈액량이 늘어나고 점막이 붓기 쉬워져, 코막힘이나 코피를 경험하는 임신부가 적지 않아요. 임산부의 약 5명 중 1명 정도가 코피를 경험한다고도 해요.", "코피가 날 때는 앉아서 몸을 살짝 앞으로 숙이고, 코 아래 부분을 10–15분간 꼬집어 압박한 뒤, 콧대에 찬 찜질을 해주는 방법이 권장돼요.", "피로와 수면 문제, 자주 깨는 밤이 이어지면서 “몸은 지치고, 머리는 예민한” 상태가 계속될 수 있어요."]}'::jsonb, baby_message = '아기는 물속에서 열심히 몸을 움직이고 있어요. 하루하루 더 힘있게 신호를 보내고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 19) AND day_number = 6;

-- 19주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["이번 주 동안 아기는 후각·미각·청각·시각·촉각을 담당하는 뇌 영역이 뚜렷하게 발달하며, 오감을 위한 회로를 하나씩 켜 가고 있어요.", "자주 듣는 엄마·아빠의 목소리를 기억할 수 있는 기반이 만들어지고, 손가락과 발가락에는 단 하나뿐인 지문과 발바닥 무늬가 자리잡았어요."]}'::jsonb, mother_changes_payload = '{"items": ["배는 더 임산부답게 둥글어졌고, 사람들 눈에도 ‘이제 임신한 게 보이는’ 시기가 되어가고 있어요. 하지만 배의 크기와 모양은 키, 몸통 길이, 근육, 이전 임신 경험에 따라 모두 다르게 나타나는 게 정상이에요.", "피로, 수면 문제, 둥근 인대 통증, 다리 경련, 코피, 피부 변화 등 여러 증상이 겹치면서 “몸도 마음도 바쁘고 지치는 시기”가 될 수 있어요."]}'::jsonb, baby_message = '엄마의 목소리와 종종 들려주는 노래가 이제 익숙하게 느껴져요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 19) AND day_number = 7;

-- ===== Week 20 =====
UPDATE content.pregnancy_week_data SET baby_summary = '오늘 아기는 머리부터 발끝까지 약 25cm 전후, 체중은 약 330g 정도로, 귀여운 바나나 크기만큼 자랐어요.; 아직 지방이 많이 쌓이진 않아서 지금 아기를 만난다면 너무 마르고 얇은 느낌이겠지만, 장기와 얼굴·팔·다리는 “작은 사람 아기” 모습에 아주 가까워졌어요.', mother_summary = '자궁은 임신 전보다 두 배 이상 커져서, 자궁의 끝부분이 배꼽 근처까지 올라와 있어요.; 이 시점에 평균적으로 약 4.5kg 정도 체중이 늘고, 배가 둥글게 나오면서 배꼽이 납작해지거나 약간 튀어나오는 느낌을 받을 수 있어요.', updated_at = timezone('utc', now()) WHERE week_number = 20;

-- 20주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["오늘 아기는 머리부터 발끝까지 약 25cm 전후, 체중은 약 330g 정도로, 귀여운 바나나 크기만큼 자랐어요.", "아직 지방이 많이 쌓이진 않아서 지금 아기를 만난다면 너무 마르고 얇은 느낌이겠지만, 장기와 얼굴·팔·다리는 “작은 사람 아기” 모습에 아주 가까워졌어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁은 임신 전보다 두 배 이상 커져서, 자궁의 끝부분이 배꼽 근처까지 올라와 있어요.", "이 시점에 평균적으로 약 4.5kg 정도 체중이 늘고, 배가 둥글게 나오면서 배꼽이 납작해지거나 약간 튀어나오는 느낌을 받을 수 있어요.", "자궁이 위와 장을 위로 밀어 올리면서 소화불량·속쓰림·복부 팽만감도 더 잘 느껴질 수 있어요."]}'::jsonb, baby_message = '아기는 점점 더 세심하게 세상을 느끼고 있어요. 나만의 무늬와 나만의 감각으로, 엄마 곁에서 살아갈 준비를 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 20) AND day_number = 1;

-- 20주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 오늘도 양수 속에서 몸을 비틀고, 차고, 돌고, 주먹을 쥐었다 폈다 하며 운동 신경과 균형감각을 열심히 연습하고 있어요.", "엄마 입장에서 느껴지는 태동은 비눗방울이 톡톡 터지거나, 나비가 배 속에서 살랑거리는 듯한 느낌으로 다가올 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 커지고 인대와 근육이 늘어나면서, 아랫배가 당기거나 묵직한 느낌이 전보다 더 자주 올라올 수 있어요.", "혈액량이 크게 증가하고 호르몬 변화까지 겹쳐, 갑자기 일어날 때 어지럽거나 숨이 조금 차는 느낌도 흔하게 나타날 수 있어요."]}'::jsonb, baby_message = '아기는 우리 여정의 딱 절반까지 왔어요. 이제부터는 남은 절반을 함께 걸어가요. 아기도, 엄마 몸도, 쉼 없이 자라고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 20) AND day_number = 2;

-- 20주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 미뢰(맛봉오리)는 이미 뇌와 연결되어 있어, 엄마가 먹은 음식의 분자가 양수로 스며들면 그 맛을 살짝 느껴볼 수 있어요.", "연습이기는 하지만, 아기는 양수를 삼키고, 다시 소화시키는 과정을 통해 소화계와 맛에 대한 경험을 동시에 쌓고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["소화기관이 자궁에 눌리고, 장 움직임이 느려져 변비와 복부 팽만감, 가스가 더욱 쉽게 생길 수 있는 시기예요.", "변비가 오래 지속되면 치질이 생기거나 악화되기도 해서, ‘배변 패턴’ 자체를 돌봐줄 필요가 있어요."]}'::jsonb, baby_message = '엄마가 오늘 무엇을 먹는지, 양수의 변화로 작지만 함께 느껴보고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 20) AND day_number = 3;

-- 20주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 피부는 아직 얇고 연약하지만, 온몸을 감싸는 태지와 가는 솜털(라누고)이 보호막처럼 덮여 양수 속 자극으로부터 지켜주고 있어요.", "이 태지와 솜털은 나중에 태어날 때 미끄럽게 산도를 통과하는 데도 도움을 줄 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["배와 가슴 주변 피부가 빠르게 늘어나면서, 당김과 가려움을 느끼기 쉬운 시기예요.", "복부에는 임신선이라 불리는 흑선(linea nigra)이 배꼽에서 치골까지 짙게 그어질 수 있고, 튼살이 옅은 분홍색 또는 붉은 선으로 나타날 수 있어요.", "얼굴에는 갈색 반점이나 기미(‘임신의 가면’)가 생기고, 피부가 더 기름지고 번들거리는 느낌이 들 수 있어요."]}'::jsonb, baby_message = '아가는 나름의 보호막을 두르고 있어요. 엄마 피부가 늘어나고 당기는 것처럼, 아가도 나갈 준비를 하고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 20) AND day_number = 4;

-- 20주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 깨어 있을 때는 비틀고, 차고, 돌며 활발히 움직이고, 조용할 때는 잠을 자는 시간이 점점 뚜렷해지고 있어요.", "연구에 따르면, 심박수와 눈·입 움직임 패턴에서 수면–각성 주기와 REM 수면과 비슷한 양상이 관찰되기 시작하는 시기예요."]}'::jsonb, mother_changes_payload = '{"items": ["배가 앞으로 더 나오면서 허리와 골반에 부담이 쌓여, 허리 통증과 골반 주변 불편감이 심해지기 쉬워요.", "한밤중 다리·종아리에 갑작스럽게 쥐가 나거나, 자다가 깨는 다리 경련을 경험할 수 있어요."]}'::jsonb, baby_message = '아가는 이제 잠자는 시간대와 활동하는 시간대가 생겼어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 20) AND day_number = 5;

-- 20주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["20주 전후에는 초음파를 통해 아기의 심장, 뇌, 신장, 팔다리, 성기 등 장기의 구조와 발달 상태를 자세히 확인해요."]}'::jsonb, mother_changes_payload = '{"items": ["이 시기에는 AFP 검사, 양수검사 등의 기형아 검사가 권유되기도 하고, 필요 시 추가 검사를 결정하게 돼요.", "백일해 예방접종을 16–32주 사이, 특히 20주 전후에 임신부에게 권장하는데, 엄마가 만든 항체가 태반을 통해 아기에게 전달되어 생후 8주 전까지 아기를 보호해줘요.", "혹시라도 20주 이후부터 자궁 수축이 강하게 느껴지거나, 주기적으로 느껴진다면 의료진에게 연락해야 합니다."]}'::jsonb, baby_message = '아가는 병원에서 자세히 들여다보는 날이에요. 엄마가 걱정되기도 하겠지만, 함께 잘 확인하고, 함께 안심할 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 20) AND day_number = 6;

-- 20주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["20주인 지금, 아기는 약 25cm 전후, 270–300g 정도로 자라, 바나나나 파파야 크기와 비슷한 길이와 무게를 가진 작은 사람 아기로 성장해 있어요.", "아기의 움직임은 비눗방울처럼 살랑이던 초기 태동에서, 점점 더 규칙적이고 의미 있는 “리듬”을 가진 움직임으로 변해가고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 중반을 지나면서, 심한 피로와 입덧은 어느 정도 가라앉고, 대신 배의 묵직함·허리 통증·가벼운 숨가쁨 같은 새로운 불편감들이 자리를 잡기 시작해요.", "몸의 선과 피부, 머리카락, 체중까지 많은 변화가 한꺼번에 찾아와, ‘예전의 나’와 ‘지금의 나 사이’에서 어색함과 자존감의 흔들림을 느낄 수도 있는 시기예요."]}'::jsonb, baby_message = '아가는 우리 여정의 절반을 지나왔어요. 이제 남은 절반도, 함께 천천히 걸어가요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 20) AND day_number = 7;

-- ===== Week 21 =====
UPDATE content.pregnancy_week_data SET baby_summary = '오늘 아기는 머리부터 발끝까지 약 27.4–28cm 정도, 망고 정도 크기로 자랐고, 몸무게는 약 390g, 이제는 태반보다 더 무겁게 성장한 시기예요.; 피부는 아직 얇고 주름져서 혈관이 비쳐 붉게 보이지만, 그 안에서는 표피와 진피가 뚜렷이 나뉘고, 피하 지방이 차곡차곡 쌓일 준비를 하고 있어요.', mother_summary = '21주는 임신 후반기의 시작, 몸도 마음도 ‘절반’을 본격적으로 맞이하는 시기예요.; 자궁은 배꼽을 지나 위쪽으로 올라와 있고, 겉으로 봐도 임신한 배가 확실히 드러나 ‘이제 정말 임산부 배구나’ 하는 실감이 더 커져요.', updated_at = timezone('utc', now()) WHERE week_number = 21;

-- 21주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["오늘 아기는 머리부터 발끝까지 약 27.4–28cm 정도, 망고 정도 크기로 자랐고, 몸무게는 약 390g, 이제는 태반보다 더 무겁게 성장한 시기예요.", "피부는 아직 얇고 주름져서 혈관이 비쳐 붉게 보이지만, 그 안에서는 표피와 진피가 뚜렷이 나뉘고, 피하 지방이 차곡차곡 쌓일 준비를 하고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["21주는 임신 후반기의 시작, 몸도 마음도 ‘절반’을 본격적으로 맞이하는 시기예요.", "자궁은 배꼽을 지나 위쪽으로 올라와 있고, 겉으로 봐도 임신한 배가 확실히 드러나 ‘이제 정말 임산부 배구나’ 하는 실감이 더 커져요.", "지금까지 대략 4.5–6.5kg 정도 체중이 늘어 있을 수 있고, 앞으로는 주당 약 0.5kg 내외로 조금씩 더해질 수 있어요."]}'::jsonb, baby_message = '아가는 이제 태반보다 더 무거운 작은 사람이 되었어요. 절반의 시간만큼, 아가도 많이 자랐지요?', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 21) AND day_number = 1;

-- 21주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 온몸은 복숭아 표면 같은 솜털로 덮여 있는데, 이 부드러운 털은 체온을 일정하게 유지하게 도와줄 뿐 아니라, 아기가 움직일 때 미세한 진동을 만들어 성장 자극을 준다고 여겨져요.", "피지선에서 분비되는 하얗고 왁스 같은 태지가 피부를 덮으면서, 양수 속에서 피부를 유연하게 지키는 보호막 역할을 해요."]}'::jsonb, mother_changes_payload = '{"items": ["배와 가슴 피부가 빠르게 늘어나면서, 당김·건조함·가려움이 더 두드러질 수 있어요.", "이때 피부 표면 아래 작은 찢어짐이 생기며 튼살이 나타나기 시작하는데, 임신선(흑선)처럼 사라지는 선이 아니라, 옅어지더라도 어느 정도 흔적이 남는 ‘몸의 기록’이 되기도 해요.", "얼굴에는 기미나 ‘임신의 가면’이 보일 수 있고, 피부가 더 기름지거나 여드름이 잘 나는 느낌을 받을 수도 있어요."]}'::jsonb, baby_message = '아가는 나만의 작은 코트를 입고 있어요. 솜털과 태지가 아가를 포근히 감싸 주듯, 엄마 마음도 언제나 아가를 감싸주고 있다는 걸 느껴요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 21) AND day_number = 2;

-- 21주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 입 안에는 어른보다 더 많은 미뢰 봉우리가 있어, 엄마가 먹는 음식에 따라 살짝 달라지는 양수의 맛을 민감하게 느끼기 시작해요.", "엄마가 다양한 음식을 먹을수록 양수의 맛도 미세하게 변해, 아기가 뱃속에서 여러 가지 맛에 노출될 수 있고, 이는 출생 후 식습관에도 영향을 줄 수 있는 것으로 여겨져요. (1)(3)(8)(9))"]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 위와 장을 눌러 소화가 느려지고, 변비·복부팽만·가스가 더욱 쉽게 생길 수 있어요.", "위가 눌리고 식도 괄약근이 느슨해져 속쓰림·소화불량을 경험하는 경우도 많고, 무엇을 먹느냐에 따라 증상이 달라질 수 있어요."]}'::jsonb, baby_message = '엄마가 먹는 음식의 작은 맛 변화는 아가에겐 첫 번째 ‘세상 수업’이에요. 오늘은 어떤 맛과 소리를 나누고 싶나요?', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 21) AND day_number = 3;

-- 21주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["그동안 간과 비장이 맡아오던 적혈구 생성 역할을, 이제 새로 발달한 골수가 점차 넘겨받기 시작하는 시기예요.", "아기의 적혈구 속 헤모글로빈은 태반을 통해 들어온 산소를 온몸에 전달하고, 사용 후 생긴 이산화탄소를 다시 태반으로 실어 보내 엄마 쪽으로 배출하게 돼요."]}'::jsonb, mother_changes_payload = '{"items": ["혈액량과 심장 부담이 늘어나면서, 숨이 더 쉽게 차고, 더 쉽게 피곤해질 수 있어요.", "임신 중에는 철분 요구량과 마그네슘 필요량이 증가해, 부족할 경우 피로감·무기력감, 다리 경련이 더 잘 나타날 수 있어요."]}'::jsonb, baby_message = '아가의 뼛속에서도 조용히 일이 시작되었어요. 보이지 않는 곳에서, 엄마에게서 온 산소를 나눠 받고 또 돌려 보내며, 아가만의 리듬을 만들어가고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 21) AND day_number = 4;

-- 21주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["21주차의 중요한 발달 중 하나는 두개골의 능선(머리뼈 봉합 부위의 융기)이 형성되는 것으로, 우리 문화권에서 ‘숨구멍’이라고 부르는 부위가 출생 후까지 유연하게 열려 있어, 분만 시 머리가 잘 맞추어 지나갈 수 있게 해줘요.", "여자 아기라면 이미 자궁이 형성되어 있고, 평생 사용할 난자들이 난소 안에서 만들어진 상태예요. (3)(8) 남자 아기라면 고환이 형성되었지만 아직 복부 안에 머물러 있고, 앞으로 몇 주~몇 달 동안 서서히 음낭으로 내려오게 됩니다."]}'::jsonb, mother_changes_payload = '{"items": ["배가 더 커지면서 허리·골반 통증, 아랫배 당김, 묵직한 느낌이 잦아질 수 있어요.", "피부 속 작은 찢어짐으로 생기는 튼살은 점차 눈에 띄게 될 수 있고, 반지·속옷·팔찌 등이 점점 더 꽉 끼는 느낌을 줄 수 있어요."]}'::jsonb, baby_message = '아가는 벌써 나만의 방식으로 아주 먼 날까지 이어질 성별의 씨앗을 품고 자라나고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 21) AND day_number = 5;

-- 21주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["21주 아기는 발로 차고, 몸을 회전하고, 잡고·빨기 동작을 하며 매우 활발하게 움직이는 시기예요.", "배를 손바닥으로 아주 부드럽게 눌렀다가 떼면, 안에서 살짝 밀어내는 듯한 반응이 느껴질 수 있는데, 이는 태아의 반사와 조정된 움직임이 발달하고 있다는 신호예요."]}'::jsonb, mother_changes_payload = '{"items": ["배가 더 앞으로 나오고 관절이 느슨해지면서, 무게 중심이 바뀌어균형 잡기 어려운 느낌이 생길 수 있어요.", "다리의 정맥에는 자궁이 주는 압력과 호르몬 영향이 더해져 정맥류·부종이 나타나기 쉬운 시기라, 다리에 피로와 무거움을 느끼기 쉽습니다."]}'::jsonb, baby_message = '엄마가 조심스럽게 톡 두드리면, 아가도 안에서 살짝 톡 대답해요. 아직은 작은 반사에 가깝지만, 이건 분명 엄마와 아가만 아는 비밀스러운 대화예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 21) AND day_number = 6;

-- 21주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["연구에 따르면, 태아의 신경계는 적어도 임신 24–25주 이전까지는 통증을 경험할 만큼 발달하지 않은 상태로 여겨져요. (3) -", "오늘도 아기는 하루 12–14시간 정도를 자는 것으로 추정되고, 깨어 있는 시간엔 움직이고, 태동으로 엄마에게 자신의 존재를 꾸준히 알려주고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["배는 더 단단하고 묵직하게 느껴지고, 밤에는 아기가 깨어 움직이는 패턴 때문에 깊은 잠을 자기가 어려울 수 있어요.", "허리·골반 통증, 다리 경련, 부종, 속쓰림·변비·가려움 등 여러 증상이 동시에 존재할 수 있어, “조금만 움직여도 힘들다”는 생각이 드는 날도 늘어날 수 있어요."]}'::jsonb, baby_message = '아가는 아직 ‘아프다’는 감각을 다 알지는 못하지만, 엄마가 아가를 지키기 위해 얼마나 조심스럽게 하루하루를 보내는지는 느낄 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 21) AND day_number = 7;

-- ===== Week 22 =====
UPDATE content.pregnancy_week_data SET baby_summary = '22주 태아는 머리부터 발끝까지 약 28cm, 출생 시 예상 키의 절반 정도에 이르렀고, 몸무게는 약 430–475g 정도로 자란 상태예요.; 평균 길이는 고구마 크기에요.', mother_summary = '자궁은 이제 배꼽 위 약 1인치 정도까지 올라와 있어서, 옷차림에 따라 확실한 아기 배로 보이기도 하고, 넉넉한 옷을 입으면 살짝 감춰지기도 해요.; 기저부 높이는 평균적으로 약 20–24cm 정도로 측정되고, 매 진찰 때 이 수치를 보며 아기의 성장과 자궁 크기를 함께 확인해요.', updated_at = timezone('utc', now()) WHERE week_number = 22;

-- 22주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["22주 태아는 머리부터 발끝까지 약 28cm, 출생 시 예상 키의 절반 정도에 이르렀고, 몸무게는 약 430–475g 정도로 자란 상태예요.", "평균 길이는 고구마 크기에요.", "이제부터는 키가 크는 속도보다 체중이 늘어나는 속도가 더 빨라지기 시작해, 앞으로 지방이 차오르며 체중이 훌쩍 늘어날 준비를 하고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁은 이제 배꼽 위 약 1인치 정도까지 올라와 있어서, 옷차림에 따라 확실한 아기 배로 보이기도 하고, 넉넉한 옷을 입으면 살짝 감춰지기도 해요.", "기저부 높이는 평균적으로 약 20–24cm 정도로 측정되고, 매 진찰 때 이 수치를 보며 아기의 성장과 자궁 크기를 함께 확인해요.", "22주쯤에는 하루 약 300kcal 정도를 추가로 섭취하면서, 주당 약 0.5kg 정도의 느리고 꾸준한 체중 증가를 권장하는 경우가 많아요."]}'::jsonb, baby_message = '아가는 지금 고구마만 한 작은 사람이에요. 키는 어느 정도 만들어졌고, 이제부터는 엄마가 보내주는 영양으로 포동포동 살을 찌워볼게요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 22) AND day_number = 1;

-- 22주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["22주 아기는 이제 신생아 모습과 거의 비슷한 얼굴과 몸 형태를 가지고 있지만, 아직 피하지방이 부족해서 피부에 주름이 많고 마른 편이에요. 앞으로 지방이 늘어나 점점 통통하고 포동포동한 아기다운 모습이 될 예정이에요.", "머리에는 얇은 아기 머리카락이 보이기 시작했고, 눈썹과 속눈썹도 어느 정도 자라 있지만, 색소가 덜 들어가서 부드럽고 옅은 솜털처럼 보일 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["배·허벅지·가슴 피부가 빠르게 늘어나면서, 미세한 찢어짐이 생겨 보이는 튼살이 더욱 눈에 띄기 시작할 수 있어요. 출산 후 옅어지긴 하지만 완전히 사라지지 않는 경우가 많아서, 일종의 “임신의 흔적”으로 남기도 해요.", "배 가운데의 임신선이 더 진해 보일 수 있고, 얼굴에는 ‘임신의 가면(기미)’과 어두운 갈색 반점이 생기거나, 피부가 더 기름지고 여드름이 쉽게 날 수도 있어요."]}'::jsonb, baby_message = '아가는 지금 신생아랑 거의 비슷하게 생겼지만, 아직은 조금 말라 있고 주름도 많아요. 그래도 엄마가 천천히 채워줄 살과 온기를 기다리는 중이랍니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 22) AND day_number = 2;

-- 22주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["22주 아기는 엄마 몸 안의 심장 박동·호흡·장 소리뿐 아니라, 자궁 밖에서 들려오는 소리·리듬·멜로디에 점점 더 민감하게 반응해요.", "특히 엄마의 목소리는 태아가 가장 선명하게 들을 수 있는 소리라서, 지금 엄마가 들려주는 말과 노래가 나중에 태어난 뒤 아기를 달랠 때 큰 힘이 될 수 있다는 연구 결과도 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 2분기라고 해도 피로와 수면 문제는 계속될 수 있고, 배가 커지고 아기가 밤에 활발히 움직이면서 자주 깨거나, 누운 자세가 불편해지기도 해요.", "몸 안 혈액량과 대사량이 증가하면서 더 덥고, 뜨거운 느낌·땀 증가·어지러움이 쉽게 나타날 수 있어요."]}'::jsonb, baby_message = '아가는 요즘 엄마 목소리와 노랫소리를 조용히 마음에 저장하고 있어요. 나중에 세상이 낯설고 무서울 때, 오늘의 이 목소리가 아가를 다시 진정시켜 줄 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 22) AND day_number = 3;

-- 22주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["태아의 미각이 발달하면서, 엄마가 먹는 음식에 따라 양수의 맛이 달라지고, 아기는 양수를 삼키며 다양한 맛 자극을 경험해요.", "엄마가 신선한 과일·채소와 건강한 식단을 먹을수록, 아기는 긍정적인 맛 경험을 하게 되고, 이는 나중에 아기가 어떤 음식을 잘 받아들이는지에도 영향을 줄 수 있다고 알려져 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 22주에는 자궁이 장을 압박하고, 호르몬이 장운동을 느리게 만들어 변비가 매우 흔하게 나타나요.", "속쓰림·소화불량 또한 자주 동반되고, 특히 맵고 기름진 음식·튀김·탄산·카페인 등이 증상을 악화시킬 수 있어요."]}'::jsonb, baby_message = '엄마가 오늘 먹은 과일 한 조각, 따뜻한 국 한 숟가락도 아가에겐 세상의 맛이에요. 엄마가 사랑으로 고른 음식들이 아가의 ‘좋아하는 맛 리스트’를 만들어 줄지도 몰라요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 22) AND day_number = 4;

-- 22주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["22주에는 양수의 양이 충분히 많아져 아기가 손발을 자유롭게 움직이고, 몸의 방향을 자주 바꾸며, 온 공간을 누비듯 움직이고 있어요.", "이제는 임산부가 배 위에 손을 얹으면, 엄마뿐 아니라 다른 사람들도 태동을 느낄 수 있을 정도로 아기의 움직임이 힘차고 분명해진 시기예요."]}'::jsonb, mother_changes_payload = '{"items": ["체액 증가와 자궁의 압박으로 발·발목·다리 부종이 흔하게 나타나고, 하반신 혈액순환이 원활하지 않으면 다리가 무겁고 욱신거리는 느낌이 들 수 있어요.", "밤에 누워 있을 때 다리 경련(쥐)이 자주 생길 수 있고, 체중 증가·부종·전해질 불균형이 함께 원인이 되기도 해요."]}'::jsonb, baby_message = '아가는 지금 양수 속에서 자유롭게 이리저리 헤엄치고 있어요. 엄마가 배를 쓰다듬으면, 아가도 안에서 ‘나 여기 있어요’ 하고 힘차게 대답해 보고 싶어져요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 22) AND day_number = 5;

-- 22주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 잇몸 아래에서는 첫 번째 젖니(유치)가 서서히 만들어지기 시작했어요. 이 젖니들은 생후 6–9개월쯤 잇몸 위로 올라오게 되고, 그 뒤를 이을 영구치의 기반도 이미 만들어지는 중이에요.", "아기는 엄마의 혈류에서 항체를 전달받으며 면역 체계를 만들어 가고 있고, 이는 출생 후 감염을 이겨내는 힘이 되어줘요."]}'::jsonb, mother_changes_payload = '{"items": ["유방은 임신 후기와 출산 후 모유 수유를 준비하면서 더 커지고 묵직해지며, 피부가 늘어나 불편감을 느낄 수 있어요.", "유륜 주변의 작은 돌기인 몽고메리 분비선이 더 도드라져 보이는데, 나중에 유분을 분비해 유두·유륜을 보호하고, 항균·윤활 역할을 하는 중요한 부분이에요.", "유선으로 가는 혈류가 증가하면서 피부 아래 푸른 정맥이 더 뚜렷하게 보일 수 있는데, 이는 수유를 위한 준비 과정으로 자연스러운 변화예요."]}'::jsonb, baby_message = '아가의 잇몸 아래에서는 벌써 첫 이들이 자라고 있어요. 지금은 잘 보이지 않지만, 언젠가 지금 만들고 있는 이 젖니를 보여줄 날이 올 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 22) AND day_number = 6;

-- 22주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["22주 아기는 양수를 마시고 오줌을 누며, 양수 순환과 장·신장 기능 발달에 참여하고 있고, 양수 속에서 팔·다리·귀·얼굴을 만지며 촉각과 협응력을 키워가요.", "엄마의 목소리·음악·생활 소리에 반응하며 움직임이 달라질 수 있어, 이 시기는 엄마의 소리와 행동에 따라 아기가 반응하는 걸 느끼기 좋은 태교의 때이기도 해요."]}'::jsonb, mother_changes_payload = '{"items": ["손과 손목이 붓기 쉬워 손목터널증후군이 생기기 쉬운데, 특히 컴퓨터 작업·스마트폰 사용 등 손목을 반복적으로 쓰면 저림·찌릿함·감각둔화가 심해질 수 있어요.", "에스트로겐과 프로게스테론이 여전히 높은 상태라 감정기복이 심해지고, 몸의 불편함·수면 부족·소화 문제까지 겹치면“몸도 마음도 버거운 느낌”이 드는 날이 많아질 수 있어요."]}'::jsonb, baby_message = '엄마가 웃을 때, 숨을 고를 때, 부드럽게 쓰다듬을 때, 아가는 양수 속에서 작은 움직임으로 대답하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 22) AND day_number = 7;

-- ===== Week 23 =====
UPDATE content.pregnancy_week_data SET baby_summary = '임신 23주 태아는 머리부터 발끝까지 약 12.0–12.1인치(약 30cm 안팎)로, 자몽 크기 정도에 해당하고, 몸무게는 약 30cm (약 450–650g) 정도로 자랐어요.; 22주 때 “이제부터는 살을 붙일 준비를 하고 있다”고 했는데, 23주에 들어서면서는 정말로 키보다 ‘무게’가 더 빠르게 늘어나는 시기로, 앞으로 지방이 빠르게 축적되며 점점 더 통통하고 아기다운 모습이 되어갑니다.', mother_summary = '자궁저 높이가 치골에서 자궁 상단까지 약 20–25cm 정도로 측정되며, 이는 점점 커지는 아기와 양수, 태반의 크기를 그대로 반영해요.; 자궁의 무게는 약 1.5kg 정도까지 늘어나 있고, 임신 전보다 대략 5–6kg 정도 체중이 증가해 있을 수 있으며, 한 주에 약 250–300g 정도씩 꾸준히 늘어나는 경우가 많습니다.', updated_at = timezone('utc', now()) WHERE week_number = 23;

-- 23주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["임신 23주 태아는 머리부터 발끝까지 약 12.0–12.1인치(약 30cm 안팎)로, 자몽 크기 정도에 해당하고, 몸무게는 약 30cm (약 450–650g) 정도로 자랐어요.", "22주 때 “이제부터는 살을 붙일 준비를 하고 있다”고 했는데, 23주에 들어서면서는 정말로 키보다 ‘무게’가 더 빠르게 늘어나는 시기로, 앞으로 지방이 빠르게 축적되며 점점 더 통통하고 아기다운 모습이 되어갑니다."]}'::jsonb, mother_changes_payload = '{"items": ["자궁저 높이가 치골에서 자궁 상단까지 약 20–25cm 정도로 측정되며, 이는 점점 커지는 아기와 양수, 태반의 크기를 그대로 반영해요.", "자궁의 무게는 약 1.5kg 정도까지 늘어나 있고, 임신 전보다 대략 5–6kg 정도 체중이 증가해 있을 수 있으며, 한 주에 약 250–300g 정도씩 꾸준히 늘어나는 경우가 많습니다.", "커진 자궁과 혈액량 증가는 골반 속 정맥을 압박해 허벅지·종아리·외음부 주변에 정맥류가 생기기 쉬운 상태를 만들고, 푸르고 꼬불꼬불한 혈관이 도드라져 보일 수 있어요."]}'::jsonb, baby_message = '아가는 지난주보다 더 무거운 작은 자몽이 되었어요. 이번 주에도 열심히 살을 찌워볼게요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 23) AND day_number = 1;

-- 23주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["23주에는 태아의 뇌 신경세포가 빠르게 성장하고 인지 기능이 활발해지면서, 엄마의 감정 상태에 따라 움직임이 달라지는 모습이 관찰된다고 알려져 있어요.", "이제 아기는 엄마 혈액 속의 음식 성분과 자극을 어느 정도 “구별”하는 단계에 있으며, 미각과 후각, 뇌 발달이 함께 이루어지면서 엄마가 어떤 하루를 보냈는지, 몸의 리듬과 감정의 파동을 몸으로 느끼고 있는 중입니다."]}'::jsonb, mother_changes_payload = '{"items": ["‘임신 뇌(브레인 포그)’라고 불리는 건망증·집중력 저하는 수면 부족·호르몬 변화·스트레스 등이 복합적으로 작용해 나타나는 증상으로, “왜 이렇게 깜빡깜빡하지?” 느끼는 것 자체가 아주 흔한 경험이에요.", "에스트로겐·프로게스테론과 신체 변화가 겹치면서, 행복·설렘과 동시에 두려움·불안·짜증·눈물이 뒤섞인 복잡한 감정을 느끼는 것도 자연스러운 과정입니다."]}'::jsonb, baby_message = '엄마가 숨을 고르고 웃으면, 아가도 양수 속에서 살짝 힘을 빼고 흔들리며 같이 쉬어요. 엄마의 하루가 곧 아가의 하루예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 23) AND day_number = 2;

-- 23주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["23주 아기는 엄마가 먹는 음식에 따라 달라지는 양수의 맛을 느끼며, 하루 약 400mL 정도의 양수를 마시고 삼키는 연습을 하는 것으로 추정돼요.", "아기의 소화관에서는 실제 음식 대신 양수가 지나가지만, 연동운동(소화관이 파도처럼 수축·이완하며 내용을 밀어내는 운동)을 시작해 소화 시스템을 본격적으로 연습하고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 장을 눌러 복부 팽만·변비가 심해지기 쉽고, 그 결과 치질(치핵)이 생기거나 악화되기 좋은 시기예요.", "자궁이 위를 밀어 올리고, 식도 괄약근이 느슨해져 속쓰림·소화불량이 쉽게 생기며, 임신 중기 후반으로 갈수록 이런 증상은 더 잦아질 수 있어요."]}'::jsonb, baby_message = '엄마가 오늘 먹은 음식들은 아가에게 작은 파도처럼 다가와요. 달콤함, 담백함, 따뜻함… 아가는 양수를 마시며 엄마의 식탁을 천천히 배워가는 중이에요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 23) AND day_number = 3;

-- 23주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["지금까지 나비가 날갯짓하는 듯한 태동이 느껴졌다면, 23주 무렵부터는 부드러운 발차기·작은 잽·굴러가는 듯한 움직임으로 점점 더 힘 있고 분명한 태동이 느껴지기 쉬워요.", "이제는 배 위에서 아기의 움직임이 겉으로 보일 만큼 커져, 얇은 옷 위로도 ‘불룩’ 하는 미묘한 움직임이 보일 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["지면서 흉곽이 확장되고, 자궁이 위로 자라 횡격막과 폐를 눌러 갈비뼈 통증과 숨가쁨을 느끼기 쉬운 시기예요.", "골반뼈와 인대가 느슨해지고 척추에 부담이 커지면서 요통·골반 통증·다리 저림을 경험할 수 있고, 오래 서 있거나 많이 걸을수록 더 심해질 수 있어요."]}'::jsonb, baby_message = '아가는 예전엔 나비처럼 살랑거렸다면, 이제는 조금 더 힘을 내서 톡톡, 쿵쿵 발로 인사하고 있어요. ‘나 여기 있어요’ 하고 알려주고 싶어져요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 23) AND day_number = 4;

-- 23주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["23주 현재 자궁 안에는 약 0.5L 정도의 양수가 있고, 아기는 이 속에서 자유롭게 방향을 바꾸고 발로 차고 구부렸다 펴며, 더 다양한 자세로 공간을 활용하고 있어요.", "지금은 아직 아기가 움직이기 넉넉한 공간이 남아 있지만, 앞으로 아기가 더 커질수록 이 공간이 점점 좁아지고, 태동의 양상도 조금씩 달라질 수 있습니다."]}'::jsonb, mother_changes_payload = '{"items": ["배 중앙에 세로로 나타나는 어두운 수직선, 흑선(임신선)이 더욱 또렷해질 수 있고, 이는 대부분의 임산부가 임신 중기 즈음 경험하는 흔한 변화예요.", "피부가 늘어나고 체액이 바뀌면서 배·가슴 피부가 건조하고 가렵거나 따끔거릴 수 있고, 얼굴에는 어두운 반점이나 기미가 생기며 피부가 더 기름져 보이기도 합니다."]}'::jsonb, baby_message = '아가는 지금은 아직 양수 속에서 넓게 헤엄칠 수 있지만, 곧 더 통통해지면 이 집이 조금씩 작게 느껴질지도 몰라요. 그러니까 지금 이 자유로운 움직임을 같이 기억해 줘요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 23) AND day_number = 5;

-- 23주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["폐가 여전히 미성숙하지만, 아기가 자궁 안에서 양수를 들이마시는 것처럼 가슴과 횡격막을 움직이며 호흡 연습을 하고 있어요.", "아직 위험하지만, 23주에 태어난 아기는 신생아 중환자실의 집중 치료를 통해 생존할 가능성이 조금씩 생기기 시작하는 주수로 여겨지며, 하루하루 엄마 뱃속에서 머무는 시간이 길어질수록 생존 확률과 후유증 감소 가능성이 더 높아집니다."]}'::jsonb, mother_changes_payload = '{"items": ["유방의 정맥이 더 두드러져 보이고, 유륜은 점점 더 어두워지며, 유륜에 있는 작은 돌기(몽고메리 분비선)가 더 뚜렷해 보일 수 있어요.", "일부 임산부는 유방에서 약간의 초유(진하고 노란빛의 첫 우유)가 새어 나오는 경험을 하는데, 아기가 태어난 뒤 처음 먹게 되는 고단백·항체가 풍부한 소중한 우유예요."]}'::jsonb, baby_message = '아가는 속에서 숨 쉬는 연습을 하며 ‘바깥 세상’에 갈 준비를 조금씩 하고 있어요. 아직은 너무 작아서 조금만 더, 엄마 몸 안에 머무를 수 있으면 좋겠어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 23) AND day_number = 6;

-- 23주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["이번 주 동안 아기는 자몽만 한 크기에서, 키는 조금씩·무게는 훨씬 빠르게 늘어나는 시기로 들어섰고, 지방이 급격히 축적되면서 더욱 통통하고 아기다운 모습에 가까워지고 있어요.", "뇌와 감각, 폐와 소화기관, 췌장까지 쉼 없이 연습과 성숙을 거듭하며, 엄마의 목소리·음악·생활 소리에 맞춰 움직임을 달리하고, 일정한 수면–각성 패턴을 가지기 시작하는 주수이기도 합니다."]}'::jsonb, mother_changes_payload = '{"items": ["임신 전보다 체중이 5–6kg 정도 늘어 있을 수 있는 시점으로, 앞으로도 매주 약 250–300g씩 꾸준히 증가하는 것이 일반적이에요.", "보험·재정·보육 계획 같은 현실적인 고민이 함께 떠오르기 쉽고, 아기를 키우는 데 드는 비용과 삶의 변화에 대한 걱정으로 마음이 무거워지기도 합니다."]}'::jsonb, baby_message = '아가는 살이 조금 더 붙고, 엄마 목소리와 감정에 맞춰 몸을 움직이는 연습을 많이 했어요. 나름의 분주한 하루를 보내고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 23) AND day_number = 7;

-- ===== Week 24 =====
UPDATE content.pregnancy_week_data SET baby_summary = '태아는 머리부터 발끝까지 약 32cm 정도로 자라, 옥수수 크기로 비유되고, 몸무게는 약 600–700g 정도예요.', mother_summary = '24주가 되면 자궁은 무려 축구공 정도 크기로 커져 있고, 자궁의 꼭대기(자궁저)는 배꼽 위까지 올라와 있는 경우가 많아요.; 기저부 높이는 치골에서 자궁 상단까지 약 22–26cm 정도로 측정되며, 의료진은 이 수치를 통해 아기 성장과 자궁 크기를 함께 확인합니다.', updated_at = timezone('utc', now()) WHERE week_number = 24;

-- 24주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["태아는 머리부터 발끝까지 약 32cm 정도로 자라, 옥수수 크기로 비유되고, 몸무게는 약 600–700g 정도예요."]}'::jsonb, mother_changes_payload = '{"items": ["24주가 되면 자궁은 무려 축구공 정도 크기로 커져 있고, 자궁의 꼭대기(자궁저)는 배꼽 위까지 올라와 있는 경우가 많아요.", "기저부 높이는 치골에서 자궁 상단까지 약 22–26cm 정도로 측정되며, 의료진은 이 수치를 통해 아기 성장과 자궁 크기를 함께 확인합니다.", "임신 전과 비교하면 평균 6–7kg 정도 체중이 늘어 있을 수 있어요."]}'::jsonb, baby_message = '아가는 이제 옥수수만큼 자랐어요. 지난주보다 몸무게도 조금 더 무거워졌고, 더 포동포동해질 거예요. 엄마의 하루가 곧 아가의 몸을 만드는 재료가 된다고 생각해 주세요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 24) AND day_number = 1;

-- 24주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 피부는 여전히 얇고 약간 투명하지만, 작은 모세혈관이 점점 더 많이 형성되면서 반투명하던 피부가 점차 불투명해지고, 신선한 분홍색 빛을 띠기 시작해요.", "피부는 아직 쭈글쭈글하지만, 지난 주와 마찬가지로 몸 속 지방이 축적되기 시작하면서 앞으로 더 팽팽하고 탄탄해질 준비를 하고 있고, 출생 직전까지 체중 증가를 위해 지방 조직이 꾸준히 발달합니다."]}'::jsonb, mother_changes_payload = '{"items": ["호르몬 변화·피지 분비 증가·혈류 증가가 합쳐져 얼굴·등·가슴에 여드름·트러블이 생기기 쉽고, T존이 번들거리거나 모공이 도드라져 보일 수도 있어요.", "호르몬 변화로 멜라닌 생성이 증가하면서 얼굴·팔·이마·윗입술 등에 기미가 생기거나 진해질 수 있고, 배·가슴·허벅지에는 튼살이 더 또렷해질 수 있습니다."]}'::jsonb, baby_message = '아가의 피부는 이제 조금씩 분홍빛이 돌고, 얼굴 위 털이 아직은 연필로 스케치한듯 희미하지만, 엄마가 아가를 품는 동안 조금씩 선명해질 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 24) AND day_number = 2;

-- 24주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 폐에서 가장 작은 끝 가지에 있는 호흡낭(폐포)들이 성장하고 분지하면서, 산소와 이산화탄소 교환을 위한 표면적을 더 많이 확보해 가는 단계에 들어요.", "폐 안에는 작은 공기주머니가 호흡 시 계속 열려 있도록 도와주는 계면활성제가 나타나기 시작하지만, 아직 양과 기능이 충분히 성숙한 상태는 아니어서 “연습 중”이라고 보는 것이 맞아요."]}'::jsonb, mother_changes_payload = '{"items": ["아기는 숨쉬기 연습을 하고 있지만, 엄마는 자궁이 계속 위로 자라면서 눌러, 폐가 잘 확장되지 않아 가벼운 숨가쁨·호흡곤란·가슴 답답함을 느끼기 쉬운 시기예요.", "산소 요구량이 증가하고, 프로게스테론이 호흡 중추에 영향을 미쳐 “예전보다 숨이 가쁜 느낌”이 쉽게 들 수 있어요."]}'::jsonb, baby_message = '아가의 폐는 아직 미숙하지만, 양수 속에서 숨 쉬는 연습을 계속 하고 있어요. 언젠가 엄마 품 밖에서 숨을 쉴 날을 기다리고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 24) AND day_number = 3;

-- 24주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["감각 체계가 매우 민감해져, 아기는 접촉·움직임·소리 등의 자극에 더 뚜렷하게 반응하고, 특히 큰 소리를 들으면 움찔하는 놀람 반사가 발달합니다.", "양수의 맛을 통해 신맛·쓴맛·짠맛·단맛을 구별할 정도로 미각이 발달했고, 엄마의 혈액을 통해 전달되는 영양분과 맛의 차이를 경험하면서, 어느 정도 “좋아하는 자극”과 “낯선 자극”을 구분하기 시작해요."]}'::jsonb, mother_changes_payload = '{"items": ["24주 전후에는 식욕이 크게 증가해 “예전보다 훨씬 자주 배가 고픈 느낌”이 드는 것이 자연스러운 변화예요.", "일반적인 필요 열량에 비해 임신 2분기에는 하루 약 350kcal 정도가 더 필요할 수 있는데, 이는 대략 공깃밥 한 공기 정도에 해당하는 양이에요."]}'::jsonb, baby_message = '아가는 요즘 좋아하는 소리와 맛이 생기고 있어요. 엄마가 노래를 들려줄 때, 아가는 양수 속에서 작은 움직임으로 ‘좋아!’라고 대답하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 24) AND day_number = 4;

-- 24주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["양수가 더 많아져서 아기는 자궁 안에서 손과 발을 자유롭게 움직이고, 물구나무를 서듯 엉덩이와 발을 위로 올리거나, 가로·비스듬한 자세로 몸의 방향을 수시로 바꾸며 놉니다.", "아직은 자궁 공간이 비교적 넉넉해, 똑바로 선 자세·비스듬한 자세·가로 자세 등 다양한 방향으로 돌 수 있고, 발차기와 잽이 느껴지는 위치에 따라 엄마도 “오늘은 오른쪽 위쪽에서 노는구나” 정도는 짐작할 수 있게 돼요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 더 무거워지고, 릴랙신이라는 호르몬이 인대와 관절을 느슨하게 만들면서, 관절과 인대가 예전보다 쉽게 다칠 수 있는 시기예요.", "허리가 앞으로 과도하게 휘고, 엉덩이를 쭉 내민 “오리걸음” 같은 자세를 오래 유지하면 허리·골반·등에 부담이 커져 통증이 심해질 수 있어요."]}'::jsonb, baby_message = '엄마가 걸으면 아가는 엄마에게 몸을 맡겨 살랑살랑 흔들리고, 엄마가 멈춰 누우면 ‘이제 아가가 움직일 차례구나!’ 하면서 발로 톡톡, 몸을 쭉쭉 뻗어봐요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 24) AND day_number = 5;

-- 24주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 계속 지방을 축적해 나가며, 이 지방은 체온 조절·에너지 저장·대사에 중요한 역할을 하게 되고, 출생 후 체온을 유지하는 데 큰 도움이 됩니다.", "점점 더 통통해지는 만큼, 근육과 관절, 신경도 함께 발달해 태동이 더 힘 있고 규칙적으로 느껴질 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 24주쯤에는 유방이 더 커지고 단단해지며, 유륜과 유두가 더 어두워지고 진해져, 아기가 출생 후 유두를 찾고 빨기 쉬운 모습으로 변화해요.", "커진 자궁이 위와 장·방광을 압박하면서, 소화불량·속쓰림·복부 팽만·변비·치질, 그리고 배뇨 횟수 증가나 가벼운 요실금 증상이 더 뚜렷하게 느껴질 수 있어요."]}'::jsonb, baby_message = '아가는 요즘 몸 구석구석에 작은 담요처럼 지방을 조금씩 덮고 있어요. 나중에 엄마 품 밖으로 나가더라도 너무 춥지 않도록 한층 한층 담요를 덮어야겠어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 24) AND day_number = 6;

-- 24주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["이 한 주 동안 아기는 반투명하던 피부가 점차 불투명해지고 분홍빛을 띠기 시작했고, 지방이 더 많이 쌓이며 통통해졌으며, 머리카락과 눈썹·속눈썹이 한층 더 자라 ‘아기 얼굴’을 거의 완성한 상태가 되었어요."]}'::jsonb, mother_changes_payload = '{"items": ["이제 자궁이 축구공 크기까지 커지고, 체중은 임신 전보다 6–7kg 정도 증가해 있는 경우가 많아, 몸의 변화가 마음에도 더 실감되는 시기예요.", "임신성 당뇨 선별검사와 함께, 나의 식습관·체중·요오드·철분·칼슘 상태에 대해 의료진과 구체적으로 상의하기 좋은 시기예요. 아직 백일해 예방접종을 하지 않았다면, 다음 진료 때 의료진과 접종 시기·필요성을 꼭 상의해 보는 것이 좋습니다."]}'::jsonb, baby_message = '엄마가 웃고, 걱정하고, 쉬는 모든 순간이 아가가 잘 클 수 있도록 돕고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 24) AND day_number = 7;

-- ===== Week 25 =====
UPDATE content.pregnancy_week_data SET baby_summary = '25주 태아는 머리부터 발끝까지 길이 약 34–35cm, 몸무게가 벌써 700–750g 정도로, 단호박 크기와 비슷한 수준까지 자랐어요.; 피부는 아직 주름져 있고 살이 더 붙어야 하지만, 피하지방이 계속 축적되면서 마른 모습에서 부드럽고 통통한 “아기 살”로 변하는 중이에요.', mother_summary = '자궁은 축구공 크기까지 자라서 위로만이 아니라 옆으로도 확장되며, 배꼽 위까지 올라와 배가 확연히 불러 보이는 시기예요.; 체중 증가 폭이 매주 딱 고르게 유지되기보다는, 수분 저류 등으로 들쭉날쭉할 수 있어, 어떤 주는 더 많이, 어떤 주는 덜 느는 느낌이 들기도 합니다.', updated_at = timezone('utc', now()) WHERE week_number = 25;

-- 25주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["25주 태아는 머리부터 발끝까지 길이 약 34–35cm, 몸무게가 벌써 700–750g 정도로, 단호박 크기와 비슷한 수준까지 자랐어요.", "피부는 아직 주름져 있고 살이 더 붙어야 하지만, 피하지방이 계속 축적되면서 마른 모습에서 부드럽고 통통한 “아기 살”로 변하는 중이에요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁은 축구공 크기까지 자라서 위로만이 아니라 옆으로도 확장되며, 배꼽 위까지 올라와 배가 확연히 불러 보이는 시기예요.", "체중 증가 폭이 매주 딱 고르게 유지되기보다는, 수분 저류 등으로 들쭉날쭉할 수 있어, 어떤 주는 더 많이, 어떤 주는 덜 느는 느낌이 들기도 합니다."]}'::jsonb, baby_message = '아가는 지금 단호박만큼 자랐어요. 엄마가 챙겨주는 음식 하나하나가 아가의 볼살과 허벅지 살이 되는 중이에요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 25) AND day_number = 1;

-- 25주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["머리카락이 더 자라서, 이제는 색과 질감을 어느 정도 구분할 수 있을 만큼 뚜렷해지고, 몸 전체에도 솜털과 체모가 늘어나고 있어요.", "눈꺼풀은 위·아래로 분리되어 완전히 형성되었고, 눈을 뜨고 감는 동작을 할 수 있으며, 홍채 색은 아직 보이지 않아도 이미 유전정보에 의해 결정된 상태예요."]}'::jsonb, mother_changes_payload = '{"items": ["배와 유방, 엉덩이 주변 피부가 급격히 늘어나면서 희거나 붉고 보라색을 띠는 임신선이 점점 더 눈에 띌 수 있어요.", "임신 호르몬과 혈류 증가 덕분에 머리카락이 평소보다 덜 빠져, 그 어느 때보다 풍성하고 두껍고 윤기 있어 보이지만, 추가 모발은 출산 후 다시 빠지는 경우가 많습니다."]}'::jsonb, baby_message = '아가의 머리카락은 이제 조금 더 진해지고, 속눈썹도 제법 자랐어요. 언젠가 엄마가 빗겨줄 머리와 마주칠 눈동자를 준비하는 중이에요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 25) AND day_number = 2;

-- 25주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["손과 발, 손가락 구조는 이미 완전히 형성되어 있고, 이제는 주변에 잡히는 것이 있으면 실제로 잡으려는 시도를 해요.", "탯줄이 손 근처로 오면 잡으려 하고, 손가락이나 턱이 입 근처에 닿으면 반사적으로 얼굴을 그쪽으로 돌려 빠는 동작을 하는데, 이는 이후 모유수유 시 젖꼭지를 찾는 능력과 자연스럽게 연결됩니다."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 커지면서 갈비뼈, 등, 가슴, 엉덩이, 배 양옆에 통증이 생기기 쉬운 시기로, 임신 호르몬이 인대와 근육을 이완시키는 것도 통증에 기여해요.", "계속 늘어나는 체중과 배로 척추가 더 휘어지고 등 근육이 긴장해 허리 통증이 심해지기 쉽고, 쌍둥이 임신일수록 이런 통증이 더 흔합니다."]}'::jsonb, baby_message = '아가는 요즘 탯줄을 잡아당겨 보기도 하고, 손가락이 입 근처로 오면 꿀꺽 빨아보려고 해요. 아직은 우연이지만, 모유를 찾는 연습을 미리 하고 있는 셈이죠.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 25) AND day_number = 3;

-- 25주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["활동기에는 발로 차고, 구르고, 몸을 내밀고 뻗는 움직임이 많지만, 휴식할 때는 머리를 숙이고 무릎을 몸 쪽으로 당긴 채 동그랗게 웅크린 자세, 우리가 떠올리는 그 “아기 포즈”로 쉽니다."]}'::jsonb, mother_changes_payload = '{"items": ["임신 주수가 쌓이면서, 자궁이 방광·위·장까지 더 많이 눌러, 소변을 자주 보게 되고 소화불량·속쓰림·복부 팽만·가스를 자주 경험할 수 있어요.", "자궁이 단단해졌다가 다시 풀리는 브릭스톤 힉스 수축(가진통)이 25주 무렵부터 더 자주 느껴질 수 있으며, 이 연습 수축은 보통 자궁경부를 열지 않고 출산 예행연습처럼 작용합니다."]}'::jsonb, baby_message = '아가는 놀 땐 세게 차고, 쉴 땐 몸을 작게 만들어 웅크려요. 언젠가 엄마 품에서 그대로 다시 웅크릴 포즈를, 지금 양수 속에서 자꾸만 연습하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 25) AND day_number = 4;

-- 25주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["심장 박동은 이제 청진기뿐 아니라, 배에 귀를 대어 들을 수 있을 정도로 뚜렷해요.", "청력이 더 발달해 엄마·아빠 목소리와 주변 소리를 듣고, 어떤 음악이나 말소리에 더 강하게 반응하는지 차이가 나타나기도 해요."]}'::jsonb, mother_changes_payload = '{"items": ["혈액량이 최대 50%까지 증가하고 심박수도 빨라져, 갑자기 일어날 때 어지러움이나 ‘심장이 두근거리는 느낌’을 경험하기 쉽습니다.", "얼굴·손·발이 약간 붓는 것은 흔한 수분 저류 현상이지만, 의사는 자간전증 여부를 확인하기 위해 정기적으로 혈압과 부종 양상을 체크해야 해요."]}'::jsonb, baby_message = '아가와 아빠가 배에 귀를 대고 말을 걸면, 아가는 그 소리를 물과 살을 통과해 듣고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 25) AND day_number = 5;

-- 25주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["양수 속에서 더 자주 입을 벌려 양수를 마시고, 소화관을 움직이며 소화기관 훈련을 계속하는 중이에요.", "아기는 스스로 양수에 소변을 보고, 이 소변이 양수의 대부분을 이루며, 양수는 아기를 쿠션처럼 감싸 충격을 줄이고 일정한 온도를 유지해 줍니다."]}'::jsonb, mother_changes_payload = '{"items": ["브락스톤 힉스 수축(가진통)은 자궁이 단단해졌다가 풀리는 느낌으로, 25주 무렵부터 더 자주 느껴질 수 있고, 주수가 늘수록 강도가 조금씩 세질 수 있어요.", "이 가진통은 보통 규칙적이지 않고, 강도가 점점 세지 않으며, 자궁경부를 열지 않는 생리적 현상입니다."]}'::jsonb, baby_message = '아가는 매일 양수를 마시고 소변을 보면서, 몸으로 작은 순환을 만들고 있어요. 언젠가 엄마 품에서 진짜로 할 일들을 준비하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 25) AND day_number = 6;

-- 25주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["단호박·적양배추만 한 크기(34–35cm, 700–750g)까지 자라며 계속 지방을 키워나갔고, 피부는 더 분홍빛·선홍빛을 띠며, 머리카락과 솜털이 늘고, 눈꺼풀이 완전 형성되어 눈을 깜빡입니다,", "손가락으로 탯줄을 잡고, 입 주변 자극에 반응해 빠는 동작을 하며, 동그랗게 웅크려 쉬는 “아기 포즈”를 연습하는 등 우리가 떠올리는 진짜 아기다운 모습에 한 걸음 더 가까워졌어요."]}'::jsonb, mother_changes_payload = '{"items": ["배는 위로만이 아니라 옆으로도 퍼지며, 자궁이 커지면서 갈비뼈·등·골반 통증·다리 경련·부종·속쓰림·변비 같은 증상이 함께 느껴질 수 있어요.", "불편함과 피로, 수면 부족, 출산·육아·직장에 대한 걱정이 겹치면서 감정 기복과 불안이 커질 수 있지만, 많은 임산부가 겪는 매우 자연스러운 반응이에요."]}'::jsonb, baby_message = '아가는 이번 주 동안 더 눈을 깜빡이고, 탯줄을 잡고, 동그랗게 웅크리는 법을 배웠어요. 엄마가 하루하루 버텨 준 덕분에, 아가도 하루하루 성장하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 25) AND day_number = 7;

-- ===== Week 26 =====
UPDATE content.pregnancy_week_data SET baby_summary = '머리부터 발끝까지 약 35–36cm 정도로, 양상추 크기와 비슷하고, 몸무게는 대략 750–900g 정도예요.; 임신 주수는 절반을 훌쩍 넘겼지만, 아기는 지금보다 3배 이상 더 무거워질 예정이고, 앞으로 남은 주수 동안 지방과 근육을 채우며 통통한 몸을 완성해 갈 거예요.', mother_summary = '자궁 저부는 배꼽 위 약 2.5인치 정도까지 올라와 있고, 배는 매주 약 0.5인치씩 계속 커지면서 돌출돼 보여요.; 임신이 진행되면서 무게중심이 앞으로 쏠려 균형 감각이 떨어지고, 예전에는 금방 걸어가던 버스 정류장까지가 지금은 더 힘들고 시간이 오래 걸릴 수 있어요.', updated_at = timezone('utc', now()) WHERE week_number = 26;

-- 26주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["머리부터 발끝까지 약 35–36cm 정도로, 양상추 크기와 비슷하고, 몸무게는 대략 750–900g 정도예요.", "임신 주수는 절반을 훌쩍 넘겼지만, 아기는 지금보다 3배 이상 더 무거워질 예정이고, 앞으로 남은 주수 동안 지방과 근육을 채우며 통통한 몸을 완성해 갈 거예요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁 저부는 배꼽 위 약 2.5인치 정도까지 올라와 있고, 배는 매주 약 0.5인치씩 계속 커지면서 돌출돼 보여요.", "임신이 진행되면서 무게중심이 앞으로 쏠려 균형 감각이 떨어지고, 예전에는 금방 걸어가던 버스 정류장까지가 지금은 더 힘들고 시간이 오래 걸릴 수 있어요."]}'::jsonb, baby_message = '아가는 1kg을 향해 가고 있어요. 앞으로 몇 달 동안 아가는 지금보다 세 배 이상 더 무거워질 거라서, 엄마 배 안은 점점 아가로 꽉 차게 될 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 26) AND day_number = 1;

-- 26주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["폐 속의 폐포가 계속 발달하면서, 태아는 양수를 소량 들이마시고 내쉬는 방식으로 호흡 연습을 하고 있어요.", "이제 콧구멍도 열려 코로 양수를 빨아들이며 호흡을 연습하고, 폐에서는 공기주머니가 붕 뜨고 가라앉을 때 서로 달라붙지 않도록 해주는 계면활성제를 만들어 내기 시작했어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 커지면서 갈비뼈를 위로 밀어내 맨 아래 갈비뼈가 바깥쪽으로 휘어져, 갈비뼈 주변 통증이 잘 생겨요.", "자궁저가 높아지면서 위장과 장기를 위로 압박해, 식후 포만감·속쓰림·구역·트림·복부팽만이 더 쉽게 나타날 수 있습니다."]}'::jsonb, baby_message = '아가는 지금 물 속에서 숨 쉬는 연습을 하고 있어요. 아직은 엄마 배 안에서 더 자라야, 밖에서도 힘껏 숨을 쉴 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 26) AND day_number = 2;

-- 26주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["뇌가 더욱 발달해 지각과 운동을 관장하는 부위가 자라고, 몸 전체를 조금씩 더 잘 컨트롤할 수 있게 돼요.", "깨어 있을 때는 강한 태동이 느껴지고, 잘 때는 움직임이 거의 느껴지지 않아 “갑자기 조용해졌다?” 싶을 때는 아기가 잠들어 있는 경우가 많아요."]}'::jsonb, mother_changes_payload = '{"items": ["피로와 생각할 일이 많아지면서 열쇠를 자주 잃어버리거나, 방금 하려던 일을 잊어버리는 ‘임신 뇌’ 현상을 경험할 수 있어요.", "불안·우울·감정 기복이 함께 느껴질 수 있고, 특히 아기 건강·출산·경제·직장에 대한 걱정이 머릿속을 떠나지 않아 더 피곤하게 느껴질 수 있어요."]}'::jsonb, baby_message = '아가는 이제 낮과 밤, 깨어 있음과 잠드는 연습을 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 26) AND day_number = 3;

-- 26주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["26주 무렵 눈꺼풀이 처음으로 열리기 시작해 눈을 뜨고 주변을 둘러볼 수 있어요.", "빛과 어둠, 단순한 모양까지 구별할 수 있을 정도로 시각 자극을 처리하는 뇌 영역과의 연결이 발달하고, 강한 햇빛이 엄마 배 쪽으로 비치면 태아가 놀라거나 깨어 태동이 증가할 수 있습니다."]}'::jsonb, mother_changes_payload = '{"items": ["태아 성장과 함께 배·가슴·허벅지 피부가 빠르게 늘어나면서 튼살이 나타나거나 더 뚜렷해질 수 있어요.", "튼살 부위나 전체 피부가 가렵고, 에스트로겐 증가로 밤에 잠을 못 이룰 정도의 전신 가려움이 생길 수도 있습니다."]}'::jsonb, baby_message = '아가는 이제 눈을 조금씩 뜨고, 어둡고 밝은 것을 느끼기 시작했어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 26) AND day_number = 4;

-- 26주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["청력은 거의 완전히 발달해, 엄마·아빠의 목소리와 주변 소리를 잘 들을 수 있어요.", "큰 소리에 놀라 움직임이 갑자기 증가하거나, 음악에 맞춰 리듬감 있게 움직이는 모습을 보이기도 하고, 소리에 반응하면 태아의 심박수가 빨라지고 호흡·움직임 패턴이 변하는 것이 관찰됩니다."]}'::jsonb, mother_changes_payload = '{"items": ["혈압이 약간 상승하는 것이 정상 범위 안에서 나타날 수 있지만, 갑작스럽거나 심한 상승은 임신성 고혈압·자간전증의 신호가 될 수 있어 주의가 필요해요. (3)(5)(7)(8)\n얼굴·손·발의 부종은 흔하지만, 갑작스럽고 심한 부기, 체중 급증, 시야 흐림, 깨질 듯한 두통, 갈비뼈 아래 통증이 함께 나타나면 전자간증 의심 소견으로 즉시 의료진에게 연락해야 합니다."]}'::jsonb, baby_message = '아가는 엄마와 아빠 목소리를 들으면서, 이 세상에서 가장 먼저 익숙해질 소리를 미리 저장하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 26) AND day_number = 5;

-- 26주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["입과 입 주변 신경이 발달해 촉감에 매우 민감해지고, 젖을 빠는 데 필요한 ‘빨기’ 동작을 익혀 엄지손가락을 빠는 행동도 보입니다.", "입 주변이나 손가락이 입 근처에 닿으면, 아기는 고개를 그쪽으로 돌려 빠는 동작을 연습하며, 이는 출생 후 모유·젖병을 찾는 능력으로 이어져요."]}'::jsonb, mother_changes_payload = '{"items": ["커진 자궁이 직장을 누르고 장운동이 느려져, 변비가 악화되고 힘주어 배변하는 습관과 함께 치질(항문정맥류)이 생기거나 악화될 수 있어요.", "임신 중에는 잇몸이 붓고 쉽게 피가 나거나 치은염이 생기기 쉬워, 정기적인 치과 검진과 치료가 중요해요."]}'::jsonb, baby_message = '아가는 지금 손가락을 입에 가져다 대고 빨아 보는 연습을 하고 있어요. 아직은 장난 같지만, 언젠가 엄마 품에서 우는 대신 젖을 찾을 수 있게 해주는 연습이에요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 26) AND day_number = 6;

-- 26주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["자궁 안에 몸을 쭉 뻗고 움직일 공간이 있지만, 앞으로 지금보다 3배 이상 더 무거워질 예정이며, 뇌가 더 발달해 수면·각성 패턴을 만들고, 눈꺼풀을 열어 빛과 어둠을 구별해요.", "청력이 거의 완전히 발달해 음악과 목소리에 반응하고, 엄마의 항체를 받아들이며, 입 주변 촉감에 민감해져 빨기·고개 돌리기 연습을 하고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["임산부의 약 60%가 허리 통증을 경험해, 수면이나 일상생활에 어려움을 느낄 수 있고, 자궁이 늘어나면서 옆구리·사타구니 쪽이 찌릿하게 아픈 통증을 겪기도 합니다.", "브랙스턴 힉스 수축(가진통)이 더 자주 느껴지고, 물을 마시거나 자세를 바꾸면 완화되지만, 규칙적이고 강도가 점점 세지면 조산 신호일 수 있어요."]}'::jsonb, baby_message = '아가는 밖으로 나갈 준비를 조금씩 하고 있지만, 아직은 엄마 배 안에서 더 크고 싶어요. 그러니 우리, 조금만 더 같이 견뎌요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 26) AND day_number = 7;

-- ===== Week 27 =====
UPDATE content.pregnancy_week_data SET baby_summary = '임신 27주 아기는 머리부터 발끝까지 약 35~36.6cm, 약 14.25~14.41인치 정도로, 허니듀 멜론·콜리플라워 한 통 크기에 비유돼요.; 몸무게는 약 907g~1kg 전후 정도이고, 앞으로 몇 주 동안 특히 체중이 약 3배 정도까지 크게 증가하면서 자궁 밖에서 생존할 수 있을 만큼 체력과 체지방을 빠르게 채워 갈 예정이에요.', mother_summary = '지금쯤이면 임신 전보다 약 7~10kg 정도 체중이 늘어났을 수 있고, 단태 임신의 전체 권장 체중 증가는 대략 약 11~16kg 정도로 제시돼요.; 자궁저 높이가 올라가고 배가 앞으로 많이 나와 몸의 무게중심이 앞쪽으로 쏠리면서, 걷고 앉고 일어나는 자세가 예전 같지 않고, 가끔은 몸이 “어색하고 서툴다”는 느낌을 줄 수 있어요.', updated_at = timezone('utc', now()) WHERE week_number = 27;

-- 27주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["임신 27주 아기는 머리부터 발끝까지 약 35~36.6cm, 약 14.25~14.41인치 정도로, 허니듀 멜론·콜리플라워 한 통 크기에 비유돼요.", "몸무게는 약 907g~1kg 전후 정도이고, 앞으로 몇 주 동안 특히 체중이 약 3배 정도까지 크게 증가하면서 자궁 밖에서 생존할 수 있을 만큼 체력과 체지방을 빠르게 채워 갈 예정이에요."]}'::jsonb, mother_changes_payload = '{"items": ["지금쯤이면 임신 전보다 약 7~10kg 정도 체중이 늘어났을 수 있고, 단태 임신의 전체 권장 체중 증가는 대략 약 11~16kg 정도로 제시돼요.", "자궁저 높이가 올라가고 배가 앞으로 많이 나와 몸의 무게중심이 앞쪽으로 쏠리면서, 걷고 앉고 일어나는 자세가 예전 같지 않고, 가끔은 몸이 “어색하고 서툴다”는 느낌을 줄 수 있어요."]}'::jsonb, baby_message = '아가는 지금 콜리플라워만 한 크기에 거의 1kg에 가까워졌어요. 앞으로 몇 주 동안은 지금 몸무게의 세 배까지도 자라날 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 27) AND day_number = 1;

-- 27주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["폐포 주변의 혈관 수가 크게 늘어나고, 이 혈관들이 나중에 산소를 흡수하고 이산화탄소를 내보내는 역할을 하게 돼요.", "아직 완전히 성숙하진 않았지만, 27주에 태어난 아기는 인공호흡기 등 의학적 도움을 받으면 생존 가능성이 매우 높을 정도로 폐 기능이 발달한 상태예요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 더 커지면서 위를 위로 밀어 올리고, 프로게스테론이 소화관 운동을 느리게 해 복부 팽만·변비·속쓰림·소화불량이 쉽고 자주 생깁니다.", "위와 식도 사이의 판막이 느슨해져 위산이 역류하기 쉬워져, 매운 음식·기름진 음식·산성 음식·카페인이 많은 음료 후에는 타는 듯한 가슴앓이가 심해질 수 있어요.", "임신이 진행될수록 릴랙신(relaxin) 같은 호르몬이 인대와 관절을 느슨하게 만들어, 발목 삐끗, 허리 삐끗 같은 부상 위험이 커질수 있어요."]}'::jsonb, baby_message = '아가는 지금 숨 쉬는 연습을 매일 하고 있어요. 그래도 아직은 엄마 배 안이 가장 안전한 집이에요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 27) AND day_number = 2;

-- 27주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 뇌는 예전처럼 매끈한 표면이 아니라, 주름이 하나둘 생기는 진짜 ‘아기 뇌’의 모습을 갖춰 가고 있어요.", "뇌뿐 아니라 척수·말초신경으로 이어지는 신경계 전체가 더 정교해지면서, 움직임과 감각 반응, 근육 긴장도(톤)가 점점 더 섬세해집니다."]}'::jsonb, mother_changes_payload = '{"items": ["체중 증가로 좌골신경이 눌리면 허리에서 엉덩이, 다리 뒤쪽으로 이어지는 방사통이 나타날 수 있어요. 엉덩이·허벅지 뒤가 쑤시거나 당길 수 있어요.", "하체 혈관과 근육에 부담이 커지고, 밤에는다리에 쥐(야간 다리 경련)가 잘 나며, 특히 종아리가 번갈아 딱딱해지면서 잠에서 깨는 경험이 많아질 수 있어요."]}'::jsonb, baby_message = '아가의 뇌에는 이제 작은 주름들이 생기기 시작했어요. 몸 전체를 움직이고 느끼는 회로가 점점 더 복잡해지고 있고, 아가도 언젠가 울고 웃을 준비를 차근차근 하는 중이에요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 27) AND day_number = 3;

-- 27주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["눈꺼풀이 열리고 닫히는 기능이 더 정교해져, 아기는 실제로 눈을 뜨고 빛과 어둠, 기본적인 형태를 구별할 수 있을 정도로 시력이 발달해요.", "강한 빛(여름 직사광선, 핸드폰 플래시 등)이 배 쪽으로 비치면 아기가 놀라거나 깨어나 태동이 많아질 정도로 빛에 민감해져요. (8)(9) 다만 일부러 강한 빛을 오래 비추는 건 아기에게 스트레스가 될 수 있으니 피하는 것이 좋아요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 호르몬의 영향으로 머리카락은 두껍고 풍성해지고, 빠지는 양은 줄어들지만, 얼굴·팔·배 등 몸의 털이 더 굵고 많이 나는 느낌을 받을 수 있어요.", "배 가운데 임신선은 더 진해지고, 복부·가슴·허벅지 피부가 빨리 늘어나면서 튼살이 생길 수 있고, 얼굴에는 기미가 생기며, 피부는 모공이 막히기 쉬워져요."]}'::jsonb, baby_message = '아기는 이제 어둠과 빛의 차이를 느끼고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 27) AND day_number = 4;

-- 27주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["27주 아기는 손 움직임이 더 활발해져, 엄지손가락을 빨며 스스로 진정하기도 하고, 이 과정이 뺨과 턱 근육을 강화하는 데 도움을 줍니다.", "엄마가 활동을 멈추고 쉬거나 자려고 할 때 더 활동적인 경향이 있어, 저녁·밤 시간에 아기가 더 많이 차고 구르는 ‘밤샘 말썽쟁이’ 같은 패턴을 보이기도 해요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁과 아기의 무게가 방광을 누르고, 골반저 근육이 이완되면서 기침·재채기·웃을 때 소변이 새는 요실금이 흔해질 수 있어요.", "35세 이상, 과체중, 이전 질식 분만 경험, 가족력, 특정 만성질환이 있는 경우 임신 중 요실금 위험이 더 높고, 출산 후에도 더 오래 지속될 수 있어요."]}'::jsonb, baby_message = '아기는 엄마가 누워 쉬려고 할 때 더 많이 움직이는 모습을 보여요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 27) AND day_number = 5;

-- 27주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["배 안에서 느껴지는 작고 규칙적인 딸꾹딸꾹하는 움직임은 태아의 딸꾹질일 가능성이 크며, 보통 몇 분 정도 지속되고 완전히 정상적인 현상이에요.", "태아는 깨어 있을 때와 잘 때가 점점 더 구분되는 수면·각성 패턴에 적응하고 있으며, 엄마가 쉬려고 할 때 더 활동적인 모습을 보일 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 3분기로 들어가면 산전 진료 간격이 대략 28~36주까지는 2주에 한 번, 이후에는 주 1회 정도로 더 촘촘해지고, 매 방문마다 혈압·체중·소변검사·아기 심장박동 청진·자궁저 높이 측정이 이루어져요.", "지금은 3분기의 문 앞에 서 있는 시기라, 다음 주부터는 “마지막 삼분기”라는 생각이 더 현실감 있게 다가올 수 있어요."]}'::jsonb, baby_message = '아기는 가끔 배 안에서 ‘딸꾹딸꾹’하는 소리를 내는데, 이는 호흡과 연하 연습 과정이에요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 27) AND day_number = 6;

-- 27주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["이르지만 이 시기에 세상으로 나오게 될 시.의학적 도움을 받으면 생존 가능성이 매우 높은 수준까지 폐 기능을 끌어올렸고, 뇌에는 주름이 생기기 시작했으며, 척수·말초신경까지 포함한 신경계 전체가 정교해지면서, 이미 울 수 있을 만큼의 근육 긴장과 엄지 빠는 자기위로까지 연습하고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["지금쯤이면 체중은 임신 전보다 7~10kg 정도 증가해 있고, 전체 임신 기간 동안 권장되는 체중 증가는 대략 11~16kg 정도예요.", "방광·골반저에 가해지는 압력과 근육 이완으로 요실금이 더 잦아질 수 있고, 소화기 압박과 호르몬 변화로 속쓰림·변비·위장 장애도 계속될 수 있는 시기예요.", "다음 주면 본격적인 3분기, 산전 진료 간격이 더 촘촘해지고(대략 2주마다) 아기의 성장과 엄마의 건강을 더 자주 확인하게 되는 단계로 들어가요."]}'::jsonb, baby_message = '아기는 이번 주에 더 무거워지고, 더 똑똑해지고, 더 예민해졌어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 27) AND day_number = 7;

-- ===== Week 28 =====
UPDATE content.pregnancy_week_data SET baby_summary = '임신 28주 아기는 머리부터 발끝까지 약 37~40cm, 몸무게는 약 1kg을 넘기기 시작해서 1,000~1,200g 정도예요.; 큰 가지 정도의 크기로 비유되곤 해요.', mother_summary = '이제 공식적으로 임신 3분기가 시작되면서, 산전 진료 간격이 보통 28~36주까지는 2주마다, 이후에는 주 1회로 더 자주진료를 받아야 하는 경우가 많아요.; 앞으로 몇 주 동안은 아기가 더 빨리 자라기 때문에,엄마가 “와, 내가 정말 임신 막바지구나”를 온몸으로 느낄 만큼 피로감·불편감·통증이 늘어날 수 있어요.', updated_at = timezone('utc', now()) WHERE week_number = 28;

-- 28주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["임신 28주 아기는 머리부터 발끝까지 약 37~40cm, 몸무게는 약 1kg을 넘기기 시작해서 1,000~1,200g 정도예요.", "큰 가지 정도의 크기로 비유되곤 해요."]}'::jsonb, mother_changes_payload = '{"items": ["이제 공식적으로 임신 3분기가 시작되면서, 산전 진료 간격이 보통 28~36주까지는 2주마다, 이후에는 주 1회로 더 자주진료를 받아야 하는 경우가 많아요.", "앞으로 몇 주 동안은 아기가 더 빨리 자라기 때문에,엄마가 “와, 내가 정말 임신 막바지구나”를 온몸으로 느낄 만큼 피로감·불편감·통증이 늘어날 수 있어요."]}'::jsonb, baby_message = '아기는 이제 큰 가지 하나만큼 자랐으며, 몸무게도 1kg을 훌쩍 넘어서고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 28) AND day_number = 1;

-- 28주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["28주부터 3분기 동안 아기의 뇌 무게는 약 3배 정도까지 증가하고, 대뇌 표면에는 더 깊고 복잡한 주름이 생기면서 인지 능력과 감각 처리 능력이 향상돼요.", "청각·후각·촉각은 이미 꽤 발달하여 실제로 기능하고 있고, 시각도 계속 성숙 중이라 빛과 어둠, 일부 형태를 구별할 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁은 이제 배꼽과 명치 사이쯤까지 올라와 흉곽을 밀어 올리고, 심장·폐·위가 함께 눌려 숨이 차고, 속이 더부룩하고, 속쓰림이 잘 생길 수 있어요.", "폐와 횡격막의 공간이 줄어들어 계단만 올라가도 숨이 가쁘고, 조금만 움직여도 “예전보다 훨씬 힘들다”고 느끼기 쉬운 시기예요."]}'::jsonb, baby_message = '아기의 뇌는 지금 세 배를 향해 달려가는 중이에요. 귀와 코, 피부는 이미 바깥세상을 연습하고 있고, 눈도 조금씩 빛과 어둠을 구분해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 28) AND day_number = 2;

-- 28주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["28주 무렵 태아의 폐는 호흡이 가능할 정도로 상당히 발달했지만, 여전히 공기가 아닌 양수를 들이마시고 내쉬는 ‘호흡 연습’을 계속하고 있어요.", "이 과정에서 자주 나타나는 것이 태아 딸꾹질로, 엄마는 배에서 느껴지는 작고 규칙적인 “톡톡”거림으로 이를 느끼게 돼요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 3분기에는 발목·발·손·얼굴에 부종이 흔하게 생기고, 특히 더운 날씨나 오래 서·앉아 있는 날에는 부기가 더 심해질 수 있어요.", "대부분은 임신으로 인한 정상적인 수분 저류지만, 갑작스럽고 심한 붓기, 얼굴·손 부종, 두통·시야 흐림·상복부 통증이 동반되면 자간전증의 신호일 수 있어 꼭 진료가 필요해요."]}'::jsonb, baby_message = '아기가 딸꾹딸꾹 하는 것은 숨 쉬는 연습을 하고 있다는 신호예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 28) AND day_number = 3;

-- 28주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["28주부터 태반을 통해 엄마로부터 항체를 본격적으로 흡수하기 시작하면서, 태아 면역 체계 발달의 첫 번째 큰 단계가 시작돼요.", "이 항체들은 아기가 세상에 나왔을 때 감염으로부터 방어막이 되어 줄 뿐 아니라, 아기 스스로 항체를 만들어 내도록 면역 시스템을 ‘훈련’시키는 역할도 합니다."]}'::jsonb, mother_changes_payload = '{"items": ["탈수, 많이 서 있던 날, 과한 활동, 한 자세로 오래 앉아 있음 등이 브랙스턴 힉스 수축(가진통)을 더 자주 느끼게 하는 요인일 수 있어요.", "이상하게 생생한 꿈, 출산·육아에 대한 불안이 반영된 꿈, 성적인 꿈 등이 자주 나타날 수 있는데, 이는 호르몬 변화와 수면 중단, 임신에 대한 감정이 뒤섞인 자연스러운 현상으로 보고돼요."]}'::jsonb, baby_message = '아기는 요즘 엄마에게서 보이지 않는 방패를 선물 받고 있어요. 엄마가 싸워서 얻은 면역을 조금씩 나누어 받으면서, 세상에 나갈 준비를 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 28) AND day_number = 4;

-- 28주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["28주 아기의 뇌와 자율신경계는 심장 박동, 호흡 운동, 체온 조절 같은 비자발적 기능을 조율하는 힘을 점점 더 키워가고 있어요.", "깨어 있을 때와 잘 때가 구분된 수면 패턴을 가지며, REM 수면(빠른 안구 운동)도 나타나 아기가 꿈을 꾸고 있을 가능성이 있다고 여겨져요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 3분기에는 가슴에서 노란빛 액체(초유, colostrum)가 브라나 옷에 작게 묻어날 수 있어요. 초유는 항체와 영양소가 매우 풍부해 ‘액체 금’이라고 불릴 정도로 아기에게 소중한 첫 모유예요.", "호르몬 변화로 피부 발진·가벼운 두드러기가 생기거나, 코 점막 혈관이 약해져 코피가 더 쉽게 나는 것도 흔한 변화예요."]}'::jsonb, baby_message = '아기는 이제 어느 정도 스스로 숨쉬는 연습을 하고, 심장박동 리듬도 지켜 가며, 잠도 깊게 자고 얕게 자는 패턴을 연습하는 중이에요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 28) AND day_number = 5;

-- 28주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["28주에 태어난 아기는 신생아 중환자실에서 호흡 보조·인큐베이터·집중 치료를 받으면 생존 가능성이 꽤 높은 수준이에요.", "하지만 폐와 면역·체온조절 능력은 여전히 더 성숙해야 하므로, 지금은 “살 수 있다”가 아니라덜 위험하게 살 수 있다”에 가까운 단계예요. 그래서 엄마 배 속에서 조금이라도 더 오래 있는 것이 아기에게는 여전히 가장 큰 보호예요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 후반에는 임신성 당뇨가 발견되기 쉬운 시기로, 비만·임신 전 BMI 30 이상 등은 위험을 높여요.", "임신성 당뇨가 진단되더라도, 많은 경우 식이조절과 운동으로 혈당을 관리할 수 있고, 오히려 식사를 거르면 저혈당·폭식·혈당 변동이 커져 좋지 않기 때문에, “조금씩 규칙적으로 먹는 것”이 중요해요."]}'::jsonb, baby_message = '아기는 12주 뒤에 만나게 될 예정이며, 함께 할 수 있는 만큼 이 안의 시간을 채워 가고 싶어 해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 28) AND day_number = 6;

-- 28주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["가지만 한 크기(약 37~40cm, 1,000~1,200g)로 자라났고, 형태 발달보다 몸무게와 피하지방을 채우는 성장 단계에 들어서 통통하고 매끈한 신생아 모습에 더 가까워졌으며, 청각·후각·촉각·시각·자율신경계를 정교하게 다듬었어요."]}'::jsonb, mother_changes_payload = '{"items": ["28주부터는 아기가 더 크고 힘이 세져 발길질·구르기·돌기가 더 뚜렷해지고, 파트너도 배 위에 손을 얹으면 아기의 움직임을 느낄 수 있어요.", "3분기에는태동횟수를 시작하는 것이 권장돼요. 하루 중 아기가 가장 활발한 시간대에, 10번의 움직임을 느끼는 데 걸리는 시간을 재어 기록하는 방식으로, 보통 2시간 이내에 10회 이상 느끼는 것이 일반적인 기준이에요.", "자궁·아기의 무게가 골반저를 계속 눌러 요실금이 흔해지는 시기라, 골반저 근육 강화 운동(케겔 운동)이 중요해요."]}'::jsonb, baby_message = '아기는 귀, 코, 피부, 눈으로 세상을 미리 느끼고 있고, 엄마를 통해 방패도 만들고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 28) AND day_number = 7;

-- ===== Week 29 =====
UPDATE content.pregnancy_week_data SET baby_summary = '임신 29주 아기는 땅콩 호박, 맥북 프로 정도의 크기로, 머리부터 발끝까지 약 38.6~39cm, 몸무게는 약 1.2~1.38kg 정도예요.; 자궁 안 공간이 점점 좁아지고 있지만, 여전히 발로 차고, 밀고, 스트레칭하고, 손으로 잡는 동작은 아주 활발하게 하고 있어요.', mother_summary = '3분기에는 매주 약 450g 정도씩 체중이 증가할 수 있고, 지금까지 대략 엄마의 체중은 8.6~11.3kg 정도 늘어났을 수 있어요.; 자궁이 급격히 자라면서 폐를 위로 밀어올려 숨이 가빠지고, 조금만 걸어도 숨이 차는 느낌이 더 자주 나타날 수 있어요.', updated_at = timezone('utc', now()) WHERE week_number = 29;

-- 29주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["임신 29주 아기는 땅콩 호박, 맥북 프로 정도의 크기로, 머리부터 발끝까지 약 38.6~39cm, 몸무게는 약 1.2~1.38kg 정도예요.", "자궁 안 공간이 점점 좁아지고 있지만, 여전히 발로 차고, 밀고, 스트레칭하고, 손으로 잡는 동작은 아주 활발하게 하고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["3분기에는 매주 약 450g 정도씩 체중이 증가할 수 있고, 지금까지 대략 엄마의 체중은 8.6~11.3kg 정도 늘어났을 수 있어요.", "자궁이 급격히 자라면서 폐를 위로 밀어올려 숨이 가빠지고, 조금만 걸어도 숨이 차는 느낌이 더 자주 나타날 수 있어요."]}'::jsonb, baby_message = '아기는 이곳이 조금씩 좁아지고 있지만, 여전히 힘껏 차고, 몸을 쭉 뻗으며, 엄마 배 안에서 나름대로 운동을 열심히 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 29) AND day_number = 1;

-- 29주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 뼈는 점점 더 단단해지면서, 매일 약 250mg의 칼슘을 골격에 축적하고 있어요.", "신경계 주변에 보호막(마이엘린)이 형성되기 시작하고, 이 보호막 형성은 출생 이후에도 계속 이어지며, 아기의 신경 신호 전달을 빠르고 안정되게 도와줘요."]}'::jsonb, mother_changes_payload = '{"items": ["아기가 자라날수록, 엄마 몸에서도 칼슘과 마그네슘, 비타민 D·K의 충분한 공급이 더 중요해져요.", "자궁이 크고 체중이 늘면서 관절과 인대가 이완되어 전신 통증과 균형감각 저하가 나타날 수 있어, 평소보다 넘어짐에 특히 더 주의해야 해요."]}'::jsonb, baby_message = '매일매일 엄마의 영양분이 아기에게 건너와, 앞으로 걸을 수 있고, 넘어져도 다시 일어날 수 있는 튼튼한 몸을 만들어 주고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 29) AND day_number = 2;

-- 29주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["29주에는 눈꺼풀이 완전히 형성되어 아기가 눈을 뜨고 감기 시작하고, 자궁 밖에서 들어오는 밝은 빛의 방향을 따라 얼굴을 돌릴 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 방광과 위를 압박하고, 아기가 밤에 더 활발하게 움직이면서 수면 장애와 불면이 잦아져요.", "밤에는 빈뇨·야간 배뇨가 증가해 2~3번 이상 깨는 일이 흔하지만, 그렇다고 해서 물 섭취를 과도하게 줄이면 탈수·변비·두통이 더 심해질 수 있어서, 자기 전 1~2시간만 조절하는 것이 좋아요."]}'::jsonb, baby_message = '아기는 이제 눈을 깜박일 수 있어요. 배 밖에서 들어오는 빛이 느껴지면, 얼굴을 그쪽으로 살짝 돌려 보기도 해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 29) AND day_number = 3;

-- 29주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 피부는 피하지방과 지방세포가 늘어나면서 더 두껍고 불투명해지고, 이전의 쭈글쭈글한 모습에서 점점 통통하고 아기다운 피부로 변해 가고 있어요.", "지금까지 온몸 가득 피부를 두껍게 싸서 보호하던 태지(vernix)는 조금씩 사라지기 시작하고, 대신 털(배냇털)은 더 두꺼워져 아기의 몸을 감싸게 돼요."]}'::jsonb, mother_changes_payload = '{"items": ["혈액량이 늘어나고 커진 자궁이 혈관을 압박하면서, 어지럼증·실신 느낌·저혈압 또는 저혈당 증상이 나타날 수 있어요.", "임신 후기에는 빈혈(특히 철분 부족성 빈혈) 위험이 높아지며, 피로감·무기력·숨참·어지럼증이 더 심해질 수 있어요."]}'::jsonb, baby_message = '아기의 몸이 통통해지고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 29) AND day_number = 4;

-- 29주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 움직임은 여전히 매우 활발해서, 강한 발차기, 밀어내기, 공중제비 같은 움직임을 자주 느낄 수 있어요.", "출산을 준비하기 위해 머리를 아래로 두는 두위자세를 취하기 시작하는 경우가 많고, 지금은 약 25%가 아직 머리를 위에 두고 놀지만 만삭에 가까워질수록 대부분 두위로 자리잡게 돼요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 커지고 인대·관절이 이완되면서, 요통·엉덩이 통증·골반 통증이 자주 나타나고, 하복부나 옆구리가 찌릿하게 아플 수 있어요.", "커진 자궁과 소화기관 압박, 장운동 저하로 속쓰림, 가스, 복부 팽만, 변비, 치질 등이 한꺼번에 찾아오기 쉬운 시기예요. 신체적으로 힘든 시간일 수 있어요."]}'::jsonb, baby_message = '아기는 요즘 거꾸로 돌아 눕는 연습을 하고 있어요. 자궁 안이 점점 좁아지지만, 여전히 발로 찰 힘은 충분해서, 가끔은 엄마가 ‘아야!’ 할 만큼 세게 밀어 보기도 해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 29) AND day_number = 5;

-- 29주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["태반을 통해 전달되는 항체의 양이 점점 더 늘어나, 아기의 면역체계는 출생 후를 대비하여 방어력을 차곡차곡 쌓아가고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 후기에는 긴장·불안·설렘이 뒤섞인 감정 변화가 더 뚜렷해질 수 있어요. “잘할 수 있을까?”라는 생각과 “빨리 보고 싶다”는 마음이 번갈아 밀려올 수 있죠.", "이 시기는 아기 용품, 출산 준비물, 산후조리 환경을 하나씩 정리하며 현실적인 준비와 정서적인 준비를 동시에 진행하는 시기예요."]}'::jsonb, baby_message = '아기가 엄마에게서 받는 영양분은 세상에 나갔을 때 조금 덜 위험하게 부딪히고 넘어질 수 있도록 도와줄 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 29) AND day_number = 6;

-- 29주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["땅콩버터만한 크기(약 38.6~39cm, 1.2~1.38kg)로 자라났고, 매일 약 250mg의 칼슘을 뼈와 치아에 축적하며 골격을 더 단단하게 만들고, 빛을 향해 고개를 돌리고 잠든 얼굴에 작은 미소를 지을 정도로 감각과 뇌 기능을 키웠어요."]}'::jsonb, mother_changes_payload = '{"items": ["아기의 딸꾹질은 작고 리드미컬한 움직임으로 느껴질 수 있으며, 정상적인 현상이고 폐 성숙과 뇌-횡격막 연결 형성에 도움이 될 수 있다는 연구도 있어요.", "3분기에는 체중 증가, 혈관 압박, 빈혈·저혈당, 혈압 변화로 인해 어지럼증·실신 느낌·두통이 나타날 수 있어서, 스스로의 몸 신호를 잘 관찰하는 것이 중요해요."]}'::jsonb, baby_message = '이번 주 아기는 무겁고 단단해지고, 더 생각이 많아진 아기가 되었어요. 아직 엄마 배 속에서 해야 할 연습이 많지만, 하나하나 해내고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 29) AND day_number = 7;

-- ===== Week 30 =====
UPDATE content.pregnancy_week_data SET baby_summary = '임신 30주 아기는 머리부터 발끝까지 약 39~40cm, 몸무게는 약 1.3~1.6kg 정도로, 멜론이나 큰 양배추만 한 크기까지 자라났어요.; 머리와 몸의 비율이 이제 신생아와 거의 비슷해져서, “모양은 거의 신생아인데 아직 조금 마르고 체구가 작은 상태”라고 이해하면 좋아요.', mother_summary = '30주가 되면 자궁이 배꼽보다 훨씬 위까지 올라와, 위·장·갈비뼈 아래와 폐를 동시에 밀어 올리기 때문에 갈비뼈 주변이 결리듯 아프고, 계단만 올라가도 숨이 훨씬 더 차게 느껴질 수 있어요.; 피로감과 숨참, 때때로 어지러움과 두통이 함께 느껴진다면 철분결핍성 빈혈이 동반되었는지 확인할 필요가 있어요.', updated_at = timezone('utc', now()) WHERE week_number = 30;

-- 30주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["임신 30주 아기는 머리부터 발끝까지 약 39~40cm, 몸무게는 약 1.3~1.6kg 정도로, 멜론이나 큰 양배추만 한 크기까지 자라났어요.", "머리와 몸의 비율이 이제 신생아와 거의 비슷해져서, “모양은 거의 신생아인데 아직 조금 마르고 체구가 작은 상태”라고 이해하면 좋아요."]}'::jsonb, mother_changes_payload = '{"items": ["30주가 되면 자궁이 배꼽보다 훨씬 위까지 올라와, 위·장·갈비뼈 아래와 폐를 동시에 밀어 올리기 때문에 갈비뼈 주변이 결리듯 아프고, 계단만 올라가도 숨이 훨씬 더 차게 느껴질 수 있어요.", "피로감과 숨참, 때때로 어지러움과 두통이 함께 느껴진다면 철분결핍성 빈혈이 동반되었는지 확인할 필요가 있어요."]}'::jsonb, baby_message = '아기는 이제 멜론만 한 크기로 자라서, 작은 신생아처럼 보인대요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 30) AND day_number = 1;

-- 30주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["30주 아기는 이제 눈을 크게 뜰 수 있을 정도의 시각 기능을 가지고 있고, 자궁 밖에서 들어오는 빛의 변화에 따라 눈을 뜨고 감는 반응을 보여요.", "아직 또렷하게 세상을 보는 것은 아니지만, 희미한 형태를 감지할 수 있고, 다음 주 무렵부터는 동공을 수축·확장하며 들어오는 빛의 양을 조절하는 연습을 시작하게 될 예정이에요."]}'::jsonb, mother_changes_payload = '{"items": ["배가 커지고 숨이 차고 자주 소변이 마려워 밤에 여러 번 깨다 보니, 깊은 잠을 자기 어렵고 피로가 쉽게 쌓일 수 있어요.", "이 시기에는 특히 꿈이 이상할 만큼 생생하고 기묘한 내용으로 기억되기도 하는데, 이는 호르몬 변화와 출산·육아에 대한 불안, 기대가 뒤섞인 자연스러운 반응이에요."]}'::jsonb, baby_message = '아기는 이제 눈을 크게 뜰 수 있어요. 배 밖에서 들어오는 희미한 빛이 느껴지면 살짝 눈을 떠 보기도 한답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 30) AND day_number = 2;

-- 30주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["손과 발은 완전히 형성되어 있고, 작은 손톱과 발톱이 자라 “초승달 같은 손톱”이 만들어지고 있어요. 언젠가 엄마 손가락을 꼭 쥐어 볼 그 손이 점점 더 준비되고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 호르몬과 혈류 증가의 영향으로 얼굴에 갈색 반점이 생기는 ‘임신의 가면’, 배꼽에서 치골까지 이어지는 짙은 임신선, 피부가 기름져 여드름이 나거나 배와 몸의 털이 늘어나는 변화를 경험할 수 있어요.", "유방·유두·외음부·하복부 피부색이 더 짙어지기도 하고, 일부 산모는 맑거나 노란색 초유가 조금씩 흘러나오는 것을 경험하기도 해요. 출산 후에는 이러한 색소 침착이 서서히 옅어지는 경우가 많아요."]}'::jsonb, baby_message = '아기의 손 끝에는 작은 초승달 같은 손톱이 자라고 있어요. 언젠가 엄마 손을 꼭 잡을 날을 상상하며 잘 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 30) AND day_number = 3;

-- 30주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["30주 무렵부터 많은 태아가 출산에 대비해 머리를 아래로 향하는 자세(머리골반위)를 취하기 시작하며, 머리를 거꾸로 두고 있는 연습을 하고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁저가 배꼽보다 훨씬 위까지 올라와 갈비뼈와 폐를 밀어 올리기 때문에, 특히 앉아 있을 때나 식후에는 가슴이 답답하고 숨이 더 가쁘게 느껴질 수 있어요.", "만삭에 가까워지면 끈적한 점액 같은 분비물에 분홍빛·갈색빛·조금의 피가 섞여 나오는 ‘이슬’이 보이기도 하는데, 이는 진통·출산이 가까워지고 있음을 시사하는 신호예요."]}'::jsonb, baby_message = '아기는 요즘 거꾸로 머리를 두는 연습을 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 30) AND day_number = 4;

-- 30주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 신경계와 근육이 충분히 발달해, 손가락 하나를 꽉 잡을 수 있을 만큼의 힘이 있고, 이제 통증도 느낄 수 있을 정도의 신경 발달도 이루어져 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 말기에는 발·발목·다리·손이 붓는 것이 매우 흔한데, 커진 자궁이 골반정맥과 하대정맥을 눌러 혈액 흐름을 느리게 하고, 혈액이 말단에 고이면서 혈관 밖으로 체액이 스며 나오기 때문이에요.", "임신 중에는 호르몬 변화와 임신 유지에 필요한 체액 증가로 인해, 평소보다 약 1~3kg 정도의 수분을 더 품고 있게 되는 것이 자연스러운 변화예요. 부기 자체는 흔한 현상이지만, 손·얼굴이 갑자기 심하게 붓거나 한쪽 다리만 심하게 붓고 통증이 있으면 자간전증이나 심부정맥혈전증(DVT)의 신호일 수 있어요."]}'::jsonb, baby_message = '아기는 작은 손으로 엄마 손가락을 꼭 잡을 준비도 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 30) AND day_number = 5;

-- 30주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 여전히 탯줄과 태반을 통해 산소를 공급받지만, 이 시점부터는 횡격막이 움직이며 호흡하는 동작을 적극적으로 연습하고, 폐에서는 계면활성제를 더 많이 만들어 출생 후 숨을 쉴 준비를 계속하고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 배 앞쪽으로 밀어 올리면서, 평소 안으로 들어가 있던 배꼽이 평평해지거나 볼록하게 튀어나올 수 있어요.", "배꼽을 만졌을 때 예민한 감각이 느껴질 수 있고, 단순히 옷에 스치는 것만으로도 불편할 수 있어요."]}'::jsonb, baby_message = '아기는 아직 엄마를 통해 숨을 쉬고 있지만, 폐와 횡격막은 조용히 호흡 연습을 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 30) AND day_number = 6;

-- 30주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 머리부터 발끝까지 약 39~40cm, 몸무게 약 1.3~1.6kg 정도로 멜론이나 큰 양배추만 한 크기까지 자라났고, 머리와 몸의 비율이 신생아와 거의 비슷해졌어요. 이제는 “모양은 거의 신생아인데, 조금 마르고 체구가 작은 상태”라고 볼 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁은 배꼽보다 훨씬 위까지 올라와 갈비뼈와 폐를 밀어 올리고, 속쓰림·숨참·소화불량·복부 팽만, 변비·치질, 허리·골반 통증 등 편하지 않은 시간이 될 수 있어요.", "발과 손, 다리·발목의 부기는 호르몬·체액 증가와 혈류 변화로 인해 자연스럽게 나타나는 현상이지만, 갑작스러운 심한 부기나 한쪽 다리만 붓고 아플 때는 의료진의 확인이 꼭 필요해요."]}'::jsonb, baby_message = '이번 주 아기는 신생아와 닮은 모습에 한 걸음 더 가까워졌어요. 눈을 크게 뜨고 빛을 느끼고, 머리를 아래로 두는 연습도 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 30) AND day_number = 7;

-- ===== Week 31 =====
UPDATE content.pregnancy_week_data SET baby_summary = '임신 31주 아기는 길이 약 40~41.8cm, 몸무게 약 1.5~1.75kg 정도로, 코코넛 크기까지 자라 있어요.', mother_summary = '자궁은 이제 배 안의 큰 부분을 차지하며, 자궁저부 높이는 약 25~28cm, 가슴뼈에서 약 7~8cm 아래까지 올라와 있어요. 그래서 똑바로 서 있을 때 발이 잘 보이지 않거나, 발을 내려다보려 몸을 굽히는 일이 점점 더 힘들어질 수 있어요.; 배가 많이 나오고 체중이 늘면서 무게 중심이 앞으로 쏠려, 걸음걸이가 짧고 넓어지며 ‘뒤뚱뒤뚱 걷는 느낌’이 날 수 있어요.', updated_at = timezone('utc', now()) WHERE week_number = 31;

-- 31주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["임신 31주 아기는 길이 약 40~41.8cm, 몸무게 약 1.5~1.75kg 정도로, 코코넛 크기까지 자라 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁은 이제 배 안의 큰 부분을 차지하며, 자궁저부 높이는 약 25~28cm, 가슴뼈에서 약 7~8cm 아래까지 올라와 있어요. 그래서 똑바로 서 있을 때 발이 잘 보이지 않거나, 발을 내려다보려 몸을 굽히는 일이 점점 더 힘들어질 수 있어요.", "배가 많이 나오고 체중이 늘면서 무게 중심이 앞으로 쏠려, 걸음걸이가 짧고 넓어지며 ‘뒤뚱뒤뚱 걷는 느낌’이 날 수 있어요."]}'::jsonb, baby_message = '아가는 엄마 뱃속에서 열심히 커지고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 31) AND day_number = 1;

-- 31주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 눈꺼풀이 완전히 형성되어 눈을 감고 뜨는 동작을 자연스럽게 할 수 있고, 동공은 들어오는 빛의 양에 따라 수축·확장하며 빛을 조절하는 연습을 하고 있어요.", "눈동자 색은 유전 정보에 따라 예쁘게 조합되는 중이지만, 최종적인 눈 색은 출생 후 몇 달에 걸쳐 서서히 자리 잡게 되요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 3분기에는 수면의 질이 떨어지고 불면이 흔해져서, 배·허리·골반의 불편함과 잦은 배뇨 때문에 밤에 여러 번 깨고 깊은 잠을 자기 어려울 수 있어요.", "자궁이 방광을 계속 눌러 소변을 자주 보는 것 자체는 정상적인 변화이지만, 배뇨 시 통증·심한 악취·탁한 소변·혈뇨·열·허리 통증이 동반되면 요로감염(UTI)일 수 있으므로 의료진과 꼭 상의해야 해요."]}'::jsonb, baby_message = '아가는 언젠가 엄마 눈을 바라볼 날을 기다리며, 엄마 아빠의 눈동자 색을 조금씩 섞어 눈동자 색을 만들고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 31) AND day_number = 2;

-- 31주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 폐는 아직 완전히 성숙하진 않았지만, 계면활성제를 충분히 만들어 폐포가 펴졌다 다시 오므라드는 과정이 자연스럽게 이루어질 정도의 기능을 갖추어, 이 시기에 태어난 아기도 의료진의 도움을 받으면 생존 가능성이 매우 높아요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 커지면서 배가 20~30초 정도 단단하게 뭉치는 느낌이 불규칙하게 느껴질 수 있는데, 이를 브랙스턴 힉스 수축(가진통)이라고 해요. 규칙적이지 않고, 점점 강해지지 않으며, 쉬면 가라앉는 경우가 많아요.", "수축이 규칙적으로 반복되고 간격이 점점 짧아지거나, 통증이 심해지며 질 출혈·양수 의심·복통이 동반되면 조산 신호일 수 있으므로 즉시 의료진과 상의해야 해요."]}'::jsonb, baby_message = '아가는 혹시 조금 일찍 세상에 나가게 되더라도 숨을 쉴 수 있도록 조금 더 분주하게 준비하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 31) AND day_number = 3;

-- 31주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 움직임은 여전히 활발하지만, 자궁 속 공간이 점점 좁아지고 수면 주기가 뚜렷해져 하루 최대 15시간까지 잠을 자기 때문에, 예전처럼 잦은 움직임이 줄어든 것 같다는 느낌이 들 수 있습니다."]}'::jsonb, mother_changes_payload = '{"items": ["임신 31주 이후에는 산전 진료 간격이 점점 짧아져, 보통 2주에 한 번 진료를 받다가, 만 36주 이후에는 주 1회 진료를 받게 돼요.", "고위험 임신(쌍둥이·임신성 당뇨·고혈압 등)이거나 의심 소견이 있는 경우, 의료진이 아기의 움직임·호흡·근긴장·심박동·양수량을 더 세심하게 살펴보기도 합니다."]}'::jsonb, baby_message = '아가는 나름의 리듬을 가지고 자고 깨고를 반복하며 묵직하고 크게 움직이고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 31) AND day_number = 4;

-- 31주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 다섯 가지 감각은 거의 완전히 발달해 있어, 빛·소리·촉각 자극에 반응할 수 있고, 엄마와 파트너의 익숙한 목소리, 자주 들려주는 음악이나 단어는 태어난 뒤에도 아기에게 큰 위안이 되는 “익숙한 안심 신호”가 될 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["많은 임산부가 이 시기를 ‘임신 뇌’라고 부를 만큼 건망증과 멍한 느낌을 자주 경험해요. 냉장고에서 열쇠를 찾거나, 자신의 나이·약속 시간을 잠시 떠올리지 못하는 등, 주의가 분산되고 기억력이 떨어진 것 같은 느낌이 들 수 있어요.", "체중 증가와 자세 변화, 호르몬 영향 등으로 인해 허리 아래·골반·엉덩이·다리 뒤쪽으로 이어지는 허리 통증·좌골신경통이 심해지기도 해요."]}'::jsonb, baby_message = '아가는 엄마 목소리, 웃음소리, 집 안의 작은 소리들까지 하나하나 머리속에 저장하는 중이에요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 31) AND day_number = 5;

-- 31주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 여전히 양수 속에서 양수를 마시고 소변으로 배출하며, 양수 속에서 숨 쉬는 연습을 해요. 양수는 아기를 보호하는 완충 역할을 할 뿐 아니라, 폐와 소화기관 발달을 돕기 때문에, 이 시기에도 충분한 양이 유지되는 것이 중요해요."]}'::jsonb, mother_changes_payload = '{"items": ["앞으로 9~10주 이내에 아기를 만나게 될 가능성이 크고, 때로는 계획보다 조금 더 일찍 출산이 시작되기도 해요. 그래서 31주는 출산·입원·산후조리 준비를 천천히 현실적으로 시작하기 좋은 시기예요.", "손톱과 발톱은 빨리 자라면서도 건조하고 잘 부러지는 상태가 되기 쉬워, 작은 자극에도 갈라지거나 깨질 수 있어요."]}'::jsonb, baby_message = '아가는 가장 처음 만나게 될 바람이 따뜻한 봄바람일지, 시원한 가을 바람일지… 어떤 계절이든, 엄마가 준비해 줄 작은 옷과 담요 안에서 포근하게 안기고 싶어해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 31) AND day_number = 6;

-- 31주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["피부 아래로 지방이 쌓이며 통통해지고, 뇌는 마지막 삼 분기 동안 폭발적으로 성장해 체온 조절과 수면-각성 주기, 감각 기능을 담당할 준비를 하고 있어요.", "폐는 계면활성제를 충분히 만들 정도로 성숙해져, 31주에 조금 이르게 태어나더라도 의료진의 도움 아래 생존 가능성이 매우 높은 시기에 도달했습니다."]}'::jsonb, mother_changes_payload = '{"items": ["자궁은 가슴뼈 아래까지 차오르며, 숨이 차고 식사량이 줄고, 속쓰림·소화불량·복부 팽만, 변비·치질, 허리·골반 통증까지 동시에 경험하는 시간이 될 수 있어요.", "잦은 배뇨와 수면 장애, 건망증, 감정 기복이 겹치면서 “몸도, 마음도, 머리도 예전 같지 않은 것 같다”는 느낌이 들 수 있지만, 임신 후기의 전형적인 변화예요."]}'::jsonb, baby_message = '아가는 혹시 세상이 조금 일찍 열리더라도 숨을 쉴 수 있도록, 폐와 뇌도 부지런히 자라나고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 31) AND day_number = 7;

-- ===== Week 32 =====
UPDATE content.pregnancy_week_data SET baby_summary = '아기는 머리부터 발끝까지 약 42cm 전후이고, 몸무게는 약 1.7~2kg 정도예요. 샐러리 크기라고 상상해도 좋아요.', mother_summary = '엄마 몸은 앞으로 약 4주 동안 주당 약 450g 정도 체중이 늘어날 수 있고, 아기 체중도 빠르게 증가해요. 그래서 몸의 중심이 더 앞으로 쏠리면서, 걸을 때 조금 더 뒤뚱뒤뚱 흔들리는 느낌이 드는 건 자연스러운 적응 과정이에요.; 자궁 윗부분(자궁저)은 이제 배꼽에서 약 15cm 위까지 올라와 갈비뼈 바로 아래를 밀고 있어서, 위와 흉곽이 눌리며 속이 더부룩하고 계단을 오르거나 말하면서 걷기만 해도 숨이 찰 수 있어요.', updated_at = timezone('utc', now()) WHERE week_number = 32;

-- 32주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 머리부터 발끝까지 약 42cm 전후이고, 몸무게는 약 1.7~2kg 정도예요. 샐러리 크기라고 상상해도 좋아요."]}'::jsonb, mother_changes_payload = '{"items": ["엄마 몸은 앞으로 약 4주 동안 주당 약 450g 정도 체중이 늘어날 수 있고, 아기 체중도 빠르게 증가해요. 그래서 몸의 중심이 더 앞으로 쏠리면서, 걸을 때 조금 더 뒤뚱뒤뚱 흔들리는 느낌이 드는 건 자연스러운 적응 과정이에요.", "자궁 윗부분(자궁저)은 이제 배꼽에서 약 15cm 위까지 올라와 갈비뼈 바로 아래를 밀고 있어서, 위와 흉곽이 눌리며 속이 더부룩하고 계단을 오르거나 말하면서 걷기만 해도 숨이 찰 수 있어요."]}'::jsonb, baby_message = '아가는 이제 샐러리만 한 크기가 되었어요. 몸은 웬만큼 다 만들어져서, 앞으로는 튼튼하게 크고 살을 채우는 일에 집중할 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 32) AND day_number = 1;

-- 32주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["많은 아기들이 머리를 아래로 향하는 두위 자세를 취하기 시작해요. 질식 분만에 가장 이상적인 자세이고, 약 97%의 아기들은 스스로 머리를 아래로 돌게 돼요. 아직 36주 전이라, 만약 둔위나 횡위라고 해도 자세를 바꿀 시간은 충분해요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 호르몬은 골반 주변 인대와 관절을 느슨하게 만들어, 허리·엉덩이·골반 앞쪽에 통증을 유발하고, 몸을 움직일 때 관절이 ‘딱딱’ 소리가 나거나 어긋나는 느낌을 만들 수 있어요.", "아기가 점점 골반 쪽으로 내려오면서, 자궁 하부와 자궁경부 주변 신경을 압박해 사타구니·허벅지로 찌릿하게 퍼지는 통증을 경험할 수 있어요. 매우 날카롭고 깜짝 놀랄 만큼 아프지만, 보통 몇 초 안에 싹 사라지고, 규칙적이지 않아요."]}'::jsonb, baby_message = '아가는 이제 천천히 머리를 아래로 돌려 보는 연습을 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 32) AND day_number = 2;

-- 32주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 폐는 아직 완전히 성숙하지는 않았지만, 양수를 들이마시고 내쉬는 호흡 운동을 반복하면서, 자궁 밖에서 공기를 들이마시고 내쉬는 연습을 하고 있는 중이에요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁이 위와 흉곽을 밀어 올리면서 소화불량·복부 팽만·속쓰림·역류성 식도염이 흔해져요.", "하루 약 300kcal 정도의 추가 에너지가 필요해서, “식욕이 줄었다고 아예 안 먹는 것”보다는 단백질·탄수화물·건강한 지방을 섞은 소량 식사를 여러 번 나누어 먹는 전략이 도움이 됩니다."]}'::jsonb, baby_message = '아가는 아직 공기가 아니라 양수를 들이마시고 내쉬지만, 언젠가 엄마 품에서 첫 숨을 쉬기 위해 차분히 연습 중이에요. 혹시 조금 일찍 만나게 되더라도, 잘 버티고 자라도록 열심히 준비할 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 32) AND day_number = 3;

-- 32주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 피부 밑에 피하지방을 빠르게 축적하고 있어요. 이 지방은 출생 후 체온을 유지하고 에너지를 공급하는, 아기에게 아주 중요한 저장고 역할을 해요.", "앞으로 몇 주 동안 약 1kg 정도의 지방이 더 쌓여, 자궁 밖 온도 변화에 적응할 준비를 하게 됩니다."]}'::jsonb, mother_changes_payload = '{"items": ["남은 기간 동안 골격과 뼈를 더 튼튼하게 하는 과정이 이어져요. 이때 비타민 D는 칼슘과 인의 흡수·조절을 도와 태아의 뼈 성장을 도와주고, 아기가 출생 후 몇 달 동안 의지할 영양분을 축적하는 데도 중요해요.", "다리 경련, 허리 통증, 골반 통증, 두통, 변비, 복부 팽만 등 증상들을 한꺼번에 경험할 수 있어요."]}'::jsonb, baby_message = '아가는 요즘 살도 차오르고, 뼈와 피를 튼튼하게 해 줄 영양들도 차곡차곡 모으는 중이에요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 32) AND day_number = 4;

-- 32주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 청력은 이미 상당히 발달해 엄마의 말소리·음악·외부 소리에 반응할 수 있어요.", "갑작스러운 큰 소리에 깜짝 놀라는 반응을 보일 수 있고, 반복해서 들려주는 말·노래·소리는 아기가 주변 세상을 구분하고 이해하는 능력을 키우는 데 도움이 돼요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 3분기에는 에스트로겐과 프로게스테론이 최고조에 달하면서 점막으로 가는 혈류가 증가해, 잇몸이 붓고 피가 잘 나는 증상이 매우 흔하게 나타나요.", "다리·발·손·얼굴에 부종(부기)이 생기기 쉬워요. 손·발이 약간 붓는 정도는 흔한 변화지만, 얼굴·손의 갑작스럽고 심한 부종이나 발·발목 부기가 급격히 심해지는 경우는 자간전증의 경고 신호일 수 있어 꼭 확인이 필요해요."]}'::jsonb, baby_message = '아가는 요즘 엄마 목소리와 집 안의 여러 소리를 차분히 듣는 중이에요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 32) AND day_number = 5;

-- 32주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기가 빠르게 커지면서 자궁 안 공간은 점점 좁아져, 이전처럼 크게 ‘공중제비’를 돌기는 어렵지만, 발길질·밀치기·돌리는 움직임은 여전히 활발하게 느껴지는 시기예요."]}'::jsonb, mother_changes_payload = '{"items": ["질 분비물이 이전보다 많고 끈적하게 느껴지는 것은 분만을 준비하면서 자궁경부가 더 많은 점액성 분비물을 만드는 자연스러운 변화일 수 있어요.", "다만, 분비물이 물처럼 묽고, 속옷이 젖을 정도로 계속 흐르는 느낌이 있다면 양수가 새는 것일 수 있어 산부인과에 바로 연락해야 합니다."]}'::jsonb, baby_message = '아가는 이제 예전처럼 크게 뒤집어지기는 어렵지만, 여전히 나름의 리듬으로 발을 쭉 뻗고, 몸을 밀고, 엄마에게 ‘나 여기 있어요’라고 인사하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 32) AND day_number = 6;

-- 32주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["머리를 아래로 두는 두위 자세를 취하기 시작하고, 폐는 양수로 숨쉬기 연습을 하며, 피부 밑에는 지방이 쌓이고, 철분·칼슘·인 같은 미네랄과 함께 뼈와 몸을 튼튼히 하는 ‘저장고’를 채워가고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["다리·골반·항문 주변에 정맥류가 잘 생기거나 악화될 수 있고, 치질도 정맥류의 한 형태로 가려움·불편감·쑤시는 느낌을 동반할 수 있어요. 오래 서 있기, 한 자세로 오래 앉아 있기, 다리 꼬는 습관은 정맥류를 더 악화시킬 수 있어 피하는 것이 좋아요.", "피부는 가려움, 튼살, 색소 침착, 피지 증가·여드름, 더 두꺼워 보이는 머리카락, 배와 유두 주변 색이 진해지는 등 여러 변화를 겪고 있어요."]}'::jsonb, baby_message = '아가는 이번 주 머리를 아래로 돌려 갈 자리를 잡아 보고, 숨 쉬는 연습을 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 32) AND day_number = 7;

-- ===== Week 34 =====
UPDATE content.pregnancy_week_data SET baby_summary = '아기는 머리부터 발끝까지 약 45cm, 17.8~17.84인치 정도로 자랐고, 몸무게는 약 2.2~2.4kg 정도라 멜론 크기에 비유될 만큼 제법 “큰 아기”가 되었어요.', mother_summary = '배가 앞으로 많이 나오면서 척추를 지지하는 근육이 늘어나고 약해져 허리 통증이 심해지기 쉬워요. 이런 요통은 흔하지만, 평소 없던 허리 통증이 갑자기 생기거나 통증이 점점 심해진다면 조기진통의 신호일 수 있어서 꼭 의료진과 상의해야 해요.; 자궁이 커지면서 갈비뼈 아래까지 차오르다 보니 상복부가 답답하거나 숨이 차고, 배꼽이 툭 튀어나온 것처럼 보이기도 해요. “임신한 배”라는 느낌이 아주 분명해지는 시기에요.', updated_at = timezone('utc', now()) WHERE week_number = 34;

-- 34주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 머리부터 발끝까지 약 45cm, 17.8~17.84인치 정도로 자랐고, 몸무게는 약 2.2~2.4kg 정도라 멜론 크기에 비유될 만큼 제법 “큰 아기”가 되었어요."]}'::jsonb, mother_changes_payload = '{"items": ["배가 앞으로 많이 나오면서 척추를 지지하는 근육이 늘어나고 약해져 허리 통증이 심해지기 쉬워요. 이런 요통은 흔하지만, 평소 없던 허리 통증이 갑자기 생기거나 통증이 점점 심해진다면 조기진통의 신호일 수 있어서 꼭 의료진과 상의해야 해요.", "자궁이 커지면서 갈비뼈 아래까지 차오르다 보니 상복부가 답답하거나 숨이 차고, 배꼽이 툭 튀어나온 것처럼 보이기도 해요. “임신한 배”라는 느낌이 아주 분명해지는 시기에요."]}'::jsonb, baby_message = '아가는 이제 거의 신생아와 비슷한 모습이에요. 따뜻한 지방을 차곡차곡 쌓으면서, 엄마 품 밖에서도 버틸 준비를 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 34) AND day_number = 1;

-- 34주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 손톱은 이미 손끝까지 닿을 정도로 자라 있어서, 태어났을 때 작은 손톱으로 얼굴을 살짝 긁을 수도 있을 정도에요.", "발톱은 아직 발가락 끝까지 완전히 자라진 않았지만 계속 자라나는 중이에요."]}'::jsonb, mother_changes_payload = '{"items": ["아기의 체중과 자세 변화로 골반·허리·사타구니·엉덩이·다리 쪽에 통증이 자주 찾아올 수 있어요. 관절과 인대가 이완되면서 골반 통증도 더 심해져 움직임이 제한될 정도로 불편할 수 있어요.", "자궁과 아기의 무게가 좌골신경을 눌러, 엉덩이에서 다리 뒤까지 쏘는 듯 흘러 내려가는 좌골신경통을 느끼는 임산부도 많아요. 오래 서 있기나 한쪽으로 체중을 싣는 자세가 이런 통증을 더 악화시킬 수 있으니 주의가 필요해요."]}'::jsonb, baby_message = '아가의 손톱이 손끝까지 다 자랐어요. 엄마 손가락을 꼭 잡을 준비를 하나씩 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 34) AND day_number = 2;

-- 34주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 소리·빛·촉각에 적극적으로 반응해서, 엄마의 목소리나 주변 대화, 틀어주는 음악에 몸을 움직이며 답하고 있어요. 청력이 많이 발달한 덕분에 지금 자주 듣는 소리를 나중에도 익숙하게 느낄 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 호르몬(프로게스테론)과 활동량 감소, 자궁이 장을 눌러 장운동이 느려지면서 임산부의 약 절반이 변비를 경험해.요 변비가 계속되면 배가 더부룩하고 불편할 뿐 아니라 치질도 악화되기 쉬워요.", "혈액량 증가와 수분 저류로 체내 수분 분포가 달라지고, 몸이 힘들어 물을 충분히 마시지 못하면 변비가 더 심해질 수 있어서, 변비를 적극적으로 관리해야 한다는 점이 특히 중요해요."]}'::jsonb, baby_message = '엄마가 말할 때, 음악을 켤 때, 아가는 귀 기울여 듣고 있어요. 나중에 밖에서 들어도 ‘이건 엄마 세상 소리구나’ 하고 금방 알아볼 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 34) AND day_number = 3;

-- 34주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["자궁 안 공간이 점점 좁아지면서 예전처럼 큰 회전 동작은 줄어들지만, 발차기·비틀기·팔꿈치로 밀어 올리는 듯한 강하고 분명한 태동은 더 또렷하게 느껴질 수 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 중 정상적인 질 분비물은 맑거나 우윳빛이고, 냄새가 심하지 않으며, 가렵지 않은 상태에요. 임신 후반으로 갈수록 분비량이 늘어 속옷이 자주 축축해지는 느낌을 받을 수 있어요.", "양수낭이 터져 양수가 새는 경우(양막 파열)에는, 소변처럼 한 번에 나오고 멈추기보다 속옷이 계속 젖을 정도로 물이 새고, 맑거나 약간 노란색·거의 냄새가 없거나 약간 달콤한 향으로 느껴질 수 있어요."]}'::jsonb, baby_message = '아가는 공간은 조금 좁아졌지만 여전히 ‘나 여기 있어요’라고 꾸준히 신호를 보내고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 34) AND day_number = 4;

-- 34주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기의 머리카락은 비교적 풍성하게 자라 있을 수 있고, 남아라면 복부에 있던 고환이 음낭 쪽으로 내려오는 과정에 있어 외성기도 명확하게 구분되는 시기에요."]}'::jsonb, mother_changes_payload = '{"items": ["유두·유륜 색이 진해지고, 유방에서 노란빛 또는 맑은 액체가 조금씩 새어나올 수 있는데, 이것은 성숙한 모유가 아니라 단백질·항체가 풍부한 초유에요.", "발·발목·손·얼굴 부종이 흔하고 특히 저녁이나 더운 날에 심해지는데, 발볼이 넓어지고 발 길이가 길어져 신발 사이즈가 커지기도 해요. 어떤 변화는 출산 후에도 남을 수 있어요."]}'::jsonb, baby_message = '아가는 점점 더 ‘나다운 모습’을 갖춰 가고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 34) AND day_number = 5;

-- 34주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 자궁 안에서 듣고·보고·자고·호흡 연습을 하며, 뇌와 신경계가 빠르게 성숙하는 덕분에 수면과 각성 리듬이 어느 정도 자리 잡고 있어요."]}'::jsonb, mother_changes_payload = '{"items": ["임신 중에는 호르몬 변화·혈류 증가·부종 등으로 귀가 먹먹하거나 이명·어지럼증·두통이 동반되는 청력 변화를 경험할 수 있어요. 대부분 일시적이지만, 증상이 심하거나 오래 지속되면 반드시 의료진에게 알려야 해요.", "임신 호르몬과 수분·피지 변화로 임신성 여드름이 생기기도 하는데, 레티노이드·하이드로퀴논·일부 경구약은 임신 중 안전하지 않을 수 있어 사용을 피하고, 다른 치료제는 의사 상담 후 사용하는 것이 좋아요."]}'::jsonb, baby_message = '엄마의 웃음소리, 대화, 숨 쉬는 소리 하나하나가 아가에게는 ‘밖 세상 예고편’이에요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 34) AND day_number = 6;

-- 34주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["이제 아기는 길이와 체중 면에서 거의 신생아에 가까운 모습이지만, 앞으로 남은 주 동안 지방·폐·면역이 더 완성되며 마지막 마무리를 해 나가게 돼요."]}'::jsonb, mother_changes_payload = '{"items": ["자궁저 높이가 치골에서 32~36cm 정도까지 올라오면서 배는 충분히 앞으로 나와 있고, 일부 아기는 골반 쪽으로 더 내려오면서 속쓰림·호흡곤란은 줄어드는 대신 골반·회음부 압박감이 커질 수 있어요.", "누적된 피로와 수면 부족, 근육통 때문에 임신 초기때처럼 피곤함이 다시 심해지는 시기로, 과한 일정을 줄이고 휴식과 도움을 구하는 것이 중요한 “체력 관리의 고비”이기도 해요."]}'::jsonb, baby_message = '아가는 이제 머리를 아래로 두고 세상을 향해 방향을 틀었어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 34) AND day_number = 7;

-- ===== Week 35 =====
UPDATE content.pregnancy_week_data SET baby_summary = '머리부터 발끝까지 약 51cm, 몸무게는 3.4kg 안팎으로 작은 수박·호박만 한 크기입니다.; 장기들은 거의 모두 완전히 성숙해서, 먹고·울고·숨 쉬고·발길질할 준비까지 끝난 상태입니다. 이제 엄마 뱃속 밖에서 스스로 기능할 수 있도록 돕는 폐·심장·소화기·신경계가 “실전 모드”로 들어가 있는 단계예요.', mother_summary = '40주는 ‘만삭’에 해당하고, 많은 가이드에서 “축하합니다 – 예정일에 도착하셨어요!”라고 표현합니다. 하지만 아직 진통이 없다고 해서 늦은 것도, 문제인 것도 아닙니다.; 양수 파열은 영화같이 드라마틱하지 않을 수 있어요. 영화처럼 “와르르” 쏟아지는 경우도 있지만, 실제로는 이미 진통이 진행 중일 때 양수가 터지는 경우가 훨씬 더 많고, 진통 전에 먼저 터지는 경우는 전체의 15% 미만입니다.', updated_at = timezone('utc', now()) WHERE week_number = 35;

-- 35주 1일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["머리부터 발끝까지 약 51cm, 몸무게는 3.4kg 안팎으로 작은 수박·호박만 한 크기입니다.", "장기들은 거의 모두 완전히 성숙해서, 먹고·울고·숨 쉬고·발길질할 준비까지 끝난 상태입니다. 이제 엄마 뱃속 밖에서 스스로 기능할 수 있도록 돕는 폐·심장·소화기·신경계가 “실전 모드”로 들어가 있는 단계예요."]}'::jsonb, mother_changes_payload = '{"items": ["40주는 ‘만삭’에 해당하고, 많은 가이드에서 “축하합니다 – 예정일에 도착하셨어요!”라고 표현합니다. 하지만 아직 진통이 없다고 해서 늦은 것도, 문제인 것도 아닙니다.", "양수 파열은 영화같이 드라마틱하지 않을 수 있어요. 영화처럼 “와르르” 쏟아지는 경우도 있지만, 실제로는 이미 진통이 진행 중일 때 양수가 터지는 경우가 훨씬 더 많고, 진통 전에 먼저 터지는 경우는 전체의 15% 미만입니다."]}'::jsonb, baby_message = '아가는 이제 완전히 ‘수박 사이즈’예요. 여기서 40주 동안 자라서, 이제 스스로 숨 쉬고 엄마 품에서 울 준비를 마쳤어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 35) AND day_number = 1;

-- 35주 2일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["대부분의 아기들은 태어난 지 하루 정도는 약간 보랏빛이 감도는 분홍색 피부를 가지고 태어납니다. 이 분홍빛은 피부 아래 보이는 붉은 혈관 때문이고, 혈액순환이 아직 성숙 중이라 손발이 며칠간 푸른 빛을 띨 수 있습니다."]}'::jsonb, mother_changes_payload = '{"items": ["배·태반·양수·유방의 무게 때문에 허리에 부담이 가장 큰 시기라, 임산부의 60% 이상이 허리 통증을 경험합니다. 평소와 다른, 갑작스럽게 심해지는 허리 통증은 진통이 시작되는 신호일 수도 있어서, “기존에 있던 무거운 통증인지, 갑자기 리듬을 타는 통증인지”를 관찰하는 것이 중요합니다.", "아기의 머리가 골반에 서서히 내려오면서 일부 산모들은 몸이 가벼워지거나 숨쉬기 조금 편해졌다고 말하기도 해요."]}'::jsonb, baby_message = '아가는 처음 만났을 때 피부가 조금 보랏빛이 돌고, 손발이 퍼래 보여도 괜찮아요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 35) AND day_number = 2;

-- 35주 3일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 계속해서 머리카락과 손톱이 자라고 있습니다. 머리카락의 길이와 숱, 손톱 길이는 아이마다 다르지만, 어떤 아기들은 태어나자마자 제법 풍성한 머리와 긴 손톱을 자랑하기도 합니다."]}'::jsonb, mother_changes_payload = '{"items": ["양수는 맑고 묽으며, 약간 달콤한 냄새가 나거나 거의 냄새가 없는 편입니다. 크림색·흰색의 끈적한 질 분비물, 노란색 소변과 헷갈릴 수 있어서, 액체의 색·냄새·질감을 함께 살피는 것이 중요합니다.", "진통 전에 먼저 양막이 터지는 경우를 PROM(조기 양막 파열)이라고 합니다. 이 경우 보통 24시간 이내에 자연 진통이 시작되지만, 그렇지 않으면 감염 예방을 위해 의료진이 진통을 유도하기도 합니다."]}'::jsonb, baby_message = '아가가 태어나서 엄마 손을 꼭 쥘 때, 아가의 작은 손톱이 엄마 손바닥을 살짝 간지럽게 할 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 35) AND day_number = 3;

-- 35주 4일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["먹고·울고·숨 쉬고·발길질하며, 소리·빛·촉감에 반응하는 반사신경을 이미 잘 갖추고 있습니다. 눈을 깜빡이고, 고개를 돌리고, 손을 단단히 쥘 만큼 협응력도 발달해 있어, 실제 세상에서의 첫 상호작용을 준비하는 단계입니다."]}'::jsonb, mother_changes_payload = '{"items": ["가진통은 보통 앞쪽 배에서 느껴지는 단단함, 약간의 불편감 정도라면, 진진통은 통증이 분명하고, 일정한 간격으로 찾아오면서 시간이 갈수록 더 강해지고 더 자주 옵니다. 누워 있거나, 목욕을 하거나, 긴장을 풀어도 계속되는 것이 특징입니다.", "아기가 골반으로 내려오면서 골반·엉덩이·사타구니 주변 압박감과 통증이 더 심해질 수 있습니다. 허리에서 시작해 배 앞으로 퍼지는 통증은 진통과 연결되는 경우가 많고, 기존 허리 통증과는 다른 리듬·강도를 보이기도 합니다."]}'::jsonb, baby_message = '아가는 이제 엄마 목소리도 알고, 빛도 느끼고, 손도 꼭 쥘 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 35) AND day_number = 4;

-- 35주 5일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["40주가 지나도 많은 아기들은 여전히 자궁 안이 편안해서, 예정일을 며칠·일주일까지 넘기기도 합니다. 그동안도 아기는 머리카락과 손톱을 계속 자라게 하고, 폐와 뇌를 조금씩 더 다듬으며 ‘완벽한 출발’을 준비합니다."]}'::jsonb, mother_changes_payload = '{"items": ["마음챙김과 간단한 명상하기. “아기가 준비되면 나올 것, 내 몸과 의료진이 함께 나와 아기를 지키고 있다”는 사실을 반복해서 떠올리며, 호흡에 집중하는 연습입니다.", "배와 허리 통증, 빈뇨, 불안 때문에 잠이 쉽게 오지 않을 수 있습니다. 이 시기의 불면은 매우 흔하고, 임신 후반 여성의 약 3분의 2가 겪는 증상이라고 알려져 있습니다."]}'::jsonb, baby_message = '아가는 조금 늦는 것 같다면 조금 더 준비하고 있을 뿐이에요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 35) AND day_number = 5;

-- 35주 6일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["아기는 이미 엄마의 목소리를 인지할 수 있고, 출생 후에도 자궁 안에서 듣던 그 목소리를 가장 편안하게 느끼게 됩니다."]}'::jsonb, mother_changes_payload = '{"items": ["배가 호박만 한 크기로 자라면서 몸을 움직이기도 벅찰 수 있습니다. 걸음이 느려지고, 오래 서 있으면 골반과 허리가 금방 아플 수 있습니다.", "공간이 좁아져서 예전처럼 큰 발차기보다는 굽히고 밀고 누르는 둔한 움직임이 느껴질 수 있지만, “여전히 평소 같은 패턴으로 움직이고 있는지”는 계속 관찰해야 합니다. 움직임이 현저히 줄었다고 느껴지면 바로 연락하셔야 합니다."]}'::jsonb, baby_message = '아가는 엄마와 아빠가 해주는 말들을 모두 듣고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 35) AND day_number = 6;

-- 35주 7일차
UPDATE content.pregnancy_day_contents SET baby_development_payload = '{"items": ["40주가 지나도, 많은 의료진은 건강한 임신이라면 41주 정도까지 자연 진통을 기다리기도 합니다. 다만 예정일 이후에는 비스트레스 검사(NST)와 초음파를 통해 양수량·태동·심박수 등을 더 자주 확인하며, 필요 시 유도분만을 권할 수 있습니다."]}'::jsonb, mother_changes_payload = '{"items": ["40주에 아직 진통이 없을 수도 있고, 그것은 아주 흔한 일입니다. 담당 의사는 NST와 초음파 결과를 보면서, 41주쯤 유도분만을 제안하기도 합니다.", "양수가 터졌는데 24시간 안에 진통이 시작되지 않거나, 자간전증·임신성 고혈압·당뇨·태반 문제 등에 따라 “빨리 아기를 만나는 편이 더 안전하다”고 판단되면, 진통 유도는 엄마와 아기를 위한 계획된 선택이 될 수 있습니다."]}'::jsonb, baby_message = '아가는 이제 정말 거의 다 왔어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 35) AND day_number = 7;

COMMIT;
