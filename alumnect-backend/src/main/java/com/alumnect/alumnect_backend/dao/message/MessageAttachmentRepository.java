package com.alumnect.alumnect_backend.dao.message;

import com.alumnect.alumnect_backend.entity.message.MessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repository thao tác với bảng message_attachments.
 */
@Repository
public interface MessageAttachmentRepository extends JpaRepository<MessageAttachment, Long> {

    /**
     * Lấy toàn bộ danh sách tệp đính kèm theo mã tin nhắn.
     */
    List<MessageAttachment> findByMessageId(Long messageId);
}
