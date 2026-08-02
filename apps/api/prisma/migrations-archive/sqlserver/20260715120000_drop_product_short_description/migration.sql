/*
  Warnings:

  - Drop the `shortDescription` column from `Product`.

  Rationale: shortDescription was derived from a truncated strip of the raw
  crawl HTML and duplicated the product description with none of its structure.
  The UI no longer renders it and search now matches on `description`, so the
  column is dropped. Existing values are discarded.
*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Product] DROP COLUMN [shortDescription];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
