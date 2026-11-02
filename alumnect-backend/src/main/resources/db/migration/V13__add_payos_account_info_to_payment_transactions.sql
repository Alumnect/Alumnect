-- ==============================================================================
-- AlumNect Database Migration - Version 13
-- Feature: UC93 - Bổ sung thông tin tài khoản thụ hưởng VietQR từ PayOS
-- Lý do: Entity PaymentTransaction có account_number, account_name, bin
--        nhưng migration V11 chưa tạo các cột này.
-- ==============================================================================

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS account_name   VARCHAR(100);
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS bin            VARCHAR(20);
