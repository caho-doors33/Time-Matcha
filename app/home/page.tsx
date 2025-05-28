"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

import { Logo } from "@/components/logo"
import Link from "next/link"

import { deleteProjectById } from "@/lib/api"

export default function HomePage() {
  const [projects, setProjects] = useState<any[]>([])
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [userProfile, setUserProfile] = useState<{ name: string; avatar: string } | null>(null)

  useEffect(() => {
    const profile = localStorage.getItem("userProfile")
    if (profile) setUserProfile(JSON.parse(profile))
  }, [])

  useEffect(() => {
    const fetchProjects = async () => {
      const userId = localStorage.getItem("userId")
      if (!userId) return

      // 自分が作成したプロジェクト
      const { data: createdProjects, error: createdError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)

      // 自分が回答したプロジェクトのIDリストを取得
      const { data: answered, error: answerError } = await supabase
        .from("answers")
        .select("project_id")
        .eq("user_id", userId)

      if (createdError || answerError) {
        console.error("取得エラー:", createdError || answerError)
        return
      }

      const answeredIds = answered?.map((a) => a.project_id) || []

      // 回答したプロジェクトの詳細を取得
      const { data: answeredProjects, error: answeredDetailError } = await supabase
        .from("projects")
        .select("*")
        .in("id", answeredIds)

      if (answeredDetailError) {
        console.error("回答済みプロジェクト取得エラー:", answeredDetailError)
        return
      }

      // 重複を排除して結合
      const combined = [...(createdProjects || []), ...(answeredProjects || [])]
      const uniqueProjects = Array.from(new Map(combined.map(p => [p.id, p])).values())

      // 並び替え
      const sorted = uniqueProjects.sort((a, b) => {
        const aTime = new Date(a.created_at).getTime()
        const bTime = new Date(b.created_at).getTime()
        return sortOrder === "newest" ? bTime - aTime : aTime - bTime
      })

      setProjects(sorted)
    }

    fetchProjects()
  }, [sortOrder])

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("このプロジェクトを削除しますか？")
    if (!confirmDelete) return

    try {
      await deleteProjectById(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      alert("削除に失敗しました:" + (err as Error).message)
    }
  }

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const handleCopyLink = async (projectId: string) => {
    const url = `${window.location.origin}/projects/${projectId}`
    await navigator.clipboard.writeText(url)
    setCopiedId(projectId)

    setTimeout(() => setCopiedId(null), 2000) // 2秒で表示を戻す
  }
  return (
    <div className="min-h-screen bg-[#F8FFF8]">
      {/* トップバー */}
      <header className="bg-[#FFE5E5] shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between relative">

          <div className="flex items-center space-x-3">
            {/* ロゴ画像 */}
            <img src="/logo.png" alt="ロゴ" className="h-14 sm:h-16 w-auto" />
            {/* テキストロゴ */}
            <h1 className="text-xl sm:text-2xl font-bold text-[#4A7856] tracking-wide">
              Time Matcha
            </h1>
          </div>


          {/* ユーザー情報 */}
          <div className="flex items-center">
            <div className="text-right mr-3">
              <p className="text-sm font-medium text-[#333333]">{userProfile?.name || "ゲスト"}</p>
              <p className="text-xs text-[#666666]">ログイン中</p>
            </div>
            <div className="text-3xl sm:text-4xl leading-none">
              {userProfile?.avatar || "🙂"}
            </div>
          </div>
        </div>
      </header>


      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-[#4A7856]">プロジェクト一覧</h2>
            <button
              className="text-xs text-[#4A7856] bg-[#D4E9D7] hover:bg-[#90C290] py-1 px-2 rounded"
              onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
            >
              並び順: {sortOrder === "newest" ? "新しい順" : "古い順"}
            </button>
          </div>
          <p className="text-sm text-[#666666]">合計: {projects.length}件</p>
        </div>

        {/* プロジェクトリスト */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border-l-4 border-[#FFB7C5]"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-[#333333]">{project.name}</h3>
                <div className="flex space-x-2">
                  <Link href={`/projects/${project.id}`}>
                    <button className="text-xs bg-[#D4E9D7] hover:bg-[#90C290] text-[#4A7856] hover:text-white py-1 px-2 rounded transition-colors">
                      ✒️回答
                    </button>
                  </Link>
                  <button
                    className="text-xs bg-[#FFE5E5] hover:bg-[#FF8FAB] text-[#E85A71] hover:text-white py-1 px-2 rounded transition-colors"
                    onClick={() => handleDelete(project.id)}
                  >
                    削除
                  </button>
                  <button
                    onClick={() => handleCopyLink(project.id)}
                    className="text-xs bg-[#FFF6E5] hover:bg-[#FFD580] text-[#AA8833] hover:text-white py-1 px-2 rounded transition-colors"
                  >
                    {copiedId === project.id ? "コピー済み" : "🔗共有"}
                  </button>
                </div>

              </div>

              <div className="flex items-center mb-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-2 ${project.status === "adjusting" ? "bg-[#FF8FAB]" : "bg-[#90C290]"}`}
                ></span>
                <span className="text-xs text-[#666666]">
                  {project.status === "adjusting" ? "予定調整中" : "予定確定済み"}
                </span>
              </div>

              <p className="text-xs text-[#666666]">
                作成日: {new Date(project.created_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-[#666666] mt-1">
                作成者: {project.user_name || "不明"}
              </p>
            </div>
          ))}
        </div>

        {/* 新規プロジェクト作成ボタン */}
        <div className="fixed bottom-6 right-6">
          <Link href="/projects/new">
            <button className="bg-[#E85A71] hover:bg-[#FF8FAB] text-white h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-colors">
              <span className="text-2xl">+</span>
            </button>
          </Link>
        </div>
      </main>
    </div>
  )
}