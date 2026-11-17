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
      'Các buổi gặp mặt hoặc hỗ trợ trực tuyến cần được thống nhất thời gian và phương thức rõ ràng từ trước.',
      'Quy định vắng mặt (No-show): Nếu một bên vào trễ quá 15 phút mà không có lý do chính đáng và không thông báo trước, buổi hẹn được tính là Vắng mặt. Trường hợp Student vắng mặt không báo trước, Mentor vẫn có quyền ghi nhận Work Log cho thời gian đã dành để chờ đợi.'
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
      'Student có trách nhiệm kiểm tra và phản hồi Work Log trong vòng 72 giờ kể từ khi Mentor gửi.',
      'Nếu quá 72 giờ mà Student không có phản hồi hay khiếu nại, đây sẽ là căn cứ pháp lý mặc định để Ban Quản Trị (Admin) công nhận kết quả và thực hiện giải ngân cho Mentor khi có yêu cầu đối soát hoặc phát sinh tranh chấp.',
      'Dữ liệu Work Log là căn cứ pháp lý quan trọng nhất để giải quyết quyền lợi và các tranh chấp phát sinh.'
    ]
  },
  {
    id: 6,
    title: '6. Thanh toán & quyết toán',
    content: [
      'Mọi giao dịch thanh toán trong module Mentoring bắt buộc phải được xử lý qua hệ thống thanh toán chính thức của AlumNect.',
      'Khoản thanh toán của Student được hệ thống tạm giữ an toàn trong Quỹ ký quỹ (Escrow) và chỉ giải ngân cho Mentor khi Task/Deal hoàn tất hoặc có quyết định phân xử hợp lệ.',
      'Nghiêm cấm các giao dịch thỏa thuận chuyển tiền riêng ngoài hệ thống nhằm trốn tránh trách nhiệm bảo hộ của nền tảng.',
      'Chính sách hủy và hoàn tiền: Nếu báo hủy trước 24 giờ kể từ khi Task bắt đầu sẽ được hoàn tiền 100%; trường hợp hủy sát giờ dưới 24 giờ mà không có lý do bất khả kháng, bên hủy có thể chịu khấu trừ phí bồi hoàn theo quy định của nền tảng.',
      'Trường hợp Task hoặc Deal không hoàn thành trọn vẹn, hệ thống sẽ chuyển sang quy trình Quyết toán (Settlement) dựa trên tỷ lệ công việc thực tế được xác nhận qua Work Log.'
    ]
  },
  {
    id: 7,
    title: '7. Tranh chấp & xử lý khiếu nại',
    content: [
      'Khi phát sinh bất đồng không thể tự thương lượng, Student hoặc Mentor có quyền gửi yêu cầu tạo Phiếu hỗ trợ tranh chấp (Dispute Ticket).',
      'Thời hiệu khiếu nại: Dispute Ticket chỉ được tiếp nhận trong vòng tối đa 07 ngày kể từ khi phát sinh sự cố hoặc kể từ thời điểm Task kết thúc. Quá thời hiệu này, hệ thống sẽ tự động đóng giao dịch và giải ngân theo dữ liệu Work Log hiện hành.',
      'Ban Quản trị hệ thống (Admin) có thẩm quyền tiếp nhận, xem xét và chủ trì xử lý Ticket tranh chấp.',
      'Student, Mentor và Admin có thể trao đổi trực tiếp, cung cấp tài liệu minh chứng trong Ticket.',
      'Quyết định của Admin dựa trên Thỏa thuận (Deal), dữ liệu Work Log và bằng chứng đối chất thực tế là quyết định cuối cùng.'
    ]
  },
  {
    id: 8,
    title: '8. Bảo mật & quyền sở hữu trí tuệ',
    content: [
      'Các bên tuyệt đối giữ bí mật thông tin cá nhân, tài liệu học tập, mã nguồn dự án và dữ liệu doanh nghiệp được chia sẻ trong quá trình Mentoring.',
      'Quyền sở hữu trí tuệ: Các sản phẩm, mã nguồn, tài liệu chuyên môn do Mentor tạo ra riêng cho Student trong phạm vi Deal thuộc quyền sở hữu của Student sau khi đã hoàn tất thanh toán. Các giáo trình, tài liệu mẫu hoặc công cụ có sẵn từ trước của Mentor vẫn thuộc quyền sở hữu trí tuệ của Mentor.',
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
      'Miễn trừ trách nhiệm chuyên môn: AlumNect đóng vai trò là nền tảng kết nối và bảo đảm an toàn giao dịch; AlumNect không cam kết hay chịu trách nhiệm trực tiếp về điểm số môn học, kết quả đồ án hoặc cơ hội tuyển dụng cuối cùng của Student.',
      'Hệ thống có quyền tạm khóa hoặc đình chỉ Deal khi phát hiện dấu hiệu bất thường hoặc vi phạm Điều khoản.',
      'Điều khoản Hướng dẫn & Hỗ trợ có thể được cập nhật định kỳ. Người dùng sẽ được yêu cầu xác nhận lại trước khi tiếp tục sử dụng module.'
    ]
  }
]
