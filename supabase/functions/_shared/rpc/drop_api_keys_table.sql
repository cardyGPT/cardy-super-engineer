
CREATE OR REPLACE FUNCTION public.drop_api_keys_table()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DROP TABLE IF EXISTS public.api_keys;
    RETURN 'api_keys table has been dropped';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error dropping api_keys table: ' || SQLERRM;
END;
$$;
