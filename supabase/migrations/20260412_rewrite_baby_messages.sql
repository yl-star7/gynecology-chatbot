-- 아기 메시지 1인칭 → 3인칭 변환
-- 유산 시 아기 직접 말투가 상처가 될 수 있어 관찰자 시점으로 변경

BEGIN;

-- 5주 1일차: “엄마, 내 심장이 오늘부터 콩닥거리기 시작했어요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 심장이 오늘부터 콩닥거리기 시작했어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 5) AND day_number = 1;

-- 5주 2일차: “엄마, 내 작은 두뇌가 쑥쑥 자라나고 있어요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 작은 두뇌가 쑥쑥 자라나고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 5) AND day_number = 2;

-- 5주 3일차: “엄마, 내 몸속에 작은 기관들이 생기고 있어요. 숨 쉬고, 먹고, 자랄 준비 중이에요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 몸속에 작은 기관들이 생기고 있어요. 숨 쉬고, 먹고, 자랄 준비 중이에요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 5) AND day_number = 3;

-- 5주 4일차: “엄마 뱃속이 나만의 아늑한 물침대 같아요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마 뱃속의 아늑한 양수 속에서 편안히 지내고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 5) AND day_number = 4;

-- 5주 5일차: “엄마, 나는 지금 폭풍처럼 자라고 있어요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 지금 아주 빠르게 자라고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 5) AND day_number = 5;

-- 5주 6일차: “엄마의 모든 소리와 감정이 나에게 재미있는 자극이 되고 있어요!”
UPDATE content.pregnancy_day_contents SET baby_message = '엄마의 모든 소리와 감정이 아가에게 재미있는 자극이 되고 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 5) AND day_number = 6;

-- 5주 7일차: 👶 아기의 말”: “엄마! 나 여기 있다는 증거를 보여줬어요. 엄마의 보살핌 덕분에 쑥쑥 클 거예요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 초음파에서 작은 모습을 보여주기 시작했어요. 엄마의 보살핌 덕분에 쑥쑥 클 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 5) AND day_number = 7;

-- 6주 1일차: “엄마, 내 심장 소리 들었어요? 내가 여기서 콩닥콩닥 열심히 뛰고 있어요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 심장 소리가 들리나요? 아가가 여기서 콩닥콩닥 열심히 뛰고 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 6) AND day_number = 1;

-- 6주 2일차: “엄마, 내 작은 머릿속에 똑똑한 세포들이 가득 생기고 있어요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 작은 머릿속에 똑똑한 세포들이 가득 생기고 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 6) AND day_number = 2;

-- 6주 3일차: “엄마, 내 심장이 좌우로 나뉘었어요. 더 튼튼하게 엄마 품으로 갈 준비 중이에요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 심장이 좌우로 나뉘었어요. 더 튼튼하게 엄마 품으로 갈 준비 중이에요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 6) AND day_number = 3;

-- 6주 4일차: “엄마, 나한테 작은 팔다리가 생겼어요! 이제 엄마한테 손 흔들어 줄 수 있어요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가에게 작은 팔다리가 생겼어요! 이제 엄마한테 손 흔들어 줄 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 6) AND day_number = 4;

-- 6주 5일차: “엄마, 내 보금자리가 더 넓어지고 있어요. 나는 여기서 튼튼하게 자라고 있어요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 보금자리가 더 넓어지고 있어요. 아가는 여기서 튼튼하게 자라고 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 6) AND day_number = 5;

-- 6주 6일차: “엄마, 나 이제 올챙이에서 사람 모습으로 변신하고 있어요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 올챙이에서 사람 모습으로 변신하고 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 6) AND day_number = 6;

-- 6주 7일차: 👶 아기의 말”: “엄마! 나는 이제 가장 중요한 성장 단계를 끝내고 있어요. 이제부터는 더 튼튼하게 자랄 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 가장 중요한 성장 단계를 끝내고 있어요. 이제부터는 더 튼튼하게 자랄 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 6) AND day_number = 7;

-- 7주 1일차: “엄마, 나 이제 블루베리만큼 컸어요! 내 성장 속도 대단하죠?”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 블루베리만큼 커졌어요! 아가의 성장 속도가 대단해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 7) AND day_number = 1;

-- 7주 2일차: “엄마, 내 작은 머릿속에서 똑똑한 세포들이 열심히 연결되고 있어요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 작은 머릿속에서 똑똑한 세포들이 열심히 연결되고 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 7) AND day_number = 2;

