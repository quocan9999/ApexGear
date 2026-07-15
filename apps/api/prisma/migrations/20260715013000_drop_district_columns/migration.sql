/*
  Warnings:

  - Drop the `districtCode` and `districtName` columns from `Address`.
  - Drop the `shippingDistrict` column from `Order`.

  Rationale: VN administrative reform (effective 2025-07-01) merged provinces and
  abolished the district tier. The app now uses the 2-tier model (province -> ward),
  so the district columns are no longer written or read. Existing values are dropped.
*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Address] DROP COLUMN [districtCode], [districtName];

-- AlterTable
ALTER TABLE [dbo].[Order] DROP COLUMN [shippingDistrict];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
