CREATE TABLE IF NOT EXISTS summaries (id TEXT PRIMARY KEY, paper_id TEXT REFERENCES papers(id) ON DELETE CASCADE, tldr TEXT[] NOT NULL DEFAULT '{}', key_innovation TEXT[] NOT NULL DEFAULT '{}', practical_applications TEXT[] NOT NULL DEFAULT '{}', limitations_future_work TEXT[] NOT NULL DEFAULT '{}', key_terms JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()), updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())); CREATE INDEX IF NOT EXISTS idx_summaries_paper_id ON summaries(paper_id); COMMENT ON TABLE summaries IS 'Stores AI paper summaries with structured sections';

-- Create a function to handle summary generation in a transaction
CREATE OR REPLACE FUNCTION generate_summary(p_paper_id TEXT, p_summary JSONB)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Start transaction
    BEGIN
        -- Delete any existing summary for this paper
        DELETE FROM summaries WHERE paper_id = p_paper_id;
        
        -- Insert new summary
        INSERT INTO summaries (id, paper_id, tldr, key_terms, methodology, results, limitations_future_work)
        VALUES (
            gen_random_uuid()::text,
            p_paper_id,
            p_summary->>'tldr',
            p_summary->'key_terms',
            p_summary->'methodology',
            p_summary->'results',
            p_summary->'limitations_future_work'
        );
        
        -- Update paper has_summary flag
        UPDATE papers SET has_summary = true WHERE id = p_paper_id;
        
        -- Commit transaction
        COMMIT;
    EXCEPTION WHEN OTHERS THEN
        -- Rollback on error
        ROLLBACK;
        RAISE;
    END;
END;
$$;