-- 7주 3일차: “엄마, 내 몸속에서 밥 먹을 준비를 하고 있어요! 엄마가 해주는 맛있는 음식이 기대돼요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 몸속에서 밥 먹을 준비를 하고 있어요! 엄마가 해주는 맛있는 음식이 기대돼요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 7) AND day_number = 3;

-- 7주 4일차: “엄마, 나 이제 세상을 볼 준비를 하고 있어요! 엄마를 가장 먼저 보고 싶어요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 세상을 볼 준비를 하고 있어요! 엄마를 가장 먼저 보고 싶어 해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 7) AND day_number = 4;

-- 7주 5일차: “엄마, 내 얼굴이 점점 사람 모습을 갖춰가고 있어요. 기대해주세요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 얼굴이 점점 사람 모습을 갖춰가고 있어요. 기대해주세요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 7) AND day_number = 5;

-- 7주 6일차: “엄마, 나 이제 곧게 펴지고 있어요. 엄마 품에 안길 날을 기다리고 있어요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 곧게 펴지고 있어요. 엄마 품에 안길 날을 기다리고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 7) AND day_number = 6;

-- 7주 7일차: 👶 아기의 말”: “엄마! 나 배아기를 건강하게 졸업해요. 이제 쑥쑥 커서 엄마 만날 준비할게요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 배아기를 건강하게 졸업하고 이제 쑥쑥 커서 엄마를 만날 준비를 하고 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 7) AND day_number = 7;

-- 8주 1일차: “엄마, 나 이제 꼬리 없어지고 사람처럼 보이려고 노력하고 있어요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 꼬리가 없어지고 사람처럼 보이려고 노력하고 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 8) AND day_number = 1;

-- 8주 2일차: “엄마, 내 작은 팔다리가 길어지고 있어요. 곧 엄마에게 손을 뻗을 수 있을 거예요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 작은 팔다리가 길어지고 있어요. 곧 엄마에게 손을 뻗을 수 있을 거예요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 8) AND day_number = 2;

-- 8주 3일차: “엄마, 내 얼굴에 눈코입이 생길 자리가 잡히고 있어요. 엄마를 꼭 닮을 거예요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 얼굴에 눈코입이 생길 자리가 잡히고 있어요. 엄마를 꼭 닮을 거예요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 8) AND day_number = 3;

-- 8주 4일차: “엄마, 내 작은 심장이 힘차게 뛰고 있어요! 나 이제 혼자 움직일 수도 있답니다.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 작은 심장이 힘차게 뛰고 있어요! 아가는 이제 혼자 움직일 수도 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 8) AND day_number = 4;

-- 8주 5일차: “엄마, 내 다리가 길어지고 있어요! 조금 더 힘차게 움직여서 엄마에게 나를 보여줄게요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 다리가 길어지고 있어요! 조금 더 힘차게 움직여 엄마에게 자신을 보여줄 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 8) AND day_number = 5;

-- 8주 6일차: “엄마, 내 눈이 빛을 느끼기 시작했어요! 엄마 목소리도 더 잘 들으려고 귀를 열고 있어요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 눈이 빛을 느끼기 시작했어요! 엄마 목소리도 더 잘 들으려고 귀를 열고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 8) AND day_number = 6;

-- 8주 7일차: 👶 아기의 말”: “엄마, 나만의 지문을 만들고있어요. 나중에 손도장 찍어줄게요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 자신만의 지문을 만들고 있어요. 나중에 손도장 찍어줄 거예요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 8) AND day_number = 7;

-- 9주 1일차: “엄마, 나 이제 태아예요! 엄마 몸속에서 새로운 단계를 시작해요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 태아예요! 엄마 몸속에서 새로운 단계를 시작해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 9) AND day_number = 1;

-- 9주 2일차: “엄마, 나 이제 주먹을 쥘 수 있어요. 곧 엄마 손을 잡아볼 수 있겠죠?”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 주먹을 쥘 수 있어요. 곧 엄마 손을 잡아볼 수 있겠죠?', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 9) AND day_number = 2;

-- 9주 3일차: “엄마, 나 이제 고개를 조금 들 수 있어요. 엄마에게 서프라이즈로 보여줄게요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 고개를 조금 들 수 있어요. 엄마에게 서프라이즈로 보여줄 거예요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 9) AND day_number = 3;

