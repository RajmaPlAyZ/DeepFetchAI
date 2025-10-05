"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Award,
    BookOpen,
    Globe,
    GraduationCap,
    Shield,
    Target,
    Users,
    Zap
} from 'lucide-react'

export default function AboutPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">About D.F.M.O.E OS</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Deep Fetch For Ministry Of Education - Empowering the future of education through innovative technology
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To revolutionize education through cutting-edge technology, providing educators and students 
                with powerful tools for learning, collaboration, and knowledge management. We believe in 
                making education accessible, efficient, and engaging for everyone.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To create a world where education transcends boundaries, where every learner has access 
                to personalized, high-quality educational experiences, and where technology serves as 
                a bridge to knowledge rather than a barrier.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Key Features
            </CardTitle>
            <CardDescription>
              Discover what makes D.F.M.O.E OS special
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Document Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload, organize, and access educational materials with ease
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Collaboration Tools</h4>
                  <p className="text-sm text-muted-foreground">
                    Connect with educators and students worldwide
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Secure Platform</h4>
                  <p className="text-sm text-muted-foreground">
                    Enterprise-grade security for your educational data
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Learning Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    Track progress and optimize learning outcomes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Achievement System</h4>
                  <p className="text-sm text-muted-foreground">
                    Gamified learning with rewards and recognition
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">AI-Powered Search</h4>
                  <p className="text-sm text-muted-foreground">
                    Find relevant content instantly with smart search
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <Card>
          <CardHeader>
            <CardTitle>Technology Stack</CardTitle>
            <CardDescription>
              Built with modern, reliable technologies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Next.js 15</Badge>
              <Badge variant="outline">React 19</Badge>
              <Badge variant="outline">TypeScript</Badge>
              <Badge variant="outline">Tailwind CSS</Badge>
              <Badge variant="outline">Firebase</Badge>
              <Badge variant="outline">Firestore</Badge>
              <Badge variant="outline">Firebase Storage</Badge>
              <Badge variant="outline">Firebase Auth</Badge>
              <Badge variant="outline">Framer Motion</Badge>
              <Badge variant="outline">Radix UI</Badge>
              <Badge variant="outline">Lucide Icons</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Get in Touch</CardTitle>
            <CardDescription>
              Have questions or feedback? We'd love to hear from you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Support</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Need help? Our support team is here to assist you.
                </p>
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Feedback</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Help us improve by sharing your thoughts and suggestions.
                </p>
                <Button variant="outline" size="sm">
                  Send Feedback
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 border-t">
          <p className="text-muted-foreground">
            © 2024 D.F.M.O.E OS. All rights reserved. Built with ❤️ for education.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  )
}
