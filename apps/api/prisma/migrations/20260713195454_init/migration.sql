BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000),
    [name] NVARCHAR(100) NOT NULL,
    [phone] VARCHAR(15),
    [avatar] VARCHAR(500),
    [role] VARCHAR(30) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'CUSTOMER',
    [provider] VARCHAR(20) NOT NULL CONSTRAINT [User_provider_df] DEFAULT 'LOCAL',
    [googleId] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [User_isActive_df] DEFAULT 1,
    [failedLoginAttempts] INT NOT NULL CONSTRAINT [User_failedLoginAttempts_df] DEFAULT 0,
    [lockedUntil] DATETIME2,
    [tokenVersion] INT NOT NULL CONSTRAINT [User_tokenVersion_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [unique_active_email] UNIQUE NONCLUSTERED ([email]),
    CONSTRAINT [User_googleId_key] UNIQUE NONCLUSTERED ([googleId])
);

-- CreateTable
CREATE TABLE [dbo].[PasswordResetToken] (
    [id] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [usedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PasswordResetToken_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PasswordResetToken_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PasswordResetToken_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[Category] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [image] VARCHAR(500),
    [parentId] NVARCHAR(1000),
    [sortOrder] INT NOT NULL CONSTRAINT [Category_sortOrder_df] DEFAULT 0,
    [isActive] BIT NOT NULL CONSTRAINT [Category_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Category_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [Category_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [unique_active_category_slug] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[Brand] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [logo] VARCHAR(500),
    [website] VARCHAR(500),
    [isActive] BIT NOT NULL CONSTRAINT [Brand_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Brand_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [Brand_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [unique_active_brand_name] UNIQUE NONCLUSTERED ([name]),
    CONSTRAINT [unique_active_brand_slug] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[Product] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(500) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [shortDescription] NVARCHAR(500),
    [description] NVARCHAR(max),
    [specifications] NVARCHAR(max),
    [basePrice] DECIMAL(18,2) NOT NULL,
    [salePrice] DECIMAL(18,2),
    [categoryId] NVARCHAR(1000) NOT NULL,
    [brandId] NVARCHAR(1000) NOT NULL,
    [metaTitle] NVARCHAR(255),
    [metaDescription] NVARCHAR(500),
    [isFeatured] BIT NOT NULL CONSTRAINT [Product_isFeatured_df] DEFAULT 0,
    [isActive] BIT NOT NULL CONSTRAINT [Product_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Product_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [Product_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [unique_active_product_slug] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[ProductImage] (
    [id] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [url] VARCHAR(500) NOT NULL,
    [publicId] VARCHAR(255) NOT NULL,
    [alt] NVARCHAR(500),
    [isPrimary] BIT NOT NULL CONSTRAINT [ProductImage_isPrimary_df] DEFAULT 0,
    [sortOrder] INT NOT NULL CONSTRAINT [ProductImage_sortOrder_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProductImage_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ProductImage_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ProductSpec] (
    [id] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [group] NVARCHAR(255),
    [name] NVARCHAR(255) NOT NULL,
    [value] NVARCHAR(500) NOT NULL,
    [sortOrder] INT NOT NULL CONSTRAINT [ProductSpec_sortOrder_df] DEFAULT 0,
    CONSTRAINT [ProductSpec_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ProductOptionType] (
    [id] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [sortOrder] INT NOT NULL CONSTRAINT [ProductOptionType_sortOrder_df] DEFAULT 0,
    CONSTRAINT [ProductOptionType_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProductOptionType_productId_name_key] UNIQUE NONCLUSTERED ([productId],[name])
);

-- CreateTable
CREATE TABLE [dbo].[ProductOptionValue] (
    [id] NVARCHAR(1000) NOT NULL,
    [optionTypeId] NVARCHAR(1000) NOT NULL,
    [value] NVARCHAR(100) NOT NULL,
    [sortOrder] INT NOT NULL CONSTRAINT [ProductOptionValue_sortOrder_df] DEFAULT 0,
    CONSTRAINT [ProductOptionValue_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProductOptionValue_optionTypeId_value_key] UNIQUE NONCLUSTERED ([optionTypeId],[value])
);

-- CreateTable
CREATE TABLE [dbo].[ProductVariant] (
    [id] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [sku] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [price] DECIMAL(18,2),
    [stockTotal] INT NOT NULL CONSTRAINT [ProductVariant_stockTotal_df] DEFAULT 0,
    [stockAvailable] INT NOT NULL CONSTRAINT [ProductVariant_stockAvailable_df] DEFAULT 0,
    [lowStockThreshold] INT NOT NULL CONSTRAINT [ProductVariant_lowStockThreshold_df] DEFAULT 5,
    [attributes] NVARCHAR(max),
    [isDefault] BIT NOT NULL CONSTRAINT [ProductVariant_isDefault_df] DEFAULT 0,
    [isActive] BIT NOT NULL CONSTRAINT [ProductVariant_isActive_df] DEFAULT 1,
    [displayOrder] INT NOT NULL CONSTRAINT [ProductVariant_displayOrder_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProductVariant_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [ProductVariant_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [unique_active_sku] UNIQUE NONCLUSTERED ([sku])
);

-- CreateTable
CREATE TABLE [dbo].[VariantOption] (
    [id] NVARCHAR(1000) NOT NULL,
    [variantId] NVARCHAR(1000) NOT NULL,
    [optionValueId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [VariantOption_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [VariantOption_variantId_optionValueId_key] UNIQUE NONCLUSTERED ([variantId],[optionValueId])
);

-- CreateTable
CREATE TABLE [dbo].[Review] (
    [id] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [rating] INT NOT NULL,
    [comment] NVARCHAR(max),
    [status] VARCHAR(20) NOT NULL CONSTRAINT [Review_status_df] DEFAULT 'PENDING',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Review_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Review_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Review_productId_userId_key] UNIQUE NONCLUSTERED ([productId],[userId])
);

-- CreateTable
CREATE TABLE [dbo].[Cart] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Cart_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Cart_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[CartItem] (
    [id] NVARCHAR(1000) NOT NULL,
    [cartId] NVARCHAR(1000) NOT NULL,
    [variantId] NVARCHAR(1000) NOT NULL,
    [quantity] INT NOT NULL CONSTRAINT [CartItem_quantity_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [CartItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [CartItem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CartItem_cartId_variantId_key] UNIQUE NONCLUSTERED ([cartId],[variantId])
);

-- CreateTable
CREATE TABLE [dbo].[Order] (
    [id] NVARCHAR(1000) NOT NULL,
    [orderNumber] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [status] VARCHAR(20) NOT NULL CONSTRAINT [Order_status_df] DEFAULT 'PENDING',
    [paymentMethod] VARCHAR(20) NOT NULL,
    [paymentStatus] VARCHAR(20) NOT NULL CONSTRAINT [Order_paymentStatus_df] DEFAULT 'UNPAID',
    [subtotal] DECIMAL(18,2) NOT NULL,
    [shippingFee] DECIMAL(18,2) NOT NULL,
    [discount] DECIMAL(18,2) NOT NULL CONSTRAINT [Order_discount_df] DEFAULT 0,
    [total] DECIMAL(18,2) NOT NULL,
    [shippingName] NVARCHAR(100) NOT NULL,
    [shippingPhone] VARCHAR(15) NOT NULL,
    [shippingAddress] NVARCHAR(500) NOT NULL,
    [shippingWard] NVARCHAR(100) NOT NULL,
    [shippingDistrict] NVARCHAR(100) NOT NULL,
    [shippingProvince] NVARCHAR(100) NOT NULL,
    [couponId] NVARCHAR(1000),
    [sepayRef] NVARCHAR(1000),
    [note] NVARCHAR(500),
    [paidAt] DATETIME2,
    [confirmedAt] DATETIME2,
    [shippedAt] DATETIME2,
    [deliveredAt] DATETIME2,
    [completedAt] DATETIME2,
    [cancelledAt] DATETIME2,
    [cancelReason] NVARCHAR(500),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Order_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Order_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Order_orderNumber_key] UNIQUE NONCLUSTERED ([orderNumber]),
    CONSTRAINT [Order_sepayRef_key] UNIQUE NONCLUSTERED ([sepayRef])
);

-- CreateTable
CREATE TABLE [dbo].[OrderItem] (
    [id] NVARCHAR(1000) NOT NULL,
    [orderId] NVARCHAR(1000) NOT NULL,
    [variantId] NVARCHAR(1000) NOT NULL,
    [productName] NVARCHAR(500) NOT NULL,
    [variantInfo] NVARCHAR(255),
    [price] DECIMAL(18,2) NOT NULL,
    [quantity] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [OrderItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [OrderItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Address] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [phone] VARCHAR(15) NOT NULL,
    [provinceCode] VARCHAR(10) NOT NULL,
    [provinceName] NVARCHAR(100) NOT NULL,
    [districtCode] VARCHAR(10) NOT NULL,
    [districtName] NVARCHAR(100) NOT NULL,
    [wardCode] VARCHAR(10) NOT NULL,
    [wardName] NVARCHAR(100) NOT NULL,
    [detail] NVARCHAR(500) NOT NULL,
    [isDefault] BIT NOT NULL CONSTRAINT [Address_isDefault_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Address_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Address_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Coupon] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] VARCHAR(50) NOT NULL,
    [type] VARCHAR(20) NOT NULL,
    [description] NVARCHAR(500),
    [value] DECIMAL(18,2) NOT NULL,
    [minOrderValue] DECIMAL(18,2),
    [maxDiscount] DECIMAL(18,2),
    [maxUses] INT,
    [usedCount] INT NOT NULL CONSTRAINT [Coupon_usedCount_df] DEFAULT 0,
    [startsAt] DATETIME2,
    [expiresAt] DATETIME2,
    [isActive] BIT NOT NULL CONSTRAINT [Coupon_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Coupon_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Coupon_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Coupon_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[Setting] (
    [id] NVARCHAR(1000) NOT NULL,
    [key] VARCHAR(100) NOT NULL,
    [value] NVARCHAR(max) NOT NULL,
    CONSTRAINT [Setting_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Setting_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_email_deletedAt_idx] ON [dbo].[User]([email], [deletedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_role_idx] ON [dbo].[User]([role]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Category_slug_deletedAt_idx] ON [dbo].[Category]([slug], [deletedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Category_parentId_idx] ON [dbo].[Category]([parentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Brand_name_deletedAt_idx] ON [dbo].[Brand]([name], [deletedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Brand_slug_deletedAt_idx] ON [dbo].[Brand]([slug], [deletedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Product_categoryId_idx] ON [dbo].[Product]([categoryId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Product_brandId_idx] ON [dbo].[Product]([brandId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Product_slug_deletedAt_idx] ON [dbo].[Product]([slug], [deletedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Product_isActive_isFeatured_idx] ON [dbo].[Product]([isActive], [isFeatured]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductImage_productId_idx] ON [dbo].[ProductImage]([productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductImage_isPrimary_idx] ON [dbo].[ProductImage]([isPrimary]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductSpec_productId_idx] ON [dbo].[ProductSpec]([productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductVariant_productId_idx] ON [dbo].[ProductVariant]([productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductVariant_sku_deletedAt_idx] ON [dbo].[ProductVariant]([sku], [deletedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductVariant_isActive_idx] ON [dbo].[ProductVariant]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Review_productId_idx] ON [dbo].[Review]([productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Review_status_idx] ON [dbo].[Review]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Order_userId_idx] ON [dbo].[Order]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Order_status_idx] ON [dbo].[Order]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Order_orderNumber_idx] ON [dbo].[Order]([orderNumber]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Order_createdAt_idx] ON [dbo].[Order]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OrderItem_orderId_idx] ON [dbo].[OrderItem]([orderId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Address_userId_idx] ON [dbo].[Address]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Coupon_code_idx] ON [dbo].[Coupon]([code]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Coupon_isActive_expiresAt_idx] ON [dbo].[Coupon]([isActive], [expiresAt]);

-- AddForeignKey
ALTER TABLE [dbo].[PasswordResetToken] ADD CONSTRAINT [PasswordResetToken_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Category] ADD CONSTRAINT [Category_parentId_fkey] FOREIGN KEY ([parentId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Product] ADD CONSTRAINT [Product_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Product] ADD CONSTRAINT [Product_brandId_fkey] FOREIGN KEY ([brandId]) REFERENCES [dbo].[Brand]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProductImage] ADD CONSTRAINT [ProductImage_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProductSpec] ADD CONSTRAINT [ProductSpec_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProductOptionType] ADD CONSTRAINT [ProductOptionType_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProductOptionValue] ADD CONSTRAINT [ProductOptionValue_optionTypeId_fkey] FOREIGN KEY ([optionTypeId]) REFERENCES [dbo].[ProductOptionType]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProductVariant] ADD CONSTRAINT [ProductVariant_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[VariantOption] ADD CONSTRAINT [VariantOption_variantId_fkey] FOREIGN KEY ([variantId]) REFERENCES [dbo].[ProductVariant]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[VariantOption] ADD CONSTRAINT [VariantOption_optionValueId_fkey] FOREIGN KEY ([optionValueId]) REFERENCES [dbo].[ProductOptionValue]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Review] ADD CONSTRAINT [Review_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Review] ADD CONSTRAINT [Review_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Cart] ADD CONSTRAINT [Cart_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CartItem] ADD CONSTRAINT [CartItem_cartId_fkey] FOREIGN KEY ([cartId]) REFERENCES [dbo].[Cart]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CartItem] ADD CONSTRAINT [CartItem_variantId_fkey] FOREIGN KEY ([variantId]) REFERENCES [dbo].[ProductVariant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Order] ADD CONSTRAINT [Order_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Order] ADD CONSTRAINT [Order_couponId_fkey] FOREIGN KEY ([couponId]) REFERENCES [dbo].[Coupon]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[OrderItem] ADD CONSTRAINT [OrderItem_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[Order]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[OrderItem] ADD CONSTRAINT [OrderItem_variantId_fkey] FOREIGN KEY ([variantId]) REFERENCES [dbo].[ProductVariant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Address] ADD CONSTRAINT [Address_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
