import html2pdf from 'html2pdf.js'

/**
 * Downloads a high-quality PDF of the given invoice HTML.
 * Includes a graceful fallback to native browser Save-as-PDF if client-side canvas rendering fails.
 */
export async function downloadInvoicePdf(htmlContent: string, fileName: string): Promise<void> {
  const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`

  // Create temporary container inside visible DOM coordinates but behind UI
  const container = document.createElement('div')
  container.id = 'invoice-pdf-render-root'
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '0'
  container.style.width = '720px'
  container.style.padding = '0'
  container.style.margin = '0'
  container.style.backgroundColor = '#ffffff'
  container.style.color = '#000000'
  container.style.zIndex = '-99999'
  container.style.pointerEvents = 'none'

  // Extract style tags and body/invoice content
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  const styles = doc.querySelectorAll('style')
  styles.forEach((s) => container.appendChild(s.cloneNode(true)))

  // Guarantee black text for all default/gray elements against white PDF paper
  const resetStyle = document.createElement('style')
  resetStyle.textContent = `
    #invoice-pdf-render-root, #invoice-pdf-render-root .invoice {
      color: #000000 !important;
      background-color: #ffffff !important;
    }
    #invoice-pdf-render-root .invoice .card {
      color: #000000 !important;
      background-color: #f8fafc !important;
    }
    #invoice-pdf-render-root .invoice .task-title,
    #invoice-pdf-render-root .invoice .task-title * {
      color: #000000 !important;
    }
    #invoice-pdf-render-root .invoice .meta,
    #invoice-pdf-render-root .invoice .meta div {
      color: #1e293b !important;
    }
    #invoice-pdf-render-root .invoice .meta strong {
      color: #000000 !important;
    }
    #invoice-pdf-render-root .invoice .card h3 {
      color: #000000 !important;
    }
    #invoice-pdf-render-root .invoice .row {
      color: #000000 !important;
    }
    #invoice-pdf-render-root .invoice .row span {
      color: #000000 !important;
      font-weight: 600 !important;
    }
    #invoice-pdf-render-root .invoice .row strong {
      color: #000000 !important;
      font-weight: 700 !important;
    }
    #invoice-pdf-render-root .invoice .row.fee,
    #invoice-pdf-render-root .invoice .row.fee span {
      color: #dc2626 !important;
    }
    #invoice-pdf-render-root .invoice .row.total,
    #invoice-pdf-render-root .invoice .row.total span {
      color: #16a34a !important;
    }
    #invoice-pdf-render-root .invoice .row.total.student,
    #invoice-pdf-render-root .invoice .row.total.student span {
      color: #0284c7 !important;
    }
    #invoice-pdf-render-root .invoice .footer {
      color: #475569 !important;
    }
  `
  container.appendChild(resetStyle)

  const invoiceNode = doc.querySelector('.invoice') || doc.body
  const clonedContent = invoiceNode.cloneNode(true) as HTMLElement
  clonedContent.style.maxWidth = '100%'
  clonedContent.style.boxShadow = 'none'
  clonedContent.style.margin = '0'
  clonedContent.style.backgroundColor = '#ffffff'
  clonedContent.style.color = '#000000'
  container.appendChild(clonedContent)

  document.body.appendChild(container)

  const opt = {
    margin: 10,
    filename: finalFileName,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait' as const,
    },
  }

  try {
    // Wait for styles and DOM rendering calculation
    await new Promise((resolve) => setTimeout(resolve, 200))
    await html2pdf().set(opt).from(clonedContent).save()
  } catch (err) {
    console.warn('html2pdf generation error, using native print-to-pdf fallback:', err)
    const printWin = window.open('', '_blank', 'width=840,height=720')
    if (printWin) {
      printWin.document.write(htmlContent)
      printWin.document.close()
      printWin.focus()
      setTimeout(() => printWin.print(), 350)
    } else {
      throw err
    }
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }
}
