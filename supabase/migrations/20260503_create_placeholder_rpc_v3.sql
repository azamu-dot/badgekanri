-- supabase/migrations/20260503_create_placeholder_rpc_v3.sql

-- 期間IDを渡し、その期間のリスナー称号一覧（プレースホルダー含む）を返すRPC関数
-- 型キャストを明示し、出力カラム名の衝突を完全に排除した決定版。

CREATE OR REPLACE FUNCTION get_listener_titles_with_placeholder(p_period_id UUID)
RETURNS TABLE (
  res_id TEXT,
  res_listener_id UUID,
  res_period_id UUID,
  res_title_id UUID,
  res_note TEXT,
  res_is_placeholder BOOLEAN,
  res_listener_data JSON,
  res_title_data JSON
) AS $$
DECLARE
  v_prev_period_id UUID;
BEGIN
  -- 1. 対象期間の1つ前の期間IDを取得
  SELECT sub_p.id INTO v_prev_period_id
  FROM periods sub_p
  WHERE sub_p.start_date < (SELECT p_inner.start_date FROM periods p_inner WHERE p_inner.id = p_period_id)
  ORDER BY sub_p.start_date DESC
  LIMIT 1;

  RETURN QUERY
  -- 2. カレント期間の実際のデータ
  SELECT 
    lt.id::TEXT AS res_id, 
    lt.listener_id AS res_listener_id, 
    lt.period_id AS res_period_id, 
    lt.title_id AS res_title_id, 
    lt.note AS res_note, 
    false AS res_is_placeholder,
    row_to_json(l.*) AS res_listener_data,
    row_to_json(t.*) AS res_title_data
  FROM listener_titles lt
  JOIN listeners l ON lt.listener_id = l.id
  LEFT JOIN titles t ON lt.title_id = t.id
  WHERE lt.period_id = p_period_id

  UNION ALL

  -- 3. 先月は称号があったが、今月はまだ無いリスナー（プレースホルダー）
  SELECT 
    ('placeholder-' || pt.listener_id::TEXT)::TEXT AS res_id, 
    pt.listener_id AS res_listener_id, 
    p_period_id AS res_period_id, 
    NULL::UUID AS res_title_id, 
    NULL::TEXT AS res_note, 
    true AS res_is_placeholder,
    row_to_json(l.*) AS res_listener_data,
    NULL::JSON AS res_title_data
  FROM listener_titles pt
  JOIN listeners l ON pt.listener_id = l.id
  WHERE pt.period_id = v_prev_period_id
  AND pt.listener_id NOT IN (
    -- 今月すでに称号が付与されているリスナーを除外
    SELECT curr.listener_id FROM listener_titles curr WHERE curr.period_id = p_period_id
  );
END;
$$ LANGUAGE plpgsql;
