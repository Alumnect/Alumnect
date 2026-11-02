-- V12: Add community_group_id to conversations table to support community group chats
ALTER TABLE conversations
    ADD COLUMN community_group_id BIGINT REFERENCES community_groups(id) ON DELETE SET NULL;

-- Ensure only one active conversation per community group
CREATE UNIQUE INDEX uq_conversations_community_group
    ON conversations(community_group_id)
    WHERE community_group_id IS NOT NULL;
