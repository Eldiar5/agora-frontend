"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Search, Loader2, User, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usersService, type UserInfo } from "@/services/users"
import { useQuery } from "@tanstack/react-query"

export function UserSearch() {
    const [query, setQuery] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const [debouncedQuery, setDebouncedQuery] = useState("")
    const searchRef = useRef<HTMLDivElement>(null)

    // 1. Debounce логика: обновляем debouncedQuery с задержкой 300мс
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query)
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    // 2. Запрос к API (срабатывает, когда меняется debouncedQuery)
    const { data: results, isLoading } = useQuery({
        queryKey: ["userSearch", debouncedQuery],
        queryFn: () => usersService.search(debouncedQuery),
        enabled: debouncedQuery.length > 0, // Не искать, если пусто
    })

    // 3. Обработка клика вне компонента (чтобы закрыть список)
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleFocus = () => {
        if (debouncedQuery.length > 0) setIsOpen(true)
    }

    return (
        <div className="mb-6 relative z-50" ref={searchRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search users..."
                    className="pl-9 pr-9 bg-background/50 backdrop-blur border-muted focus-visible:ring-primary"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={handleFocus}
                />
                {query && (
                    <button
                        onClick={() => { setQuery(""); setIsOpen(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* ВЫПАДАЮЩИЙ СПИСОК РЕЗУЛЬТАТОВ */}
            {isOpen && query.length > 0 && (
                <Card className="absolute top-full mt-2 w-full max-h-80 overflow-y-auto shadow-lg animate-in fade-in zoom-in-95 duration-200">
                    {isLoading ? (
                        <div className="p-4 flex justify-center text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    ) : results && results.length > 0 ? (
                        <div className="py-2">
                            {results.map((user) => (
                                <Link
                                    key={user.id}
                                    href={`/profile/${user.login}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.login}`} />
                                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="font-medium text-sm truncate">@{user.login}</span>
                                            {(user.name || user.lastName) && (
                                                <span className="text-xs text-muted-foreground truncate">
                           {user.name} {user.lastName}
                         </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        // Если ничего не найдено
                        !isLoading && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No users found for "{query}"
                            </div>
                        )
                    )}
                </Card>
            )}
        </div>
    )
}