-- 9주 4일차: “엄마, 내 몸속의 작은 공장들이 열심히 돌아가기 시작했어요. 나 이제 혼자서도 잘 해낼 준비를 하고 있어요
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 몸속의 작은 공장들이 열심히 돌아가기 시작했어요. 아가는 이제 혼자서도 잘 해낼 준비를 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 9) AND day_number = 4;

-- 9주 5일차: “엄마, 나 이제 팔다리를 더 힘차게 움직일 수 있어요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 팔다리를 더 힘차게 움직일 수 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 9) AND day_number = 5;

-- 9주 6일차: “엄마, 내 몸에서 머리카락이 될 자리가 생기고 있어요. 내 성별은 아직 비밀이에요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 몸에서 머리카락이 될 자리가 생기고 있어요. 아가의 성별은 아직 비밀이에요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 9) AND day_number = 6;

-- 9주 7일차: 👶 아기의 말”: “엄마, 나 이제부터 쑥쑥 자라서 엄마 품에 안길 준비를 할게요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제부터 쑥쑥 자라서 엄마 품에 안길 준비를 할 거예요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 9) AND day_number = 7;

-- 10주 1일차: “엄마, 나 이제 딸기만큼 컸어요! 내 손목도 돌릴 수 있는 능력자예요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 딸기만큼 컸어요! 아가의 손목도 돌릴 수 있는 능력자예요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 10) AND day_number = 1;

-- 10주 2일차: “엄마, 이제 내 손가락이 완벽하게 분리되었어요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 손가락이 완벽하게 분리되었어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 10) AND day_number = 2;

-- 10주 3일차: “엄마, 내 태반이 나를 열심히 키워주고 있어요. 나는 이제 성장에 집중할 거예요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 태반이 아가를 열심히 키워주고 있어요. 아가는 이제 성장에 집중할 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 10) AND day_number = 3;

-- 10주 4일차: “엄마, 나 오늘 양수 속에서 운동했어요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 오늘 양수 속에서 운동했어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 10) AND day_number = 4;

-- 10주 5일차: “엄마, 나 이제 물도 삼킬 수 있어요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 물도 삼킬 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 10) AND day_number = 5;

-- 10주 6일차: “엄마, 나 이제 튼튼한 뼈를 만들고 있어요. 똑똑한 뇌도 열심히 크고 있답니다!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 튼튼한 뼈를 만들고 있으며, 똑똑한 뇌도 열심히 크고 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 10) AND day_number = 6;

-- 10주 7일차: 👶 아기의 말”: “엄마, 나 이제 안전하고 튼튼해요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 안전하고 튼튼해요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 10) AND day_number = 7;

-- 11주 1일차: “엄마, 나 이제 무화과만큼 컸어요! 위험한 시기를 넘기고 안전하게 자랄 거예요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 무화과만큼 컸으며, 위험한 시기를 넘기고 안전하게 자랄 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 11) AND day_number = 1;

-- 11주 2일차: “엄마, 나 양수 속에서 뱅글뱅글 돌고 있어요! 엄마는 내 움직임을 느낄 수 있나요?”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 양수 속에서 뱅글뱅글 돌고 있어요! 엄마는 아가의 움직임을 느낄 수 있나요?', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 11) AND day_number = 2;

-- 11주 3일차: “엄마, 나 이제 소변도 만들 수 있어요. 내 몸속 기관들이 열심히 일하고 있답니다.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 소변도 만들 수 있어요. 아가 몸속 기관들이 열심히 일하고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 11) AND day_number = 3;

-- 11주 4일차: “엄마, 내 머릿속에서 복잡하고 신기한 일이 벌어지고 있어요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 머릿속에서 복잡하고 신기한 일이 벌어지고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 11) AND day_number = 4;

-- 11주 5일차: “엄마, 내 작은 주먹을 쥐었다 폈다 할 수 있어요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 작은 주먹을 쥐었다 폈다 할 수 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 11) AND day_number = 5;

-- 11주 6일차: “엄마, 내 탯줄이 아주 튼튼해요. 엄마의 좋은 기운을 내가 듬뿍 받고 있답니다!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 탯줄이 아주 튼튼해요. 엄마의 좋은 기운을 아가가 듬뿍 받고 있답니다!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 11) AND day_number = 6;

-- 11주 7일차: 👶 아기의 말”: “엄마, 나 이제 성장 모드를 켰어요! 엄마가 주시는 영양분으로 쑥쑥 클 거예요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 성장 모드를 켰어요! 엄마가 주시는 영양분으로 쑥쑥 클 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 11) AND day_number = 7;

