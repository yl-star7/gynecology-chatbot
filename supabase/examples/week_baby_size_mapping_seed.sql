-- Fill baby-size mappings from the dedicated week/fruit DOCX.
-- Source range: weeks 5-40.
-- Keep richer existing compare-object text when it already exists.

WITH mapping (week_number, size_label) AS (
  VALUES
    (5, '참깨알'),
    (6, '완두콩'),
    (7, '블루베리'),
    (8, '체리'),
    (9, '포도알'),
    (10, '딸기'),
    (11, '무화과'),
    (12, '자두'),
    (13, '레몬'),
    (14, '복숭아'),
    (15, '사과'),
    (16, '아보카도'),
    (17, '배'),
    (18, '피망'),
    (19, '석류'),
    (20, '바나나'),
    (21, '망고'),
    (22, '고구마'),
    (23, '자몽'),
    (24, '옥수수'),
    (25, '단호박'),
    (26, '양상추'),
    (27, '콜리플라워'),
    (28, '가지'),
    (29, '땅콩 호박'),
    (30, '양배추'),
    (31, '코코넛'),
    (32, '샐러리'),
    (33, '파인애플'),
    (34, '멜론'),
    (35, '허니듀 멜론'),
    (36, '로메인 상추'),
    (37, '대파'),
    (38, '무'),
    (39, '수박'),
    (40, '호박')
)
UPDATE content.pregnancy_week_data AS week_data
SET
  baby_size_label = mapping.size_label,
  baby_size_compare_object = CASE
    WHEN week_data.baby_size_compare_object IS NULL
      OR btrim(week_data.baby_size_compare_object) = ''
    THEN mapping.size_label
    ELSE week_data.baby_size_compare_object
  END,
  updated_at = timezone('utc', now())
FROM mapping
WHERE week_data.week_number = mapping.week_number;
