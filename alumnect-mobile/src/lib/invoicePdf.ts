import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Platform, Share } from 'react-native'

/**
 * Generates and shares/downloads a PDF document from an HTML string on Mobile and Web.
 */
export async function shareOrDownloadInvoicePdf(htmlContent: string, fileNameWithoutExt: string): Promise<void> {
  const finalFileName = fileNameWithoutExt.endsWith('.pdf') ? fileNameWithoutExt : `${fileNameWithoutExt}.pdf`

  if (Platform.OS === 'web') {
    // In React Native Web, Print.printAsync triggers the native browser print preview dialog (Save as PDF)
    await Print.printAsync({ html: htmlContent })
    return
  }

  // Native iOS / Android: generate a real PDF file on the device
  const { uri } = await Print.printToFileAsync({
    html: htmlContent,
    margins: {
      left: 20,
      top: 20,
      right: 20,
      bottom: 20,
    },
  })

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: finalFileName,
    })
  } else {
    await Share.share({
      url: uri,
      title: finalFileName,
    })
  }
}

