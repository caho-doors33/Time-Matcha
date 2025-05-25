// components/ShareModal.tsx
"use client"
import React from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Props = {
    projectId: string
    onClose: () => void
}

export default function ShareModal({ projectId, onClose }: Props) {
    const router = useRouter()
    const url =
        typeof window !== "undefined"
            ? `${window.location.origin}/project/${projectId}`
            : ""

    const [copied, setCopied] = useState(false)
    const handleCopy = async () => {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000) // 2秒後に戻す
    }



    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-md text-center">
                <h2 className="text-xl font-semibold text-[#4A7856] mb-4">プロジェクト作成完了！</h2>
                <p className="text-sm mb-2 text-[#333]">以下のURLを参加者に共有してください：</p>
                <div className="bg-gray-100 rounded px-3 py-2 text-sm break-all mb-4">{url}</div>

                <button
                    className={`${copied ? "bg-[#4A7856]" : "bg-[#90C290] hover:bg-[#4A7856]"
                        } text-white font-medium py-2 px-4 rounded mb-2 transition-colors`}
                    onClick={handleCopy}
                >
                    {copied ? "コピーしました！" : "リンクをコピー"}
                </button>


                <div>
                    <button
                        className="text-sm text-[#4A7856] underline"
                        onClick={() => {
                            onClose()
                            router.push("/home")
                        }}
                    >
                        ホームに戻る
                    </button>
                </div>
            </div>
        </div>
    )
}
