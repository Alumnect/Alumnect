export interface ParsedAdjustmentMessage {
  senderName: string
  version: number
  note: string
}

/**
 * Phân tích nội dung tin nhắn hệ thống khi học viên gửi yêu cầu điều chỉnh Deal Ticket.
 * Định dạng chuẩn backend:
 * "[Tên người gửi] đã yêu cầu điều chỉnh Deal Ticket phiên bản [X]: "[Ghi chú]". Mentor vui lòng gửi phiên bản Deal Ticket mới."
 */
export function parseAdjustmentMessage(content?: string | null): ParsedAdjustmentMessage | null {
  if (!content) return null
  const trimmed = content.trim()
  const match = trimmed.match(
    /^(.+?)\s+đã yêu cầu điều chỉnh Deal Ticket phiên bản\s+(\d+):\s*"([\s\S]*)"(?:\.\s*Mentor vui lòng gửi phiên bản Deal Ticket mới\.?)?$/
  )
  if (!match) return null
  return {
    senderName: match[1].trim(),
    version: parseInt(match[2], 10),
    note: match[3].trim(),
  }
}
