"use client"

import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useParams } from 'next/navigation'


type UserProfile = {
  name: string
  avatar: string
}

export default function LoginPage() {
  const [name, setName] = useState("")
  const [avatar, setAvatar] = useState("😊")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [savedProfile, setSavedProfile] = useState<UserProfile | null>(null)
  const router = useRouter()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const params = useParams()
  const projectId = params?.id // URLが /project/[id] のとき

  // userId の保存（初回のみ）
  useEffect(() => {
    if (!localStorage.getItem("userId")) {
      const newId = uuidv4()
      localStorage.setItem("userId", newId)
    }

    // プロフィールが既にある場合は表示用に読み込み
    const saved = localStorage.getItem("userProfile")
    if (saved) {
      setSavedProfile(JSON.parse(saved))
    }
  }, [])

  // 新規登録時の保存処理
  const handleRegister = () => {
    if (!name.trim() || !avatar.trim()) {
      alert("ユーザー名とアイコン（絵文字）を入力してください")
      return
    }

    const newProfile = { name, avatar }
    localStorage.setItem("userProfile", JSON.stringify({ name, avatar }))
    setSavedProfile(newProfile)
    alert("プロフィールを保存しました！")
    router.push('/home')// TODO: プロジェクト一覧に遷移してもOK
  }

  // ログイン処理（再利用）
  const handleLogin = () => {
    alert("このアカウントでログインします！")
    router.push('/home')// TODO: プロジェクト一覧ページなどに遷移
  }

  const handleSave = async () => {
    const userId = localStorage.getItem("userId")
    const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}")
    const availability = {
      "5/8": ["10:00", "10:30"],
      "5/15": ["11:00"]
    }

    const { error } = await supabase
      .from("answers")
      .upsert(
        [
          {
            project_id: projectId,
            user_id: userId,
          }
        ],
        {
          onConflict: 'project_id, user_id' // ← ✅ ここを文字列に！
        }
      )


    if (error) {
      console.error("保存エラー:", error.message)
      alert("保存に失敗しました")
    } else {
      alert("保存完了！")
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        {savedProfile ? (
          <div className="text-center">
            <p className="text-lg mb-4">
              {savedProfile.avatar} <span className="font-bold">{savedProfile.name}</span> さん、ようこそ！
            </p>
            <button
              onClick={handleLogin}
              className="bg-[#90C290] hover:bg-[#4A7856] text-white px-4 py-2 rounded transition"
            >
              このアカウントで続ける
            </button>
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
