import type { AdminRevenueOverviewDto, AdminRevenueTransactionDto } from '../api/adminApi'

const formatDateTime = (value: string) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

/** Tải file Blob an toàn (tránh thu hồi ObjectURL trước khi trình duyệt kịp bắt đầu tải). */
function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const escapeXml = (unsafe: string | number | undefined | null) => {
  if (unsafe === undefined || unsafe === null) return ''
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Xuất Báo Cáo Tài Chính Chuyên Nghiệp định dạng Excel XML Spreadsheet 2003
 * Hỗ trợ native 100% trong Microsoft Excel, Excel 365, Google Sheets, LibreOffice Calc
 * Bao gồm 2 Worksheet:
 *   1. "Báo Cáo Tổng Hợp P&L" (Executive P&L Financial Statement)
 *   2. "Sổ Chi Tiết Giao Dịch" (Detailed Transaction Ledger)
 */
export function exportFinancialExcel(
  overview: AdminRevenueOverviewDto,
  transactions: AdminRevenueTransactionDto[],
  periodLabel: string,
) {
  const exportDate = new Date()
  const exportDateStr = formatDateTime(exportDate.toISOString())
  const filename = `Bao-Cao-Tai-Chinh-Doanh-Thu-AlumNect-${exportDate.toISOString().slice(0, 10)}.xls`

  const totalRev = overview.totalOwnedRevenue || 0
  const subRev = overview.subscriptionRevenue || 0
  const disputeRev = overview.disputeFeeRevenue || 0
  const subPercent = totalRev > 0 ? ((subRev / totalRev) * 100).toFixed(1) + '%' : '0.0%'
  const disputePercent = totalRev > 0 ? ((disputeRev / totalRev) * 100).toFixed(1) + '%' : '0.0%'

  // XML Header & Styles
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Báo Cáo Tài Chính &amp; Doanh Thu AlumNect</Title>
  <Subject>Báo cáo tài chính doanh thu nền tảng FPTU AlumNect</Subject>
  <Author>Ban Quản Trị AlumNect</Author>
  <Created>${exportDate.toISOString()}</Created>
  <Company>FPT University - AlumNect</Company>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#0F172A"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <!-- Banners & Titles -->
  <Style ss:ID="MainTitle">
   <Font ss:FontName="Segoe UI" ss:Size="15" ss:Bold="1" ss:Color="#EA580C"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Italic="1" ss:Color="#475569"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="OrgName">
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MetaLabel">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Bold="1" ss:Color="#334155"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="MetaVal">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#0F172A"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <!-- Section Headers -->
  <Style ss:ID="SectionHeader">
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#EA580C" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C2410C"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C2410C"/>
   </Borders>
  </Style>
  <Style ss:ID="SectionHeaderBlue">
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0284C7" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <!-- Table Columns -->
  <Style ss:ID="TableHead">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
   </Borders>
  </Style>
  <Style ss:ID="TableCell">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#1E293B"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="TableCellZebra">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#1E293B"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="TableCellCenter">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#1E293B"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="TableCellCurrency">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0\ &quot;₫&quot;"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="TableTotal">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#EA580C"/>
   <Interior ss:Color="#FFF7ED" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0\ &quot;₫&quot;"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#EA580C"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#EA580C"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FED7AA"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FED7AA"/>
   </Borders>
  </Style>
  <Style ss:ID="TableTotalLabel">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#9A3412"/>
   <Interior ss:Color="#FFF7ED" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#EA580C"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#EA580C"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FED7AA"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FED7AA"/>
   </Borders>
  </Style>
  <!-- Sign-off -->
  <Style ss:ID="SignTitle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SignNote">
   <Font ss:FontName="Segoe UI" ss:Size="8.5" ss:Italic="1" ss:Color="#64748B"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
 </Styles>

 <!-- =================================================================== -->
 <!-- SHEET 1: BÁO CÁO TỔNG HỢP P&L                                      -->
 <!-- =================================================================== -->
 <Worksheet ss:Name="Báo Cáo Tổng Hợp P&amp;L">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="40"/>
   <Column ss:Width="260"/>
   <Column ss:Width="160"/>
   <Column ss:Width="100"/>
   <Column ss:Width="200"/>

   <!-- Row 1: Org name -->
   <Row ss:Height="22">
    <Cell ss:MergeAcross="2"><Data ss:Type="String">ĐƠN VỊ: HỆ THỐNG KẾT NỐI CỰU SINH VIÊN ALUMNECT (FPT UNIVERSITY)</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="SubTitle"><Data ss:Type="String">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</Data></Cell>
   </Row>
   <!-- Row 2: Subtitle -->
   <Row ss:Height="18">
    <Cell ss:MergeAcross="2"><Data ss:Type="String">VẬN HÀNH BỞI: BAN QUẢN TRỊ TRƯỜNG ĐẠI HỌC FPT</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="SubTitle"><Data ss:Type="String">Độc lập - Tự do - Hạnh phúc</Data></Cell>
   </Row>
   <Row ss:Height="12"><Cell ss:MergeAcross="4"><Data ss:Type="String"></Data></Cell></Row>

   <!-- Row 4: Main Banner -->
   <Row ss:Height="28">
    <Cell ss:MergeAcross="4" ss:StyleID="MainTitle"><Data ss:Type="String">BÁO CÁO TÀI CHÍNH &amp; DOANH THU THỰC NHẬN NỀN TẢNG</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="4" ss:StyleID="SubTitle"><Data ss:Type="String">Kỳ báo cáo: ${escapeXml(periodLabel)} | Đơn vị tiền tệ: Việt Nam Đồng (VNĐ)</Data></Cell>
   </Row>
   <Row ss:Height="12"><Cell ss:MergeAcross="4"><Data ss:Type="String"></Data></Cell></Row>

   <!-- Metadata Block -->
   <Row ss:Height="22">
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Kỳ báo cáo:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(periodLabel)}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Thời gian trích xuất:</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(exportDateStr)}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Người lập:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">Quản trị viên Hệ thống AlumNect</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Tổng số giao dịch:</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="MetaVal"><Data ss:Type="String">${overview.successfulTransactionCount || transactions.length} giao dịch thành công</Data></Cell>
   </Row>
   <Row ss:Height="14"><Cell ss:MergeAcross="4"><Data ss:Type="String"></Data></Cell></Row>

   <!-- SECTION 1: DOANH THU THUỘC SỞ HỮU -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="4" ss:StyleID="SectionHeader"><Data ss:Type="String">  I. KẾT QUẢ DOANH THU THUỘC SỞ HỮU NỀN TẢNG (PLATFORM OWNED REVENUE)</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">STT</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Khoản Mục Thu Nhập</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Số Tiền (VNĐ)</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Tỷ Trọng (%)</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Ghi Chú Nghiệp Vụ</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="TableCellCenter"><Data ss:Type="Number">1</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">Doanh thu Gói dịch vụ Mentor (Subscription)</Data></Cell>
    <Cell ss:StyleID="TableCellCurrency"><Data ss:Type="Number">${subRev}</Data></Cell>
    <Cell ss:StyleID="TableCellCenter"><Data ss:Type="String">${subPercent}</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">Thanh toán gói cước hồ sơ chuyên gia PayOS</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="TableCellCenter"><Data ss:Type="Number">2</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">Phí giải quyết tranh chấp &amp; Khiếu nại (Dispute Fees)</Data></Cell>
    <Cell ss:StyleID="TableCellCurrency"><Data ss:Type="Number">${disputeRev}</Data></Cell>
    <Cell ss:StyleID="TableCellCenter"><Data ss:Type="String">${disputePercent}</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">Phí nền tảng khấu trừ sau phán quyết ticket</Data></Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:StyleID="TableTotalLabel"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="TableTotalLabel"><Data ss:Type="String">TỔNG CỘNG DOANH THU THỰC NHẬN NỀN TẢNG</Data></Cell>
    <Cell ss:StyleID="TableTotal"><Data ss:Type="Number">${totalRev}</Data></Cell>
    <Cell ss:StyleID="TableTotal"><Data ss:Type="String">100.0%</Data></Cell>
    <Cell ss:StyleID="TableTotalLabel"><Data ss:Type="String">Tăng trưởng: ${overview.monthGrowthPercent > 0 ? '+' : ''}${overview.monthGrowthPercent || 0}% so tháng trước</Data></Cell>
   </Row>
   <Row ss:Height="14"><Cell ss:MergeAcross="4"><Data ss:Type="String"></Data></Cell></Row>

   <!-- SECTION 2: QUỸ QUẢN LÝ -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="4" ss:StyleID="SectionHeaderBlue"><Data ss:Type="String">  II. QUỸ ĐANG QUẢN LÝ &amp; KÝ QUỸ TRUNG GIAN (CASH FLOW UNDER CUSTODY - KHÔNG PHẢI DOANH THU)</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">STT</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Khoản Mục Quỹ Tạm Giữ</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Số Tiền (VNĐ)</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="TableHead"><Data ss:Type="String">Mục Đích Bảo Đảm &amp; Quyền Sở Hữu</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="TableCellCenter"><Data ss:Type="Number">1</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">Quỹ ký quỹ Escrow đang bảo đảm (Holding)</Data></Cell>
    <Cell ss:StyleID="TableCellCurrency"><Data ss:Type="Number">${overview.escrowHolding || 0}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="TableCell"><Data ss:Type="String">Học viên đã nộp ký quỹ cho nhiệm vụ đang tiến hành</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="TableCellCenter"><Data ss:Type="Number">2</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">Số dư đang chờ giải ngân cho Mentor (Payout)</Data></Cell>
    <Cell ss:StyleID="TableCellCurrency"><Data ss:Type="Number">${overview.pendingMentorPayout || 0}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="TableCell"><Data ss:Type="String">Nhiệm vụ hoàn tất, chờ chuyển khoản qua VietQR</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="TableCellCenter"><Data ss:Type="Number">3</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">Số dư đang chờ hoàn trả học viên (Refund)</Data></Cell>
    <Cell ss:StyleID="TableCellCurrency"><Data ss:Type="Number">${overview.pendingStudentRefund || 0}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="TableCell"><Data ss:Type="String">Hòa giải hoặc hủy nhiệm vụ theo thỏa thuận</Data></Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:StyleID="TableTotalLabel"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="TableTotalLabel"><Data ss:Type="String">TỔNG NGUỒN TIỀN ĐANG BẢO CHỨNG LƯU THÔNG</Data></Cell>
    <Cell ss:StyleID="TableTotal"><Data ss:Type="Number">${(overview.escrowHolding || 0) + (overview.pendingMentorPayout || 0) + (overview.pendingStudentRefund || 0)}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="TableTotalLabel"><Data ss:Type="String">Bảo chứng tài chính an toàn 100% qua PayOS VietQR</Data></Cell>
   </Row>
   <Row ss:Height="14"><Cell ss:MergeAcross="4"><Data ss:Type="String"></Data></Cell></Row>

   <!-- SECTION 3: 12 MONTH TRENDS -->
   ${
     (overview.monthlyRevenue && overview.monthlyRevenue.length > 0)
       ? `
   <Row ss:Height="24">
    <Cell ss:MergeAcross="4" ss:StyleID="SectionHeader"><Data ss:Type="String">  III. DIỄN BIẾN DOANH THU 12 THÁNG GẦN NHẤT</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Tháng</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Gói Thành Viên Mentor (VNĐ)</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Phí Tranh Chấp (VNĐ)</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="TableHead"><Data ss:Type="String">Tổng Doanh Thu Tháng (VNĐ)</Data></Cell>
   </Row>
   ${overview.monthlyRevenue
     .map(
       (m, idx) => `
   <Row ss:Height="20">
    <Cell ss:StyleID="TableCellCenter"><Data ss:Type="String">${escapeXml(m.label || m.month)}</Data></Cell>
    <Cell ss:StyleID="${idx % 2 === 0 ? 'TableCellCurrency' : 'TableCellCurrency'}"><Data ss:Type="Number">${m.subscriptionRevenue || 0}</Data></Cell>
    <Cell ss:StyleID="${idx % 2 === 0 ? 'TableCellCurrency' : 'TableCellCurrency'}"><Data ss:Type="Number">${m.disputeFeeRevenue || 0}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="TableCellCurrency"><Data ss:Type="Number">${m.totalRevenue || 0}</Data></Cell>
   </Row>`,
     )
     .join('')}
   <Row ss:Height="16"><Cell ss:MergeAcross="4"><Data ss:Type="String"></Data></Cell></Row>
   `
       : ''
   }

   <!-- SIGN-OFF SECTION -->
   <Row ss:Height="20">
    <Cell ss:MergeAcross="1" ss:StyleID="SignTitle"><Data ss:Type="String">NGƯỜI LẬP BIỂU</Data></Cell>
    <Cell ss:StyleID="SignTitle"><Data ss:Type="String">KẾ TOÁN TRƯỞNG</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="SignTitle"><Data ss:Type="String">GIÁM ĐỐC / QUẢN TRỊ VIÊN DUYỆT</Data></Cell>
   </Row>
   <Row ss:Height="16">
    <Cell ss:MergeAcross="1" ss:StyleID="SignNote"><Data ss:Type="String">(Ký &amp; ghi rõ họ tên)</Data></Cell>
    <Cell ss:StyleID="SignNote"><Data ss:Type="String">(Ký &amp; ghi rõ họ tên)</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="SignNote"><Data ss:Type="String">(Ký, đóng dấu)</Data></Cell>
   </Row>
   <Row ss:Height="60"><Cell ss:MergeAcross="4"><Data ss:Type="String"></Data></Cell></Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="1" ss:StyleID="SignTitle"><Data ss:Type="String">Quản trị viên Hệ thống</Data></Cell>
    <Cell ss:StyleID="SignTitle"><Data ss:Type="String">Ban Tài Chính FPTU</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="SignTitle"><Data ss:Type="String">Ban Điều Hành AlumNect</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- =================================================================== -->
 <!-- SHEET 2: SỔ CHI TIẾT GIAO DỊCH                                    -->
 <!-- =================================================================== -->
 <Worksheet ss:Name="Sổ Chi Tiết Giao Dịch">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="40"/>  <!-- STT -->
   <Column ss:Width="120"/> <!-- Mã GD -->
   <Column ss:Width="130"/> <!-- Mã đơn hàng -->
   <Column ss:Width="150"/> <!-- Nguồn thu -->
   <Column ss:Width="260"/> <!-- Diễn giải -->
   <Column ss:Width="170"/> <!-- Người nộp -->
   <Column ss:Width="200"/> <!-- Email -->
   <Column ss:Width="130"/> <!-- Số tiền -->
   <Column ss:Width="140"/> <!-- Thời gian -->
   <Column ss:Width="110"/> <!-- Phương thức -->
   <Column ss:Width="100"/> <!-- Trạng thái -->

   <!-- Header -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="10" ss:StyleID="MainTitle"><Data ss:Type="String">SỔ CHI TIẾT NHẬT KÝ GIAO DỊCH DOANH THU NỀN TẢNG</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="10" ss:StyleID="SubTitle"><Data ss:Type="String">Trích xuất ngày: ${escapeXml(exportDateStr)} | Tổng số bản ghi: ${transactions.length}</Data></Cell>
   </Row>
   <Row ss:Height="10"><Cell ss:MergeAcross="10"><Data ss:Type="String"></Data></Cell></Row>

   <!-- Column Headers -->
   <Row ss:Height="24">
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">STT</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Mã Giao Dịch</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Mã Tham Chiếu</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Nguồn Thu</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Diễn Giải Nội Dung</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Người Nộp Tiền</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Email Người Nộp</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Số Tiền (VNĐ)</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Thời Gian Ghi Nhận</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Phương Thức</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">Trạng Thái</Data></Cell>
   </Row>

   <!-- Rows -->
   ${transactions
     .map((t, index) => {
       const isZebra = index % 2 === 1
       const cStyle = isZebra ? 'TableCellZebra' : 'TableCell'
       const sourceLabel = t.sourceType === 'MENTOR_SUBSCRIPTION' ? 'Gói Hội Viên Mentor' : 'Phí Tranh Chấp'
       return `
   <Row ss:Height="22">
    <Cell ss:StyleID="TableCellCenter"><Data ss:Type="Number">${index + 1}</Data></Cell>
    <Cell ss:StyleID="${cStyle}"><Data ss:Type="String">#${escapeXml(t.id)}</Data></Cell>
    <Cell ss:StyleID="${cStyle}"><Data ss:Type="String">${escapeXml(t.referenceCode)}</Data></Cell>
    <Cell ss:StyleID="${cStyle}"><Data ss:Type="String">${escapeXml(sourceLabel)}</Data></Cell>
    <Cell ss:StyleID="${cStyle}"><Data ss:Type="String">${escapeXml(t.description || '')}</Data></Cell>
    <Cell ss:StyleID="${cStyle}"><Data ss:Type="String">${escapeXml(t.payerName || 'N/A')}</Data></Cell>
    <Cell ss:StyleID="${cStyle}"><Data ss:Type="String">${escapeXml(t.payerEmail || 'N/A')}</Data></Cell>
    <Cell ss:StyleID="TableCellCurrency"><Data ss:Type="Number">${t.amount || 0}</Data></Cell>
    <Cell ss:StyleID="TableCellCenter"><Data ss:Type="String">${escapeXml(formatDateTime(t.occurredAt))}</Data></Cell>
    <Cell ss:StyleID="TableCellCenter"><Data ss:Type="String">${escapeXml(t.paymentMethod || 'PayOS')}</Data></Cell>
    <Cell ss:StyleID="TableCellCenter"><Data ss:Type="String">Thành công</Data></Cell>
   </Row>`
     })
     .join('')}

   <!-- Total Row -->
   <Row ss:Height="26">
    <Cell ss:MergeAcross="6" ss:StyleID="TableTotalLabel"><Data ss:Type="String">TỔNG CỘNG DOANH THU GHI NHẬN TRONG KỲ (${transactions.length} GIAO DỊCH)</Data></Cell>
    <Cell ss:StyleID="TableTotal"><Data ss:Type="Number">${transactions.reduce((s, x) => s + (x.amount || 0), 0)}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="TableTotalLabel"><Data ss:Type="String"></Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
  triggerBlobDownload(blob, filename)
}

/**
 * Xuất file CSV UTF-8 kèm BOM
 */
export function exportRevenueCsv(transactions: AdminRevenueTransactionDto[]) {
  if (!transactions.length) return
  const escape = (val: string | number | undefined | null) => `"${String(val ?? '').replaceAll('"', '""')}"`
  const rows = [
    ['Mã GD', 'Mã tham chiếu', 'Nguồn thu', 'Diễn giải', 'Người thanh toán', 'Email', 'Số tiền (VNĐ)', 'Thời gian', 'Phương thức', 'Trạng thái'],
    ...transactions.map((item) => [
      item.id,
      item.referenceCode,
      item.sourceType === 'MENTOR_SUBSCRIPTION' ? 'Gói Mentor' : 'Phí tranh chấp',
      item.description,
      item.payerName,
      item.payerEmail,
      item.amount,
      formatDateTime(item.occurredAt),
      item.paymentMethod,
      'Thành công',
    ]),
  ]
  const csv = `\uFEFF${rows.map((row) => row.map(escape).join(',')).join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  triggerBlobDownload(blob, `doanh-thu-alumnect-${new Date().toISOString().slice(0, 10)}.csv`)
}

