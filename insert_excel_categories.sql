-- Insert all categories from Excel file manually
-- This ensures category matching works properly during Excel upload
-- Note: If categories already exist, you may get duplicate errors - that's okay, just ignore them

INSERT INTO categories (name, slug, icon_url, background_color) VALUES
('Home & Garden', 'home-garden', '🏡', '#10B981'),
('Gift', 'gift', '🎁', '#EC4899'),
('Travel', 'travel', '✈️', '#3B82F6'),
('Furniture', 'furniture', '🛋️', '#8B5CF6'),
('Electronics', 'electronics', '📱', '#6366F1'),
('Sports & Outdoor', 'sports-outdoor', '⚽', '#F59E0B'),
('E-Commerce', 'e-commerce', '🛒', '#14B8A6'),
('Fashion', 'fashion', '👗', '#EF4444'),
('Hotel & Resorts', 'hotel-resorts', '🏨', '#06B6D4'),
('Footwear', 'footwear', '👟', '#F97316'),
('Kids', 'kids', '🧸', '#A855F7'),
('Office & Stationery', 'office-stationery', '📝', '#84CC16'),
('Automotive', 'automotive', '🚗', '#EAB308'),
('Beauty', 'beauty', '💄', '#DB2777'),
('Fitness', 'fitness', '💪', '#10B981'),
('Food & Grocery', 'food-grocery', '🍔', '#F59E0B'),
('Holiday', 'holiday', '🎉', '#EC4899');
