CREATE OR REPLACE FUNCTION public.sync_day_content_baby_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.content_pregnancy_day_contents
  SET baby_message = NEW.baby_message,
      updated_at   = timezone('utc', now())
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_baby_message ON content.pregnancy_day_contents;

CREATE TRIGGER trg_sync_baby_message
AFTER UPDATE OF baby_message ON content.pregnancy_day_contents
FOR EACH ROW
EXECUTE FUNCTION public.sync_day_content_baby_message();
