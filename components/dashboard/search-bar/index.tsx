"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchIcon, PaperclipIcon, XIcon, FileIcon, FolderOpenIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SearchBarProps {
  onSearch?: (query: string, files: File[] | string[]) => void
  uploadedFiles?: string[] // file names or URLs from Uploads page
  placeholder?: string
  className?: string
}

export default function SearchBar({
  onSearch,
  uploadedFiles = [],
  placeholder = "Search policies, regulations, schemes, projects...",
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<(File | string)[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showUploads, setShowUploads] = useState(false)

  // 🔍 Trigger search
  const handleSearch = () => {
    if (onSearch && (query.trim() || attachedFiles.length > 0)) {
      onSearch(query, attachedFiles)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  // 📎 Local file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachedFiles((prev) => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // 📂 Attach from uploaded files
  const handleAttachUploadedFile = (file: string) => {
    if (!attachedFiles.includes(file)) {
      setAttachedFiles((prev) => [...prev, file])
    }
    setShowUploads(false)
  }

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="relative flex items-center gap-2 ring-2 ring-border rounded-lg bg-card p-2 transition-all focus-within:ring-primary/50">
        <SearchIcon className="size-5 text-muted-foreground ml-2 shrink-0" />

        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 border-0 shadow-none focus-visible:ring-0 bg-transparent"
        />

        {/* Hidden input for local uploads */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
        />

        {/* Attach new files */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={triggerFileInput}
          className="shrink-0"
          title="Attach documents"
        >
          <PaperclipIcon className="size-4" />
        </Button>

        {/* Attach uploaded files (from Uploads page) */}
        {uploadedFiles.length > 0 && (
          <Popover open={showUploads} onOpenChange={setShowUploads}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                title="Attach from uploaded files"
              >
                <FolderOpenIcon className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <h4 className="font-semibold mb-2 text-sm text-foreground/80">Select Uploaded File</h4>
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {uploadedFiles.map((file, i) => (
                    <div
                      key={i}
                      onClick={() => handleAttachUploadedFile(file)}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                    >
                      <FileIcon className="size-3.5 text-muted-foreground" />
                      <span className="text-sm truncate">{file}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}

        {/* Search button */}
        <Button
          type="button"
          onClick={handleSearch}
          size="sm"
          className="shrink-0"
          disabled={!query.trim() && attachedFiles.length === 0}
        >
          Search
        </Button>
      </div>

      {/* Attached files display */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm ring-1 ring-border"
            >
              <FileIcon className="size-3.5 text-muted-foreground" />
              <span className="text-foreground max-w-[200px] truncate">
                {typeof file === "string" ? file : file.name}
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
