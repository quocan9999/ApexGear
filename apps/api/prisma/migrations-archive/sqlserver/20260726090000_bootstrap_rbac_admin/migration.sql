IF NOT EXISTS (SELECT 1 FROM [User] WHERE [email] = 'admin@apexgear.vn')
BEGIN
  INSERT INTO [User] ([id], [email], [name], [role], [provider], [isActive], [updatedAt])
  VALUES (CONVERT(NVARCHAR(1000), NEWID()), 'admin@apexgear.vn', N'Bootstrap Administrator', 'ADMIN', 'LOCAL', 1, CURRENT_TIMESTAMP);
END;
IF NOT EXISTS (SELECT 1 FROM [User] WHERE [email] = 'admin@apexgear.vn')
  THROW 51003, 'RBAC bootstrap migration failed to create admin@apexgear.vn.', 1;
