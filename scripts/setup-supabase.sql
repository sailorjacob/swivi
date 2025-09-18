-- Run this in your Supabase SQL Editor to set up storage buckets and policies

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('clips', 'clips', true),
  ('avatars', 'avatars', true),
  ('campaign-assets', 'campaign-assets', true);

-- Enable RLS (Row Level Security)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policies for clips bucket (authenticated users can upload, everyone can view)
CREATE POLICY "Authenticated users can upload clips" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'clips' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view clips" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'clips');

CREATE POLICY "Users can update own clips" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'clips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own clips" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'clips' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policies for avatars bucket
CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatars" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatars" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policies for campaign assets (admins only)
CREATE POLICY "Admins can manage campaign assets" 
ON storage.objects FOR ALL 
USING (bucket_id = 'campaign-assets' AND auth.jwt()->>'role' = 'admin');

CREATE POLICY "Anyone can view campaign assets" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'campaign-assets');
