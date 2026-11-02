-- Replace ad-hoc test strings with coherent mentoring scenarios.
-- IDs are intentionally scoped to the local demo records that existed before V39.

UPDATE mentoring_requests AS r
SET title = v.title,
    description = v.description
FROM (VALUES
    (1::bigint,
     'Định hướng lộ trình nghề nghiệp Backend Java',
     'Em là sinh viên năm ba, đã học Java Core và Spring Boot cơ bản. Em cần mentor đánh giá năng lực hiện tại, tư vấn lộ trình học Microservices và chuẩn bị cho kỳ thực tập Backend trong 6 tháng tới.'),
    (2::bigint,
     'Review CV ứng tuyển Backend Intern',
     'Em cần góp ý CV một trang cho vị trí Backend Intern: cách trình bày hai dự án Spring Boot, kỹ năng kỹ thuật và thành tích học tập. Mong mentor chỉ ra điểm chưa rõ và đề xuất cách diễn đạt phù hợp với nhà tuyển dụng.'),
    (3::bigint,
     'Tư vấn triển khai ứng dụng Spring Boot lên cloud',
     'Em đang hoàn thiện API cho đồ án và gặp khó khăn khi đóng gói Docker, cấu hình PostgreSQL và triển khai lên cloud. Em cần một buổi tư vấn để rà soát kiến trúc, xử lý lỗi triển khai và xây dựng checklist vận hành.'),
    (4::bigint,
     'Review CV và LinkedIn cho nhóm sinh viên Backend',
     'Nhóm ba sinh viên năm cuối cần mentor rà soát CV và hồ sơ LinkedIn trước đợt tuyển dụng fresher. Mỗi thành viên mong nhận góp ý riêng về dự án, kỹ năng và cách trình bày kinh nghiệm.'),
    (5::bigint,
     'Tư vấn đồ án marketing cho thương hiệu cà phê',
     'Nhóm đang xây dựng kế hoạch marketing số cho một thương hiệu cà phê địa phương. Cần mentor góp ý chân dung khách hàng, thông điệp chiến dịch, lựa chọn kênh và bộ KPI đo lường.'),
    (6::bigint,
     'Luyện phỏng vấn tiếng Anh cho vị trí Business Analyst',
     'Em cần luyện cách giới thiệu bản thân, trình bày kinh nghiệm dự án và trả lời câu hỏi tình huống bằng tiếng Anh. Mong mentor sửa cách dùng từ, phát âm và giúp em chuẩn bị bộ câu trả lời ngắn gọn.'),
    (7::bigint,
     'Xây dựng lộ trình học Cloud và DevOps cho nhóm',
     'Nhóm bốn sinh viên CNTT muốn có lộ trình 12 tuần về Linux, Docker, CI/CD và nền tảng cloud. Cần mentor xác định thứ tự kiến thức, bài tập thực hành và một dự án chung để đưa vào portfolio.'),
    (8::bigint,
     'Hoàn thiện chiến lược ra mắt ứng dụng đặt đồ ăn',
     'Nhóm cần phản biện kế hoạch go-to-market cho ứng dụng đặt đồ ăn trong khuôn viên trường. Phạm vi gồm phân khúc người dùng, định vị, kế hoạch nội dung bốn tuần và chỉ số đánh giá thử nghiệm.'),
    (9::bigint,
     'Xây dựng lộ trình chuyển từ QA sang Backend Java',
     'Em đã có một năm làm QA thủ công và muốn chuyển sang Backend Java. Em cần mentor đánh giá kiến thức hiện tại, đề xuất lộ trình học trong ba tháng và góp ý dự án API quản lý công việc để đưa vào portfolio.')
) AS v(id, title, description)
WHERE r.id = v.id;

