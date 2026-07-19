-- SQL Server Full-Text Search for product search.
-- Spec §4.14: search runs on Product.name + Product.description, LANGUAGE Vietnamese.
-- Prisma cannot model full-text indexes, so DDL lives here.
-- Idempotent: each step uses sys.* existence checks so re-running on an
-- already-migrated DB is a no-op. The PK index name on Product is auto-named
-- by Prisma (PK__Product__<hex>), so we resolve it from sys.indexes at run time.

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

-- 1. Full-text catalog (one per database is plenty; name it apexgear_ftc).
IF NOT EXISTS (SELECT 1 FROM sys.fulltext_catalogs WHERE name = N'apexgear_ftc')
  CREATE FULLTEXT CATALOG [apexgear_ftc] AS DEFAULT;

-- 2. Full-text index on Product(name, description).
--    - CHANGE_TRACKING AUTO: FTS index stays in sync without manual ALTER calls.
--    - STOPLIST = OFF: keep all terms (catalog is Vietnamese + English mixed).
--    - LANGUAGE 'Vietnamese' on each column so the Vietnamese word breaker
--      tokenizes names correctly.
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
