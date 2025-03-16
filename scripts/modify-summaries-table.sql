-- Script to modify summaries table for the new structure

-- First, check if the summaries table exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'summaries') THEN
    CREATE TABLE summaries (
      id TEXT PRIMARY KEY,
      paper_id TEXT NOT NULL REFERENCES papers(id),
      tldr TEXT,
      key_innovation TEXT,
      practical_applications JSONB,
      limitations_future_work JSONB,
      key_terms JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  ELSE
    -- Update existing summaries table to the new structure
    
    -- Add key_innovation column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'summaries' AND column_name = 'key_innovation'
    ) THEN
      ALTER TABLE summaries ADD COLUMN key_innovation TEXT;
    END IF;
    
    -- Add practical_applications column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'summaries' AND column_name = 'practical_applications'
    ) THEN
      ALTER TABLE summaries ADD COLUMN practical_applications JSONB;
    END IF;
    
    -- Add limitations_future_work column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'summaries' AND column_name = 'limitations_future_work'
    ) THEN
      ALTER TABLE summaries ADD COLUMN limitations_future_work JSONB;
    END IF;
    
    -- If key_points exists, rename it to practical_applications as a fallback
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'summaries' AND column_name = 'key_points'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'summaries' AND column_name = 'practical_applications'
    ) THEN
      ALTER TABLE summaries RENAME COLUMN key_points TO practical_applications;
    END IF;
    
    -- If business_implications exists, rename it to limitations_future_work as a fallback
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'summaries' AND column_name = 'business_implications'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'summaries' AND column_name = 'limitations_future_work'
    ) THEN
      ALTER TABLE summaries RENAME COLUMN business_implications TO limitations_future_work;
    END IF;
  END IF;
END
$$;

-- Add key_innovation column to summaries table
ALTER TABLE summaries 
ADD COLUMN IF NOT EXISTS key_innovation text[] DEFAULT '{}';

-- Ensure the column allows array of strings
ALTER TABLE summaries 
ALTER COLUMN key_innovation SET DEFAULT '{}';

-- Comment to help future developers
COMMENT ON COLUMN summaries.key_innovation IS 'Array of strings containing key innovation points from the paper summary'; 