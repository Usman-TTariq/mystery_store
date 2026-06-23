-- Coupachu: full schema matching production (old project)
-- Run once in NEW Supabase → SQL Editor → Run

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── categories ───
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  icon_url TEXT,
  background_color TEXT DEFAULT '#000000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── stores ───
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id SERIAL UNIQUE,
  store_name TEXT NOT NULL,
  "subStoreName" TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  store_logo_url TEXT,
  logo_alt TEXT,
  website_url TEXT,
  tracking_link TEXT,
  country TEXT,
  status TEXT,
  voucher_text TEXT,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "isTrending" BOOLEAN DEFAULT false,
  layout_position INTEGER,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  coupon_order UUID[] DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_store_id ON stores(store_id);
CREATE INDEX IF NOT EXISTS idx_stores_category_id ON stores(category_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);

-- ─── coupons ───
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  store_name TEXT,
  store_ids UUID[] DEFAULT ARRAY[]::UUID[],
  title TEXT,
  code TEXT,
  description TEXT,
  discount_type TEXT,
  discount_value NUMERIC,
  discount TEXT,
  expiry_date TIMESTAMPTZ,
  logo_url TEXT,
  url TEXT,
  coupon_type TEXT,
  get_code_text TEXT,
  get_deal_text TEXT,
  featured BOOLEAN DEFAULT false,
  clicks INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 0,
  current_uses INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  layout_position INTEGER,
  is_latest BOOLEAN DEFAULT false,
  latest_layout_position INTEGER,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_store_id ON coupons(store_id);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_category_id ON coupons(category_id);

-- ─── banners ───
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT DEFAULT 'home',
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── articles ───
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  content TEXT,
  excerpt TEXT,
  featured_image_url TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── faqs ───
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── system_pages ───
CREATE TABLE IF NOT EXISTS system_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_type TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── contact_submissions ───
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  recipient_email TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── newsletter_subscriptions ───
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  recipient_email TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── click_tracking ───
CREATE TABLE IF NOT EXISTS click_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  user_ip TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RLS ───
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view stores" ON stores;
DROP POLICY IF EXISTS "Public can insert stores" ON stores;
DROP POLICY IF EXISTS "Public can update stores" ON stores;
DROP POLICY IF EXISTS "Public can delete stores" ON stores;
DROP POLICY IF EXISTS "Allow public read access to stores" ON stores;
DROP POLICY IF EXISTS "Allow public insert access to stores" ON stores;
DROP POLICY IF EXISTS "Allow public update access to stores" ON stores;
DROP POLICY IF EXISTS "Allow public delete access to stores" ON stores;
DROP POLICY IF EXISTS "Public can view active coupons" ON coupons;
DROP POLICY IF EXISTS "Public can manage coupons" ON coupons;
DROP POLICY IF EXISTS "Public can update coupons" ON coupons;
DROP POLICY IF EXISTS "Public can delete coupons" ON coupons;
DROP POLICY IF EXISTS "Allow public read access to coupons" ON coupons;
DROP POLICY IF EXISTS "Allow public insert access to coupons" ON coupons;
DROP POLICY IF EXISTS "Allow public update access to coupons" ON coupons;
DROP POLICY IF EXISTS "Allow public delete access to coupons" ON coupons;
DROP POLICY IF EXISTS "Public can view active banners" ON banners;
DROP POLICY IF EXISTS "Public can insert banners" ON banners;
DROP POLICY IF EXISTS "Public can update banners" ON banners;
DROP POLICY IF EXISTS "Public can delete banners" ON banners;
DROP POLICY IF EXISTS "Public can view published articles" ON articles;
DROP POLICY IF EXISTS "Public can view faqs" ON faqs;
DROP POLICY IF EXISTS "Public can view system pages" ON system_pages;
DROP POLICY IF EXISTS "Public can insert categories" ON categories;
DROP POLICY IF EXISTS "Public can update categories" ON categories;
DROP POLICY IF EXISTS "Public can delete categories" ON categories;
DROP POLICY IF EXISTS "Public can select categories" ON categories;
DROP POLICY IF EXISTS "Public can insert contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Public can insert newsletter subscriptions" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Public can insert click tracking" ON click_tracking;

CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public can view stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Public can insert stores" ON stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update stores" ON stores FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete stores" ON stores FOR DELETE USING (true);
CREATE POLICY "Public can view active coupons" ON coupons FOR SELECT USING (status = 'active');
CREATE POLICY "Public can manage coupons" ON coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update coupons" ON coupons FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete coupons" ON coupons FOR DELETE USING (true);
CREATE POLICY "Public can view active banners" ON banners FOR SELECT USING (active = true);
CREATE POLICY "Public can insert banners" ON banners FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update banners" ON banners FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete banners" ON banners FOR DELETE USING (true);
CREATE POLICY "Public can view published articles" ON articles FOR SELECT USING (published = true);
CREATE POLICY "Public can view faqs" ON faqs FOR SELECT USING (true);
CREATE POLICY "Public can view system pages" ON system_pages FOR SELECT USING (true);
CREATE POLICY "Public can insert categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update categories" ON categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete categories" ON categories FOR DELETE USING (true);
CREATE POLICY "Public can insert contact submissions" ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can insert newsletter subscriptions" ON newsletter_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can insert click tracking" ON click_tracking FOR INSERT WITH CHECK (true);

-- ─── Functions ───
CREATE OR REPLACE FUNCTION increment_coupon_clicks(coupon_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE coupons SET clicks = COALESCE(clicks, 0) + 1 WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
DROP TRIGGER IF EXISTS update_banners_updated_at ON banners;
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Storage buckets (run after tables; create via Dashboard if this fails) ───
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('coupon-logos', 'coupon-logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('category-logos', 'category-logos', true) ON CONFLICT (id) DO NOTHING;
