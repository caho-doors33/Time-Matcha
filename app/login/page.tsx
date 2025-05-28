
"use client"

import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

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

    const saved = localStorage.getItem("userProfile")
    if (saved) {
      setSavedProfile(JSON.parse(saved))
    }

    setIsLoading(false) // 読み込み完了
  }, [])

  const handleRegister = () => {
    if (!name.trim() || !avatar.trim()) {
      alert("ユーザー名とアイコン（絵文字）を入力してください")
      return
    }

    const newProfile = { name, avatar }
    localStorage.setItem("userProfile", JSON.stringify(newProfile))
    setSavedProfile(newProfile)
    router.push("/home")
  }

  const handleLogin = () => {
    router.push("/home")
  }

  if (isLoading) {
    return <div className="text-center text-[#4A7856] mt-20">読み込み中...</div>
  }

  return (
    <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        {savedProfile ? (
          <div className="text-center">
            <div className = "flex flex-col gap-3">
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
              onClick={() => {
                const confirmReset = confirm(
                  "別のアカウントを作成すると、これまでのデータ（ニックネーム・絵文字・回答履歴など）はすべて削除されます。本当によろしいですか？"
                )
                if (confirmReset) {
                  localStorage.clear()
                  setSavedProfile(null)
                  setName("")
                  setAvatar("😊")
                }
              }}
              className="bg-[#E85A71] hover:bg-[#FF8FAB] text-white py-2 px-4 rounded-md transition"
            >
              別のアカウントで始める
            </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-medium text-[#4A7856] mb-6 text-center">プロフィールを登録</h2>

            <div className="mb-4">
              <label className="block text-sm text-[#4A7856] mb-1">ユーザー名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：さくら"
                className="w-full px-4 py-2 border border-[#D4E9D7] rounded-md"
              />
            </div>

            <div className="mb-6 relative">
              <label className="block text-sm text-[#4A7856] mb-1">アイコン（絵文字）</label>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setPickerOpen(!pickerOpen)}
                  className="text-2xl px-4 py-2 border rounded-md bg-white shadow-sm"
                >
                  {avatar}
                </button>
                <span className="text-sm text-[#888]">← 絵文字を選んでね！</span>
              </div>

              {pickerOpen && (
                <div className="absolute z-50 mt-2">
                  <Picker
                    onEmojiSelect={(emoji: any) => {
                      setAvatar(emoji.native)
                      setPickerOpen(false)
                    }}
                    title="絵文字を選ぶ"
                    emoji="point_up"
                    theme="light"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleRegister}
              className="w-full bg-[#E85A71] hover:bg-[#FF8FAB] text-white py-2 px-4 rounded-md transition"
            >
              このアカウントで始める
            </button>
          </>
        )}
      </div>
    </div>
  )
}
