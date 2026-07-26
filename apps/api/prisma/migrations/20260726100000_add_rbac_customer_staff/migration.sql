-- RBAC customer/staff split: existing accounts are active by default.
ALTER TABLE [User]
ADD [activationStatus] VARCHAR(24) NOT NULL CONSTRAINT [User_activationStatus_df] DEFAULT 'ACTIVE',
    [internalNote] NVARCHAR(MAX) NULL;

CREATE TABLE [StaffInvitationToken] (
  [id] NVARCHAR(1000) NOT NULL,
  [tokenHash] VARCHAR(128) NOT NULL,
  [userId] NVARCHAR(1000) NOT NULL,
  [expiresAt] DATETIME2 NOT NULL,
  [usedAt] DATETIME2 NULL,
  [createdAt] DATETIME2 NOT NULL CONSTRAINT [StaffInvitationToken_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT [StaffInvitationToken_pkey] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [StaffInvitationToken_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE UNIQUE NONCLUSTERED INDEX [StaffInvitationToken_tokenHash_key]
  ON [StaffInvitationToken]([tokenHash]);
CREATE NONCLUSTERED INDEX [StaffInvitationToken_userId_usedAt_idx]
  ON [StaffInvitationToken]([userId], [usedAt]);

-- Refuse ambiguous bootstrap data instead of silently demoting an account.
IF (SELECT COUNT(*) FROM [User] WHERE [role] = 'SUPER_ADMIN' AND [email] <> 'admin@apexgear.vn') > 0
  THROW 51000, 'RBAC migration blocked: existing SUPER_ADMIN rows conflict with admin@apexgear.vn. Resolve the conflict and rerun.', 1;

IF (SELECT COUNT(*) FROM [User] WHERE [role] = 'SUPER_ADMIN') > 1
  THROW 51001, 'RBAC migration blocked: multiple SUPER_ADMIN rows already exist. Resolve the conflict and rerun.', 1;

-- Execute after the ALTER TABLE statement has completed. SQL Server otherwise
-- validates activationStatus before it exists within this migration batch.
EXEC(N'UPDATE [User]
SET [role] = ''SUPER_ADMIN'', [isActive] = 1, [deletedAt] = NULL, [activationStatus] = ''ACTIVE''
WHERE [email] = ''admin@apexgear.vn'';');

IF NOT EXISTS (SELECT 1 FROM [User] WHERE [email] = 'admin@apexgear.vn')
  THROW 51002, 'RBAC migration blocked: bootstrap account admin@apexgear.vn does not exist.', 1;

CREATE UNIQUE NONCLUSTERED INDEX [UX_User_OneSuperAdmin]
  ON [User]([role])
  WHERE [role] = 'SUPER_ADMIN';
