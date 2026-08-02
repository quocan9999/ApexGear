ALTER TABLE [User] ADD [emailVerifiedAt] DATETIME2 NULL;

EXEC(N'
UPDATE [User]
SET [emailVerifiedAt] = COALESCE([updatedAt], [createdAt], SYSUTCDATETIME())
WHERE [deletedAt] IS NULL
  AND [provider] IN (''LOCAL'', ''GOOGLE'')
  AND [emailVerifiedAt] IS NULL;
');

EXEC(N'
UPDATE [User]
SET [emailVerifiedAt] = COALESCE([updatedAt], [createdAt], SYSUTCDATETIME())
WHERE [deletedAt] IS NULL
  AND [provider] = ''LOCAL''
  AND [emailVerifiedAt] IS NULL;
');

EXEC(N'
UPDATE [User]
SET [emailVerifiedAt] = COALESCE([updatedAt], [createdAt], SYSUTCDATETIME())
WHERE [deletedAt] IS NULL
  AND [provider] = ''GOOGLE''
  AND [emailVerifiedAt] IS NULL;
');

CREATE TABLE [EmailVerificationToken] (
  [id] NVARCHAR(1000) NOT NULL,
  [token] NVARCHAR(1000) NOT NULL,
  [userId] NVARCHAR(1000) NOT NULL,
  [expiresAt] DATETIME2 NOT NULL,
  [usedAt] DATETIME2 NULL,
  [createdAt] DATETIME2 NOT NULL CONSTRAINT [EmailVerificationToken_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT [EmailVerificationToken_pkey] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [EmailVerificationToken_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE UNIQUE NONCLUSTERED INDEX [EmailVerificationToken_token_key] ON [EmailVerificationToken]([token]);
CREATE NONCLUSTERED INDEX [EmailVerificationToken_userId_usedAt_idx] ON [EmailVerificationToken]([userId], [usedAt]);
