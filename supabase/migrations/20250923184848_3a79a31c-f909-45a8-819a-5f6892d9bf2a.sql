-- Add additional profile fields for comprehensive user information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_url TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT;