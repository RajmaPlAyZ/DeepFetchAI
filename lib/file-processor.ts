// Service to extract text content from various file types

export class FileProcessor {
  /**
   * Fetch and extract text content from a file URL
   */
  static async extractTextFromURL(url: string, fileName: string): Promise<string> {
    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Determine file type
      const extension = fileName.split('.').pop()?.toLowerCase()
      
      switch (extension) {
        case 'txt':
          return buffer.toString('utf-8')
        
        case 'pdf':
          return await this.extractPDFText(buffer, fileName)
        
        case 'doc':
        case 'docx':
          return await this.extractWordText(buffer, fileName)
        
        case 'xls':
        case 'xlsx':
          return await this.extractExcelText(buffer, fileName)
        
        default:
          // Try to read as text
          try {
            return buffer.toString('utf-8')
          } catch {
            return `[File: ${fileName}]\nFile type: ${extension}\nBinary file - content cannot be extracted as text.`
          }
      }
    } catch (error) {
      console.error(`Error processing file ${fileName}:`, error)
      return `[Error reading file: ${fileName}]: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  /**
   * Extract text from PDF files
   */
  private static async extractPDFText(buffer: Buffer, fileName: string): Promise<string> {
    try {
      const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs')
      
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
      
      return `[PDF Document: ${fileName}]\n\n${fullText.trim()}`
    } catch (error) {
      console.error('PDF extraction error:', error)
      return `[PDF Document: ${fileName}]\nError extracting PDF text: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  /**
   * Extract text from Word documents
   */
  private static async extractWordText(buffer: Buffer, fileName: string): Promise<string> {
    try {
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return `[Word Document: ${fileName}]\n\n${result.value}`
    } catch (error) {
      console.error('Word extraction error:', error)
      return `[Word Document: ${fileName}]\nError extracting Word text: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  /**
   * Extract text from Excel files
   */
  private static async extractExcelText(buffer: Buffer, fileName: string): Promise<string> {
    try {
      const XLSX = require('xlsx')
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      
      let text = `[Excel Spreadsheet: ${fileName}]\n\n`
      
      workbook.SheetNames.forEach((sheetName: string) => {
        const sheet = workbook.Sheets[sheetName]
        const csvData = XLSX.utils.sheet_to_csv(sheet)
        text += `\n--- Sheet: ${sheetName} ---\n${csvData}\n`
      })
      
      return text
    } catch (error) {
      console.error('Excel extraction error:', error)
      return `[Excel Spreadsheet: ${fileName}]\nError extracting Excel data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  /**
   * Process multiple files and combine their contents
   */
  static async processMultipleFiles(
    fileData: Array<{ name: string; url?: string; content?: string }>
  ): Promise<string> {
    const contents: string[] = []
    
    for (const file of fileData) {
      if (file.content) {
        // If content is already provided (local file)
        contents.push(`\n--- File: ${file.name} ---\n${file.content}`)
      } else if (file.url) {
        // If URL is provided (uploaded file)
        const text = await this.extractTextFromURL(file.url, file.name)
        contents.push(`\n--- File: ${file.name} ---\n${text}`)
      } else {
        contents.push(`\n--- File: ${file.name} ---\n[File reference only]`)
      }
    }
    
    return contents.join('\n\n')
  }

  /**
   * Truncate content if too long (to avoid token limits)
   */
  static truncateContent(content: string, maxChars: number = 10000): string {
    if (content.length <= maxChars) {
      return content
    }
    
    return content.substring(0, maxChars) + '\n\n[Content truncated due to length...]'
  }
}
