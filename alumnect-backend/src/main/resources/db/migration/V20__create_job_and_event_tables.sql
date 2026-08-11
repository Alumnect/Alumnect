-- =====================================================================
-- AlumNect (ACCP)
-- V20: Create events and job_postings tables
-- =====================================================================

-- 1. Create events table
CREATE TABLE events (
    id               BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organizer_id     BIGINT        NOT NULL,
    title            VARCHAR(200)  NOT NULL,
    description      TEXT,
    cover_image_url  VARCHAR(500),
    location         VARCHAR(255),
    start_time       TIMESTAMPTZ   NOT NULL,
    end_time         TIMESTAMPTZ,
    capacity         INTEGER,
    attendee_count   INTEGER       NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT fk_events_organizer_id FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Create job_postings table
CREATE TABLE job_postings (
    id               BIGINT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    poster_id        BIGINT         NOT NULL,
    title            VARCHAR(200)   NOT NULL,
    company          VARCHAR(150)   NOT NULL,
    location         VARCHAR(150),
    employment_type  VARCHAR(20)    NOT NULL DEFAULT 'FULL_TIME',
    description      TEXT           NOT NULL,
    requirements     TEXT,
    salary_min       NUMERIC(12,2),
    salary_max       NUMERIC(12,2),
    apply_url        VARCHAR(500),
    contact_email    VARCHAR(255),
    purchase_id      BIGINT,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT ck_job_postings_employment_type CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT')),
    CONSTRAINT fk_job_postings_poster_id FOREIGN KEY (poster_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Update foreign keys in posts for events and job_postings
ALTER TABLE posts ADD CONSTRAINT fk_posts_event_id FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;
ALTER TABLE posts ADD CONSTRAINT fk_posts_job_id FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE SET NULL;
