import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      )
    }

    // Create sample notifications matching the screenshot
    await NotificationService.createNotification(
      userId,
      'success',
      'PAYMENT RECEIVED',
      'Your payment to Rampart Studio has been processed successfully.'
    )

    await NotificationService.createNotification(
      userId,
      'info',
      'INTRO: JOYCO STUDIO AND VO',
      'About Us - We\'re a healthcare company focused on accessibility and innovation.'
    )

    await NotificationService.createNotification(
      userId,
      'warning',
      'SYSTEM UPDATE',
      'Security patches have been applied to all guard bots.'
    )

    return NextResponse.json({
      success: true,
      message: 'Sample notifications created successfully'
    })

  } catch (error: any) {
    console.error('Test notifications API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