UPDATE mentoring_request_distributions AS d
SET response_note = v.response_note
FROM (VALUES
    (3::bigint, 'Hiện lịch của anh đã kín nên chưa thể nhận thêm buổi tư vấn trong tuần này.'),
    (5::bigint, 'Anh có thể hỗ trợ nhóm review từng CV và thống nhất một buổi tổng kết chung.'),
    (7::bigint, 'Anh đã xem brief và có thể đồng hành cùng nhóm hoàn thiện kế hoạch marketing.'),
    (11::bigint, 'Anh nhận hỗ trợ nhóm phản biện chiến lược và hoàn thiện bộ KPI thử nghiệm.'),
    (14::bigint, 'Anh có thể cùng em xây dựng lộ trình và review dự án Backend trong ba tháng.')
) AS v(id, response_note)
WHERE d.id = v.id;

UPDATE mentoring_groups AS g
SET name = v.name,
    description = v.description
FROM (VALUES
    (1::bigint, 'Nhóm Cloud & DevOps K18', 'Cùng xây dựng lộ trình học và dự án CI/CD trong 12 tuần.'),
    (2::bigint, 'Nhóm Go-to-market Campus Food', 'Nhóm đồ án nghiên cứu chiến lược ra mắt ứng dụng đặt đồ ăn trong trường.')
) AS v(id, name, description)
WHERE g.id = v.id;

UPDATE mentoring_deals AS d
SET task_scope = v.task_scope,
    expected_result = v.expected_result
FROM (VALUES
    (1::bigint,
     'Rà soát CV và LinkedIn của ba thành viên; góp ý cách mô tả dự án Backend, kỹ năng và thành tích; tổ chức một buổi trao đổi chung để thống nhất bản chỉnh sửa cuối.',
     'Ba CV có nhận xét chi tiết, ba hồ sơ LinkedIn được tối ưu và một checklist ứng tuyển Backend Fresher dùng chung cho cả nhóm.'),
    (2::bigint,
     'Phản biện chân dung khách hàng, thông điệp chiến dịch, kế hoạch nội dung và KPI cho đồ án marketing thương hiệu cà phê; hướng dẫn nhóm hoàn thiện slide bảo vệ.',
     'Bản kế hoạch marketing đã chỉnh sửa, bảng KPI theo từng kênh và bộ slide thuyết trình hoàn chỉnh để nhóm luyện bảo vệ.'),
    (3::bigint,
     'Đánh giá chiến lược ra mắt ứng dụng đặt đồ ăn; rà soát phân khúc người dùng, định vị, lịch nội dung bốn tuần và cách thiết kế thử nghiệm trong khuôn viên trường.',
     'Bản go-to-market một trang, lịch nội dung bốn tuần, bảng ngân sách thử nghiệm và dashboard KPI mẫu.'),
    (4::bigint,
     'Đánh giá nền tảng Java hiện tại, xây dựng lộ trình chuyển từ QA sang Backend trong ba tháng và review dự án API quản lý công việc.',
     'Lộ trình học 12 tuần, checklist kiến thức Backend Java và danh sách góp ý ưu tiên cho repository dự án portfolio.')
) AS v(id, task_scope, expected_result)
WHERE d.id = v.id;

UPDATE mentoring_deal_snapshots AS s
SET task_scope = v.task_scope,
    expected_result = v.expected_result,
    change_note = v.change_note
