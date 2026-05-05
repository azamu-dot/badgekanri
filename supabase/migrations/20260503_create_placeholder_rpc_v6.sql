-- supabase/migrations/20260503_create_placeholder_rpc_v6.sql

-- JOINをLEFT JOINに変更し、データの欠落を防ぐ安全性強化版
DROP FUNCTION IF EXISTS get_listener_titles_with_placeholder(UUID);

CREATE OR REPLACE FUNCTION get_listener_titles_with_placeholder(p_period_id UUID)
RETURNS TABLE (
  res_id TEXT,
  res_listener_id UUID,
  res_period_id UUID,
  res_title_id UUID,
  res_note TEXT,
  res_is_placeholder BOOLEAN,
  res_listener_data JSONB,
  res_title_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  -- 1. 今期すでに称号が付与されているリスナー (LEFT JOINで安全性を確保)
  SELECT 
    lt.id::TEXT, 
    lt.listener_id, 
    lt.period_id, 
    lt.title_id, 
    lt.note, 
    false,
    to_jsonb(l.*),
    to_jsonb(t.*)
  FROM listener_titles lt
  LEFT JOIN listeners l ON lt.listener_id = l.id
  LEFT JOIN titles t ON lt.title_id = t.id
  WHERE lt.period_id = p_period_id

  UNION ALL

  -- 2. 今期まだ称号がないリスナー
  SELECT 
    ('placeholder-' || l.id::TEXT)::TEXT, 
    l.id, 
    p_period_id, 
    NULL::UUID, 
    NULL::TEXT, 
    true,
    to_jsonb(l.*),
    NULL::JSONB
  FROM listeners l
  WHERE l.id NOT IN (
    SELECT listener_id FROM listener_titles WHERE period_id = p_period_id
  );
END;
$$ LANGUAGE plpgsql;
