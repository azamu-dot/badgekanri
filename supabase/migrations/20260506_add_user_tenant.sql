-- 1. 各テーブルに user_id を追加 (auth.uid() をデフォルトに設定)
ALTER TABLE listeners ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE periods ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE titles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE listener_titles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE rewards ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE listener_rewards ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE my_activities ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

-- 2. 一意制約の更新 (テナント間で同じ名前を許容するため)
ALTER TABLE listeners DROP CONSTRAINT IF EXISTS listeners_name_unique;
ALTER TABLE listeners ADD CONSTRAINT listeners_name_user_id_unique UNIQUE (name, user_id);

ALTER TABLE titles DROP CONSTRAINT IF EXISTS titles_name_unique;
ALTER TABLE titles ADD CONSTRAINT titles_name_user_id_unique UNIQUE (name, user_id);

-- 3. 既存のガバガバなポリシーを削除 (もしあれば)
DROP POLICY IF EXISTS "allow_all_listeners" ON listeners;
DROP POLICY IF EXISTS "allow_all_periods" ON periods;
DROP POLICY IF EXISTS "allow_all_titles" ON titles;
DROP POLICY IF EXISTS "allow_all_listener_titles" ON listener_titles;
DROP POLICY IF EXISTS "allow_all_rewards" ON rewards;
DROP POLICY IF EXISTS "allow_all_listener_rewards" ON listener_rewards;
DROP POLICY IF EXISTS "allow_all_my_activities" ON my_activities;

-- 4. RLS を再有効化 (念のため)
ALTER TABLE listeners ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listener_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE listener_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE my_activities ENABLE ROW LEVEL SECURITY;

-- 5. 認証ユーザーが自分自身のデータのみ操作できるポリシーを作成
CREATE POLICY "user_can_manage_own_listeners" ON listeners FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_can_manage_own_periods" ON periods FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_can_manage_own_titles" ON titles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_can_manage_own_listener_titles" ON listener_titles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_can_manage_own_rewards" ON rewards FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_can_manage_own_listener_rewards" ON listener_rewards FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_can_manage_own_my_activities" ON my_activities FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