FROM (VALUES
    (1::bigint,
     'Rà soát CV và LinkedIn của ba thành viên; góp ý dự án, kỹ năng và thành tích; tổ chức một buổi trao đổi chung.',
     'Ba CV có nhận xét, ba hồ sơ LinkedIn được tối ưu và checklist ứng tuyển dùng chung.',
     'Mentor gửi đề xuất phạm vi review hồ sơ lần đầu.'),
    (2::bigint,
     'Rà soát CV và LinkedIn của ba thành viên; góp ý cách mô tả dự án Backend, kỹ năng và thành tích; tổ chức một buổi trao đổi chung để thống nhất bản chỉnh sửa cuối.',
     'Ba CV có nhận xét chi tiết, ba hồ sơ LinkedIn được tối ưu và một checklist ứng tuyển Backend Fresher dùng chung cho cả nhóm.',
     'Cập nhật phạm vi theo góp ý của học viên và gửi phiên bản 2.'),
    (3::bigint,
     'Phản biện chân dung khách hàng, thông điệp chiến dịch, kế hoạch nội dung và KPI cho đồ án marketing thương hiệu cà phê; hướng dẫn nhóm hoàn thiện slide bảo vệ.',
     'Bản kế hoạch marketing đã chỉnh sửa, bảng KPI theo từng kênh và bộ slide thuyết trình hoàn chỉnh để nhóm luyện bảo vệ.',
     'Thống nhất phạm vi và sản phẩm bàn giao với nhóm.'),
    (4::bigint,
     'Đánh giá chiến lược ra mắt ứng dụng đặt đồ ăn; rà soát phân khúc người dùng, định vị, lịch nội dung bốn tuần và cách thiết kế thử nghiệm trong khuôn viên trường.',
     'Bản go-to-market một trang, lịch nội dung bốn tuần, bảng ngân sách thử nghiệm và dashboard KPI mẫu.',
     'Mentor tạo Deal Ticket phiên bản 1.'),
    (5::bigint,
     'Đánh giá nền tảng Java hiện tại, xây dựng lộ trình chuyển từ QA sang Backend trong ba tháng và review dự án API quản lý công việc.',
     'Lộ trình học 12 tuần, checklist kiến thức Backend Java và danh sách góp ý ưu tiên cho repository dự án portfolio.',
     'Mentor chấp nhận Deal theo điều kiện của Request.')
) AS v(id, task_scope, expected_result, change_note)
WHERE s.id = v.id;

UPDATE mentoring_tasks AS t
SET task_title = v.task_title,
    task_scope = v.task_scope,
    expected_result = v.expected_result
FROM (VALUES
    (1::bigint,
     'Review CV và LinkedIn cho nhóm sinh viên Backend',
     'Rà soát CV và LinkedIn của ba thành viên; góp ý cách mô tả dự án Backend, kỹ năng và thành tích; tổ chức một buổi trao đổi chung để thống nhất bản chỉnh sửa cuối.',
     'Ba CV có nhận xét chi tiết, ba hồ sơ LinkedIn được tối ưu và một checklist ứng tuyển Backend Fresher dùng chung cho cả nhóm.'),
    (2::bigint,
     'Tư vấn đồ án marketing cho thương hiệu cà phê',
     'Phản biện chân dung khách hàng, thông điệp chiến dịch, kế hoạch nội dung và KPI; hướng dẫn nhóm hoàn thiện slide bảo vệ.',
     'Bản kế hoạch marketing đã chỉnh sửa, bảng KPI theo từng kênh và bộ slide thuyết trình hoàn chỉnh.'),
    (3::bigint,
     'Hoàn thiện chiến lược ra mắt ứng dụng đặt đồ ăn',
     'Đánh giá chiến lược ra mắt; rà soát phân khúc người dùng, định vị, lịch nội dung bốn tuần và cách thiết kế thử nghiệm trong khuôn viên trường.',
     'Bản go-to-market một trang, lịch nội dung bốn tuần, bảng ngân sách thử nghiệm và dashboard KPI mẫu.'),
    (4::bigint,
     'Xây dựng lộ trình chuyển từ QA sang Backend Java',
     'Đánh giá nền tảng Java, xây dựng lộ trình học 12 tuần, review dự án API quản lý công việc và bổ sung một buổi phỏng vấn thử Backend.',
     'Lộ trình học 12 tuần, checklist Backend Java, góp ý repository portfolio và biên bản nhận xét buổi phỏng vấn thử.')
) AS v(id, task_title, task_scope, expected_result)
WHERE t.id = v.id;

UPDATE mentoring_work_logs AS w
SET description = v.description,
    work_completed = v.work_completed,
    result = v.result,
    next_action = v.next_action,
    student_feedback = v.student_feedback
