/**
 * Nội dung chi tiết các điều khoản của Module Hướng dẫn & Hỗ trợ (Mentorship).
 * Tuân thủ đầy đủ 10 mục quy định nghiệp vụ theo đặc tả Use Case UC90.
 */

export interface TermsSection {
  id: number
  title: string
  content: string[]
}

export const MENTORING_TERMS_SECTIONS: TermsSection[] = [
  {
    id: 1,
    title: '1. Trách nhiệm của người tham gia',
    content: [
      'Các bên (Mentor và Student) cam kết cung cấp thông tin trung thực, chính xác và chịu trách nhiệm về nội dung hồ sơ, bằng cấp và kỹ năng của mình trên hệ thống.',
      'Người tham gia có nghĩa vụ tự bảo vệ thông tin đăng nhập và các hoạt động phát sinh từ tài khoản của mình.',
      'Student và Mentor chủ động duy trì liên lạc và thực hiện đúng các cam kết hỗ trợ đã thống nhất trong khuôn khổ chương trình.'
    ]
  },
  {
    id: 2,
    title: '2. Quy tắc ứng xử',
    content: [
      'Student và Mentor luôn giữ thái độ giao tiếp văn minh, tôn trọng lẫn nhau, chuyên nghiệp và đúng chuẩn mực học thuật cũng như văn hóa FPT University.',
      'Không sử dụng ngôn từ kích động, xúc phạm, phân biệt đối xử hoặc quấy rối dưới bất kỳ hình thức nào trong quá trình trao đổi.',
      'Mọi ý kiến đóng góp, phản hồi cần mang tính xây dựng nhằm hỗ trợ sự phát triển chuyên môn và kỹ năng của người học.'
    ]
  },
  {
    id: 3,
    title: '3. Trao đổi & hợp tác',
    content: [
      'Hai bên tuân thủ nghiêm ngặt phạm vi công việc, mục tiêu học tập và lộ trình hướng dẫn đã thỏa thuận ban đầu.',
      'Không một bên nào được tự ý đơn phương thay đổi Thỏa thuận (Deal) đã được cả hai bên xác nhận trên hệ thống.',
      'Các buổi gặp mặt hoặc hỗ trợ trực tuyến cần được thống nhất thời gian và phương thức rõ ràng từ trước.'
    ]
  },
  {
    id: 4,
    title: '4. Task & Deadline',
    content: [
      'Mentor thực hiện giao việc, hướng dẫn và đánh giá Task theo đúng kế hoạch của Deal đã được hai bên kích hoạt.',
      'Student có trách nhiệm nỗ lực hoàn thành các bài tập, nhiệm vụ được giao đúng thời hạn (Deadline).',
      'Mọi yêu cầu gia hạn Deadline cần có sự trao đổi và đồng thuận của cả hai bên trước khi thời hạn kết thúc.'
    ]
  },
  {
    id: 5,
    title: '5. Work Log',
    content: [
      'Mentor có trách nhiệm ghi nhận Work Log chi tiết, minh bạch mỗi khi hoàn thành phiên hướng dẫn hoặc tác vụ công việc cụ thể.',
      'Student có toàn quyền xem, theo dõi tiến độ và phản hồi/xác nhận tính chính xác của các Work Log được tạo.',
      'Dữ liệu Work Log là căn cứ pháp lý quan trọng để giải quyết quyền lợi và các tranh chấp phát sinh (nếu có).'
    ]
  },
  {
    id: 6,
    title: '6. Thanh toán & quyết toán',
    content: [
      'Mọi giao dịch thanh toán trong module Mentoring bắt buộc phải được xử lý qua hệ thống thanh toán chính thức của AlumNect.',
      'Nghiêm cấm các giao dịch thỏa thuận chuyển tiền riêng ngoài hệ thống nhằm trốn tránh trách nhiệm bảo hộ của nền tảng.',
      'Trường hợp Task hoặc Deal không hoàn thành trọn vẹn, hệ thống sẽ chuyển sang quy trình Quyết toán (Settlement) dựa trên tỷ lệ công việc thực tế được xác nhận qua Work Log.'
    ]
  },
  {
    id: 7,
    title: '7. Tranh chấp & xử lý khiếu nại',
    content: [
      'Khi phát sinh bất đồng không thể tự thương lượng, Student hoặc Mentor có quyền gửi yêu cầu tạo Phiếu hỗ trợ tranh chấp (Dispute Ticket).',
      'Ban Quản trị hệ thống (Admin) có thẩm quyền tiếp nhận, xem xét và chủ trì xử lý Ticket tranh chấp.',
      'Student, Mentor và Admin có thể trao đổi trực tiếp, cung cấp tài liệu minh chứng trong Ticket.',
      'Quyết định của Admin dựa trên Thỏa thuận (Deal), dữ liệu Work Log và bằng chứng đối chất thực tế là quyết định cuối cùng.'
    ]
  },
  {
    id: 8,
    title: '8. Bảo mật thông tin',
    content: [
      'Các bên tuyệt đối giữ bí mật thông tin cá nhân, tài liệu học tập, mã nguồn dự án và dữ liệu doanh nghiệp được chia sẻ trong quá trình Mentoring.',
      'Không phát tán, sao chép hoặc thương mại hóa bất kỳ tài liệu nào ra ngoài hệ thống nếu chưa có sự đồng ý bằng văn bản của bên cung cấp.',
      'Mọi dữ liệu trao đổi trong nền tảng được bảo vệ theo Chính sách Quyền riêng tư của AlumNect.'
    ]
  },
  {
    id: 9,
    title: '9. Hành vi nghiêm cấm',
    content: [
      'Nghiêm cấm các hành vi gian lận thi cử, làm hộ bài tập lớn, thi hộ hoặc vi phạm liêm chính học thuật dưới mọi hình thức.',
      'Nghiêm cấm chia sẻ nội dung độc hại, lừa đảo, phát tán mã độc hoặc sử dụng module cho các mục đích thương mại trái phép.',
      'Tài khoản vi phạm sẽ bị khóa vĩnh viễn và bị thu hồi toàn bộ quyền lợi trên mạng lưới AlumNect.'
    ]
  },
  {
    id: 10,
    title: '10. Quyền và trách nhiệm của nền tảng',
    content: [
      'AlumNect cung cấp giải pháp công nghệ kết nối, giám sát và bảo đảm an toàn cho các hoạt động Hướng dẫn & Hỗ trợ.',
      'Hệ thống có quyền tạm khóa hoặc đình chỉ Deal khi phát hiện dấu hiệu bất thường hoặc vi phạm Điều khoản.',
      'Điều khoản Hướng dẫn & Hỗ trợ có thể được cập nhật định kỳ. Người dùng sẽ được yêu cầu xác nhận phiên bản mới trước khi tiếp tục sử dụng module.'
    ]
  }
]
