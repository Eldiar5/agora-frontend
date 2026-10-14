import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // Получаем путь запроса (например, /api/v1/auth/login)
    const { pathname } = request.nextUrl;

    // Проверяем, начинается ли путь с /api/v1
    if (pathname.startsWith("/api/v1")) {
        // Получаем URL бэкенда из переменных окружения
        // В Docker это будет http://gateway:9000
        // Локально - http://localhost:9000
        const backendUrl = process.env.BACKEND_URL || "http://localhost:9000";

        // Формируем новый URL
        const targetUrl = new URL(pathname, backendUrl);

        // Копируем параметры запроса (?id=123...)
        targetUrl.search = request.nextUrl.search;

        console.log(`🔀 Proxying ${pathname} to ${targetUrl.toString()}`);

        // Делаем Rewrite (подмена адреса, браузер этого не видит)
        return NextResponse.rewrite(targetUrl);
    }

    return NextResponse.next();
}

// Указываем, для каких путей применять middleware
export const config = {
    matcher: "/api/v1/:path*",
};