FROM (VALUES
    (1::bigint, 'Khảo sát mục tiêu ứng tuyển và cấu trúc CV hiện tại của ba thành viên.', 'Đã đọc ba CV, ghi chú các phần thiếu số liệu và nhóm kỹ năng cần ưu tiên.', 'Thống nhất tiêu chí CV Backend Fresher và danh sách nội dung cần bổ sung cho từng bạn.', 'Các thành viên cập nhật mô tả dự án theo mẫu STAR trước buổi tiếp theo.', NULL),
    (2::bigint, 'Review chi tiết phần dự án và kinh nghiệm trong từng CV.', 'Đã sửa tiêu đề dự án, bullet thành tích và cách trình bày công nghệ sử dụng.', 'Ba bản CV nháp đã rõ vai trò cá nhân và có số liệu minh chứng tốt hơn.', 'Hoàn thiện phiên bản CV một trang và gửi lại để kiểm tra lần cuối.', NULL),
    (3::bigint, 'Tối ưu hồ sơ LinkedIn và phần giới thiệu nghề nghiệp.', 'Đã góp ý headline, phần About, kỹ năng và cách gắn dự án GitHub.', 'Cả ba hồ sơ có thông điệp nhất quán với vị trí Backend Fresher.', 'Cập nhật ảnh, đường dẫn GitHub và bật chế độ tìm kiếm việc làm.', NULL),
    (4::bigint, 'Kiểm tra chéo CV sau khi nhóm chỉnh sửa.', 'Đã rà lỗi chính tả, định dạng, từ khóa ATS và độ dài của ba CV.', 'Các CV đạt cấu trúc một trang, dễ đọc và phù hợp mô tả tuyển dụng mẫu.', 'Chuẩn bị câu hỏi cho buổi tổng kết và mô phỏng sàng lọc CV.', NULL),
    (5::bigint, 'Tổng kết quá trình review CV và LinkedIn.', 'Đã bàn giao bản nhận xét cuối cùng cùng checklist ứng tuyển.', 'Nhóm hoàn tất ba CV, ba hồ sơ LinkedIn và kế hoạch ứng tuyển trong bốn tuần.', 'Mỗi thành viên chọn năm vị trí phù hợp và bắt đầu nộp hồ sơ.', 'Checklist rõ ràng; nhóm đã chỉnh xong CV và có thể bắt đầu ứng tuyển.'),
    (6::bigint, 'Phân tích khách hàng mục tiêu cho thương hiệu cà phê.', 'Đã rà soát dữ liệu khảo sát và gom khách hàng thành ba phân khúc chính.', 'Nhóm chọn sinh viên và nhân viên văn phòng trẻ làm phân khúc ưu tiên.', 'Hoàn thiện insight và thông điệp chính cho từng phân khúc.', NULL),
    (7::bigint, 'Rà soát kế hoạch kênh và nội dung chiến dịch.', 'Đã góp ý vai trò của Facebook, TikTok và chương trình khách hàng thân thiết.', 'Có khung nội dung bốn tuần và KPI sơ bộ theo từng kênh.', 'Nhóm bổ sung ngân sách, người phụ trách và mốc đo lường.', NULL)
) AS v(id, description, work_completed, result, next_action, student_feedback)
WHERE w.id = v.id;

UPDATE mentoring_work_log_revisions AS r
SET description = v.description,
    work_completed = v.work_completed,
    result = v.result,
    next_action = v.next_action,
    student_feedback = v.student_feedback
