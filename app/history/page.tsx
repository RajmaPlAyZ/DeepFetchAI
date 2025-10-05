"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import DashboardPageLayout from '@/components/dashboard/layout'
import SearchHistory from '@/components/dashboard/search-history'
import { useAuth } from '@/lib/auth-context'
import { SearchHistoryService, SearchHistoryItem } from '@/lib/search-history-service'
import { History as HistoryIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HistoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSearches: 0,
    searchesThisWeek: 0,
    searchesThisMonth: 0,
  })

  useEffect(() => {
    if (user) {
      loadHistory()
      loadStats()
    }
  }, [user])

  const loadHistory = async () => {
    if (!user) return

    try {
      setLoading(true)
      const userHistory = await SearchHistoryService.getUserHistory(user.uid)
      setHistory(userHistory)
    } catch (err: any) {
      console.error('Failed to load history:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user) return

    try {
      const userStats = await SearchHistoryService.getUserStats(user.uid)
      setStats(userStats)
    } catch (err: any) {
      console.error('Failed to load stats:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await SearchHistoryService.deleteHistoryItem(id)
      setHistory(prev => prev.filter(item => item.id !== id))
      // Reload stats after deletion
      loadStats()
    } catch (err: any) {
      console.error('Failed to delete history item:', err)
    }
  }

  const handleReuse = (query: string) => {
    // Navigate to dashboard with query
    router.push(`/?query=${encodeURIComponent(query)}`)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Please sign in to view your search history
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardPageLayout
        header={{
          title: "Search History",
          description: "View and manage your past searches",
          icon: HistoryIcon,
        }}
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Searches</CardDescription>
              <CardTitle className="text-3xl">{stats.totalSearches}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>This Week</CardDescription>
              <CardTitle className="text-3xl">{stats.searchesThisWeek}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-3xl">{stats.searchesThisMonth}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* History Component */}
        <SearchHistory
          history={history}
          loading={loading}
          onDelete={handleDelete}
          onReuse={handleReuse}
        />
      </DashboardPageLayout>
    </ProtectedRoute>
  )
}
