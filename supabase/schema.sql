-- ============================================================
-- BadgeKanri App — Supabase Database Schema
-- ============================================================
-- このファイルをSupabaseのSQL Editorで実行してください。
-- 上から順番に実行することで依存関係の問題を回避できます。
-- ============================================================

-- 拡張機能の有効化（UUIDサポート）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. listeners（リスナー情報）
-- ============================================================
-- 過去に入力されたリスナー名をサジェスト候補として保存するマスタテーブル。
CREATE TABLE IF NOT EXISTS listeners (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  note        TEXT,                           -- メモ（任意）
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT listeners_name_unique UNIQUE (name)
);

-- ============================================================
-- 2. periods（集計期間）
-- ============================================================
-- 月単位、または任意の日数で区切った集計期間を管理する。
CREATE TABLE IF NOT EXISTS periods (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label       TEXT NOT NULL,                 -- 表示名（例: "2024年5月", "特別期間A"）
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  is_monthly  BOOLEAN NOT NULL DEFAULT TRUE, -- 月単位か任意期間か
  is_active   BOOLEAN NOT NULL DEFAULT FALSE,-- 現在の集計期間か
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT periods_date_check CHECK (end_date >= start_date)
);

-- ============================================================
-- 3. titles（称号マスタ）
-- ============================================================
-- 称号の名称とカラーコードを管理する。後から追加・変更可能。
CREATE TABLE IF NOT EXISTS titles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,                 -- 称号名（例: "ダイヤモンド", "ゴールド"）
  color_code  TEXT NOT NULL DEFAULT '#888888', -- カラーコード（HEX形式）
  description TEXT,                          -- 説明（任意）
  sort_order  INTEGER NOT NULL DEFAULT 0,    -- 表示順（グレード順などに使用）
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT titles_name_unique UNIQUE (name)
);

-- ============================================================
-- 4. listener_titles（リスナーと称号の紐付け）
-- ============================================================
-- 誰が・どの期間に・どの称号を取得したか。
-- 連続取得回数はクエリで動的に算出するため、ここには持たない設計。
-- 同一リスナー×同一期間のレコードは1件のみ（称号変更は UPDATE で対応）。
CREATE TABLE IF NOT EXISTS listener_titles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listener_id UUID NOT NULL REFERENCES listeners(id) ON DELETE CASCADE,
  period_id   UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  title_id    UUID NOT NULL REFERENCES titles(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- 付与・更新日時
  note        TEXT,                                -- メモ（任意）
  CONSTRAINT listener_titles_unique UNIQUE (listener_id, period_id)
);

-- ============================================================
-- 5. rewards（称号に対する特典）
-- ============================================================
-- 各称号に紐づく特典を管理する。
-- deadline_type: 'monthly'（月リセット）| 'fixed'（任意期限）| 'permanent'（永続）| 'none'（なし）
CREATE TABLE IF NOT EXISTS rewards (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_id         UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,            -- 特典名（例: "コラボ権", "優先視聴"）
  description      TEXT,                    -- 詳細説明
  deadline_type    TEXT NOT NULL DEFAULT 'none'
                     CHECK (deadline_type IN ('monthly', 'fixed', 'permanent', 'none')),
  fixed_deadline   DATE,                    -- deadline_type = 'fixed' のときのみ使用
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. listener_rewards（リスナーごとの特典実行状況）
-- ============================================================
-- 各リスナーが各特典を消化したか否かを管理する。
CREATE TABLE IF NOT EXISTS listener_rewards (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listener_title_id UUID NOT NULL REFERENCES listener_titles(id) ON DELETE CASCADE,
  reward_id         UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  is_done           BOOLEAN NOT NULL DEFAULT FALSE, -- 実行済みか
  done_at           TIMESTAMPTZ,                    -- 実行日時
  note              TEXT,
  CONSTRAINT listener_rewards_unique UNIQUE (listener_title_id, reward_id)
);

-- ============================================================
-- 7. my_activities（ライバー自身の他枠での称号記録）
-- ============================================================
-- ライバー自身が他の配信で獲得した称号をメモとして記録する独立テーブル。
CREATE TABLE IF NOT EXISTS my_activities (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,  -- 獲得日
  streamer_name TEXT NOT NULL,                        -- 配信者名（枠の主）
  title_name    TEXT NOT NULL,                        -- 獲得した称号名
  note          TEXT,                                 -- メモ
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- インデックスの作成（検索パフォーマンス向上）
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_listener_titles_listener ON listener_titles(listener_id);
CREATE INDEX IF NOT EXISTS idx_listener_titles_period   ON listener_titles(period_id);
CREATE INDEX IF NOT EXISTS idx_listener_titles_title    ON listener_titles(title_id);
CREATE INDEX IF NOT EXISTS idx_listener_rewards_lt      ON listener_rewards(listener_title_id);
CREATE INDEX IF NOT EXISTS idx_rewards_title            ON rewards(title_id);
CREATE INDEX IF NOT EXISTS idx_my_activities_date       ON my_activities(activity_date);

-- ============================================================
-- Row Level Security（RLS）の設定
-- ============================================================
-- ※ 認証なしで使用する場合は以下のポリシーを設定してください。
-- ※ 認証を追加する場合は適宜変更してください。

ALTER TABLE listeners        ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods          ENABLE ROW LEVEL SECURITY;
ALTER TABLE titles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE listener_titles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards          ENABLE ROW LEVEL SECURITY;
ALTER TABLE listener_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE my_activities    ENABLE ROW LEVEL SECURITY;

-- 全操作を許可するポリシー（認証なし運用の場合）
CREATE POLICY "allow_all_listeners"        ON listeners        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_periods"          ON periods          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_titles"           ON titles           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_listener_titles"  ON listener_titles  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_rewards"          ON rewards          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_listener_rewards" ON listener_rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_my_activities"    ON my_activities    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_listeners_updated_at
  BEFORE UPDATE ON listeners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_titles_updated_at
  BEFORE UPDATE ON titles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_my_activities_updated_at
  BEFORE UPDATE ON my_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- サンプルデータ（初期確認用）
-- ============================================================
-- 称号マスタの初期データ
INSERT INTO titles (name, color_code, description, sort_order) VALUES
  ('ダイヤモンド', '#00BFFF', '最高ランクの称号', 1),
  ('プラチナ',    '#E5E4E2', 'プラチナランクの称号', 2),
  ('ゴールド',    '#FFD700', 'ゴールドランクの称号', 3),
  ('シルバー',    '#C0C0C0', 'シルバーランクの称号', 4),
  ('ブロンズ',    '#CD7F32', 'ブロンズランクの称号', 5)
ON CONFLICT (name) DO NOTHING;

-- 今月の集計期間（サンプル）
INSERT INTO periods (label, start_date, end_date, is_monthly, is_active) VALUES
  (
    TO_CHAR(CURRENT_DATE, 'YYYY年MM月'),
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE,
    TRUE,
    TRUE
  )
ON CONFLICT DO NOTHING;
