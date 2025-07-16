"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import Picker from "@emoji-mart/react"
import data from "@emoji-mart/data"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Header({
    userName,
    userAvatar,
    showBackButton = false,
}: {
    userName: string
    userAvatar?: string
    showBackButton?: boolean
}) {
    const router = useRouter()
    const [menuOpen, setMenuOpen] = useState(false)
    const [pickerOpen, setPickerOpen] = useState(false)
    const [name, setName] = useState("")
    const [avatar, setAvatar] = useState("😊")
    const menuRef = useRef<HTMLDivElement>(null)

    // ✅ 初期値をlocalStorageから取得
    useEffect(() => {
        const profileRaw = localStorage.getItem("userProfile")
        if (profileRaw) {
            const parsed = JSON.parse(profileRaw)
            setName(parsed.name)
            setAvatar(parsed.avatar)
        }
    }, [menuOpen]) // メニュー開くたびに再読み込み

    // ✅ 外クリックでメニューを閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false)
                setPickerOpen(false)
            }
        }
        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        } else {
            document.removeEventListener("mousedown", handleClickOutside)
        }
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [menuOpen])

    const handleSave = async () => {
        localStorage.setItem("userProfile", JSON.stringify({ name, avatar }))
        setMenuOpen(false)

        const userId = localStorage.getItem("userId")
        if (userId) {
            const { error } = await supabase
                .from("answers")
                .update({ name, avatar })
                .eq("user_id", userId)

            if (error) {
                console.error("回答データの更新エラー:", error.message)
                alert("プロフィール保存はできましたが、過去の回答データ更新に失敗しました")
            }
        }

        location.reload()
    }

    return (
        <header className="bg-[#FFE5E5] shadow-sm sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between relative">
                {/* ロゴとタイトル */}
                <div className="flex items-center space-x-3">
                    {showBackButton && (
                        <Link href="/home" className="text-[#4A7856]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                    )}
                    <img src="/logo.png" alt="ロゴ" className="h-14 sm:h-16 w-auto" />
                    <h1 className="text-xl sm:text-2xl font-bold text-[#4A7856] tracking-wide">
                        Time Matcha
                    </h1>
                </div>

                {/* ユーザー情報 */}
                <div className="relative" ref={menuRef}>
                    <div className="flex items-center cursor-pointer" onClick={() => setMenuOpen(!menuOpen)}>
                        <div className="text-right mr-3">
                            <p className="text-sm font-medium text-[#333333]">{userName || "Guest"}</p>
                        </div>
                        <div className="text-3xl sm:text-4xl leading-none">{userAvatar || "🦕"}</div>
                    </div>

                    {/* ▼ 編集メニュー */}
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-72 bg-white border rounded-md shadow-lg z-50 p-4 space-y-5">

                            {/* ① タイトル */}
                            <div>
                                <label className="block text-base font-semibold text-[#4A7856]">
                                    Edit Profile
                                </label>
                            </div>

                            {/* ② アイコン + 入力欄 */}
                            <div className="flex items-center space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setPickerOpen(!pickerOpen)}
                                    className="text-5xl bg-transparent hover:scale-110 transition-transform"
                                    aria-label="アイコンを選ぶ"
                                >
                                    {avatar}
                                </button>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Name"
                                    className="w-full border-0 border-b border-gray-300 focus:border-gray-600 focus:ring-0 text-[#333] placeholder-gray-400 bg-transparent"
                                />
                            </div>

                            {/* ③ ピッカー（オプション） */}
                            {pickerOpen && (
                                <div>
                                    <Picker
                                        data={data}
                                        onEmojiSelect={(emoji: any) => {
                                            setAvatar(emoji.native)
                                            setPickerOpen(false)
                                        }}
                                        theme="light"
                                    />
                                </div>
                            )}

                            {/* ④ 保存ボタン */}
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSave}
                                    className="bg-[#90C290] hover:bg-[#4A7856] text-white px-3 py-1 rounded transition"
                                >
                                    Save
                                </button>
                            </div>

                        </div>
                    )}

                </div>
            </div>
        </header>
    )
}
