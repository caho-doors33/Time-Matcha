// components/Header.tsx
"use client"

import Link from "next/link"

export default function Header({
    userName,
    userAvatar,
    showBackButton = false, // ← デフォルトで「戻るボタンなし」
}: {
    userName: string
    userAvatar?: string
    showBackButton?: boolean
}) {
    return (
        <header className="bg-[#FFE5E5] shadow-sm sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between relative">
                {/* 左：ロゴとテキスト */}
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

                {/* 右：ユーザー情報 */}
                <div className="flex items-center">
                    <div className="text-right mr-3">
                        <p className="text-sm font-medium text-[#333333]">{userName || "ゲスト"}</p>
                    </div>
                    <div className="text-3xl sm:text-4xl leading-none">
                        {userAvatar || "🙂"}
                    </div>
                </div>
            </div>
        </header>
    )
}
