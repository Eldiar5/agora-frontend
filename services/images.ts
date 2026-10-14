import api from "@/lib/axios"

export const imagesService = {
    async upload(file: File): Promise<string> {
        const formData = new FormData()
        formData.append("file", file)

        // ВАЖНО: Передаем headers с Content-Type: undefined
        // Это заставит axios убрать дефолтный application/json и позволит браузеру
        // автоматически выставить правильный multipart/form-data с boundary.
        const response = await api.post<{ url: string }>("/image/upload", formData, {
            headers: {
                "Content-Type": undefined,
            },
        })
        return response.data.url
    },
}