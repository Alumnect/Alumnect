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
      'Điều khoản Hướng dẫn & Hỗ trợ có thể được cập nhật định kỳ. Người dùng sẽ được yêu cầu xác nhận lại trước khi tiếp tục sử dụng module.'
    ]
  }
]

/** Bản tiếng Anh của điều khoản Mentoring (dùng khi giao diện ở English). */
export const MENTORING_TERMS_SECTIONS_EN: TermsSection[] = [
  {
    id: 1,
    title: '1. Participant responsibilities',
    content: [
      'Both parties (Mentor and Student) commit to providing truthful and accurate information and are responsible for the content of their profile, qualifications and skills on the system.',
      'Participants are responsible for protecting their login credentials and all activity arising from their accounts.',
      'Students and Mentors proactively keep in touch and fulfil the support commitments agreed within the program.',
    ],
  },
  {
    id: 2,
    title: '2. Code of conduct',
    content: [
      'Students and Mentors always communicate in a civil, respectful and professional manner, in line with academic standards and the culture of FPT University.',
      'Inflammatory, insulting, discriminatory or harassing language of any kind is not allowed during exchanges.',
      'All comments and feedback should be constructive and support the learner\'s professional and skill development.',
    ],
  },
  {
    id: 3,
    title: '3. Communication & collaboration',
    content: [
      'Both parties strictly follow the scope of work, learning goals and mentoring plan agreed at the start.',
      'Neither party may unilaterally change a Deal that both parties have confirmed on the system.',
      'In-person or online sessions must have their time and format agreed clearly in advance.',
    ],
  },
  {
    id: 4,
    title: '4. Tasks & deadlines',
    content: [
      'The Mentor assigns, guides and evaluates Tasks according to the plan of the Deal activated by both parties.',
      'The Student is responsible for completing assigned exercises and tasks on time (Deadline).',
      'Any request to extend a Deadline must be discussed and agreed by both parties before the deadline ends.',
    ],
  },
  {
    id: 5,
    title: '5. Work Log',
    content: [
      'The Mentor is responsible for recording a detailed and transparent Work Log whenever a mentoring session or specific task is completed.',
      'The Student has full rights to view, track progress and respond to / confirm the accuracy of the Work Logs created.',
      'Work Log data is an important basis for resolving rights and any disputes that may arise.',
    ],
  },
  {
    id: 6,
    title: '6. Payment & settlement',
    content: [
      'All payment transactions in the Mentoring module must be processed through AlumNect\'s official payment system.',
      'Private money transfers outside the system to avoid the platform\'s protection are strictly prohibited.',
      'If a Task or Deal is not fully completed, the system moves to a Settlement process based on the actual share of work confirmed through Work Logs.',
    ],
  },
  {
    id: 7,
    title: '7. Disputes & complaint handling',
    content: [
      'When a disagreement cannot be settled by negotiation, the Student or Mentor may submit a Dispute Ticket.',
      'System administrators (Admin) are authorized to receive, review and lead the handling of dispute Tickets.',
      'Students, Mentors and Admins can discuss directly and provide supporting documents within the Ticket.',
      'The Admin\'s decision, based on the Deal, Work Log data and the evidence presented, is final.',
    ],
  },
  {
    id: 8,
    title: '8. Information security',
    content: [
      'All parties must keep personal information, study materials, project source code and business data shared during Mentoring strictly confidential.',
      'Do not distribute, copy or commercialize any material outside the system without the written consent of the party who provided it.',
      'All data exchanged on the platform is protected under AlumNect\'s Privacy Policy.',
    ],
  },
  {
    id: 9,
    title: '9. Prohibited conduct',
    content: [
      'Cheating on exams, doing assignments or exams for others, or violating academic integrity in any form is strictly prohibited.',
      'Sharing harmful or fraudulent content, spreading malware, or using the module for unauthorized commercial purposes is strictly prohibited.',
      'Violating accounts will be permanently locked and all of their benefits on the AlumNect network revoked.',
    ],
  },
  {
    id: 10,
    title: '10. Platform rights and responsibilities',
    content: [
      'AlumNect provides the technology to connect, monitor and keep Mentoring activities safe.',
      'The system may temporarily lock or suspend a Deal when it detects abnormal signs or violations of the Terms.',
      'The Mentoring Terms may be updated periodically. Users will be asked to confirm again before continuing to use the module.',
    ],
  },
]

/** Lấy điều khoản theo ngôn ngữ giao diện hiện tại. */
export const getMentoringTermsSections = (language: string): TermsSection[] =>
  language === 'en' ? MENTORING_TERMS_SECTIONS_EN : MENTORING_TERMS_SECTIONS
