
"use client"

import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"



type UserProfile = {
  name: string
  avatar: string
}

export default function LoginPage() {
  const [name, setName] = useState("")
  const [avatar, setAvatar] = useState("😊")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [savedProfile, setSavedProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/home"


  const router = useRouter()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const params = useParams()
  const projectId = params?.id

  useEffect(() => {
    // 初回アクセス時、userIdがなければ生成
    if (!localStorage.getItem("userId")) {
      const newId = uuidv4()
      localStorage.setItem("userId", newId)
    }

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setHasSession(true)
        const profile = localStorage.getItem("userProfile")
        if (profile) {
          setSavedProfile(JSON.parse(profile))
        } else {
          router.push("/setup-profile")
        }
      }
      setIsLoading(false)
    }

    checkSession()
  }, [])

  const handleRegister = () => {
    if (!name.trim() || !avatar.trim()) {
      alert("ユーザー名とアイコン（絵文字）を入力してください")
      return
    }

    const newProfile = { name, avatar }
    localStorage.setItem("userProfile", JSON.stringify(newProfile))
    setSavedProfile(newProfile)
    router.push(redirect)
  }

  const handleLogin = () => {
    router.push(redirect)
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://time-matcha.vercel.app/auth/callback" 
      },
    })
  }

  if (isLoading) {
    return <div className="text-center text-[#4A7856] mt-20">読み込み中...</div>
  }

  return (
    <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        {!hasSession ? (
          <div className="text-center">
            <h2 className="text-xl font-medium text-[#4A7856] mb-6">ログイン</h2>
            <button
              onClick={handleGoogleLogin}
              className="bg-[#6BA8E0] hover:bg-[#4D91D1] text-white py-2 px-4 rounded transition w-full"
            >
              Googleアカウントで始める
            </button>
          </div>
        ) : savedProfile ? (
          <div className="text-center">
            <div className="flex flex-col gap-3">
              <p className="text-lg mb-4">
                {savedProfile.avatar} <span className="font-bold">{savedProfile.name}</span> さん、ようこそ！
              </p>
              <button
                onClick={handleLogin}
                className="bg-[#90C290] hover:bg-[#4A7856] text-white px-4 py-2 rounded transition"
              >
                このアカウントで続ける
              </button>

              <button
                onClick={async () => {
                  const confirmReset = confirm(
                    "別のアカウントを作成すると、これまでのデータ（ニックネーム・絵文字・回答履歴など）はすべて削除されます。本当によろしいですか？"
                  )
                  if (confirmReset) {
                    await supabase.auth.signOut()
                    localStorage.clear()
                    setSavedProfile(null)
                    setName("")
                    setAvatar("😊")
                    setHasSession(false)
                  }
                }}
                className="bg-[#E85A71] hover:bg-[#FF8FAB] text-white py-2 px-4 rounded-md transition"
              >
                アカウントを削除する
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}