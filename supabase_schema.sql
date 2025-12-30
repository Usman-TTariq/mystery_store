-- ============================================
-- Supabase Database Schema for Coupon Store
-- ============================================
-- Copy and paste this entire file into Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (CAUTION: This will delete all data!)
-- Uncomment the following lines if you want to start fresh:
-- DROP TABLE IF EXISTS click_tracking CASCADE;
-- DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;
-- DROP TABLE IF EXISTS contact_submissions CASCADE;
-- DROP TABLE IF EXISTS coupons CASCADE;
-- DROP TABLE IF EXISTS stores CASCADE;
-- DROP TABLE IF EXISTS banners CASCADE;
-- DROP TABLE IF EXISTS articles CASCADE;
-- DROP TABLE IF EXISTS faqs CASCADE;
-- DROP TABLE IF EXISTS system_pages CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon_url TEXT,
  background_color TEXT DEFAULT '#000000',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id column to stores if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE stores ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sub_store_name TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  voucher_text TEXT,
  seo_title TEXT,
  seo_description TEXT,
  featured BOOLEAN DEFAULT false,
  layout_position INTEGER,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to stores if table already exists
DO $$ 
BEGIN
  -- Add sub_store_name if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'sub_store_name') THEN
    ALTER TABLE stores ADD COLUMN sub_store_name TEXT;
  END IF;
  -- Add slug if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'slug') THEN
    ALTER TABLE stores ADD COLUMN slug TEXT UNIQUE;
  END IF;
  -- Add voucher_text if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'voucher_text') THEN
    ALTER TABLE stores ADD COLUMN voucher_text TEXT;
  END IF;
  -- Add seo_title if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'seo_title') THEN
    ALTER TABLE stores ADD COLUMN seo_title TEXT;
  END IF;
  -- Add seo_description if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'seo_description') THEN
    ALTER TABLE stores ADD COLUMN seo_description TEXT;
  END IF;
  -- Add featured if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'featured') THEN
    ALTER TABLE stores ADD COLUMN featured BOOLEAN DEFAULT false;
  END IF;
  -- Add layout_position if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'layout_position') THEN
    ALTER TABLE stores ADD COLUMN layout_position INTEGER;
  END IF;
END $$;

-- Add category_id column to coupons if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coupons' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE coupons ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  store_name TEXT,
  store_ids UUID[] DEFAULT ARRAY[]::UUID[],
  code TEXT,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  max_uses INTEGER DEFAULT 0,
  current_uses INTEGER DEFAULT 0,
  expiry_date TIMESTAMP WITH TIME ZONE,
  logo_url TEXT,
  url TEXT,
  coupon_type TEXT CHECK (coupon_type IN ('code', 'deal')),
  get_code_text TEXT,
  get_deal_text TEXT,
  featured BOOLEAN DEFAULT false,
  layout_position INTEGER,
  is_latest BOOLEAN DEFAULT false,
  latest_layout_position INTEGER,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to coupons if table already exists
DO $$ 
BEGIN
  -- Add store_name if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'store_name') THEN
    ALTER TABLE coupons ADD COLUMN store_name TEXT;
  END IF;
  -- Add store_ids if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'store_ids') THEN
    ALTER TABLE coupons ADD COLUMN store_ids UUID[] DEFAULT ARRAY[]::UUID[];
  END IF;
  -- Add logo_url if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'logo_url') THEN
    ALTER TABLE coupons ADD COLUMN logo_url TEXT;
  END IF;
  -- Add url if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'url') THEN
    ALTER TABLE coupons ADD COLUMN url TEXT;
  END IF;
  -- Add coupon_type if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'coupon_type') THEN
    ALTER TABLE coupons ADD COLUMN coupon_type TEXT CHECK (coupon_type IN ('code', 'deal'));
  END IF;
  -- Add get_code_text if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'get_code_text') THEN
    ALTER TABLE coupons ADD COLUMN get_code_text TEXT;
  END IF;
  -- Add get_deal_text if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'get_deal_text') THEN
    ALTER TABLE coupons ADD COLUMN get_deal_text TEXT;
  END IF;
  -- Add featured if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'featured') THEN
    ALTER TABLE coupons ADD COLUMN featured BOOLEAN DEFAULT false;
  END IF;
  -- Add layout_position if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'layout_position') THEN
    ALTER TABLE coupons ADD COLUMN layout_position INTEGER;
  END IF;
  -- Add is_latest if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'is_latest') THEN
    ALTER TABLE coupons ADD COLUMN is_latest BOOLEAN DEFAULT false;
  END IF;
  -- Add latest_layout_position if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'latest_layout_position') THEN
    ALTER TABLE coupons ADD COLUMN latest_layout_position INTEGER;
  END IF;
