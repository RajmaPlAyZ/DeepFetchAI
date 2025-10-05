"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import DashboardChart from "@/components/dashboard/chart"
import DepartmentActivity from "@/components/dashboard/department-activity"
import DashboardPageLayout from "@/components/dashboard/layout"
import SearchBar from "@/components/dashboard/search-bar"
import DashboardStat from "@/components/dashboard/stat"
import SystemStatus from "@/components/dashboard/system-status"
import BoomIcon from "@/components/icons/boom"
import BracketsIcon from "@/components/icons/brackets"
import GearIcon from "@/components/icons/gear"
import ProcessorIcon from "@/components/icons/proccesor"
import mockDataJson from "@/mock.json"
import type { MockData } from "@/types/dashboard"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { UploadService, type UploadedFile } from "@/lib/upload-service"
import SearchResults from "@/components/dashboard/search-results"
import { ClientFileReader } from "@/lib/client-file-reader"
import { SearchHistoryService } from "@/lib/search-history-service"
import { AnalyticsService, type DashboardStats, type ChartData } from "@/lib/analytics-service"
import { NotificationService } from "@/lib/notification-service"
import { FileText, Search, Upload as UploadIcon } from "lucide-react"

const mockData = mockDataJson as MockData

// Icon mapping
const iconMap = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
}

export default function DashboardOverview() {
  const { user } = useAuth()
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchResult, setSearchResult] = useState<{
    response: string
    query: string
    filesAttached: number
  } | null>(null)

  // Store full file objects, not just names
  const [uploadedFileObjects, setUploadedFileObjects] = useState<UploadedFile[]>([])
  
  // Real-time stats and chart data
  const [stats, setStats] = useState<DashboardStats>({
    totalSearches: 0,
    totalUploads: 0,
    activeUsers: 1,
    searchesThisWeek: 0,
    uploadsThisWeek: 0,
    searchTrend: 0,
    uploadTrend: 0
  })
  const [chartData, setChartData] = useState<ChartData[]>([])

  useEffect(() => {
    if (user) {
      loadStats()
      loadChartData()
    }
  }, [user])

  const loadStats = async () => {
    if (!user) return
    try {
      const dashboardStats = await AnalyticsService.getDashboardStats(user.uid)
      setStats(dashboardStats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadChartData = async () => {
    if (!user) return
    try {
      const data = await AnalyticsService.getChartData(user.uid)
      setChartData(data)
    } catch (error) {
      console.error('Failed to load chart data:', error)
    }
  }

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setUploadedFiles([])
        setUploadedFileObjects([])
        return
      }
      try {
        const files: UploadedFile[] = await UploadService.getUserUploads(user.uid)
        setUploadedFileObjects(files)
        // Display names in the dropdown
        setUploadedFiles(files.map((f) => f.name))
      } catch (e) {
        // Fail silently for dashboard; uploads page handles detailed errors
        setUploadedFiles([])
        setUploadedFileObjects([])
      }
    }
    load()
  }, [user])
  return (
    <ProtectedRoute>
      <DashboardPageLayout
        header={{
          title: "Overview",
          description: "Last updated 12:05",
          icon: BracketsIcon,
        }}
      >
        <div className="mb-6">
          <SearchBar
            onSearch={async (query, files) => {
              setSearchLoading(true)
              setSearchError(null)
              setSearchResult(null)

              try {
                // Prepare file data with content extraction
                const fileDataPromises = files.map(async (f) => {
                  if (typeof f === 'string') {
                    // This is an uploaded file name, find its URL
                    const uploadedFile = uploadedFileObjects.find(uf => uf.name === f)
                    return {
                      name: f,
                      url: uploadedFile?.url
                    }
                  } else {
                    // This is a local File object - extract content in browser
                    const extension = f.name.split('.').pop()?.toLowerCase()
                    
                    if (['txt', 'md', 'json', 'csv'].includes(extension || '')) {
                      // Text files - read directly
                      const content = await ClientFileReader.readFileAsText(f)
                      return {
                        name: f.name,
                        content
                      }
                    } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(extension || '')) {
                      // Binary files - send to extraction API
                      const base64 = await ClientFileReader.readFileAsBase64(f)
                      
                      // Extract text via API
                      const extractResponse = await fetch('/api/extract-file', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileName: f.name, base64Content: base64 })
                      })
                      
                      if (extractResponse.ok) {
                        const extractData = await extractResponse.json()
                        return {
                          name: f.name,
                          content: extractData.extractedText
                        }
                      } else {
                        return {
                          name: f.name,
                          content: `[Could not extract text from ${f.name}]`
                        }
                      }
                    } else {
                      return {
                        name: f.name,
                        content: `[Unsupported file type: ${f.name}]`
                      }
                    }
                  }
                })

                const fileData = await Promise.all(fileDataPromises)
                
                const fileNames = files.map(f => 
                  typeof f === 'string' ? f : f.name
                )

                const response = await fetch('/api/search', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    query, 
                    files: fileNames,
                    fileData: fileData
                  }),
                })

                const data = await response.json()

                if (!response.ok) {
                  throw new Error(data.error || 'Search failed')
                }

                setSearchResult(data)

                // Save to history and create notification
                if (user && data.response) {
                  try {
                    await SearchHistoryService.saveSearch(
                      user.uid,
                      query,
                      data.response,
                      fileNames
                    )
                    
                    // Create success notification
                    await NotificationService.notifySearchComplete(user.uid, query)
                    
                    // Reload stats after search
                    loadStats()
                    loadChartData()
                  } catch (historyError) {
                    console.error('Failed to save search history:', historyError)
                    // Don't fail the search if history save fails
                  }
                }
              } catch (err: any) {
                setSearchError(err.message || 'Failed to process search')
              } finally {
                setSearchLoading(false)
              }
            }}
            uploadedFiles={uploadedFiles}
          />
        </div>

        <div className="mb-6">
          <SearchResults
            loading={searchLoading}
            error={searchError}
            result={searchResult}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <DashboardStat
            label="Total Searches"
            value={stats.totalSearches.toString()}
            description={`${stats.searchesThisWeek} searches this week`}
            icon={Search}
            tag={stats.searchTrend > 0 ? `+${stats.searchTrend}%` : `${stats.searchTrend}%`}
            intent={stats.searchTrend >= 0 ? "positive" : "negative"}
            direction={stats.searchTrend >= 0 ? "up" : "down"}
          />
          <DashboardStat
            label="Total Uploads"
            value={stats.totalUploads.toString()}
            description={`${stats.uploadsThisWeek} uploads this week`}
            icon={UploadIcon}
            tag={stats.uploadTrend > 0 ? `+${stats.uploadTrend}%` : `${stats.uploadTrend}%`}
            intent={stats.uploadTrend >= 0 ? "positive" : "negative"}
            direction={stats.uploadTrend >= 0 ? "up" : "down"}
          />
          <DashboardStat
            label="Files Processed"
            value={(stats.totalSearches + stats.totalUploads).toString()}
            description="Total documents analyzed"
            icon={FileText}
            tag="Active"
            intent="neutral"
            direction="up"
          />
        </div>

        <div className="mb-6">
          <DashboardChart chartData={chartData} />
        </div>

        {/* Main 2-column grid section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DepartmentActivity departments={mockData.departmentActivity} />
          <SystemStatus statuses={mockData.systemStatus} />
        </div>
      </DashboardPageLayout>
    </ProtectedRoute>
  )
}