-- 12주 1일차: “엄마, 나 자두만큼 컸어요! 이제 더 튼튼하게 자랄 거예요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 자두만큼 컸어요! 이제 더 튼튼하게 자랄 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 12) AND day_number = 1;

-- 12주 2일차: “엄마, 이제 내 손가락이 따로따로 움직여요. 곧 엄마 손도 잡아볼 수 있겠죠?”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 손가락이 이제 따로따로 움직여요. 곧 엄마 손도 잡아볼 수 있겠죠?', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 12) AND day_number = 2;

-- 12주 3일차: “엄마, 내 얼굴이 점점 또렷해지고 있어요. 곧 귀여운 옆모습을 보여줄 수 있어요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 얼굴이 점점 또렷해지고 있어요. 곧 귀여운 옆모습을 보여줄 수 있어요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 12) AND day_number = 3;

-- 12주 4일차: “엄마, 나 오늘 양수 속에서 운동했어요. 팔다리도 뻗고, 하품도 했답니다!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 오늘 양수 속에서 운동했어요. 팔다리도 뻗고, 하품도 했답니다!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 12) AND day_number = 4;

-- 12주 5일차: “엄마, 나 이제 물도 삼킬 수 있어요. 젖도 잘 먹을 준비를 하고 있어요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 물도 삼킬 수 있어요. 젖도 잘 먹을 준비를 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 12) AND day_number = 5;

-- 12주 6일차: “엄마, 이제 엄마 목소리의 울림을 느낄 수 있어요. 자주 이야기해 주세요!”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 엄마 목소리의 울림을 느낄 수 있어요. 자주 이야기해 주세요!', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 12) AND day_number = 6;

-- 12주 7일차: 👶 아기의 말”: “엄마, 힘든 초기를 건강하게 통과했어요! 이제 안정적인 중기로 함께 나아가요.”
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 힘든 초기를 건강하게 통과했어요! 이제 안정적인 중기로 함께 나아가요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 12) AND day_number = 7;

-- 13주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13) AND day_number = 1;

-- 13주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13) AND day_number = 2;

-- 13주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13) AND day_number = 3;

-- 13주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13) AND day_number = 4;

-- 13주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13) AND day_number = 5;

-- 13주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13) AND day_number = 6;

-- 13주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 13) AND day_number = 7;

-- 14주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 14) AND day_number = 1;

-- 14주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 14) AND day_number = 2;

-- 14주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 14) AND day_number = 3;

-- 14주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 14) AND day_number = 4;

-- 14주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 14) AND day_number = 5;

-- 14주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 14) AND day_number = 6;

-- 14주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 14) AND day_number = 7;

-- 15주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 15) AND day_number = 1;

-- 15주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 15) AND day_number = 2;

-- 15주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 15) AND day_number = 3;

-- 15주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 15) AND day_number = 4;

-- 15주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 15) AND day_number = 5;

-- 15주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 15) AND day_number = 6;

-- 15주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 15) AND day_number = 7;

-- 16주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 16) AND day_number = 1;

-- 16주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 16) AND day_number = 2;

-- 16주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 팔다리를 움직일 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 16) AND day_number = 3;

-- 16주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마 뱃속에서 활발하게 움직이기 시작했어요. 팔다리를 쭉 뻗고 몸을 비틀며 제법 활기찬 모습을 보여주고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 16) AND day_number = 4;

-- 16주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마의 목소리를 알아듣기 시작했어요. 엄마가 이야기하는 소리에 반응하며 뱃속에서 꼼지락거리는 것으로 대답하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 16) AND day_number = 5;

-- 16주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 사람의 형상을 갖추었어요. 눈, 코, 입이 뚜렷해지고 손가락과 발가락도 구분되어 보인답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 16) AND day_number = 6;

-- 16주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마가 먹는 음식의 맛을 느끼기 시작했어요. 양수를 통해 엄마가 섭취한 음식의 맛이 아가에게 전달되고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 16) AND day_number = 7;

-- 17주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뼈가 단단해지기 시작했어요. 칼슘이 뼈에 쌓이면서 아가의 골격이 튼튼해지고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 17) AND day_number = 1;

-- 17주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마의 심장 소리를 들으며 안정감을 느껴요. 엄마의 규칙적인 심장 소리는 아가에게 편안함을 주고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 17) AND day_number = 2;

-- 17주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 다양한 표정을 지을 수 있어요. 입을 오물거리거나 눈을 깜빡이는 등 귀여운 표정을 연습하고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 17) AND day_number = 3;