FROM (VALUES
    (1::bigint, 'Tối ưu hồ sơ LinkedIn và phần giới thiệu nghề nghiệp.', 'Đã góp ý headline, phần About, kỹ năng và cách gắn dự án GitHub.', 'Cả ba hồ sơ có thông điệp nhất quán với vị trí Backend Fresher.', 'Cập nhật ảnh, đường dẫn GitHub và bật chế độ tìm kiếm việc làm.', NULL),
    (2::bigint, 'Kiểm tra chéo CV sau khi nhóm chỉnh sửa.', 'Đã rà lỗi chính tả, định dạng, từ khóa ATS và độ dài của ba CV.', 'Các CV đạt cấu trúc một trang, dễ đọc và phù hợp mô tả tuyển dụng mẫu.', 'Chuẩn bị câu hỏi cho buổi tổng kết và mô phỏng sàng lọc CV.', NULL),
    (3::bigint, 'Tổng kết quá trình review CV và LinkedIn.', 'Đã bàn giao bản nhận xét cuối cùng cùng checklist ứng tuyển.', 'Nhóm hoàn tất ba CV, ba hồ sơ LinkedIn và kế hoạch ứng tuyển trong bốn tuần.', 'Mỗi thành viên chọn năm vị trí phù hợp và bắt đầu nộp hồ sơ.', NULL),
    (4::bigint, 'Tổng kết quá trình review CV và LinkedIn.', 'Đã bàn giao bản nhận xét cuối cùng cùng checklist ứng tuyển.', 'Nhóm hoàn tất ba CV, ba hồ sơ LinkedIn và kế hoạch ứng tuyển trong bốn tuần.', 'Mỗi thành viên chọn năm vị trí phù hợp và bắt đầu nộp hồ sơ.', 'Checklist rõ ràng; nhóm đã chỉnh xong CV và có thể bắt đầu ứng tuyển.'),
    (5::bigint, 'Phân tích khách hàng mục tiêu cho thương hiệu cà phê.', 'Đã rà soát dữ liệu khảo sát và gom khách hàng thành ba phân khúc chính.', 'Nhóm chọn sinh viên và nhân viên văn phòng trẻ làm phân khúc ưu tiên.', 'Hoàn thiện insight và thông điệp chính cho từng phân khúc.', NULL),
    (6::bigint, 'Rà soát kế hoạch kênh và nội dung chiến dịch.', 'Đã góp ý vai trò của Facebook, TikTok và chương trình khách hàng thân thiết.', 'Có khung nội dung bốn tuần và KPI sơ bộ theo từng kênh.', 'Nhóm bổ sung ngân sách, người phụ trách và mốc đo lường.', NULL)
) AS v(id, description, work_completed, result, next_action, student_feedback)
WHERE r.id = v.id;

UPDATE mentoring_work_log_feedbacks
SET reason = 'Nhóm cần bổ sung đường dẫn LinkedIn và thống nhất lại định dạng trước khi xác nhận.'
WHERE id = 4;

UPDATE mentoring_task_completions AS c
SET final_summary = v.final_summary,
    deliverables = v.deliverables,
    feedback_note = v.feedback_note
FROM (VALUES
    (1::bigint,
     'Đã hoàn tất review CV và LinkedIn cho ba thành viên, tập trung vào cách mô tả dự án Backend và mức độ phù hợp với vị trí Fresher.',
     'Ba CV đã chú thích, ba hồ sơ LinkedIn đã tối ưu và checklist ứng tuyển Backend Fresher.',
     'Nội dung góp ý cụ thể, dễ áp dụng; nhóm xác nhận đã nhận đủ sản phẩm bàn giao.'),
    (2::bigint,
     'Đã hoàn thiện chiến lược ra mắt thử nghiệm ứng dụng đặt đồ ăn trong khuôn viên trường.',
     'Bản go-to-market, lịch nội dung bốn tuần, bảng ngân sách thử nghiệm và dashboard KPI mẫu.',
     'Kế hoạch rõ ràng, có thể dùng trực tiếp cho buổi bảo vệ và giai đoạn thử nghiệm.')
) AS v(id, final_summary, deliverables, feedback_note)
WHERE c.id = v.id;

UPDATE mentoring_task_deadline_extensions
SET reason = 'Nhóm cần thêm một ngày để tổng hợp kết quả khảo sát khách hàng và cập nhật số liệu vào slide.'
WHERE id = 1;

UPDATE mentoring_task_amendments AS a
SET reason = v.reason,
    previous_scope = v.previous_scope,
    new_scope = v.new_scope,
    previous_expected_result = v.previous_expected_result,
    new_expected_result = v.new_expected_result
