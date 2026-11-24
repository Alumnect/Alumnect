import html2pdf from 'html2pdf.js'

/**
 * Downloads a high-quality PDF of the given invoice HTML.
 * Includes a graceful fallback to native browser Save-as-PDF if client-side canvas rendering fails.
 */
export async function downloadInvoicePdf(htmlContent: string, fileName: string): Promise<void> {
  const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`

  // Create temporary container
  const container = document.createElement('div')
  container.id = 'invoice-pdf-render-root'
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.width = '760px'
  container.style.padding = '0'
  container.style.margin = '0'
  container.style.backgroundColor = '#ffffff'
  container.style.zIndex = '-1000'

  // Extract style tags and body/invoice content
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  const styles = doc.querySelectorAll('style')
  styles.forEach((s) => container.appendChild(s.cloneNode(true)))

  const invoiceNode = doc.querySelector('.invoice') || doc.body
  const clonedContent = invoiceNode.cloneNode(true) as HTMLElement
  clonedContent.style.maxWidth = '100%'
  clonedContent.style.boxShadow = 'none'
  clonedContent.style.margin = '0'
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
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait' as const,
    },
  }

  try {
    await html2pdf().set(opt).from(container).save()
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
