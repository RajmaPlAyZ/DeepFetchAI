"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { useState } from 'react'
import { LoginForm } from './login-form'
import { SignupForm } from './signup-form'

export function AuthWrapper() {
  const [isLogin, setIsLogin] = useState(true)
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        {isLogin ? <LoginForm /> : <SignupForm />}
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-center">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Create Account" : "Sign In"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