FROM (VALUES
    (1::bigint,
     'Đề xuất bổ sung một buổi review GitHub để đánh giá chất lượng dự án portfolio.',
     'Đánh giá nền tảng Java, xây dựng lộ trình học 12 tuần và review dự án API quản lý công việc.',
     'Đánh giá nền tảng Java, xây dựng lộ trình học 12 tuần, review dự án API quản lý công việc và review repository GitHub.',
     'Lộ trình 12 tuần, checklist Backend Java và danh sách góp ý cho dự án portfolio.',
     'Lộ trình 12 tuần, checklist Backend Java, góp ý dự án và biên bản review GitHub.'),
    (2::bigint,
     'Hai bên thống nhất chuyển nội dung bổ sung sang một buổi phỏng vấn thử phù hợp mục tiêu tuyển dụng.',
     'Đánh giá nền tảng Java, xây dựng lộ trình học 12 tuần và review dự án API quản lý công việc.',
     'Đánh giá nền tảng Java, xây dựng lộ trình học 12 tuần, review dự án API quản lý công việc và phỏng vấn thử Backend.',
     'Lộ trình 12 tuần, checklist Backend Java và danh sách góp ý cho dự án portfolio.',
     'Lộ trình 12 tuần, checklist Backend Java, góp ý dự án và nhận xét phỏng vấn thử.'),
    (3::bigint,
     'Bổ sung buổi phỏng vấn thử Backend Java và báo cáo nhận xét sau buổi phỏng vấn.',
     'Đánh giá nền tảng Java, xây dựng lộ trình học 12 tuần và review dự án API quản lý công việc.',
     'Đánh giá nền tảng Java, xây dựng lộ trình học 12 tuần, review dự án API quản lý công việc và bổ sung một buổi phỏng vấn thử Backend.',
     'Lộ trình 12 tuần, checklist Backend Java và danh sách góp ý cho dự án portfolio.',
     'Lộ trình 12 tuần, checklist Backend Java, góp ý repository portfolio và biên bản nhận xét buổi phỏng vấn thử.')
) AS v(id, reason, previous_scope, new_scope, previous_expected_result, new_expected_result)
WHERE a.id = v.id;

UPDATE mentoring_task_settlement_proposals
SET reason = 'Học viên thay đổi lịch làm việc và không thể tiếp tục đúng tiến độ. Hai bên thống nhất dừng Task, thanh toán phần mentor đã tư vấn và hoàn lại phần công việc chưa thực hiện.'
WHERE id = 1;

UPDATE mentoring_dispute_tickets
SET description = 'Học viên thay đổi lịch làm việc và không thể tiếp tục đúng tiến độ. Hai bên đã thống nhất dừng Task, thanh toán phần mentor đã tư vấn và hoàn lại phần công việc chưa thực hiện.\n\n[Ghi chú thêm gửi Admin]: Tự động gửi khi hai bên đồng thuận dừng Task.'
WHERE id = 1;

UPDATE mentoring_ticket_messages
SET content = 'Em xác nhận hai bên đã thống nhất phương án phân chia. Nhờ Admin kiểm tra và hỗ trợ quyết toán.'
WHERE id = 1;

