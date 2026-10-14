"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { authService } from "@/services/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Loader2, Landmark } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const [loginValue, setLoginValue] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // response теперь типа LoginResponse
      const response = await authService.login(loginValue, password)

      // Вызываем login контекста, передавая оба токена
      login(response.token.accessToken, response.token.refreshToken, response.login)

      toast.success("Welcome back!")
      router.push("/")
    } catch {
      toast.error("Invalid credentials. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
  }

  return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">

            {/* 👇 ЛОГОТИП AGORA (Синий стиль) */}
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Landmark className="h-10 w-10 text-blue-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to sign in to your account
            </p>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login">Username</Label>
                <Input
                    id="login"
                    type="text"
                    placeholder="Enter your username"
                    value={loginValue}
                    onChange={(e) => setLoginValue(e.target.value)}
                    required
                    disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sign In
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
  )
}
