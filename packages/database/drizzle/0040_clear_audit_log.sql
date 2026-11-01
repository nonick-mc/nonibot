-- v5とv6で`before`/`after`のキー名が根本的に異なるため、既存の監査ログをすべて削除する
DELETE FROM "audit_log";
