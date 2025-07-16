// /app/auth/callback/page.tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function CallbackPage() {
    const router = useRouter()

    useEffect(() => {
        const checkSession = async () => {
            const { data, error } = await supabase.auth.getSession()
            if (error || !data.session) {
                alert("ログインに失敗しました")
                router.push("/login")
                return
            }

            const user = data.session.user
            localStorage.setItem("userId", user.id)

            const profile = localStorage.getItem("userProfile")
            if (!profile) {
                router.push("/setup-profile")
            } else {
                router.push("/home")
            }
        }

        checkSession()
    }, [router])

    return <p className="text-center mt-20">ログイン処理中...</p>
}
