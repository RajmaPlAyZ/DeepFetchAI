"use client"

import {
    User,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { auth, db } from './firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  updateUserProfile: (displayName: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          // Keep the original user object and only add additional data
          const userData = userDoc.data();
          Object.keys(userData).forEach(key => {
            if (key !== 'uid' && key !== 'email') {
              (user as any)[key] = userData[key];
            }
          });
        }
        setUser(user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not initialized')
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!auth || !db) throw new Error('Firebase not initialized')
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(user, { displayName })
    
    // Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName,
      createdAt: new Date().toISOString(),
      role: 'user'
    })
  }

  const logout = async () => {
    if (!auth) throw new Error('Firebase not initialized')
    await signOut(auth)
  }

  const updateUserProfile = async (displayName: string) => {
    if (!auth || !db || !user) throw new Error('Not authenticated')
    await updateProfile(user, { displayName })
    
    // Update Firestore
    await setDoc(doc(db, 'users', user.uid), {
      displayName
    }, { merge: true })

    // Update local user state
    setUser(prev => prev ? { ...prev, displayName } as User : null)
  }

  const value = useMemo(() => ({
    user,
    loading,
    signIn,
    signUp,
    logout,
    updateUserProfile
  }), [user, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
