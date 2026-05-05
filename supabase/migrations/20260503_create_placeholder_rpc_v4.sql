-- supabase/migrations/20260503_create_placeholder_rpc_v4.sql

-- 以前の関数を一度削除して確実に更新する
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
DECLARE
  v_prev_period_id UUID;
BEGIN
  -- 1. 1つ前の期間IDを取得
  SELECT sub_p.id INTO v_prev_period_id
  FROM periods sub_p
  WHERE sub_p.start_date < (SELECT p_inner.start_date FROM periods p_inner WHERE p_inner.id = p_period_id)
  ORDER BY sub_p.start_date DESC
  LIMIT 1;

  RETURN QUERY
  -- 2. カレント期間の実際のデータ
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

  -- 3. プレースホルダー（前回の称号保持者）
  SELECT 
    ('placeholder-' || pt.listener_id::TEXT)::TEXT, 
    pt.listener_id, 
    p_period_id, 
    NULL::UUID, 
    NULL::TEXT, 
    true,
    to_jsonb(l.*),
    NULL::JSONB
  FROM listener_titles pt
  JOIN listeners l ON pt.listener_id = l.id
  WHERE pt.period_id = v_prev_period_id
  AND pt.listener_id NOT IN (
    SELECT curr.listener_id FROM listener_titles curr WHERE curr.period_id = p_period_id
  );
END;
$$ LANGUAGE plpgsql;