-- 17주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마의 감정을 느끼기 시작했어요. 엄마가 행복해하면 아가도 기분이 좋아지고, 스트레스를 받으면 아가도 불안해할 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 17) AND day_number = 4;

-- 17주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마의 움직임에 반응해요. 엄마가 걷거나 움직일 때마다 아가는 뱃속에서 흔들리며 함께 움직이고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 17) AND day_number = 5;

-- 17주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 많은 것을 보고 들을 수 있어요. 엄마 뱃속의 어둠 속에서도 빛을 감지하고, 외부의 소리를 들으며 세상을 배우고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 17) AND day_number = 6;

-- 17주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마의 사랑을 듬뿍 느끼며 건강하게 자라고 있어요. 엄마의 따뜻한 마음이 아가에게 그대로 전달되고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 17) AND day_number = 7;

-- 19주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 통통해졌어요. 엄마 뱃속에서 열심히 영양분을 섭취하며 살이 오르고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 19) AND day_number = 1;

-- 19주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마의 목소리에 더욱 민감하게 반응해요. 엄마가 노래를 불러주거나 말을 걸어주면 뱃속에서 활발하게 움직이며 좋아한답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 19) AND day_number = 2;

-- 19주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 소리를 구분할 수 있어요. 엄마의 목소리와 다른 외부의 소리를 구분하며 듣고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 19) AND day_number = 3;

-- 19주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마의 배를 통해 세상과 소통하고 있어요. 엄마가 배를 만져주면 아가는 부드러운 손길에 반응하며 기뻐한답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 19) AND day_number = 4;

-- 19주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 많은 것을 배우고 있어요. 엄마 뱃속에서 다양한 소리와 자극을 통해 세상을 익히고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 19) AND day_number = 5;

-- 19주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마의 건강 상태를 느끼며 함께 성장하고 있어요. 엄마가 건강해야 아가도 튼튼하게 자랄 수 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 19) AND day_number = 6;

-- 19주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마의 사랑 속에서 무럭무럭 자라고 있어요. 곧 세상 밖으로 나올 준비를 하며 힘을 키우고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 19) AND day_number = 7;

-- 20주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 뚜렷한 성별을 구분할 수 있을 정도로 발달했어요. 초음파 검사를 통해 아가의 성별을 확인할 수 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 20) AND day_number = 1;

-- 20주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마 뱃속에서 편안하게 잠을 자고 깨는 시간을 반복하고 있어요. 규칙적인 생활 패턴을 만들어가고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 20) AND day_number = 2;

-- 20주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마 뱃속에서 활발하게 움직이며 성장하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 20) AND day_number = 3;

-- 20주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마의 목소리를 듣고 반응하기 시작했어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 20) AND day_number = 4;

-- 20주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 피부가 점차 두꺼워지고 지방층이 발달하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 20) AND day_number = 5;

-- 20주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마의 심장 소리를 들으며 안정감을 느끼고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 20) AND day_number = 6;

-- 20주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 손톱과 발톱이 거의 완성되었어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 20) AND day_number = 7;

-- 21주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마의 움직임에 따라 함께 흔들리며 균형 감각을 키우고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 21) AND day_number = 1;

-- 21주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 머리카락이 자라나기 시작했어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 21) AND day_number = 2;

-- 21주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마가 먹는 음식의 맛을 느끼고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 21) AND day_number = 3;

-- 21주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 폐가 발달하며 숨쉬기 연습을 시작했어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 21) AND day_number = 4;

-- 21주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마의 감정 변화를 느끼고 반응할 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 21) AND day_number = 5;

-- 21주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 눈꺼풀이 발달하고 있지만 아직 빛을 감지하지는 못해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 21) AND day_number = 6;

-- 21주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마 뱃속에서 다양한 자세로 움직이며 놀고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 21) AND day_number = 7;

-- 22주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 청각이 더욱 발달하여 주변 소리에 민감하게 반응해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 22) AND day_number = 1;

-- 22주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마의 배를 누르면 반응하며 놀기도 해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 22) AND day_number = 2;

-- 22주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 몸에 솜털이 덮여 체온을 유지하는 데 도움을 줘요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 22) AND day_number = 3;

-- 22주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마의 소화기관 소리를 들으며 익숙해지고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 22) AND day_number = 4;

-- 22주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 성별 구분이 더욱 뚜렷해지고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 22) AND day_number = 5;

-- 22주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마의 호흡에 맞춰 폐로 양수를 들이마시고 내쉬는 연습을 해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 22) AND day_number = 6;

