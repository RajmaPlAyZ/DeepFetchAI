"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FileText, CheckCircle2, XCircle, Copy, Download } from "lucide-react"
import { useState } from "react"

interface SearchResultsProps {
  loading: boolean
  error: string | null
  result: {
    response: string
    query: string
    filesAttached: number
  } | null
}

export default function SearchResults({ loading, error, result }: SearchResultsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (result?.response) {
      navigator.clipboard.writeText(result.response)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (result?.response) {
      const blob = new Blob([result.response], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `search-result-${Date.now()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  if (!loading && !error && !result) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Search Results
        </CardTitle>
        {result && (
          <CardDescription>
            Query: <span className="font-medium text-foreground">{result.query}</span>
            {result.filesAttached > 0 && (
              <Badge variant="outline" className="ml-2">
                {result.filesAttached} file{result.filesAttached > 1 ? 's' : ''} attached
              </Badge>
            )}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                Analyzing your query and retrieving relevant information...
              </p>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && !loading && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Search completed successfully
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {result.response}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
