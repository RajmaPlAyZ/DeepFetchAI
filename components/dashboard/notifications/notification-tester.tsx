"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { NotificationService } from "@/lib/notification-service"
import { useState } from "react"

export function NotificationTester() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const createTestNotifications = async () => {
    if (!user) return

    try {
      setLoading(true)
      await NotificationService.createSampleNotifications(user.uid)
      alert('Test notifications created successfully!')
    } catch (error) {
      console.error('Failed to create test notifications:', error)
      alert('Failed to create test notifications')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={createTestNotifications}
        disabled={loading}
        variant="outline"
        size="sm"
      >
        {loading ? 'Creating...' : '🔔 Test Notifications'}
      </Button>
    </div>
  )
}
