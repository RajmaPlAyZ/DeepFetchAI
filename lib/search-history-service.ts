import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where, limit } from 'firebase/firestore'
import { db } from './firebase'

export interface SearchHistoryItem {
  id: string
  userId: string
  query: string
  response: string
  filesAttached: string[]
  timestamp: string
  filesCount: number
}

export class SearchHistoryService {
  /**
   * Save a search to history
   */
  static async saveSearch(
    userId: string,
    searchQuery: string,
    aiResponse: string,
    filesAttached: string[] = []
  ): Promise<SearchHistoryItem> {
    if (!db) throw new Error('Firebase not initialized')

    const historyData = {
      userId,
      query: searchQuery,
      response: aiResponse,
      filesAttached,
      filesCount: filesAttached.length,
      timestamp: new Date().toISOString(),
    }

    const docRef = await addDoc(collection(db, 'searchHistory'), historyData)

    return {
      id: docRef.id,
      ...historyData,
    }
  }

  /**
   * Get user's search history
   */
  static async getUserHistory(userId: string, maxResults: number = 50): Promise<SearchHistoryItem[]> {
    if (!db) throw new Error('Firebase not initialized')

    try {
      // Try with composite index (requires Firebase index)
      const historyRef = collection(db, 'searchHistory')
      const q = query(
        historyRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      )

      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as SearchHistoryItem))
    } catch (error: any) {
      // Fallback: If index doesn't exist, get all and filter client-side
      console.warn('Composite index not found, using fallback method:', error.message)
      
      const historyRef = collection(db, 'searchHistory')
      const q = query(historyRef, where('userId', '==', userId))
      
      const querySnapshot = await getDocs(q)
      
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as SearchHistoryItem))
      
      // Sort by timestamp client-side
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      
      // Limit results
      return items.slice(0, maxResults)
    }
  }

  /**
   * Get all search history (admin view)
   */
  static async getAllHistory(maxResults: number = 100): Promise<SearchHistoryItem[]> {
    if (!db) throw new Error('Firebase not initialized')

    try {
      const historyRef = collection(db, 'searchHistory')
      const q = query(historyRef, orderBy('timestamp', 'desc'), limit(maxResults))

      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as SearchHistoryItem))
    } catch (error: any) {
      // Fallback: Get all and sort client-side
      console.warn('Index not found for getAllHistory, using fallback:', error.message)
      
      const historyRef = collection(db, 'searchHistory')
      const querySnapshot = await getDocs(historyRef)
      
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as SearchHistoryItem))
      
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      
      return items.slice(0, maxResults)
    }
  }

  /**
   * Delete a search history item
   */
  static async deleteHistoryItem(historyId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized')

    await deleteDoc(doc(db, 'searchHistory', historyId))
  }

  /**
   * Search within history
   */
  static async searchHistory(userId: string, searchTerm: string): Promise<SearchHistoryItem[]> {
    // Get all user history first, then filter client-side
    // For better performance, consider using Algolia or similar for full-text search
    const allHistory = await this.getUserHistory(userId, 200)

    const lowerSearchTerm = searchTerm.toLowerCase()

    return allHistory.filter(item =>
      item.query.toLowerCase().includes(lowerSearchTerm) ||
      item.response.toLowerCase().includes(lowerSearchTerm)
    )
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
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Get search statistics
   */
  static async getUserStats(userId: string): Promise<{
    totalSearches: number
    searchesThisWeek: number
    searchesThisMonth: number
  }> {
    const allHistory = await this.getUserHistory(userId, 1000)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    return {
      totalSearches: allHistory.length,
      searchesThisWeek: allHistory.filter(item => new Date(item.timestamp) > weekAgo).length,
      searchesThisMonth: allHistory.filter(item => new Date(item.timestamp) > monthAgo).length,
    }
  }
}
