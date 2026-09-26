-- Notifications previously had no way to say what they were about, so
-- clicking one in the bell dropdown couldn't take you anywhere. Store the
-- in-app path to open (e.g. "/quote/<id>" or "/rfq/<id>") alongside the
-- message, set by whichever action creates the notification.
ALTER TABLE public.notifications ADD COLUMN link TEXT;
