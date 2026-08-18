ALTER TABLE job_postings DROP CONSTRAINT IF EXISTS ck_job_postings_employment_type;
ALTER TABLE job_postings DROP COLUMN IF EXISTS employment_type;
