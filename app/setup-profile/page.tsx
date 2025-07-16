"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Picker from "@emoji-mart/react"
import data from "@emoji-mart/data"

export default function SetupProfilePage() {
    const [name, setName] = useState("")
    const [avatar, setAvatar] = useState("🦕")
    const [pickerOpen, setPickerOpen] = useState(false)
    const router = useRouter()

    const handleSubmit = () => {
        if (!name.trim()) {
            alert("名前を入力してください")
            return
        }
        const profile = { name, avatar }
        localStorage.setItem("userProfile", JSON.stringify(profile))
        router.push("/home")
    }

    return (
        <div className="min-h-screen bg-[#FFF9F9] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
                <h2 className="text-2xl font-bold text-center text-[#4A7856]">プロフィール登録</h2>
                <div className="mb-6">
                    <div className="flex items-center space-x-4">
                        {/* 絵文字ボタン */}
                        <button
                            type="button"
                            onClick={() => setPickerOpen(!pickerOpen)}
                            className="text-5xl bg-transparent hover:scale-110 transition-transform"
                            aria-label="アイコンを選ぶ"
                        >
                            {avatar}
                        </button>

                        {/* 入力欄 */}
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Name"
                            className="w-full border-0 border-b border-gray-300 focus:border-gray-600 focus:ring-0 text-[#333] placeholder-gray-400 transition-all duration-200 bg-transparent"
                        />

                    </div>

                    {/* 絵文字ピッカー */}
                    {pickerOpen && (
                        <div className="mt-2">
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
                </div>



                {/* 登録ボタン */}
                <button
                    onClick={handleSubmit}
                    className="w-full bg-[#E85A71] hover:bg-[#FF8FAB] text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
                    disabled={!name.trim()}
                >
                    登録してはじめる
                </button>
            </div>
        </div>
    )
}
