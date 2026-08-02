# Archived SQL Server raw crawler

This raw staging tier used a separate SQL Server database. It is archived because the current PostgreSQL adoption uses the existing catalog and does not re-crawl. The file-based crawler and `npm run seed:crawled` remain active.
