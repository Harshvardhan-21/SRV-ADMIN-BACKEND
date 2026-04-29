-- Fix existing banners: sync isActive with status field
UPDATE banners 
SET "isActive" = true 
WHERE status = 'active' OR status IS NULL;

UPDATE banners 
SET "isActive" = false 
WHERE status = 'inactive';

-- Show current banner state
SELECT 
  id, 
  title, 
  status, 
  "isActive", 
  "targetRole",
  "displayOrder",
  "order",
  "createdAt"
FROM banners 
ORDER BY "createdAt" DESC 
LIMIT 20;
