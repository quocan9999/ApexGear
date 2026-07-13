SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'unique_active_email' AND parent_object_id = OBJECT_ID(N'[dbo].[User]'))
  ALTER TABLE [dbo].[User] DROP CONSTRAINT unique_active_email;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'unique_active_email' AND object_id = OBJECT_ID(N'[dbo].[User]') AND is_unique_constraint = 0)
  DROP INDEX unique_active_email ON [dbo].[User];
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'unique_active_email' AND object_id = OBJECT_ID(N'[dbo].[User]'))
  CREATE UNIQUE NONCLUSTERED INDEX unique_active_email ON [dbo].[User](email) WHERE [deletedAt] IS NULL;

IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'unique_active_category_slug' AND parent_object_id = OBJECT_ID(N'[dbo].[Category]'))
  ALTER TABLE [dbo].[Category] DROP CONSTRAINT unique_active_category_slug;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'unique_active_category_slug' AND object_id = OBJECT_ID(N'[dbo].[Category]') AND is_unique_constraint = 0)
  DROP INDEX unique_active_category_slug ON [dbo].[Category];
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'unique_active_category_slug' AND object_id = OBJECT_ID(N'[dbo].[Category]'))
  CREATE UNIQUE NONCLUSTERED INDEX unique_active_category_slug ON [dbo].[Category](slug) WHERE [deletedAt] IS NULL;

IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'unique_active_brand_name' AND parent_object_id = OBJECT_ID(N'[dbo].[Brand]'))
  ALTER TABLE [dbo].[Brand] DROP CONSTRAINT unique_active_brand_name;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'unique_active_brand_name' AND object_id = OBJECT_ID(N'[dbo].[Brand]') AND is_unique_constraint = 0)
  DROP INDEX unique_active_brand_name ON [dbo].[Brand];
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'unique_active_brand_name' AND object_id = OBJECT_ID(N'[dbo].[Brand]'))
  CREATE UNIQUE NONCLUSTERED INDEX unique_active_brand_name ON [dbo].[Brand](name) WHERE [deletedAt] IS NULL;

IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'unique_active_brand_slug' AND parent_object_id = OBJECT_ID(N'[dbo].[Brand]'))
  ALTER TABLE [dbo].[Brand] DROP CONSTRAINT unique_active_brand_slug;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'unique_active_brand_slug' AND object_id = OBJECT_ID(N'[dbo].[Brand]') AND is_unique_constraint = 0)
  DROP INDEX unique_active_brand_slug ON [dbo].[Brand];
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'unique_active_brand_slug' AND object_id = OBJECT_ID(N'[dbo].[Brand]'))
  CREATE UNIQUE NONCLUSTERED INDEX unique_active_brand_slug ON [dbo].[Brand](slug) WHERE [deletedAt] IS NULL;

IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'unique_active_product_slug' AND parent_object_id = OBJECT_ID(N'[dbo].[Product]'))
  ALTER TABLE [dbo].[Product] DROP CONSTRAINT unique_active_product_slug;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'unique_active_product_slug' AND object_id = OBJECT_ID(N'[dbo].[Product]') AND is_unique_constraint = 0)
  DROP INDEX unique_active_product_slug ON [dbo].[Product];
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'unique_active_product_slug' AND object_id = OBJECT_ID(N'[dbo].[Product]'))
  CREATE UNIQUE NONCLUSTERED INDEX unique_active_product_slug ON [dbo].[Product](slug) WHERE [deletedAt] IS NULL;

IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'unique_active_sku' AND parent_object_id = OBJECT_ID(N'[dbo].[ProductVariant]'))
  ALTER TABLE [dbo].[ProductVariant] DROP CONSTRAINT unique_active_sku;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'unique_active_sku' AND object_id = OBJECT_ID(N'[dbo].[ProductVariant]') AND is_unique_constraint = 0)
  DROP INDEX unique_active_sku ON [dbo].[ProductVariant];
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'unique_active_sku' AND object_id = OBJECT_ID(N'[dbo].[ProductVariant]'))
  CREATE UNIQUE NONCLUSTERED INDEX unique_active_sku ON [dbo].[ProductVariant](sku) WHERE [deletedAt] IS NULL;

SELECT name, OBJECT_NAME(object_id) AS table_name, filter_definition FROM sys.indexes WHERE name LIKE 'unique_active_%';