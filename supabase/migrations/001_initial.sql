-- ============================================================
-- PsiClinic — Schema inicial
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES — dados do psicólogo
-- ============================================================
CREATE TABLE profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name         TEXT,
  crp               TEXT,
  email             TEXT,
  phone             TEXT,
  approach          TEXT,
  session_duration  INTEGER DEFAULT 50,
  session_fee       NUMERIC(10,2),
  bio               TEXT,
  avatar_url        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: own read"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: own write"
  ON profiles FOR ALL USING (auth.uid() = id);

-- ============================================================
-- PATIENTS — pacientes
-- ============================================================
CREATE TABLE patients (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id   UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name              TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  birth_date        DATE,
  cpf               TEXT,
  address           TEXT,
  status            TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo','alta')),
  session_fee       NUMERIC(10,2),
  session_frequency TEXT,
  insurance         TEXT,
  referral          TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patients: own"
  ON patients FOR ALL USING (auth.uid() = psychologist_id);

-- ============================================================
-- MEDICAL_RECORDS — prontuário estruturado (1 por paciente)
-- ============================================================
CREATE TABLE medical_records (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id              UUID NOT NULL UNIQUE REFERENCES patients ON DELETE CASCADE,
  psychologist_id         UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  main_complaint          TEXT,
  history                 TEXT,
  diagnostic_hypothesis   TEXT,
  icd_code                TEXT,
  therapeutic_plan        TEXT,
  approach                TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medical_records: own"
  ON medical_records FOR ALL USING (auth.uid() = psychologist_id);

-- ============================================================
-- SESSIONS — sessões
-- ============================================================
CREATE TABLE sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
  psychologist_id  UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 50,
  status           TEXT NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada','realizada','cancelada','falta')),
  session_number   INTEGER,
  notes            TEXT,
  evolution        TEXT,
  payment_status   TEXT NOT NULL DEFAULT 'pendente' CHECK (payment_status IN ('pendente','pago','isento')),
  fee              NUMERIC(10,2),
  modality         TEXT NOT NULL DEFAULT 'presencial' CHECK (modality IN ('presencial','online')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions: own"
  ON sessions FOR ALL USING (auth.uid() = psychologist_id);

CREATE INDEX idx_sessions_psychologist_at ON sessions (psychologist_id, scheduled_at);
CREATE INDEX idx_sessions_patient        ON sessions (patient_id);

-- ============================================================
-- SUPERVISION_RECORDS — supervisão clínica
-- ============================================================
CREATE TABLE supervision_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id  UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  supervisor_name  TEXT,
  scheduled_at     TIMESTAMPTZ,
  cases_discussed  TEXT,
  insights         TEXT,
  action_plan      TEXT,
  cost             NUMERIC(10,2),
  payment_status   TEXT NOT NULL DEFAULT 'pendente' CHECK (payment_status IN ('pendente','pago')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE supervision_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supervision_records: own"
  ON supervision_records FOR ALL USING (auth.uid() = psychologist_id);

-- ============================================================
-- FINANCIAL_TRANSACTIONS — lançamentos financeiros
-- ============================================================
CREATE TABLE financial_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id  UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  category         TEXT NOT NULL CHECK (category IN ('consultorio','pessoal')),
  type             TEXT NOT NULL CHECK (type IN ('receita','despesa')),
  description      TEXT NOT NULL,
  amount           NUMERIC(10,2) NOT NULL,
  date             DATE NOT NULL,
  patient_id       UUID REFERENCES patients ON DELETE SET NULL,
  session_id       UUID REFERENCES sessions ON DELETE SET NULL,
  payment_method   TEXT,
  status           TEXT NOT NULL DEFAULT 'confirmado' CHECK (status IN ('pendente','confirmado')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_transactions: own"
  ON financial_transactions FOR ALL USING (auth.uid() = psychologist_id);

CREATE INDEX idx_financial_psychologist ON financial_transactions (psychologist_id, date);

-- ============================================================
-- Trigger para updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at          BEFORE UPDATE ON profiles          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_patients_updated_at           BEFORE UPDATE ON patients           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_medical_records_updated_at    BEFORE UPDATE ON medical_records    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sessions_updated_at           BEFORE UPDATE ON sessions           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_supervision_records_updated_at BEFORE UPDATE ON supervision_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
