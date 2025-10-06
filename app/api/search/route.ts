import { NextRequest, NextResponse } from 'next/server'
import { FileProcessor } from '@/lib/file-processor'

export async function POST(request: NextRequest) {
  try {
    const { query, files, fileData } = await request.json()

    if (!query && (!files || files.length === 0)) {
      return NextResponse.json(
        { error: 'Query or files required' },
        { status: 400 }
      )
    }

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Build context from files
    let fileContext = ''
    if (fileData && fileData.length > 0) {
      // Process file contents
      const processedContent = await FileProcessor.processMultipleFiles(fileData)
      const truncatedContent = FileProcessor.truncateContent(processedContent, 8000)
      fileContext = `\n\n=== ATTACHED DOCUMENTS ===\n${truncatedContent}`
    } else if (files && files.length > 0) {
      // Fallback: just list file names
      fileContext = `\n\nAttached documents: ${files.join(', ')}`
    }

    // System prompt for the AI assistant
    const systemPrompt = `You are an AI assistant for the Department of Higher Education under the Ministry of Education (MoE), India. Your role is to help officials search, retrieve, and analyze information from:

- Functional rules and regulations
- Government policies
- Educational schemes and programs
- Ongoing and completed projects
- Institutional data and guidelines
- Administrative procedures

Provide accurate, concise, and actionable insights. When referencing information:
1. Cite specific rules, schemes, or policies when applicable
2. Provide relevant context and implications
3. Suggest related areas to explore if helpful
4. Maintain professional and formal tone

If the query is unclear or requires additional context, ask clarifying questions.`

    const userPrompt = `${query}${fileContext}`

    // Call OpenAI API with timeout and better error handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    let response
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
        signal: controller.signal,
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      console.error('Network error connecting to OpenAI:', fetchError)
      
      // Provide more specific error messages
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - OpenAI API took too long to respond' },
          { status: 504 }
        )
      }
      
      if (fetchError.code === 'ENOTFOUND' || fetchError.cause?.code === 'ENOTFOUND') {
        return NextResponse.json(
          { error: 'Cannot connect to OpenAI API. Please check your internet connection or network settings.' },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { error: `Network error: ${fetchError.message}` },
        { status: 503 }
      )
    }
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API error:', error)
      return NextResponse.json(
        { error: 'Failed to process search query' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || 'No response generated'

    return NextResponse.json({
      success: true,
      response: aiResponse,
      query,
      filesAttached: files?.length || 0,
    })

  } catch (error: any) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
