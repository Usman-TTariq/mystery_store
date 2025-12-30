-- Enable RLS on faqs table if not already enabled
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view faqs" ON faqs;
DROP POLICY IF EXISTS "Allow public insert access to faqs" ON faqs;
DROP POLICY IF EXISTS "Allow public update access to faqs" ON faqs;
DROP POLICY IF EXISTS "Allow public delete access to faqs" ON faqs;

-- Create policies for public access (consistent with other tables in this project)

-- Allow anyone to read faqs
CREATE POLICY "Public can view faqs"
ON faqs FOR SELECT
USING (true);

-- Allow anyone to insert faqs
CREATE POLICY "Allow public insert access to faqs"
ON faqs FOR INSERT
WITH CHECK (true);

-- Allow anyone to update faqs
CREATE POLICY "Allow public update access to faqs"
ON faqs FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow anyone to delete faqs
CREATE POLICY "Allow public delete access to faqs"
ON faqs FOR DELETE
USING (true);
