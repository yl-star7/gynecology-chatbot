BEGIN;

WITH fruit_map (week_number, fruit_name) AS (
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
    (25, '단호박')
)
UPDATE public.pregnancy_weeks pw
SET
  baby_size_label = fruit_map.fruit_name,
  baby_size_compare_object = fruit_map.fruit_name,
  updated_at = timezone('utc', now())
FROM fruit_map
WHERE pw.week_number = fruit_map.week_number;

COMMIT;
