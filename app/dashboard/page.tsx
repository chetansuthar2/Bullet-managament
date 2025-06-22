'use client'
import { useUser } from "@clerk/nextjs"
import { db } from "@/lib/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import type { DocumentData } from "firebase/firestore";

interface UserData {
  name?: string;
  email?: string;
}

export default function DashboardPage() {
  const { user } = useUser()
  const [userData, setUserData] = useState<DocumentData | null>(null)

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.id)
      getDoc(userRef).then((docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data())
        } else {
          const data = {
            name: user.fullName ?? undefined,
            email: user.primaryEmailAddress?.emailAddress,
          }
          setDoc(userRef, data)
          setUserData(data)
        }
      })
    }
  }, [user])

  if (!user) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-800 mb-4">Welcome, {userData?.name}</h1>
          <div className="space-y-3">
            <p className="text-sm sm:text-base text-gray-700">
              <span className="font-medium">Email:</span> {userData?.email}
            </p>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Your dashboard is ready! You can manage your bullet repair entries from the main page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