END $$;

-- Banners table
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  image_url TEXT NOT NULL,
  position TEXT DEFAULT 'home' CHECK (position IN ('home', 'category', 'sidebar', 'spotlight')),
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Articles table (News & Blog)
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image_url TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FAQs table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Pages table
CREATE TABLE IF NOT EXISTS system_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_type TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Click Tracking table
CREATE TABLE IF NOT EXISTS click_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  user_ip TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact Submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  recipient_email TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletter Subscriptions table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  recipient_email TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_coupons_store_id ON coupons(store_id);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_featured ON coupons(featured);
CREATE INDEX IF NOT EXISTS idx_coupons_is_latest ON coupons(is_latest);
CREATE INDEX IF NOT EXISTS idx_stores_featured ON stores(featured);
CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(active);
CREATE INDEX IF NOT EXISTS idx_banners_order_index ON banners(order_index);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);
CREATE INDEX IF NOT EXISTS idx_click_tracking_coupon_id ON click_tracking(coupon_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_clicked_at ON click_tracking(clicked_at);

-- Create category_id indexes only if columns exist
DO $$ 
BEGIN
  -- Index for coupons.category_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'category_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_coupons_category_id') THEN
      CREATE INDEX idx_coupons_category_id ON coupons(category_id);
    END IF;
  END IF;
  
  -- Index for stores.category_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'category_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stores_category_id') THEN
      CREATE INDEX idx_stores_category_id ON stores(category_id);
    END IF;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view categories" ON categories;
DROP POLICY IF EXISTS "Public can view stores" ON stores;
DROP POLICY IF EXISTS "Public can view active coupons" ON coupons;
DROP POLICY IF EXISTS "Public can view active banners" ON banners;
DROP POLICY IF EXISTS "Public can view published articles" ON articles;
DROP POLICY IF EXISTS "Public can view faqs" ON faqs;
DROP POLICY IF EXISTS "Public can view system pages" ON system_pages;
DROP POLICY IF EXISTS "Public can insert contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Public can insert newsletter subscriptions" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Public can insert click tracking" ON click_tracking;

-- Public read policies (for frontend - allows anyone to read)
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public can view stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Public can view active coupons" ON coupons FOR SELECT USING (status = 'active');
CREATE POLICY "Public can view active banners" ON banners FOR SELECT USING (active = true);
CREATE POLICY "Public can view published articles" ON articles FOR SELECT USING (published = true);
CREATE POLICY "Public can view faqs" ON faqs FOR SELECT USING (true);
CREATE POLICY "Public can view system pages" ON system_pages FOR SELECT USING (true);

-- Allow public to insert contact submissions and newsletter subscriptions
CREATE POLICY "Public can insert contact submissions" ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can insert newsletter subscriptions" ON newsletter_subscriptions FOR INSERT WITH CHECK (true);

-- Allow public to insert click tracking
CREATE POLICY "Public can insert click tracking" ON click_tracking FOR INSERT WITH CHECK (true);

-- IMPORTANT: Allow service role to insert/update/delete banners (for admin panel)
-- Since we're using service role key, RLS is bypassed, but we add this for safety
-- For authenticated admin users, you can add:
-- CREATE POLICY "Admins can manage banners" ON banners FOR ALL USING (auth.role() = 'authenticated');

-- Function to increment coupon clicks
CREATE OR REPLACE FUNCTION increment_coupon_clicks(coupon_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE coupons
  SET current_uses = current_uses + 1
  WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
DROP TRIGGER IF EXISTS update_banners_updated_at ON banners;
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
DROP TRIGGER IF EXISTS update_system_pages_updated_at ON system_pages;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_pages_updated_at BEFORE UPDATE ON system_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- IMPORTANT: After running this SQL:
-- ============================================
-- 1. Go to Storage and create these buckets:
--    - 'banners' (public)
--    - 'coupon-logos' (public)
--    - 'category-logos' (public)
--
-- 2. Set bucket policies to allow public read:
--    - Go to Storage > Policies
--    - Add policy: "Allow public read access"
--    - Policy: SELECT for public
--
-- 3. Test by creating a banner in admin panel
-- ============================================
