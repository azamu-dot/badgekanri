-- supabase/migrations/20260503_create_placeholder_rpc_v5.sql

-- 以前の関数をDROPして確実に更新
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
  -- 1. 今期すでに称号が付与されているリスナー
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
  JOIN listeners l ON lt.listener_id = l.id
  LEFT JOIN titles t ON lt.title_id = t.id
  WHERE lt.period_id = p_period_id

  UNION ALL

  -- 2. 今期まだ称号がない「すべての」リスナー（プレースホルダーとして表示）
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
    -- 今期の listener_titles に存在しないリスナーだけを抽出
    SELECT listener_id FROM listener_titles WHERE period_id = p_period_id
  );
END;
$$ LANGUAGE plpgsql;
