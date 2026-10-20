-- BlurSpot PostgreSQL Schema Migration
-- Run: psql -U postgres -d blurspot -f 001_schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  phone         VARCHAR(50),
  address       TEXT,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'authority')),
  department    VARCHAR(100),
  verified      BOOLEAN NOT NULL DEFAULT FALSE,
  karma         INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. otp_verifications
CREATE TABLE IF NOT EXISTS otp_verifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_code   VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_user_id ON otp_verifications(user_id);

-- 3. authorities
CREATE TABLE IF NOT EXISTS authorities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255),
  department    VARCHAR(100) NOT NULL,
  location      VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_authorities_department ON authorities(department);

-- 4. reports
CREATE TABLE IF NOT EXISTS reports (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                VARCHAR(500),
  description          TEXT NOT NULL,
  type                 VARCHAR(100) NOT NULL,
  category             VARCHAR(100) NOT NULL,
  seriousness          VARCHAR(50) NOT NULL DEFAULT 'medium',
  priority_score       NUMERIC(6,2) NOT NULL DEFAULT 0,
  latitude             NUMERIC(10,7) NOT NULL,
  longitude            NUMERIC(10,7) NOT NULL,
  status               VARCHAR(50) NOT NULL DEFAULT 'Reported',
  noticed_time         VARCHAR(255),
  awaiting_verification BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status   ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_type     ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_user_id  ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports(latitude, longitude);

-- 5. report_images
CREATE TABLE IF NOT EXISTS report_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  image_key   TEXT,
  is_proof    BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_images_report_id ON report_images(report_id);

-- 6. report_timeline
CREATE TABLE IF NOT EXISTS report_timeline (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id  UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  status     VARCHAR(50) NOT NULL,
  note       TEXT,
  updated_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_report_id ON report_timeline(report_id);

-- 7. report_upvotes
CREATE TABLE IF NOT EXISTS report_upvotes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id  UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(report_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_upvotes_report_id ON report_upvotes(report_id);
CREATE INDEX IF NOT EXISTS idx_upvotes_user_id   ON report_upvotes(user_id);

-- 8. report_verifications
CREATE TABLE IF NOT EXISTS report_verifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id  UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action     VARCHAR(20) NOT NULL CHECK (action IN ('verify', 'reject')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(report_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_verifications_report_id ON report_verifications(report_id);

-- 9. notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(100) NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
