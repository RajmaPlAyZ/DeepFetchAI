"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  History, 
  Search, 
  Trash2, 
  Copy, 
  Download, 
  FileText,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { useState } from "react"
import { SearchHistoryItem, SearchHistoryService } from "@/lib/search-history-service"

interface SearchHistoryProps {
  history: SearchHistoryItem[]
  loading?: boolean
  onDelete?: (id: string) => void
  onReuse?: (query: string) => void
}

export default function SearchHistory({ 
  history, 
  loading = false,
  onDelete,
  onReuse 
}: SearchHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const filteredHistory = searchTerm
    ? history.filter(item =>
        item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.response.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : history

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleDownload = (item: SearchHistoryItem) => {
    const content = `Query: ${item.query}\n\nResponse:\n${item.response}\n\nTimestamp: ${item.timestamp}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `search-${item.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Search History
        </CardTitle>
        <CardDescription>
          View and manage your past searches
          {history.length > 0 && (
            <Badge variant="outline" className="ml-2">
              {history.length} search{history.length > 1 ? 'es' : ''}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search within history */}
        {history.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && history.length === 0 && (
          <div className="text-center py-8">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No search history yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your searches will appear here
            </p>
          </div>
        )}

        {!loading && filteredHistory.length === 0 && history.length > 0 && (
          <Alert>
            <AlertDescription>
              No results found for "{searchTerm}"
            </AlertDescription>
          </Alert>
        )}

        {!loading && filteredHistory.length > 0 && (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {filteredHistory.map((item) => {
                const isExpanded = expandedItems.has(item.id)
                const previewLength = 150

                return (
                  <Card key={item.id} className="border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <p className="font-medium text-sm truncate">
                              {item.query}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {SearchHistoryService.formatTimestamp(item.timestamp)}
                            </span>
                            {item.filesCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {item.filesCount} file{item.filesCount > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Response Preview/Full */}
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm whitespace-pre-wrap">
                          {isExpanded
                            ? item.response
                            : item.response.length > previewLength
                            ? `${item.response.substring(0, previewLength)}...`
                            : item.response}
                        </p>
                        {item.response.length > previewLength && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(item.id)}
                            className="mt-2 h-7 text-xs"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Show more
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Files attached */}
                      {item.filesAttached.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.filesAttached.map((file, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {file}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        {onReuse && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReuse(item.query)}
                            className="h-7 text-xs"
                          >
                            <Search className="h-3 w-3 mr-1" />
                            Reuse
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(item.response)}
                          className="h-7 text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(item)}
                          className="h-7 text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        {onDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(item.id)}
                            className="h-7 text-xs text-destructive hover:text-destructive ml-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
