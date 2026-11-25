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
      'Các bên (Cố vấn và Học viên) cam kết cung cấp thông tin trung thực, chính xác và chịu trách nhiệm về nội dung hồ sơ, bằng cấp và kỹ năng của mình trên hệ thống.',
      'Người tham gia có nghĩa vụ tự bảo vệ thông tin đăng nhập và các hoạt động phát sinh từ tài khoản của mình.',
      'Học viên và Cố vấn chủ động duy trì liên lạc và thực hiện đúng các cam kết hỗ trợ đã thống nhất trong khuôn khổ chương trình.'
    ]
  },
  {
    id: 2,
    title: '2. Quy tắc ứng xử',
    content: [
      'Học viên và Cố vấn luôn giữ thái độ giao tiếp văn minh, tôn trọng lẫn nhau, chuyên nghiệp và đúng chuẩn mực học thuật cũng như văn hóa Trường Đại học FPT.',
      'Không sử dụng ngôn từ kích động, xúc phạm, phân biệt đối xử hoặc quấy rối dưới bất kỳ hình thức nào trong quá trình trao đổi.',
      'Mọi ý kiến đóng góp, phản hồi cần mang tính xây dựng nhằm hỗ trợ sự phát triển chuyên môn và kỹ năng của người học.'
    ]
  },
  {
    id: 3,
    title: '3. Trao đổi, hợp tác & Quy định hủy lịch, vắng mặt',
    content: [
      'Hai bên tuân thủ nghiêm ngặt phạm vi công việc, mục tiêu học tập và lộ trình hướng dẫn đã thỏa thuận ban đầu; không bên nào được tự ý đơn phương thay đổi thỏa thuận đã được xác nhận trên hệ thống.',
      'Quy định báo hủy và dời lịch hẹn: Các buổi gặp mặt trực tiếp hoặc hỗ trợ trực tuyến phải được thống nhất thời gian từ trước. Nếu muốn hủy hoặc dời lịch buổi hẹn, bên yêu cầu phải thông báo trước tối thiểu 12 giờ trước giờ bắt đầu để được coi là hợp lệ.',
      'Quy định vắng mặt: Nếu một bên vào trễ quá 15 phút so với lịch hẹn mà không có lý do chính đáng và không thông báo trước, buổi hẹn được tính là vắng mặt.',
      'Quyền lợi khi đối phương vắng mặt: Trường hợp Học viên vắng mặt không báo trước, Cố vấn vẫn được quyền ghi nhận nhật ký công việc hợp lệ cho buổi đó. Ngược lại, nếu Cố vấn vắng mặt không báo trước, Học viên có quyền yêu cầu xếp buổi học bù tương đương hoặc hoàn trả 100% chi phí phiên đó kèm trừ điểm uy tín của Cố vấn.'
    ]
  },
  {
    id: 4,
    title: '4. Nhiệm vụ & Thời hạn hoàn thành',
    content: [
      'Cố vấn thực hiện giao việc, hướng dẫn và đánh giá nhiệm vụ theo đúng kế hoạch của thỏa thuận đã được hai bên kích hoạt.',
      'Học viên có trách nhiệm nỗ lực hoàn thành các bài tập, nhiệm vụ được giao đúng thời hạn cam kết.',
      'Mọi yêu cầu gia hạn thời hạn hoàn thành cần có sự trao đổi và đồng thuận của cả hai bên trước khi thời hạn kết thúc.'
    ]
  },
  {
    id: 5,
    title: '5. Nhật ký công việc & Cơ chế tự động xác nhận',
    content: [
      'Cố vấn có trách nhiệm ghi nhận nhật ký công việc chi tiết, minh bạch (nội dung hoàn thành, kết quả đạt được, tài liệu minh chứng) sau mỗi phiên hướng dẫn hoặc tác vụ công việc cụ thể.',
      'Học viên có quyền và trách nhiệm kiểm tra, bấm xác nhận hoặc phản hồi yêu cầu chỉnh sửa nhật ký công việc trong vòng 72 giờ kể từ thời điểm Cố vấn tạo nhật ký.',
      'Quy định tự động xác nhận: Nếu quá thời hạn 72 giờ mà Học viên im lặng, không phản hồi và không gửi khiếu nại, hệ thống cùng Ban Quản trị sẽ mặc định tự động xác nhận nhật ký công việc đó là hợp lệ để làm căn cứ quyết toán và giải ngân cho Cố vấn, ngăn chặn việc cố tình trì hoãn thanh toán.',
      'Dữ liệu nhật ký công việc đã xác nhận là căn cứ pháp lý quan trọng nhất để bảo vệ quyền lợi đôi bên và phân xử khi có tranh chấp.'
    ]
  },
  {
    id: 6,
    title: '6. Thanh toán, Thu hộ – Chi hộ & Ký quỹ (Escrow)',
    content: [
      '6.1. Vai trò trung gian và Ủy quyền Thu hộ – Chi hộ: AlumNect hoạt động với tư cách là nền tảng số kết nối giữa Học viên (Người học) và Cố vấn (Mentor). Nguồn doanh thu duy nhất của AlumNect đến từ phí đăng ký gói thành viên (Subscription) của Mentor; AlumNect không thu phí hoa hồng trên từng buổi học. Đối với thù lao tư vấn phát sinh giữa Học viên và Mentor, Mentor đồng ý ủy quyền cho AlumNect (thông qua đối tác trung gian thanh toán PayOS được Ngân hàng Nhà nước cấp phép) thực hiện việc tiếp nhận tiền thanh toán từ Học viên (thu hộ) và giải ngân lại cho Mentor (chi hộ) sau khi phiên tư vấn hoặc nhiệm vụ hoàn tất. Khoản tiền thu hộ – chi hộ này là giao dịch dân sự trực tiếp giữa Học viên và Mentor, không được ghi nhận là doanh thu của AlumNect.',
      '6.2. Phí hạ tầng thanh toán: Mọi giao dịch giải ngân cho Mentor hoặc hoàn tiền cho Học viên qua cổng thanh toán PayOS sẽ tự động khấu trừ phí hạ tầng giao dịch là 3.000 VNĐ/lệnh chuyển khoản (hoặc theo biểu phí thực tế của cổng thanh toán tại từng thời điểm). Bên nhận tiền (Mentor hoặc Học viên trong trường hợp hoàn tiền) là bên chịu khoản phí giao dịch này.',
      '6.3. Quy định xử lý Tranh chấp và Hoàn tiền (Escrow): Trong thời gian phiên tư vấn chưa hoàn tất, toàn bộ khoản tiền của Học viên được tạm giữ an toàn (Escrow 100%) thông qua hạ tầng thanh toán liên kết PayOS. Trường hợp phát sinh khiếu nại hoặc tranh chấp, Ban Quản trị AlumNect sẽ căn cứ vào bằng chứng của hai bên để đưa ra phán quyết phân chia tỷ lệ: (i) Phần hoàn lại cho Học viên: Trừ 3.000 VNĐ phí chuyển khoản hoàn tiền; (ii) Phần chi trả cho Mentor: Trừ 3.000 VNĐ phí chuyển khoản chi trả.'
    ]
  },
  {
    id: 7,
    title: '7. Tranh chấp & Thời hiệu khiếu nại',
    content: [
      'Khi phát sinh bất đồng không thể tự thương lượng, Học viên hoặc Cố vấn có quyền gửi yêu cầu tạo phiếu khiếu nại tranh chấp để tạm phong tỏa khoản tiền ký quỹ.',
      'Thời hiệu khiếu nại: Phiếu khiếu nại tranh chấp chỉ được phép mở trong vòng tối đa 07 ngày kể từ thời điểm phát sinh sự cố hoặc kể từ ngày kết thúc thỏa thuận và nhiệm vụ. Quá thời hiệu 07 ngày, hệ thống tự động đóng quyền khiếu nại và giải ngân dứt điểm theo dữ liệu nhật ký công việc hiện hành.',
      'Ban Quản trị hệ thống có thẩm quyền tiếp nhận, xem xét lịch sử trao đổi, đối chiếu nhật ký công việc và các bằng chứng hai bên cung cấp trong phiếu khiếu nại.',
      'Phán quyết của Ban Quản trị dựa trên nội dung thỏa thuận, dữ liệu nhật ký công việc và bằng chứng thực tế là quyết định phân xử cuối cùng.'
    ]
  },
  {
    id: 8,
    title: '8. Bảo mật & Quyền sở hữu trí tuệ',
    content: [
      'Các bên tuyệt đối giữ bí mật thông tin cá nhân, tài liệu học tập, mã nguồn dự án và dữ liệu nội bộ được chia sẻ trong suốt quá trình hướng dẫn.',
      'Quyền sở hữu trí tuệ: Các sản phẩm tạo ra trong quá trình hướng dẫn (đoạn mã nguồn, bản thiết kế, báo cáo, tài liệu giải pháp mà Cố vấn hướng dẫn hoặc cùng Học viên thực hiện trong phạm vi thỏa thuận) thuộc quyền sở hữu và quyền sử dụng của Học viên sau khi hoàn tất thanh toán. Ngược lại, các giáo trình, bài giảng mẫu, bộ khung tài liệu và công cụ có sẵn từ trước của Cố vấn vẫn thuộc quyền sở hữu trí tuệ riêng của Cố vấn.',
      'Không bên nào được tự ý phát tán, sao chép trái phép hoặc thương mại hóa tài sản trí tuệ của bên kia ra ngoài hệ thống khi chưa có sự đồng ý bằng văn bản.',
      'Mọi dữ liệu trao đổi trên nền tảng được bảo vệ nghiêm ngặt theo Chính sách quyền riêng tư của AlumNect.'
    ]
  },
  {
    id: 9,
    title: '9. Hành vi nghiêm cấm',
    content: [
      'Nghiêm cấm các hành vi gian lận thi cử, làm hộ bài tập lớn, viết hộ khóa luận, thi hộ hoặc vi phạm liêm chính học thuật dưới mọi hình thức.',
      'Nghiêm cấm chia sẻ nội dung độc hại, lừa đảo, phát tán mã độc hoặc lợi dụng hoạt động hướng dẫn cho các mục đích thương mại trái phép.',
      'Tài khoản vi phạm sẽ bị khóa vĩnh viễn và bị thu hồi toàn bộ quyền lợi trên mạng lưới AlumNect.'
    ]
  },
  {
    id: 10,
    title: '10. Quyền, trách nhiệm & Miễn trừ trách nhiệm của nền tảng',
    content: [
      'AlumNect cung cấp giải pháp công nghệ kết nối, giám sát tiến độ và bảo đảm an toàn giao dịch cho các hoạt động hướng dẫn và hỗ trợ.',
      'Miễn trừ trách nhiệm chuyên môn: Nền tảng AlumNect đóng vai trò kết nối và bảo đảm giao dịch minh bạch, hoàn toàn không cam kết hay chịu trách nhiệm về kết quả điểm số trên lớp, kết quả bảo vệ đồ án hoặc kết quả tuyển dụng cuối cùng của Học viên.',
      'Hệ thống có quyền tạm khóa tài khoản hoặc đình chỉ thỏa thuận khi phát hiện dấu hiệu gian lận hoặc vi phạm điều khoản.',
      'Điều khoản hướng dẫn và hỗ trợ có thể được cập nhật định kỳ; người dùng sẽ được thông báo và xác nhận lại trước khi tiếp tục sử dụng dịch vụ.'
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
    title: '3. Collaboration, Cancellation & No-show Policy',
    content: [
      'Both parties strictly follow the scope of work, learning goals and mentoring plan agreed at the start; neither party may unilaterally change a confirmed Deal.',
      'Session Cancellation & Rescheduling: Online or offline session times must be agreed in advance. Any request to cancel or reschedule a session must be notified at least 12 hours before the scheduled start time to be considered valid.',
      'No-show Policy: If either party is more than 15 minutes late without a valid reason and without prior notice, the session is counted as a No-show.',
      'Rights upon Counterparty No-show: If the Student is absent without prior notice, the Mentor retains the right to log a valid Work Log for that session. Conversely, if the Mentor is absent without prior notice, the Student is entitled to a make-up session or a 100% refund for that session along with a reputation penalty applied to the Mentor.',
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
    title: '5. Work Log & Auto-approve Mechanism',
    content: [
      'The Mentor is responsible for recording a detailed and transparent Work Log (completed work, deliverables, supporting evidence) after each mentoring session or task.',
      'The Student has the right and responsibility to review, confirm, or request revisions to a Work Log within 72 hours of its creation by the Mentor.',
      'Auto-approve Rule: If 72 hours pass and the Student remains silent without confirming or filing a dispute, the system and Administrators (Admin) will automatically approve (Auto-approve) the Work Log as valid legal grounds for settlement and payout to the Mentor, preventing deliberate payment avoidance.',
      'Confirmed Work Log data serves as the primary legal basis for protecting both parties and resolving disputes.',
    ],
  },
  {
    id: 6,
    title: '6. Payment, Collection & Disbursement on Behalf & Escrow',
    content: [
      '6.1. Intermediary Role & Authorization for Collection and Disbursement on Behalf: AlumNect operates strictly as a digital matching platform connecting Students (Learners) and Mentors. AlumNect\'s sole revenue comes from Mentor Membership Subscription fees; AlumNect does NOT charge commission fees on individual mentoring sessions. For mentoring honorariums/fees arising between Student and Mentor, the Mentor authorizes AlumNect (via PayOS, a payment intermediary licensed by the State Bank of Vietnam) to receive payments from Students (collection on behalf) and disburse funds to the Mentor (disbursement on behalf) after the mentoring session or task is completed. These collected and disbursed funds constitute a direct civil transaction between Student and Mentor and are never recorded as AlumNect revenue.',
      '6.2. Payment Infrastructure Fee: All payout disbursements to Mentors or refunds to Students via the PayOS gateway automatically deduct a transaction infrastructure fee of 3,000 VND per transfer (or according to the actual gateway tariff at that time). The recipient of funds (Mentor, or Student in case of refunds) bears this transaction fee.',
      '6.3. Dispute Resolution & Refund Policy (Escrow): While a mentoring session or task is pending completion, 100% of the Student\'s payment is held securely in Escrow via the PayOS linked payment infrastructure. In the event of a complaint or dispute, AlumNect will evaluate evidence from both parties to issue an arbitration ruling: (i) Refund to Student: Deducting only the 3,000 VND refund transfer fee; (ii) Payout to Mentor: Deducting only the 3,000 VND payout transfer fee.'
    ],
  },
  {
    id: 7,
    title: '7. Disputes & Statute of Limitations',
    content: [
      'When a disagreement cannot be settled by negotiation, the Student or Mentor may submit a Dispute Ticket to freeze the Escrow fund (ON_HOLD).',
      'Statute of Limitations: Dispute Tickets may only be opened within a maximum of 07 days from the date of the incident or the Deal/Task completion date. After 07 days, the system automatically closes the dispute window and finalizes payout based on recorded Work Logs.',
      'System Administrators (Admin) are authorized to review chat history, audit Work Logs, and evaluate evidence submitted by both parties within the Ticket.',
      'The Admin\'s decision, based on the Deal terms, Work Log data, and verified evidence, is final and binding.',
    ],
  },
  {
    id: 8,
    title: '8. Confidentiality & Intellectual Property (IP)',
    content: [
      'All parties must keep personal information, study materials, project source code, and internal data shared during Mentoring strictly confidential.',
      'Intellectual Property (IP): Deliverables created during Mentoring (code snippets, designs, reports, or solutions developed for or co-created with the Student under the Deal) belong to the Student upon full payment. Conversely, the Mentor\'s pre-existing curricula, templates, and tools remain the sole intellectual property of the Mentor for the Student\'s personal learning use only.',
      'Neither party may distribute, copy, or commercialize the other party\'s intellectual property outside the platform without prior written consent.',
      'All data exchanged on the platform is strictly protected under AlumNect\'s Privacy Policy.',
    ],
  },
  {
    id: 9,
    title: '9. Prohibited conduct',
    content: [
      'Cheating on exams, ghostwriting assignments or theses, taking exams for others, or violating academic integrity in any form is strictly prohibited.',
      'Sharing harmful or fraudulent content, spreading malware, or using Mentoring activities for unauthorized commercial purposes is strictly prohibited.',
      'Violating accounts will be permanently banned and all privileges on the AlumNect network revoked.',
    ],
  },
  {
    id: 10,
    title: '10. Platform Rights, Responsibilities & Disclaimer',
    content: [
      'AlumNect provides the technology infrastructure to connect participants, monitor progress, and safeguard transactions for Mentoring activities.',
      'Professional Disclaimer: AlumNect acts as a connecting and transaction-protection platform and does not guarantee or assume liability for classroom grades, thesis defense scores, or final employment outcomes of the Student.',
      'The system reserves the right to suspend accounts or freeze Deals upon detecting fraud or violations of these Terms.',
      'The Mentoring Terms may be updated periodically; users will be notified and asked to re-confirm before continuing to use the service.',
    ],
  },
]

/** Lấy điều khoản theo ngôn ngữ giao diện hiện tại. */
export const getMentoringTermsSections = (language: string): TermsSection[] =>
  language?.startsWith('en') ? MENTORING_TERMS_SECTIONS_EN : MENTORING_TERMS_SECTIONS
