/*
  Warnings:

  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `UniqueIdentifier`.
  - You are about to alter the column `productId` on the `ProductImage` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `UniqueIdentifier`.
  - You are about to alter the column `productId` on the `ProductOptionType` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `UniqueIdentifier`.
  - You are about to alter the column `productId` on the `ProductSpec` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `UniqueIdentifier`.
  - You are about to alter the column `productId` on the `ProductVariant` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `UniqueIdentifier`.
  - You are about to alter the column `productId` on the `Review` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `UniqueIdentifier`.
  - You are about to alter the column `googleId` on the `User` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `VarChar(255)`.
  - A unique constraint covering the columns `[name]` on the table `Brand` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Brand` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[ProductImage] DROP CONSTRAINT [ProductImage_productId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[ProductOptionType] DROP CONSTRAINT [ProductOptionType_productId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[ProductSpec] DROP CONSTRAINT [ProductSpec_productId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[ProductVariant] DROP CONSTRAINT [ProductVariant_productId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Review] DROP CONSTRAINT [Review_productId_fkey];

-- DropIndex
DROP INDEX [ProductImage_productId_idx] ON [dbo].[ProductImage];

-- DropIndex
ALTER TABLE [dbo].[ProductOptionType] DROP CONSTRAINT [ProductOptionType_productId_name_key];

-- DropIndex
DROP INDEX [ProductSpec_productId_idx] ON [dbo].[ProductSpec];

-- DropIndex
DROP INDEX [ProductVariant_productId_idx] ON [dbo].[ProductVariant];

-- DropIndex
DROP INDEX [Review_productId_idx] ON [dbo].[Review];

-- DropIndex
ALTER TABLE [dbo].[Review] DROP CONSTRAINT [Review_productId_userId_key];

-- AlterTable
ALTER TABLE [dbo].[Product] DROP CONSTRAINT [Product_pkey];
ALTER TABLE [dbo].[Product] ALTER COLUMN [id] UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE [dbo].[Product] ADD CONSTRAINT Product_pkey PRIMARY KEY CLUSTERED ([id]);

-- AlterTable
ALTER TABLE [dbo].[ProductImage] ALTER COLUMN [productId] UNIQUEIDENTIFIER NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[ProductOptionType] ALTER COLUMN [productId] UNIQUEIDENTIFIER NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[ProductSpec] ALTER COLUMN [productId] UNIQUEIDENTIFIER NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[ProductVariant] ALTER COLUMN [productId] UNIQUEIDENTIFIER NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Review] ALTER COLUMN [productId] UNIQUEIDENTIFIER NOT NULL;

-- AlterTable
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'unique_active_googleId' AND object_id = OBJECT_ID(N'[dbo].[User]'))
    DROP INDEX [unique_active_googleId] ON [dbo].[User];

ALTER TABLE [dbo].[User] ALTER COLUMN [googleId] VARCHAR(255) NULL;

CREATE UNIQUE NONCLUSTERED INDEX [unique_active_googleId] ON [dbo].[User]([googleId]) WHERE [googleId] IS NOT NULL;


-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductImage_productId_idx] ON [dbo].[ProductImage]([productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductSpec_productId_idx] ON [dbo].[ProductSpec]([productId]);

-- CreateIndex
ALTER TABLE [dbo].[ProductOptionType] ADD CONSTRAINT [ProductOptionType_productId_name_key] UNIQUE NONCLUSTERED ([productId], [name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductVariant_productId_idx] ON [dbo].[ProductVariant]([productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Review_productId_idx] ON [dbo].[Review]([productId]);

-- CreateIndex
ALTER TABLE [dbo].[Review] ADD CONSTRAINT [Review_productId_userId_key] UNIQUE NONCLUSTERED ([productId], [userId]);


-- AddForeignKey
ALTER TABLE [dbo].[ProductImage] ADD CONSTRAINT [ProductImage_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProductSpec] ADD CONSTRAINT [ProductSpec_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProductOptionType] ADD CONSTRAINT [ProductOptionType_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProductVariant] ADD CONSTRAINT [ProductVariant_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Review] ADD CONSTRAINT [Review_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;


COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

-- ============================================================
-- SQL Server Full-Text Search Setup
-- ============================================================

-- 1. Full-text catalog
IF NOT EXISTS (SELECT 1 FROM sys.fulltext_catalogs WHERE name = N'apexgear_ftc')
  CREATE FULLTEXT CATALOG [apexgear_ftc] AS DEFAULT;

-- 2. Full-text index on Product(name, description).
--    The PK is now UniqueIdentifier (16 bytes), which is safely under the 900 bytes limit.
IF NOT EXISTS (
  SELECT 1 FROM sys.fulltext_indexes
  WHERE object_id = OBJECT_ID(N'[dbo].[Product]')
)
BEGIN
  DECLARE @pkIndexName sysname;
  SELECT @pkIndexName = name
  FROM sys.indexes
  WHERE object_id = OBJECT_ID(N'[dbo].[Product]') AND is_primary_key = 1;

  IF @pkIndexName IS NULL
    THROW 50000, 'Product primary key not found; cannot create full-text index.', 1;

  DECLARE @sql nvarchar(max) = N'
    CREATE FULLTEXT INDEX ON [dbo].[Product](
      [name]        LANGUAGE ''Vietnamese'',
      [description] LANGUAGE ''Vietnamese''
    )
    KEY INDEX ' + QUOTENAME(@pkIndexName) + N'
    ON [apexgear_ftc]
    WITH CHANGE_TRACKING AUTO, STOPLIST = OFF;';
  EXEC sp_executesql @sql;
END
