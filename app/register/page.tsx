"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { authService, type RegistrationPayload } from "@/services/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Landmark, Loader2, CalendarIcon, User, Building2} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

// Define base fields as a plain object schema (without refinement)
const baseFields = {
  login: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}

// Person schema: merge base fields with person-specific fields, then refine
const personSchema = z
  .object({
    ...baseFields,
    name: z.string().min(1, "Name is required"),
    surname: z.string().min(1, "Surname is required"),
    dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

// Organization schema: merge base fields with org-specific fields, then refine
const organizationSchema = z
  .object({
    ...baseFields,
    title: z.string().min(1, "Organization title is required"),
    specialization: z.string().min(1, "Specialization is required"),
    dateOfFoundation: z.date({ required_error: "Date of foundation is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type PersonFormData = z.infer<typeof personSchema>
type OrganizationFormData = z.infer<typeof organizationSchema>

export default function RegisterPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, authLoading, router])

  if (authLoading || isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <Landmark className="h-10 w-10 text-blue-600" />
                </div>
            </div>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Choose your account type to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="person" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="person" className="gap-2">
                <User className="h-4 w-4" />
                Person
              </TabsTrigger>
              <TabsTrigger value="organization" className="gap-2">
                <Building2 className="h-4 w-4" />
                Organization
              </TabsTrigger>
            </TabsList>
            <TabsContent value="person">
              <PersonForm login={login} router={router} />
            </TabsContent>
            <TabsContent value="organization">
              <OrganizationForm login={login} router={router} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

// Person registration form component
function PersonForm({
  login,
  router,
}: {
  login: (accessToken: string, refreshToken: string, login: string) => void
  router: ReturnType<typeof useRouter>
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
  })

  const onSubmit = async (data: PersonFormData) => {
    try {
      const payload: RegistrationPayload = {
        login: data.login,
        password: data.password,
        userType: "PERSON",
        name: data.name,
        surname: data.surname,
        dateOfBirth: format(data.dateOfBirth, "yyyy-MM-dd"),
      }

        // 1. Сначала регистрируем пользователя
        // (Мы игнорируем ответ, так как там нет токена)
        await authService.register(payload)

        // 2. СРАЗУ делаем автоматический логин, чтобы получить токен
        const loginResponse = await authService.login(data.login, data.password)

        // 3. Сохраняем токен и обновляем контекст
        login(loginResponse.token.accessToken, loginResponse.token.refreshToken, loginResponse.login)

        toast.success("Account created successfully! Redirecting...")
        router.push("/")
    } catch (error) {
        console.error(error)
        toast.error("Registration failed. Username might be taken.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="person-login">Username</Label>
        <Input id="person-login" placeholder="Choose a username" {...register("login")} disabled={isSubmitting} />
        {errors.login && <p className="text-sm text-destructive">{errors.login.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">First Name</Label>
          <Input id="name" placeholder="John" {...register("name")} disabled={isSubmitting} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="surname">Last Name</Label>
          <Input id="surname" placeholder="Doe" {...register("surname")} disabled={isSubmitting} />
          {errors.surname && <p className="text-sm text-destructive">{errors.surname.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Date of Birth</Label>
        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => date > new Date()}
                  captionLayout="dropdown"
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="person-password">Password</Label>
        <Input
          id="person-password"
          type="password"
          placeholder="Create a password"
          {...register("password")}
          disabled={isSubmitting}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="person-confirmPassword">Confirm Password</Label>
        <Input
          id="person-confirmPassword"
          type="password"
          placeholder="Confirm your password"
          {...register("confirmPassword")}
          disabled={isSubmitting}
        />
        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isSubmitting ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  )
}

// Organization registration form component
function OrganizationForm({
  login,
  router,
}: {
  login: (accessToken: string, refreshToken: string, login: string) => void
  router: ReturnType<typeof useRouter>
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
  })

  const onSubmit = async (data: OrganizationFormData) => {
    try {
      const payload: RegistrationPayload = {
        login: data.login,
        password: data.password,
        userType: "ORGANIZATION",
        title: data.title,
        specialization: data.specialization,
        dateOfFoundation: format(data.dateOfFoundation, "yyyy-MM-dd"),
      }

        // 1. Регистрация
        await authService.register(payload)

        // 2. Авто-логин для получения токена
        const loginResponse = await authService.login(data.login, data.password)

        // 3. Сохранение сессии
        login(loginResponse.token.accessToken, loginResponse.token.refreshToken, loginResponse.login)

        toast.success("Organization account created! Redirecting...")
        router.push("/")
    } catch (error) {
        console.error(error)
        toast.error("Registration failed. Username might be taken.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-login">Username</Label>
        <Input id="org-login" placeholder="Choose a username" {...register("login")} disabled={isSubmitting} />
        {errors.login && <p className="text-sm text-destructive">{errors.login.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Organization Name</Label>
        <Input id="title" placeholder="Acme Inc." {...register("title")} disabled={isSubmitting} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialization">Specialization</Label>
        <Input
          id="specialization"
          placeholder="Software Development"
          {...register("specialization")}
          disabled={isSubmitting}
        />
        {errors.specialization && <p className="text-sm text-destructive">{errors.specialization.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Date of Foundation</Label>
        <Controller
          control={control}
          name="dateOfFoundation"
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => date > new Date()}
                  captionLayout="dropdown"
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.dateOfFoundation && <p className="text-sm text-destructive">{errors.dateOfFoundation.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-password">Password</Label>
        <Input
          id="org-password"
          type="password"
          placeholder="Create a password"
          {...register("password")}
          disabled={isSubmitting}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-confirmPassword">Confirm Password</Label>
        <Input
          id="org-confirmPassword"
          type="password"
          placeholder="Confirm your password"
          {...register("confirmPassword")}
          disabled={isSubmitting}
        />
        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isSubmitting ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  )
}
