-- Create a function to create the notes table
CREATE OR REPLACE FUNCTION create_notes_table()
RETURNS void AS $$
BEGIN
    -- Create notes table if it doesn't exist
    CREATE TABLE IF NOT EXISTS notes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        is_archived BOOLEAN DEFAULT false,
        tags TEXT[]
    );

    -- Create index if it doesn't exist
    CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);

    -- Create function to automatically update updated_at if it doesn't exist
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = timezone('utc'::text, now());
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Create trigger if it doesn't exist
    DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
    CREATE TRIGGER update_notes_updated_at
        BEFORE UPDATE ON notes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
END;
$$ LANGUAGE plpgsql; 