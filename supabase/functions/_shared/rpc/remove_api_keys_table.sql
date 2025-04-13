
CREATE OR REPLACE FUNCTION public.remove_api_keys_table()
RETURNS VOID AS $$
BEGIN
  DROP TABLE IF EXISTS public.api_keys;
  RAISE NOTICE 'api_keys table dropped';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
