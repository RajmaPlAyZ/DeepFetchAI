// Client-side file reading utilities for browser

export class ClientFileReader {
  /**
   * Read text content from a File object in the browser
   */
  static async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          resolve(result)
        } else {
          reject(new Error('Failed to read file as text'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Error reading file'))
      }
      
      reader.readAsText(file)
    })
  }

  /**
   * Read file as ArrayBuffer for binary files
   */
  static async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const result = e.target?.result
        if (result instanceof ArrayBuffer) {
          resolve(result)
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Error reading file'))
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Read file as Base64 string
   */
  static async readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          // Remove data URL prefix
          const base64 = result.split(',')[1] || result
          resolve(base64)
        } else {
          reject(new Error('Failed to read file as Base64'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Error reading file'))
      }
      
      reader.readAsDataURL(file)
    })
  }

  /**
   * Extract text from different file types in browser
   */
  static async extractText(file: File): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    try {
      switch (extension) {
        case 'txt':
        case 'md':
        case 'json':
        case 'csv':
          return await this.readFileAsText(file)
        
        case 'pdf':
        case 'doc':
        case 'docx':
        case 'xls':
        case 'xlsx':
          // For these types, we'll send to server for processing
          // Return a base64 encoded version
          const base64 = await this.readFileAsBase64(file)
          return base64
        
        default:
          // Try to read as text
          try {
            return await this.readFileAsText(file)
          } catch {
            return `[Binary file: ${file.name}]`
          }
      }
    } catch (error) {
      console.error(`Error extracting text from ${file.name}:`, error)
      return `[Error reading file: ${file.name}]`
    }
  }

  /**
   * Check if file type is supported for text extraction
   */
  static isSupportedFileType(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const supportedTypes = ['txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'md', 'json', 'csv']
    return supportedTypes.includes(extension || '')
  }

  /**
   * Get file size in human-readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}
