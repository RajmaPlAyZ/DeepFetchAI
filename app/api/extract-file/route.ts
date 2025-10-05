import { NextRequest, NextResponse } from 'next/server'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

// Helper to extract text from base64 encoded files
export async function POST(request: NextRequest) {
  try {
    const { fileName, base64Content } = await request.json()

    if (!fileName || !base64Content) {
      return NextResponse.json(
        { error: 'fileName and base64Content required' },
        { status: 400 }
      )
    }

    const extension = fileName.split('.').pop()?.toLowerCase()
    const buffer = Buffer.from(base64Content, 'base64')

    let extractedText = ''

    try {
      switch (extension) {
        case 'pdf': {
          // Use pdfjs-dist for PDF extraction
          const uint8Array = new Uint8Array(buffer)
          const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
          const pdfDocument = await loadingTask.promise
          
          let fullText = ''
          
          // Extract text from each page
          for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum)
            const textContent = await page.getTextContent()
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ')
            fullText += pageText + '\n\n'
          }
          
          extractedText = fullText.trim()
          break
        }

        case 'doc':
        case 'docx': {
          const mammoth = require('mammoth')
          const result = await mammoth.extractRawText({ buffer })
          extractedText = result.value
          break
        }

        case 'xls':
        case 'xlsx': {
          const XLSX = require('xlsx')
          const workbook = XLSX.read(buffer, { type: 'buffer' })
          
          let text = ''
          workbook.SheetNames.forEach((sheetName: string) => {
            const sheet = workbook.Sheets[sheetName]
            const csvData = XLSX.utils.sheet_to_csv(sheet)
            text += `\n--- Sheet: ${sheetName} ---\n${csvData}\n`
          })
          extractedText = text
          break
        }

        default:
          return NextResponse.json(
            { error: `Unsupported file type: ${extension}` },
            { status: 400 }
          )
      }

      return NextResponse.json({
        success: true,
        fileName,
        extractedText,
        length: extractedText.length
      })

    } catch (error: any) {
      console.error('File extraction error:', error)
      return NextResponse.json(
        { error: `Failed to extract text: ${error.message}` },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Extract file API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
