-- Script to modify summaries table for the new structure

-- First, check if the summaries table exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'summaries') THEN
    CREATE TABLE summaries (
      id TEXT PRIMARY KEY,
      paper_id TEXT NOT NULL REFERENCES papers(id),
      tldr TEXT[] DEFAULT '{}',
      key_innovation TEXT[] DEFAULT '{}',
      practical_applications TEXT[] DEFAULT '{}',
      limitations_future_work TEXT[] DEFAULT '{}',
      key_terms JSONB DEFAULT '{}',
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
      ALTER TABLE summaries ADD COLUMN key_innovation TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add practical_applications column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'summaries' AND column_name = 'practical_applications'
    ) THEN
      ALTER TABLE summaries ADD COLUMN practical_applications TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add limitations_future_work column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'summaries' AND column_name = 'limitations_future_work'
    ) THEN
      ALTER TABLE summaries ADD COLUMN limitations_future_work TEXT[] DEFAULT '{}';
    END IF;
    
    -- If key_points exists, check its type and convert/rename if needed
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'summaries' AND column_name = 'key_points'
    ) THEN
      -- If not an array, convert it
      IF NOT (
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'summaries' AND column_name = 'key_points'
      ) = 'ARRAY' THEN
        ALTER TABLE summaries 
        ALTER COLUMN key_points TYPE TEXT[] USING ARRAY[key_points];
      END IF;
      
      -- Rename if practical_applications doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'summaries' AND column_name = 'practical_applications'
      ) THEN
        ALTER TABLE summaries RENAME COLUMN key_points TO practical_applications;
      END IF;
    END IF;
    
    -- If business_implications exists, check its type and convert/rename if needed
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'summaries' AND column_name = 'business_implications'
    ) THEN
      -- If not an array, convert it
      IF NOT (
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'summaries' AND column_name = 'business_implications'
      ) = 'ARRAY' THEN
        ALTER TABLE summaries 
        ALTER COLUMN business_implications TYPE TEXT[] USING ARRAY[business_implications];
      END IF;
      
      -- Rename if limitations_future_work doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'summaries' AND column_name = 'limitations_future_work'
      ) THEN
        ALTER TABLE summaries RENAME COLUMN business_implications TO limitations_future_work;
      END IF;
    END IF;
    
    -- Make sure tldr is an array
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'summaries' AND column_name = 'tldr'
    ) AND NOT (
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'summaries' AND column_name = 'tldr'
    ) = 'ARRAY' THEN
      ALTER TABLE summaries 
      ALTER COLUMN tldr TYPE TEXT[] USING ARRAY[tldr];
    END IF;
  END IF;
END
$$;

-- Check and update the key_innovation column to ensure it's a text array
DO $$
BEGIN
  -- Make sure key_innovation exists 
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'summaries' AND column_name = 'key_innovation'
  ) AND NOT (
    SELECT data_type FROM information_schema.columns 
    WHERE table_name = 'summaries' AND column_name = 'key_innovation'
  ) = 'ARRAY' THEN
    -- Convert to text array if it's not already
    ALTER TABLE summaries 
    ALTER COLUMN key_innovation TYPE TEXT[] USING ARRAY[key_innovation];
  END IF;
END
$$;

-- Comment to help future developers
COMMENT ON COLUMN summaries.key_innovation IS 'Array of strings containing key innovation points from the paper summary';
COMMENT ON COLUMN summaries.tldr IS 'Array of strings containing TLDR points from the paper summary';
COMMENT ON COLUMN summaries.practical_applications IS 'Array of strings containing practical application points from the paper summary';
COMMENT ON COLUMN summaries.limitations_future_work IS 'Array of strings containing limitations and future work points from the paper summary'; 