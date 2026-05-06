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
INSERT INTO content.pregnancy_week_data (
  week_number,
  title,
  baby_size_label,
  baby_size_compare_object,
  status,
  created_at,
  updated_at
)
SELECT
  fruit_map.week_number,
  fruit_map.week_number || '주차',
  fruit_map.fruit_name,
  fruit_map.fruit_name,
  'draft',
  timezone('utc', now()),
  timezone('utc', now())
FROM fruit_map
ON CONFLICT (week_number) DO UPDATE
SET
  baby_size_label = EXCLUDED.baby_size_label,
  baby_size_compare_object = EXCLUDED.baby_size_compare_object,
  updated_at = timezone('utc', now());

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'content'
      AND table_name = 'pregnancy_weeks'
  ) THEN
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
    INSERT INTO content.pregnancy_weeks (
      week_number,
      title,
      baby_size_label,
      baby_size_compare_object,
      status,
      created_at,
      updated_at
    )
    SELECT
      fruit_map.week_number,
      fruit_map.week_number || '주차',
      fruit_map.fruit_name,
      fruit_map.fruit_name,
      'draft',
      timezone('utc', now()),
      timezone('utc', now())
    FROM fruit_map
    ON CONFLICT (week_number) DO UPDATE
    SET
      baby_size_label = EXCLUDED.baby_size_label,
      baby_size_compare_object = EXCLUDED.baby_size_compare_object,
      updated_at = timezone('utc', now());
  END IF;
END $$;

COMMIT;
