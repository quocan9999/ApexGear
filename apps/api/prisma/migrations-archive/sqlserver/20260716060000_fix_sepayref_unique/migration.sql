-- sepayRef UNIQUE constraint allows only ONE NULL in SQL Server (ANSI).
-- Every COD order has sepayRef = NULL → second COD order fails with
-- "Violation of UNIQUE KEY constraint 'Order_sepayRef_key'".
-- Replace with a filtered unique index that ignores NULLs.
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'Order_sepayRef_key' AND parent_object_id = OBJECT_ID(N'[dbo].[Order]'))
  ALTER TABLE [dbo].[Order] DROP CONSTRAINT [Order_sepayRef_key];

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Order_sepayRef' AND object_id = OBJECT_ID(N'[dbo].[Order]') AND has_filter = 1)
  CREATE UNIQUE NONCLUSTERED INDEX [IX_Order_sepayRef] ON [dbo].[Order]([sepayRef]) WHERE [sepayRef] IS NOT NULL;
