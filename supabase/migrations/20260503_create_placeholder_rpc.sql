-- supabase/migrations/20260503_create_placeholder_rpc.sql

-- 期間IDを渡し、その期間のリスナー称号一覧（プレースホルダー含む）を返すRPC関数
-- フロントエンドでの重いループ処理をDB側にオフロードします。

CREATE OR REPLACE FUNCTION get_listener_titles_with_placeholder(p_period_id UUID)
RETURNS TABLE (
  id TEXT,
  listener_id UUID,
  period_id UUID,
  title_id UUID,
  note TEXT,
  is_placeholder BOOLEAN,
  listener_data JSON,
  title_data JSON
) AS $$
DECLARE
  v_prev_period_id UUID;
BEGIN
  -- 1. 対象期間の1つ前の期間IDを取得
  SELECT p.id INTO v_prev_period_id
  FROM periods p
  WHERE p.start_date < (SELECT start_date FROM periods WHERE id = p_period_id)
  ORDER BY p.start_date DESC
  LIMIT 1;

  RETURN QUERY
  -- 2. カレント期間の実際のデータ
  SELECT 
    lt.id::TEXT, lt.listener_id, lt.period_id, lt.title_id, lt.note, 
    false AS is_placeholder,
    row_to_json(l.*) AS listener_data,
    row_to_json(t.*) AS title_data
  FROM listener_titles lt
  JOIN listeners l ON lt.listener_id = l.id
  LEFT JOIN titles t ON lt.title_id = t.id
  WHERE lt.period_id = p_period_id

  UNION ALL

  -- 3. 先月は称号があったが、今月はまだ無いリスナー（プレースホルダー）
  SELECT 
    'placeholder-' || pt.listener_id AS id, 
    pt.listener_id, 
    p_period_id AS period_id, 
    NULL::UUID AS title_id, 
    NULL AS note, 
    true AS is_placeholder,
    row_to_json(l.*) AS listener_data,
    NULL::JSON AS title_data
  FROM listener_titles pt
  JOIN listeners l ON pt.listener_id = l.id
  WHERE pt.period_id = v_prev_period_id
  AND pt.listener_id NOT IN (
    -- 今月すでに称号が付与されているリスナーを除外
    SELECT curr.listener_id FROM listener_titles curr WHERE curr.period_id = p_period_id
  );
END;
$$ LANGUAGE plpgsql;
