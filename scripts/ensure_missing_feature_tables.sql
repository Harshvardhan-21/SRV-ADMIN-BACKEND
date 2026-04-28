CREATE TABLE IF NOT EXISTS public.app_ratings (
  id text PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "userId" text NOT NULL,
  "userRole" text NOT NULL CHECK ("userRole" IN ('dealer', 'electrician')),
  rating numeric(2,1) NOT NULL,
  review text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_app_ratings_user_role"
  ON public.app_ratings ("userId", "userRole");

CREATE TABLE IF NOT EXISTS public.festivals (
  id text PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  greeting text NOT NULL,
  "subGreeting" text,
  emoji text NOT NULL DEFAULT '🎉',
  "bannerEmojis" text NOT NULL DEFAULT '🎉✨🎊',
  "particleEmojis" text NOT NULL DEFAULT '✨⭐🌟',
  "primaryColor" text NOT NULL DEFAULT '#DE3B30',
  "secondaryColor" text NOT NULL DEFAULT '#F59E0B',
  "accentColor" text NOT NULL DEFAULT '#FFFFFF',
  "bgColor" text NOT NULL DEFAULT '#FFF8E7',
  "cardColor" text NOT NULL DEFAULT '#FFFBF0',
  "textColor" text NOT NULL DEFAULT '#1C0A00',
  "startDate" date NOT NULL,
  "endDate" date NOT NULL,
  active boolean NOT NULL DEFAULT true,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.otp_codes (
  id text PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  phone text NOT NULL,
  purpose text NOT NULL,
  code text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  "expiresAt" timestamp(3) NOT NULL,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IDX_otp_codes_phone_purpose"
  ON public.otp_codes (phone, purpose);

CREATE TABLE IF NOT EXISTS public.product_categories (
  id text PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  label text NOT NULL UNIQUE,
  glyph text,
  "imageUrl" text,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.product_categories (
  id,
  label,
  "sortOrder",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT
  uuid_generate_v4()::text,
  src.category,
  src.sort_order,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT
    category,
    ROW_NUMBER() OVER (ORDER BY category) - 1 AS sort_order
  FROM (
    SELECT DISTINCT category
    FROM public.products
    WHERE category IS NOT NULL
      AND btrim(category) <> ''
  ) dedup
) src
ON CONFLICT (label) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.reward_schemes (
  id text PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name text NOT NULL,
  description text NOT NULL,
  "pointsCost" integer NOT NULL DEFAULT 0,
  category text NOT NULL,
  "storeCategory" text,
  "imageUrl" text,
  mrp numeric(10,2),
  active boolean NOT NULL DEFAULT true,
  "targetRole" text,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "legacyCategoryId" text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.user_profile_images (
  id text PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "userId" text NOT NULL,
  "userRole" text NOT NULL CHECK ("userRole" IN ('dealer', 'electrician')),
  "imageData" text NOT NULL,
  "mimeType" text NOT NULL,
  "isCurrent" boolean NOT NULL DEFAULT true,
  source text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IDX_user_profile_images_user_role"
  ON public.user_profile_images ("userId", "userRole");

CREATE TABLE IF NOT EXISTS public.user_qr_codes (
  id text PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "userId" text NOT NULL,
  "userRole" text NOT NULL CHECK ("userRole" IN ('dealer', 'electrician')),
  "qrValue" text NOT NULL,
  "qrImageUrl" text,
  "generatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_qr_codes_user_role"
  ON public.user_qr_codes ("userId", "userRole");

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id text PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  title text,
  "lastMessageId" text,
  "lastMessage" text,
  "lastMessageAt" timestamp(3),
  "unreadAdminCount" integer NOT NULL DEFAULT 0,
  "unreadUserCount" integer NOT NULL DEFAULT 0,
  "participantType" text NOT NULL DEFAULT 'user' CHECK ("participantType" IN ('admin', 'user')),
  "participantId" text,
  "participantName" text,
  "participantDeviceToken" text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id text PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "conversationId" text NOT NULL,
  content text NOT NULL,
  "senderType" text NOT NULL DEFAULT 'user' CHECK ("senderType" IN ('admin', 'user')),
  "senderId" text,
  "senderName" text,
  "isRead" boolean NOT NULL DEFAULT false,
  "readAt" timestamp(3),
  "messageType" text NOT NULL DEFAULT 'text' CHECK ("messageType" IN ('text', 'image', 'file')),
  "attachmentUrl" text,
  metadata text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IDX_chat_messages_conversation"
  ON public.chat_messages ("conversationId");

ALTER TABLE public.electricians
  ADD COLUMN IF NOT EXISTS "passwordHash" text,
  ADD COLUMN IF NOT EXISTS "language" text,
  ADD COLUMN IF NOT EXISTS "darkMode" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "pushEnabled" boolean NOT NULL DEFAULT true;

ALTER TABLE public.dealers
  ADD COLUMN IF NOT EXISTS "passwordHash" text,
  ADD COLUMN IF NOT EXISTS "language" text,
  ADD COLUMN IF NOT EXISTS "darkMode" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "pushEnabled" boolean NOT NULL DEFAULT true;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS "userId" text,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS "readAt" timestamp(3);

ALTER TABLE public.redemptions
  ADD COLUMN IF NOT EXISTS "schemeId" text,
  ADD COLUMN IF NOT EXISTS note text;

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS "photoUrl" text;

ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS "userCategory" text;

ALTER TABLE public.admins ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE public.banners ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE public.dealers ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE public.electricians ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE public.gift_orders ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE public.offers ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE public.points_config ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE public.products ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE public.qr_codes ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE public.redemptions ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE public.scans ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE public.settings ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE public.support_tickets ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE public.testimonials ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
ALTER TABLE public.wallet_transactions ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

ALTER TABLE public.admins ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.banners ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.dealers ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.electricians ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.gift_orders ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.notifications ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.offers ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.points_config ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.products ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.qr_codes ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.redemptions ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.support_tickets ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.testimonials ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
