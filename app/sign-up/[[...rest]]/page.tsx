"use client";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-6">
        {/* Header */}
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome to Vehicle Repair Management</h1>
          <p className="text-blue-100">Create your account to get started</p>
        </div>

        {/* Sign Up Form */}
        <div className="flex justify-center">
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
                card: "shadow-2xl",
                headerTitle: "text-2xl font-bold",
                headerSubtitle: "text-gray-600",
                socialButtonsBlockButton: "border-gray-300 hover:bg-gray-50",
                formFieldInput: "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
                footerActionLink: "text-blue-600 hover:text-blue-700"
              }
            }}
            redirectUrl="/"
          />
        </div>

        {/* Info */}
        <div className="text-center text-blue-100 text-sm max-w-md">
          <p>🔒 Each email can only be used once for registration</p>
          <p>📧 You'll receive a verification email after signup</p>
        </div>
      </div>
    </div>
  );
}