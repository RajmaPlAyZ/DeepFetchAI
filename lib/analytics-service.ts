import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from './firebase'

export interface DashboardStats {
  totalSearches: number
  totalUploads: number
  activeUsers: number
  searchesThisWeek: number
  uploadsThisWeek: number
  searchTrend: number // percentage change
  uploadTrend: number // percentage change
}

export interface ChartData {
  date: string
  searches: number
  uploads: number
}

export interface ActivityItem {
  id: string
  type: 'search' | 'upload' | 'system'
  title: string
  description: string
  timestamp: string
  userId?: string
  userName?: string
}

export class AnalyticsService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(userId?: string): Promise<DashboardStats> {
    if (!db) throw new Error('Firebase not initialized')

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    try {
      // Get search history
      const searchHistoryRef = collection(db, 'searchHistory')
      const searchQuery = userId 
        ? query(searchHistoryRef, where('userId', '==', userId))
        : searchHistoryRef
      
      const searchSnapshot = await getDocs(searchQuery)
      const allSearches = searchSnapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp
      }))

      // Get uploads
      const uploadsRef = collection(db, 'uploads')
      const uploadsQuery = userId
        ? query(uploadsRef, where('uploadedBy', '==', userId))
        : uploadsRef
      
      const uploadsSnapshot = await getDocs(uploadsQuery)
      const allUploads = uploadsSnapshot.docs.map(doc => ({
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt
      }))

      // Calculate stats
      const totalSearches = allSearches.length
      const totalUploads = allUploads.length

      const searchesThisWeek = allSearches.filter(s => 
        new Date(s.timestamp) > weekAgo
      ).length

      const searchesLastWeek = allSearches.filter(s => 
        new Date(s.timestamp) > twoWeeksAgo && new Date(s.timestamp) <= weekAgo
      ).length

      const uploadsThisWeek = allUploads.filter(u => 
        new Date(u.uploadedAt) > weekAgo
      ).length

      const uploadsLastWeek = allUploads.filter(u => 
        new Date(u.uploadedAt) > twoWeeksAgo && new Date(u.uploadedAt) <= weekAgo
      ).length

      // Calculate trends (percentage change)
      const searchTrend = searchesLastWeek > 0
        ? ((searchesThisWeek - searchesLastWeek) / searchesLastWeek) * 100
        : searchesThisWeek > 0 ? 100 : 0

      const uploadTrend = uploadsLastWeek > 0
        ? ((uploadsThisWeek - uploadsLastWeek) / uploadsLastWeek) * 100
        : uploadsThisWeek > 0 ? 100 : 0

      // Get unique users (if admin view)
      const uniqueUsers = new Set([
        ...allSearches.map((s: any) => s.userId),
        ...allUploads.map((u: any) => u.uploadedBy)
      ]).size

      return {
        totalSearches,
        totalUploads,
        activeUsers: uniqueUsers,
        searchesThisWeek,
        uploadsThisWeek,
        searchTrend: Math.round(searchTrend),
        uploadTrend: Math.round(uploadTrend)
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      return {
        totalSearches: 0,
        totalUploads: 0,
        activeUsers: 0,
        searchesThisWeek: 0,
        uploadsThisWeek: 0,
        searchTrend: 0,
        uploadTrend: 0
      }
    }
  }

  /**
   * Get chart data for the last 7 days
   */
  static async getChartData(userId?: string): Promise<ChartData[]> {
    if (!db) throw new Error('Firebase not initialized')

    try {
      const now = new Date()
      const chartData: ChartData[] = []

      // Generate last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        chartData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          searches: 0,
          uploads: 0
        })
      }

      // Get search history
      const searchHistoryRef = collection(db, 'searchHistory')
      const searchQuery = userId
        ? query(searchHistoryRef, where('userId', '==', userId))
        : searchHistoryRef
      
      const searchSnapshot = await getDocs(searchQuery)
      
      searchSnapshot.docs.forEach(doc => {
        const data = doc.data()
        const timestamp = new Date(data.timestamp)
        const dayIndex = Math.floor((now.getTime() - timestamp.getTime()) / (24 * 60 * 60 * 1000))
        
        if (dayIndex >= 0 && dayIndex < 7) {
          chartData[6 - dayIndex].searches++
        }
      })

      // Get uploads
      const uploadsRef = collection(db, 'uploads')
      const uploadsQuery = userId
        ? query(uploadsRef, where('uploadedBy', '==', userId))
        : uploadsRef
      
      const uploadsSnapshot = await getDocs(uploadsQuery)
      
      uploadsSnapshot.docs.forEach(doc => {
        const data = doc.data()
        const timestamp = new Date(data.uploadedAt)
        const dayIndex = Math.floor((now.getTime() - timestamp.getTime()) / (24 * 60 * 60 * 1000))
        
        if (dayIndex >= 0 && dayIndex < 7) {
          chartData[6 - dayIndex].uploads++
        }
      })

      return chartData
    } catch (error) {
      console.error('Error getting chart data:', error)
      return []
    }
  }

  /**
   * Get recent activity
   */
  static async getRecentActivity(userId?: string, maxItems: number = 10): Promise<ActivityItem[]> {
    if (!db) throw new Error('Firebase not initialized')

    try {
      const activities: ActivityItem[] = []

      // Get recent searches
      const searchHistoryRef = collection(db, 'searchHistory')
      const searchQuery = userId
        ? query(searchHistoryRef, where('userId', '==', userId), limit(maxItems))
        : query(searchHistoryRef, limit(maxItems))
      
      const searchSnapshot = await getDocs(searchQuery)
      
      searchSnapshot.docs.forEach(doc => {
        const data = doc.data()
        activities.push({
          id: doc.id,
          type: 'search',
          title: 'Search Query',
          description: data.query.substring(0, 100) + (data.query.length > 100 ? '...' : ''),
          timestamp: data.timestamp,
          userId: data.userId
        })
      })

      // Get recent uploads
      const uploadsRef = collection(db, 'uploads')
      const uploadsQuery = userId
        ? query(uploadsRef, where('uploadedBy', '==', userId), limit(maxItems))
        : query(uploadsRef, limit(maxItems))
      
      const uploadsSnapshot = await getDocs(uploadsQuery)
      
      uploadsSnapshot.docs.forEach(doc => {
        const data = doc.data()
        activities.push({
          id: doc.id,
          type: 'upload',
          title: 'File Uploaded',
          description: data.name,
          timestamp: data.uploadedAt,
          userId: data.uploadedBy
        })
      })

      // Sort by timestamp
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      return activities.slice(0, maxItems)
    } catch (error) {
      console.error('Error getting recent activity:', error)
      return []
    }
  }

  /**
   * Format timestamp for display
   */
  static formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }
}
