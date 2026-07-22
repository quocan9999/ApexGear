CREATE TABLE [AdminNotification] (
  [id] NVARCHAR(1000) NOT NULL,
  [dedupeKey] VARCHAR(191) NOT NULL,
  [type] VARCHAR(30) NOT NULL,
  [title] NVARCHAR(255) NOT NULL,
  [body] NVARCHAR(500) NULL,
  [orderId] NVARCHAR(1000) NULL,
  [variantId] NVARCHAR(1000) NULL,
  [isRead] BIT NOT NULL CONSTRAINT [AdminNotification_isRead_df] DEFAULT 0,
  [readAt] DATETIME2 NULL,
  [createdAt] DATETIME2 NOT NULL CONSTRAINT [AdminNotification_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
  [updatedAt] DATETIME2 NOT NULL,
  CONSTRAINT [AdminNotification_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE UNIQUE NONCLUSTERED INDEX [AdminNotification_dedupeKey_key] ON [AdminNotification]([dedupeKey]);
CREATE NONCLUSTERED INDEX [AdminNotification_createdAt_idx] ON [AdminNotification]([createdAt]);
CREATE NONCLUSTERED INDEX [AdminNotification_isRead_createdAt_idx] ON [AdminNotification]([isRead], [createdAt]);
CREATE NONCLUSTERED INDEX [AdminNotification_type_idx] ON [AdminNotification]([type]);

CREATE TABLE [LowStockAlertState] (
  [id] NVARCHAR(1000) NOT NULL,
  [variantId] NVARCHAR(1000) NOT NULL,
  [isActive] BIT NOT NULL CONSTRAINT [LowStockAlertState_isActive_df] DEFAULT 0,
  [lastNotifiedStock] INT NULL,
  [notifiedAt] DATETIME2 NULL,
  [resolvedAt] DATETIME2 NULL,
  [updatedAt] DATETIME2 NOT NULL,
  CONSTRAINT [LowStockAlertState_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE UNIQUE NONCLUSTERED INDEX [LowStockAlertState_variantId_key] ON [LowStockAlertState]([variantId]);