-- 22주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 엄마 뱃속에서 편안하게 잠을 자고 깨어나는 시간을 보내고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 22) AND day_number = 7;

-- 23주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가의 뼈가 단단해지기 시작하며 더욱 튼튼해지고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 23) AND day_number = 1;

-- 23주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌 발달이 활발해지면서 감각기관이 발달하기 시작했어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 23) AND day_number = 2;

-- 23주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 이제 제법 움직임이 커져서 엄마가 태동을 느낄 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 23) AND day_number = 3;

-- 23주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 청각이 발달하여 엄마의 목소리와 심장 소리를 들을 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 23) AND day_number = 4;

-- 23주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 피부가 투명한 상태에서 점차 불투명해지기 시작했어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 23) AND day_number = 5;

-- 23주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 폐가 발달하면서 폐포가 형성되기 시작했어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 23) AND day_number = 6;

-- 23주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 지방층이 쌓이기 시작하면서 통통해지기 시작했어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 23) AND day_number = 7;

-- 24주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 눈꺼풀이 생기고 눈동자를 움직일 수 있게 되었어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 24) AND day_number = 1;

-- 24주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌의 주름이 발달하면서 더욱 복잡한 기능을 수행할 준비를 해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 24) AND day_number = 2;

-- 24주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뼈가 단단해지고 근육이 발달하면서 활발하게 움직여요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 24) AND day_number = 3;

-- 24주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 탯줄을 잡거나 빨면서 놀기도 해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 24) AND day_number = 4;

-- 24주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 미각이 발달하여 양수의 맛을 느끼고 반응할 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 24) AND day_number = 5;

-- 24주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 폐에서 폐포가 계속 발달하며 숨을 쉬기 위한 준비를 해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 24) AND day_number = 6;

-- 24주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 피부 아래 지방이 축적되면서 체온 조절 능력이 향상돼요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 24) AND day_number = 7;

-- 25주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌의 신경세포가 활발하게 연결되면서 인지 능력이 발달해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 25) AND day_number = 1;

-- 25주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 척수에서 신경 신호를 보내는 능력이 발달해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 25) AND day_number = 2;

-- 25주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뼈가 더욱 단단해지고 관절이 유연해져요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 25) AND day_number = 3;

-- 25주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 양수를 마시고 소변으로 배출하는 과정을 반복하며 소화기관을 발달시켜요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 25) AND day_number = 4;

-- 25주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 폐에서 폐포가 더욱 성숙해지고 폐 표면 활성 물질이 생성돼요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 25) AND day_number = 5;

-- 25주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 지방층이 두꺼워지면서 외형이 더욱 동글동글해져요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 25) AND day_number = 6;

-- 25주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌 발달이 계속되어 감각 정보 처리가 더욱 정교해져요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 25) AND day_number = 7;

-- 26주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌 발달이 활발해지면서 꿈을 꾸기 시작할 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 26) AND day_number = 1;

-- 26주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 폐 성숙이 계속되면서 폐포가 발달하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 26) AND day_number = 2;

-- 26주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 청각이 더욱 발달하여 엄마의 목소리나 주변 소리에 반응할 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 26) AND day_number = 3;

-- 26주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 피부 아래 지방층이 쌓이면서 통통해지기 시작해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 26) AND day_number = 4;

-- 26주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 눈꺼풀이 열리면서 빛을 감지할 수 있게 돼요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 26) AND day_number = 5;

-- 26주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뼈가 계속 단단해지고 근육이 발달하여 활발하게 움직여요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 26) AND day_number = 6;

-- 26주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 양수 속에서 균형 감각을 발달시키며 움직임을 연습해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 26) AND day_number = 7;

-- 27주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌의 주름이 더 깊어지면서 인지 능력이 발달하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 27) AND day_number = 1;

-- 27주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 폐에서 폐포의 표면 활성제 생성이 증가하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 27) AND day_number = 2;

-- 27주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌에서 신경 세포 간의 연결이 활발하게 이루어지고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 27) AND day_number = 3;

-- 27주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 체온 조절 능력이 향상되면서 스스로 체온을 유지하려고 노력해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 27) AND day_number = 4;

-- 27주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 손가락과 발가락의 지문이 뚜렷해지고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 27) AND day_number = 5;

-- 27주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뼈가 계속 성장하고 칼슘을 흡수하며 튼튼해지고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 27) AND day_number = 6;

-- 27주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌의 활동량이 늘어나면서 더 많은 움직임을 보여줘요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 27) AND day_number = 7;

