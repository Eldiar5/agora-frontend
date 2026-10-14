"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Landmark, LogOut, User } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notification-center"

export function Header() {
  const { isAuthenticated, userLogin, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">

          {/* ЛОГОТИП */}
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <Landmark className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl tracking-tight">Agora</span>
          </Link>

          {/* ПРАВАЯ ПАНЕЛЬ */}
          <div className="flex items-center gap-2">

            {isAuthenticated ? (
                <>
                  {/* 1. [Факел] Уведомления */}
                  <NotificationCenter />

                  {/* 2. [Профиль] */}
                  <Link href={`/profile/${userLogin}`}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full hover:bg-accent transition-colors"
                        title="Мой профиль"
                    >
                      <User className="h-6 w-6" />
                    </Button>
                  </Link>

                  {/* 3. [Выход] */}
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="h-10 w-10 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors"
                      title="Выйти"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
            ) : (
                // Для гостей
                <div className="flex gap-2 mr-2">
                  <Link href="/login">
                    <Button variant="ghost">Войти</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Регистрация</Button>
                  </Link>
                </div>
            )}

            {/* 4. [Тема] - Всегда последняя */}
            <ThemeToggle />

          </div>
        </div>
      </header>
  )
}