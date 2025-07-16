"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

import { Logo } from "@/components/logo"
import Link from "next/link"
import Header from "@/components/header"

import { deleteProjectById } from "@/lib/api"
import ConfirmDeleteModal from "@/components/ui/delete_modal"


export default function HomePage() {
  const [projects, setProjects] = useState<any[]>([])
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [userProfile, setUserProfile] = useState<{ name: string; avatar: string } | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

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

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return

    try {
      await deleteProjectById(deleteTargetId)
      setProjects((prev) => prev.filter((p) => p.id !== deleteTargetId))
      setDeleteTargetId(null)
    } catch (err) {
      alert("削除に失敗しました:" + (err as Error).message)
      setDeleteTargetId(null)
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
      <Header userName={userProfile?.name || "ゲスト"} userAvatar={userProfile?.avatar} />

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-2 sm:space-y-0">
          {/* 左側：タイトル＆並び替えボタン */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-[#4A7856]">プロジェクト一覧</h2>
            <button
              className="inline-flex items-center text-xs text-[#4A7856] bg-[#D4E9D7] hover:bg-[#90C290] py-1 px-2 rounded transition-colors"
              onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
            >
              並び順: {sortOrder === "newest" ? "新しい順" : "古い順"}
            </button>
          </div>

          {/* 右側：プロジェクト数 */}
          <p className="text-sm text-[#666666] text-right sm:text-left">
            合計: {projects.length}件
          </p>
        </div>



        {/* プロジェクトリスト */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-start relative hover:shadow-md transition-shadow border-l-4 border-[#FFB7C5]"
            >
              {/* 左：本文エリア */}
              <div className="flex-1 pr-2">
                <h3 className="text-base font-semibold text-[#333333] break-words mb-1">
                  {project.name}
                </h3>

                <div className="flex items-center text-xs text-[#666666] mb-1">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${project.status === "adjusting" ? "bg-[#FF8FAB]" : "bg-[#90C290]"}`}></span>
                  {project.status === "adjusting" ? "予定調整中" : "予定確定済み"}
                </div>

                <p className="text-xs text-[#666666]">作成日: {new Date(project.created_at).toLocaleDateString()}</p>
                <p className="text-xs text-[#666666]">作成者: {project.user_name || "不明"}</p>
                {/* 追加：場所を表示 */}
                {project.location && (
                  <p className="text-xs text-[#666666]">場所: {project.location}</p>
                )}


                {/* 📊 Dashboard ボタン（やさしい緑） */}
                <Link href={`/dashboard/${project.id}`}>
                  <button className="mt-3 w-full text-sm font-semibold bg-[#D4E9D7] hover:bg-[#90C290] text-[#4A7856] py-2 px-4 rounded-md transition">
                    📊 Dashboard
                  </button>
                </Link>
              </div>

              {/* 右上：Delete & Share */}
              <div className="flex flex-col items-end space-y-2 absolute top-3 right-3">
                <button
                  className="text-[10px] bg-[#FFE5E5] hover:bg-[#FF8FAB] text-[#E85A71] hover:text-white py-1 px-2 rounded transition"
                  onClick={() => setDeleteTargetId(project.id)}

                >
                  🗑️ Delete
                </button>
                <button
                  onClick={() => handleCopyLink(project.id)}
                  className="text-[10px] bg-[#FFF6E5] hover:bg-[#FFD580] text-[#AA8833] hover:text-white py-1 px-2 rounded transition"
                >
                  {copiedId === project.id ? "Copied!" : "🔗 Share"}
                </button>
              </div>
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
      <ConfirmDeleteModal
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="このプロジェクトを削除しますか？"
        description="削除すると、このプロジェクトのデータは元に戻せません。本当によろしいですか？"
        confirmText="完全に削除する"
        cancelText="キャンセル"
      />

    </div >
  )
}