-- 28주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌 발달이 더욱 정교해지면서 감각을 통합하기 시작해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 28) AND day_number = 1;

-- 28주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 폐 기능이 더욱 성숙해지면서 호흡 연습을 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 28) AND day_number = 2;

-- 28주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 지방층이 더 두꺼워져 포동포동한 모습이 되고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 28) AND day_number = 3;

-- 28주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 시력이 발달하여 눈을 뜨고 감으며 주변을 인식해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 28) AND day_number = 4;

-- 28주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌에서 신경 전달 물질이 활발하게 분비되어 감정 발달의 기초를 다져요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 28) AND day_number = 5;

-- 28주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뼈가 더욱 단단해지고 근육량이 늘어나 힘찬 움직임을 보여줘요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 28) AND day_number = 6;

-- 28주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 폐가 성숙해지면서 숨을 쉬는 연습을 하고 있어요. 폐포에 폐 계면활성제가 쌓이기 시작해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 28) AND day_number = 7;

-- 29주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌 발달이 활발해지면서 감각 기관이 더욱 발달하고 있어요. 시각과 청각이 더욱 예민해져요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 29) AND day_number = 1;

-- 29주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 지방층이 두꺼워지면서 통통한 모습을 갖추기 시작해요. 체온 조절 능력이 향상돼요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 29) AND day_number = 2;

-- 29주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 손톱과 발톱이 완전히 자랐어요. 머리카락도 계속 자라면서 제법 풍성해져요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 29) AND day_number = 3;

-- 29주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뼈가 단단해지고 근육이 발달하면서 활발하게 움직여요. 엄마는 아가의 움직임을 더 잘 느낄 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 29) AND day_number = 4;

-- 29주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 눈을 뜨고 감을 수 있게 되었어요. 빛을 감지하고 반응할 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 29) AND day_number = 5;

-- 29주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 폐에서 폐 계면활성제 생성이 활발해져요. 폐가 성숙해지면서 출산 후 호흡을 준비해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 29) AND day_number = 6;

-- 29주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌의 주름이 더욱 깊어지고 복잡해지면서 인지 능력이 발달하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 29) AND day_number = 7;

-- 30주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 양수 속에서 활발하게 움직이며 근육과 뼈를 발달시키고 있어요. 탯줄을 잡거나 빨기도 해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 30) AND day_number = 1;

-- 30주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 피부가 점차 투명해지고 붉은색을 띠게 돼요. 피하지방이 쌓이면서 더 이상 투명하지 않게 돼요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 30) AND day_number = 2;

-- 30주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 청각이 발달하여 엄마의 목소리나 외부 소리에 반응해요. 익숙한 소리에 안정감을 느껴요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 30) AND day_number = 3;

-- 30주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌 발달이 계속되어 신경 세포들이 활발하게 연결되고 있어요. 복잡한 기능을 수행할 준비를 해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 30) AND day_number = 4;

-- 30주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 폐가 성숙해지면서 폐 계면활성제 분비가 늘어나요. 출산 후 폐가 펴지는 것을 도와줘요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 30) AND day_number = 5;

-- 30주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뼈가 더욱 단단해지고 근육량이 늘어나면서 힘찬 움직임을 보여줘요. 엄마는 아가의 발차기를 느낄 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 30) AND day_number = 6;

-- 30주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌의 신경 세포들이 빠르게 성장하고 연결되면서 복잡한 기능을 수행할 수 있게 돼요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 30) AND day_number = 7;

-- 31주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 피하지방이 축적되면서 통통한 모습이 되어가고 있어요. 체온 조절 능력이 향상돼요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 31) AND day_number = 1;

-- 31주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 폐가 성숙해지면서 폐 계면활성제 생성이 꾸준히 이루어져요. 출산 후 호흡을 위한 준비가 잘 되어가고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 31) AND day_number = 2;

-- 31주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌 발달이 계속되어 감각 기관이 더욱 정교해지고 있어요. 주변 환경을 더 잘 인식해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 31) AND day_number = 3;

-- 31주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뼈가 단단해지고 근육이 발달하면서 활발하게 움직여요. 엄마는 아가의 움직임을 더 잘 느낄 수 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 31) AND day_number = 4;

-- 31주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 눈을 뜨고 감으며 빛에 반응하는 능력이 더욱 발달했어요. 외부 자극에 대한 인식이 높아져요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 31) AND day_number = 5;

