-- CreateTable
CREATE TABLE [dbo].[ShippingRule] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ShippingRule_id_df] DEFAULT newid(),
    [name] NVARCHAR(255) NOT NULL,
    [fee] DECIMAL(18,2) NOT NULL,
    [isDefault] BIT NOT NULL CONSTRAINT [ShippingRule_isDefault_df] DEFAULT 0,
    [isActive] BIT NOT NULL CONSTRAINT [ShippingRule_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ShippingRule_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ShippingRule_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ShippingRegion] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ShippingRegion_id_df] DEFAULT newid(),
    [ruleId] UNIQUEIDENTIFIER NOT NULL,
    [provinceCode] VARCHAR(10) NOT NULL,
    [provinceName] NVARCHAR(100) NOT NULL,
    [wardCode] VARCHAR(10),
    [wardName] NVARCHAR(100),
    CONSTRAINT [ShippingRegion_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ShippingRegion_provinceCode_wardCode_key] UNIQUE NONCLUSTERED ([provinceCode], [wardCode])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ShippingRegion_ruleId_idx] ON [dbo].[ShippingRegion]([ruleId]);

-- AddForeignKey
ALTER TABLE [dbo].[ShippingRegion] ADD CONSTRAINT [ShippingRegion_ruleId_fkey] FOREIGN KEY ([ruleId]) REFERENCES [dbo].[ShippingRule]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
