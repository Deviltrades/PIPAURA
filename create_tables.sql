CREATE TABLE IF NOT EXISTS currency_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  currency TEXT NOT NULL CHECK (char_length(currency)=3),
  data_score INT NOT NULL DEFAULT 0,
  cb_tone_score INT NOT NULL DEFAULT 0,
  commodity_score INT NOT NULL DEFAULT 0,
  sentiment_score INT NOT NULL DEFAULT 0,
  market_score INT NOT NULL DEFAULT 0,
  total_score INT NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_currency_scores_window
ON currency_scores (currency, window_end DESC);

CREATE TABLE IF NOT EXISTS fundamental_bias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair TEXT NOT NULL UNIQUE,
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  base_score INT NOT NULL,
  quote_score INT NOT NULL,
  total_bias INT NOT NULL,
  bias_text TEXT NOT NULL,
  summary TEXT NOT NULL,
  confidence INT NOT NULL DEFAULT 50,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fundamental_bias_pair ON fundamental_bias (pair);

ALTER TABLE currency_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundamental_bias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access to fundamental_bias" ON fundamental_bias;
CREATE POLICY "Public read access to fundamental_bias"
ON fundamental_bias FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Service role write to fundamental_bias" ON fundamental_bias;
CREATE POLICY "Service role write to fundamental_bias"  
ON fundamental_bias FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role access to currency_scores" ON currency_scores;
CREATE POLICY "Service role access to currency_scores"
ON currency_scores FOR ALL TO public USING (true) WITH CHECK (true);

-- Index bias table for global stock indices
CREATE TABLE IF NOT EXISTS index_bias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument TEXT NOT NULL UNIQUE,
  score INT NOT NULL,
  bias_text TEXT NOT NULL,
  summary TEXT NOT NULL,
  confidence INT NOT NULL DEFAULT 50,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_index_bias_instr ON index_bias (instrument);

ALTER TABLE index_bias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access to index_bias" ON index_bias;
CREATE POLICY "Public read access to index_bias"
ON index_bias FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Service role write to index_bias" ON index_bias;
CREATE POLICY "Service role write to index_bias"  
ON index_bias FOR ALL TO public USING (true) WITH CHECK (true);