-- 31주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌 발달이 활발해지고 있어요. 시각과 청각이 발달하며 외부 소리에 반응하기 시작해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 31) AND day_number = 6;

-- 31주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 폐가 성숙해지고 있어요. 폐포가 발달하며 출산 후 호흡을 준비하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 31) AND day_number = 7;

-- 32주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 지방층이 두꺼워지면서 통통한 모습이 되어가고 있어요. 체온 조절 능력이 향상되고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 32) AND day_number = 1;

-- 32주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 양수 속에서 활발하게 움직이며 근육과 뼈를 발달시키고 있어요. 팔다리를 쭉 뻗거나 주먹을 쥐는 등 다양한 움직임을 보여요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 32) AND day_number = 2;

-- 32주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌의 주름이 더욱 깊어지고 있어요. 복잡한 신경망이 발달하며 인지 능력이 향상될 준비를 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 32) AND day_number = 3;

-- 32주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 감각 기관이 발달하여 엄마의 목소리, 심장 소리, 외부 소리를 구분할 수 있게 되었어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 32) AND day_number = 4;

-- 32주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 태반을 통해 영양분을 공급받으며 꾸준히 성장하고 있어요. 몸의 비율이 점차 안정되어 가고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 32) AND day_number = 5;

-- 32주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 수면과 깨어있는 시간을 구분하기 시작했어요. 규칙적인 수면 패턴을 보이며 휴식을 취하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 32) AND day_number = 6;

-- 32주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 폐활량이 늘어나면서 더 깊은 숨을 쉬고 있어요. 폐 성숙이 거의 완료되어 가고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 32) AND day_number = 7;

-- 34주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 지방층이 더욱 발달하여 포동포동한 모습이 되었어요. 추운 외부 환경에서도 체온을 유지할 수 있게 되었어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 34) AND day_number = 1;

-- 34주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뼈가 단단해지고 있어요. 칼슘과 인을 흡수하며 뼈를 튼튼하게 만들고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 34) AND day_number = 2;

-- 34주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌 발달이 매우 활발하여 뇌의 주름이 더욱 복잡해지고 있어요. 신경 세포 간의 연결이 강화되고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 34) AND day_number = 3;

-- 34주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 시각이 발달하여 엄마 뱃속의 어둠 속에서도 빛을 감지할 수 있어요. 눈을 깜빡이거나 초점을 맞추는 연습을 해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 34) AND day_number = 4;

-- 34주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 폐가 거의 완성되어 출산 후에도 스스로 호흡할 수 있게 되었어요. 폐포에 폐 계면활성제가 충분히 생성되고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 34) AND day_number = 5;

-- 34주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 면역 체계를 발달시키고 있어요. 엄마로부터 항체를 받아 질병에 대한 저항력을 키우고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 34) AND day_number = 6;

-- 34주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 양수 속에서 활발하게 움직이며 근육과 신경계를 발달시키고 있어요. 손가락과 발가락을 움직이며 감각을 익히고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 34) AND day_number = 7;

-- 35주 1일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 지방층이 더욱 두꺼워져 통통한 아기의 모습을 갖추었어요. 체온 조절 능력이 더욱 향상되었어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 35) AND day_number = 1;

-- 35주 2일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뇌 발달이 완성 단계에 가까워지고 있어요. 복잡한 사고와 학습을 위한 신경망이 발달하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 35) AND day_number = 2;

-- 35주 3일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 폐가 완전히 성숙하여 출산 후에도 안정적으로 호흡할 수 있어요. 폐 계면활성제 생성이 충분해요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 35) AND day_number = 3;

-- 35주 4일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '아가는 뼈가 더욱 단단해지고 있어요. 출산 후 활동을 위한 준비를 하고 있어요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 35) AND day_number = 4;

-- 35주 5일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '35주 5일차 아가는 폐 성숙을 위해 지방층을 쌓고 있어요. 폐가 완전히 발달하면 숨을 쉬기 시작할 거예요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 35) AND day_number = 5;

-- 35주 6일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '35주 6일차 아가는 이제 곧 세상에 나올 준비를 하고 있어요. 머리가 아래로 향하는 자세를 취하고 있을 가능성이 높아요.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 35) AND day_number = 6;

-- 35주 7일차: 
UPDATE content.pregnancy_day_contents SET baby_message = '35주 7일차 아가는 거의 다 자랐어요. 양수 속에서 마지막으로 살을 찌우며 세상에 나올 준비를 하고 있답니다.', updated_at = timezone('utc', now()) WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = 35) AND day_number = 7;

COMMIT;