UPDATE messages AS m
SET content = v.content
FROM (VALUES
    (2::bigint, 'Chào anh, em gửi anh CV hiện tại của nhóm. Anh xem giúp phần dự án Backend nhé.'),
    (3::bigint, 'Nhóm em ưu tiên ứng tuyển Fresher Java trong tháng tới và muốn giữ CV gọn trong một trang.'),
    (5::bigint, 'Hiếu Phan đã yêu cầu điều chỉnh Deal Ticket phiên bản 1: "Nhờ mentor bổ sung review LinkedIn và checklist ứng tuyển cho cả nhóm." Mentor vui lòng gửi phiên bản Deal Ticket mới.'),
    (9::bigint, 'Anh đã nhận đủ ba CV. Anh sẽ ghi chú trực tiếp và gửi khung chỉnh sửa trước buổi trao đổi.'),
    (28::bigint, 'Nhóm em đã cập nhật CV và LinkedIn theo checklist. Cảm ơn anh, các góp ý rất cụ thể.'),
    (29::bigint, E'🚀 [Cố vấn] đã nộp kết quả hoàn thành Task (Chờ nghiệm thu):\n📝 Kết quả: Đã hoàn tất review CV và LinkedIn cho ba thành viên.\n📦 Sản phẩm bàn giao: Ba CV đã chú thích, ba hồ sơ LinkedIn đã tối ưu và checklist ứng tuyển Backend Fresher.'),
    (30::bigint, E'🎉 [Học viên] đã XÁC NHẬN hoàn thành Task! Nhiệm vụ chính thức nghiệm thu thành công và hệ thống đã kích hoạt lệnh quyết toán thù lao cho Cố vấn.\n💬 Đánh giá: Nội dung góp ý cụ thể, dễ áp dụng; nhóm đã nhận đủ sản phẩm bàn giao.'),
    (11::bigint, 'Chào em, anh đã xem brief đồ án. Nhóm đang cần ưu tiên phần chiến lược hay slide bảo vệ?'),
    (12::bigint, 'Anh thấy dữ liệu khảo sát đã đủ để phân nhóm khách hàng, nhưng cần làm rõ insight chính.'),
    (13::bigint, 'Nhóm gửi anh bảng khảo sát và bản kế hoạch hiện tại nhé, anh sẽ ghi chú trước buổi gặp.'),
    (14::bigint, 'Buổi đầu mình sẽ chốt phân khúc, buổi sau mới đi vào kênh và KPI.'),
    (15::bigint, 'Anh cũng sẽ gửi nhóm một mẫu bảng ngân sách để điền số liệu.'),
    (16::bigint, 'Dạ nhóm em ưu tiên hoàn thiện chiến lược trước, sau đó mới chỉnh slide bảo vệ.'),
    (17::bigint, 'Em đã gửi file khảo sát và kế hoạch nội dung trong phần đính kèm.'),
    (18::bigint, 'Anh nhận được rồi. Phân khúc sinh viên đang khá rõ, nhóm cần bổ sung thêm nhóm nhân viên văn phòng trẻ.'),
    (19::bigint, 'Phần KPI nên tách theo nhận biết, tương tác và chuyển đổi để dễ theo dõi.'),
    (20::bigint, 'Nhóm có số liệu ngân sách dự kiến cho Facebook và TikTok chưa?'),
    (21::bigint, 'Dạ có, nhóm em sẽ cập nhật chi phí dự kiến và gửi lại tối nay.'),
    (22::bigint, 'Cảm ơn anh, nhóm em sẽ chuẩn bị thêm hai phương án thông điệp để trao đổi trong buổi đầu.'),
    (26::bigint, 'Nhóm em đã cập nhật chân dung khách hàng và lịch nội dung theo góp ý của anh.'),
    (27::bigint, E'📅 [Mentor] đã gửi Ticket đề xuất gia hạn Deadline đến 23/10/2026 21:22.\nLý do: Nhóm cần thêm một ngày để tổng hợp kết quả khảo sát khách hàng và cập nhật số liệu vào slide.'),
    (32::bigint, 'Chào cả nhóm, anh đã đọc bản go-to-market. Mình sẽ bắt đầu từ bài toán người dùng trong khuôn viên trường.'),
    (33::bigint, 'Nhóm em đang phân vân nên ưu tiên sinh viên ở ký túc xá hay toàn bộ sinh viên trong trường.'),
    (34::bigint, 'Theo khảo sát của nhóm, sinh viên ở ký túc xá đặt đồ ăn buổi tối nhiều hơn.'),
    (35::bigint, 'Bọn em cũng có danh sách khoảng 20 quán quanh trường có thể tham gia thử nghiệm.'),
    (36::bigint, 'Vậy giai đoạn đầu nên tập trung vào ký túc xá và khung giờ tối để thông điệp rõ hơn.'),
    (37::bigint, 'Nhóm hãy đặt mục tiêu thử nghiệm trong bốn tuần thay vì triển khai quá rộng.'),
    (38::bigint, 'Tuần một dùng để tuyển quán và hoàn thiện menu; tuần hai bắt đầu truyền thông.'),
    (39::bigint, 'Nội dung nên nhấn mạnh giao nhanh trong khuôn viên và ưu đãi theo nhóm bạn.'),
    (40::bigint, 'Mỗi tuần cần theo dõi lượt cài đặt, đơn hàng đầu tiên và tỷ lệ quay lại.'),
    (41::bigint, 'Anh sẽ gửi nhóm mẫu dashboard KPI sau buổi hôm nay.'),
    (42::bigint, 'Phần ngân sách nên dành một khoản nhỏ cho mã giới thiệu giữa sinh viên.'),
    (43::bigint, 'Nhóm nhớ ghi rõ giả định và ngưỡng thành công của thử nghiệm.'),
    (44::bigint, 'Khi bảo vệ, hãy trình bày lý do chọn phân khúc trước rồi mới nói đến kênh.'),
    (45::bigint, 'Mỗi bạn phụ trách một phần: đối tác quán, nội dung, vận hành và đo lường.'),
    (46::bigint, 'Nếu còn thời gian, nhóm có thể phỏng vấn thêm năm chủ quán để kiểm chứng.'),
    (47::bigint, 'Anh đã tổng hợp phạm vi và sản phẩm bàn giao trong Deal Ticket, cả nhóm xem giúp nhé.'),
    (51::bigint, E'🚀 [Cố vấn] đã nộp kết quả hoàn thành Task (Chờ nghiệm thu):\n📝 Kết quả: Đã hoàn thiện chiến lược ra mắt thử nghiệm trong khuôn viên trường.\n📦 Sản phẩm bàn giao: Bản go-to-market, lịch nội dung bốn tuần, ngân sách và dashboard KPI mẫu.'),
    (52::bigint, E'🎉 [Học viên] đã XÁC NHẬN hoàn thành Task! Nhiệm vụ chính thức nghiệm thu thành công và hệ thống đã kích hoạt lệnh quyết toán thù lao cho Cố vấn.\n💬 Đánh giá: Kế hoạch rõ ràng và có thể dùng trực tiếp cho buổi bảo vệ.'),
    (54::bigint, 'Chào em, anh đã xem mục tiêu chuyển từ QA sang Backend Java.'),
    (55::bigint, 'Em gửi anh repository dự án API và danh sách kiến thức đã học để anh đánh giá nhé.'),
    (56::bigint, 'Dạ em gửi ngay. Em muốn ưu tiên Spring Boot, database và kỹ năng phỏng vấn.'),
    (60::bigint, E'📝 [Mentor] đã gửi Ticket điều chỉnh Task (Phiên bản v1) (Bổ sung thêm: 1.000đ).\nLý do: Đề xuất bổ sung một buổi review GitHub để đánh giá chất lượng dự án portfolio.'),
    (62::bigint, E'📝 [Mentor] đã gửi Ticket điều chỉnh Task (Phiên bản v2) (Bổ sung thêm: 1.000đ).\nLý do: Hai bên thống nhất chuyển nội dung bổ sung sang một buổi phỏng vấn thử phù hợp mục tiêu tuyển dụng.'),
    (64::bigint, E'📝 [Mentor] đã gửi Ticket điều chỉnh Task (Phiên bản v3) (Bổ sung thêm: 3.000đ).\nLý do: Bổ sung buổi phỏng vấn thử Backend Java và báo cáo nhận xét sau buổi phỏng vấn.'),
    (67::bigint, E'⚖️ [Học viên] đã gửi đề xuất dừng Task và phân chia tiền:\n- Mentor nhận: 2.500đ\n- Học viên hoàn trả: 2.500đ\nLý do: Học viên thay đổi lịch làm việc; hai bên thống nhất thanh toán phần đã thực hiện và hoàn lại phần còn lại.')
) AS v(id, content)
WHERE m.id = v.id;
