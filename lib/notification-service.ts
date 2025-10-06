import { collection, addDoc, getDocs, query, where, orderBy, limit, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'

export interface Notification {
  id: string
  userId: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  actionLabel?: string
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(
    userId: string,
    type: 'success' | 'info' | 'warning' | 'error',
    title: string,
    message: string,
    actionUrl?: string,
    actionLabel?: string
  ): Promise<Notification> {
    if (!db) throw new Error('Firebase not initialized')

    const notificationData = {
      userId,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl,
      actionLabel
    }

    const docRef = await addDoc(collection(db, 'notifications'), notificationData)

    return {
      id: docRef.id,
      ...notificationData
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: string, maxResults: number = 20): Promise<Notification[]> {
    if (!db) throw new Error('Firebase not initialized')

    try {
      const notificationsRef = collection(db, 'notifications')
      const q = query(
        notificationsRef,
        where('userId', '==', userId)
      )

      const querySnapshot = await getDocs(q)

      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification))

      // Sort by timestamp client-side
      notifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      return notifications.slice(0, maxResults)
    } catch (error) {
      console.error('Error getting notifications:', error)
      return []
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    if (!db) throw new Error('Firebase not initialized')

    try {
      const notificationsRef = collection(db, 'notifications')
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.size
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized')

    const notificationRef = doc(db, 'notifications', notificationId)
    await updateDoc(notificationRef, { read: true })
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized')

    const notifications = await this.getUserNotifications(userId)
    const unreadNotifications = notifications.filter(n => !n.read)

    await Promise.all(
      unreadNotifications.map(n => this.markAsRead(n.id))
    )
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized')

    await deleteDoc(doc(db, 'notifications', notificationId))
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllNotifications(userId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized')

    const notifications = await this.getUserNotifications(userId)
    await Promise.all(
      notifications.map(n => this.deleteNotification(n.id))
    )
  }

  /**
   * Create notification for successful search
   */
  static async notifySearchComplete(userId: string, query: string): Promise<void> {
    await this.createNotification(
      userId,
      'success',
      'Search Completed',
      `Your search for "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}" has been completed successfully.`,
      '/history',
      'View History'
    )
  }

  /**
   * Create notification for file upload
   */
  static async notifyFileUploaded(userId: string, fileName: string): Promise<void> {
    await this.createNotification(
      userId,
      'success',
      'File Uploaded',
      `"${fileName}" has been uploaded successfully.`,
      '/uploads',
      'View Uploads'
    )
  }

  /**
   * Create notification for system updates
   */
  static async notifySystemUpdate(userId: string, message: string): Promise<void> {
    await this.createNotification(
      userId,
      'info',
      'System Update',
      message
    )
  }

  /**
   * Create notification for errors
   */
  static async notifyError(userId: string, title: string, message: string): Promise<void> {
    await this.createNotification(
      userId,
      'error',
      title,
      message
    )
  }

  /**
   * Create notification for document processing
   */
  static async notifyDocumentProcessed(userId: string, fileName: string): Promise<void> {
    await this.createNotification(
      userId,
      'success',
      'DOCUMENT PROCESSED',
      `${fileName} has been successfully indexed and is ready for search.`
    )
  }

  /**
   * Create notification for batch upload
   */
  static async notifyBatchUpload(userId: string, count: number, folderName: string): Promise<void> {
    await this.createNotification(
      userId,
      'success',
      'BATCH UPLOAD COMPLETE',
      `Successfully processed ${count} documents from ${folderName}.`
    )
  }

  /**
   * Create sample notifications for testing
   */
  static async createSampleNotifications(userId: string): Promise<void> {
    const now = new Date();
    
    // Create a few sample notifications
    await this.createNotification(
      userId,
      'success',
      'PAYMENT RECEIVED',
      'Your payment to Rampart Studio has been processed successfully.',
      undefined,
      undefined
    );

    await this.createNotification(
      userId,
      'info',
      'INTRO: JOYCO STUDIO AND VO',
      'About Us - We\'re a healthcare company focused on accessibility and innovation.',
      undefined,
      undefined
    );

    await this.createNotification(
      userId,
      'warning',
      'SYSTEM UPDATE',
      'Security patches have been applied to all guard bots.',
      undefined,
      undefined
    );
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}
