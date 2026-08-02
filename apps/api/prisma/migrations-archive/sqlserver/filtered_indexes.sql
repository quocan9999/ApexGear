-- Manual / re-runnable version of migration 20260714183000_filtered_unique_indexes.
-- Prefer: npx prisma migrate deploy
-- Fallback: sqlcmd -S localhost -d apexgear -E -I -i apps/api/prisma/filtered_indexes.sql

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

-- User.email
IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'unique_active_email' AND parent_object_id = OBJECT_ID(N'[dbo].[User]'))
  ALTER TABLE [dbo].[User] DROP CONSTRAINT [unique_active_email];
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'unique_active_email' AND object_id = OBJECT_ID(N'[dbo].[User]') AND has_filter = 0)
  DROP INDEX [unique_active_email] ON [dbo].[User];
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'unique_active_email' AND object_id = OBJECT_ID(N'[dbo].[User]') AND has_filter = 1)
  CREATE UNIQUE NONCLUSTERED INDEX [unique_active_email] ON [dbo].[User]([email]) WHERE [deletedAt] IS NULL;

-- User.googleId
IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'User_googleId_key' AND parent_object_id = OBJECT_ID(N'[dbo].[User]'))
  ALTER TABLE [dbo].[User] DROP CONSTRAINT [User_googleId_key];
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'User_googleId_key' AND object_id = OBJECT_ID(N'[dbo].[User]'))
  DROP INDEX [User_googleId_key] ON [dbo].[User];
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'unique_active_googleId' AND object_id = OBJECT_ID(N'[dbo].[User]') AND has_filter = 0)
  DROP INDEX [unique_active_googleId] ON [dbo].[User];
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'unique_active_googleId' AND object_id = OBJECT_ID(N'[dbo].[User]') AND has_filter = 1)
  CREATE UNIQUE NONCLUSTERED INDEX [unique_active_googleId] ON [dbo].[User]([googleId]) WHERE [googleId] IS NOT NULL;

-- Category.slug
IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'unique_active_category_slug' AND parent_object_id = OBJECT_ID(N'[dbo].[Category]'))
  ALTER TABLE [dbo].[Category] DROP CONSTRAINT [unique_active_category_slug];
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'unique_active_category_slug' AND object_id = OBJECT_ID(N'[dbo].[Category]') AND has_filter = 0)
  DROP INDEX [unique_active_category_slug] ON [dbo].[Category];
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'unique_active_category_slug' AND object_id = OBJECT_ID(N'[dbo].[Category]') AND has_filter = 1)
  CREATE UNIQUE NONCLUSTERED INDEX [unique_active_category_slug] ON [dbo].[Category]([slug]) WHERE [deletedAt] IS NULL;

-- Brand.name / Brand.slug
IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'unique_active_brand_name' AND parent_object_id = OBJECT_ID(N'[dbo].[Brand]'))
  ALTER TABLE [dbo].[Brand] DROP CONSTRAINT [unique_active_brand_name];
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'unique_active_brand_name' AND object_id = OBJECT_ID(N'[dbo].[Brand]') AND has_filter = 0)
  DROP INDEX [unique_active_brand_name] ON [dbo].[Brand];
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'unique_active_brand_name' AND object_id = OBJECT_ID(N'[dbo].[Brand]') AND has_filter = 1)
  CREATE UNIQUE NONCLUSTERED INDEX [unique_active_brand_name] ON [dbo].[Brand]([name]) WHERE [deletedAt] IS NULL;

IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'unique_active_brand_slug' AND parent_object_id = OBJECT_ID(N'[dbo].[Brand]'))
  ALTER TABLE [dbo].[Brand] DROP CONSTRAINT [unique_active_brand_slug];
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'unique_active_brand_slug' AND object_id = OBJECT_ID(N'[dbo].[Brand]') AND has_filter = 0)
  DROP INDEX [unique_active_brand_slug] ON [dbo].[Brand];
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'unique_active_brand_slug' AND object_id = OBJECT_ID(N'[dbo].[Brand]') AND has_filter = 1)
  CREATE UNIQUE NONCLUSTERED INDEX [unique_active_brand_slug] ON [dbo].[Brand]([slug]) WHERE [deletedAt] IS NULL;

-- Product.slug
IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'unique_active_product_slug' AND parent_object_id = OBJECT_ID(N'[dbo].[Product]'))
  ALTER TABLE [dbo].[Product] DROP CONSTRAINT [unique_active_product_slug];
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'unique_active_product_slug' AND object_id = OBJECT_ID(N'[dbo].[Product]') AND has_filter = 0)
  DROP INDEX [unique_active_product_slug] ON [dbo].[Product];
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'unique_active_product_slug' AND object_id = OBJECT_ID(N'[dbo].[Product]') AND has_filter = 1)
  CREATE UNIQUE NONCLUSTERED INDEX [unique_active_product_slug] ON [dbo].[Product]([slug]) WHERE [deletedAt] IS NULL;

-- ProductVariant.sku
IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'unique_active_sku' AND parent_object_id = OBJECT_ID(N'[dbo].[ProductVariant]'))
  ALTER TABLE [dbo].[ProductVariant] DROP CONSTRAINT [unique_active_sku];
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'unique_active_sku' AND object_id = OBJECT_ID(N'[dbo].[ProductVariant]') AND has_filter = 0)
  DROP INDEX [unique_active_sku] ON [dbo].[ProductVariant];
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'unique_active_sku' AND object_id = OBJECT_ID(N'[dbo].[ProductVariant]') AND has_filter = 1)
  CREATE UNIQUE NONCLUSTERED INDEX [unique_active_sku] ON [dbo].[ProductVariant]([sku]) WHERE [deletedAt] IS NULL;

SELECT name, OBJECT_NAME(object_id) AS table_name, has_filter, filter_definition
FROM sys.indexes
WHERE name LIKE N'unique_active_%'
ORDER BY name;
