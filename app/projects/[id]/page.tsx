"use client"

// コンポーネント・フックのインポート
import { Logo } from "@/components/logo"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useMemo } from "react"
import Link from "next/link"

export default function ProjectPage() {
  // ルーターとパラメータの取得
  const params = useParams() as { id: string }
  const projectId = params.id
  const router = useRouter()

  // 状態管理：プロジェクト情報やブロック選択状況
  const [project, setProject] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [fullDaySelection, setFullDaySelection] = useState<{ [date: string]: string }>({})
  const [availableBlocks, setAvailableBlocks] = useState<{ [date: string]: string[] }>({})
  const [unavailableBlocks, setUnavailableBlocks] = useState<{ [date: string]: string[] }>({})
  const [undecidedBlocks, setUndecidedBlocks] = useState<{ [date: string]: string[] }>({})
  const [isDragging, setIsDragging] = useState(false)
  const [dragStatus, setDragStatus] = useState<"available" | "unavailable" | "undecided" | "none" | null>(null)
  const [dragTarget, setDragTarget] = useState<{ date: string, time: string } | null>(null)
  const [currentDragStatus, setCurrentDragStatus] = useState<"available" | "unavailable" | "undecided" | "none">("available")
  const [userProfile, setUserProfile] = useState<{ name: string; avatar?: string } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // 時間スロット生成（30分刻み）
  function generateTimeSlots(start: string, end: string): string[] {
    const slots: string[] = []
    let [hour, minute] = start.split(":").map(Number)
    const [endHour, endMinute] = end.split(":").map(Number)

    while (hour < endHour || (hour === endHour && minute < endMinute)) {
      slots.push(`${hour}:${minute.toString().padStart(2, "0")}`)

      minute += 30
      if (minute >= 60) {
        minute = 0
        hour += 1
      }
    }

    return slots
  }




  // プロジェクト情報および回答取得
  useEffect(() => {
    const fetchData = async () => {
      // プロジェクト取得


      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single()

      if (projectError) {
        console.error("プロジェクト取得失敗:", projectError)
        setLoading(false)
        return
      }

      setProject(projectData)

      // ローカルストレージからユーザー取得
      const userId = localStorage.getItem("userId")
      if (!userId) {
        setLoading(false)
        return
      }



      // 回答データ取得
      const { data: answerData, error: answerError } = await supabase
        .from("answers")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .single()

      if (answerError) {
        console.warn("回答なし、または取得失敗:", answerError.message)
      }

      // 回答データをステートに反映
      if (answerData?.availability) {
        const availability = answerData.availability
        const available: { [date: string]: string[] } = {}
        const unavailable: { [date: string]: string[] } = {}
        const undecided: { [date: string]: string[] } = {}

        for (const date in availability) {
          available[date] = availability[date].available || []
          unavailable[date] = availability[date].unavailable || []
          undecided[date] = availability[date].undecided || []
        }

        setAvailableBlocks(available)
        setUnavailableBlocks(unavailable)
        setUndecidedBlocks(undecided)
      }

      setLoading(false)
    }

    fetchData()
  }, [projectId])

  useEffect(() => {
    const profileRaw = localStorage.getItem("userProfile")
    if (!profileRaw) {
      const currentPath = window.location.pathname
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
      return
    }

    const parsed = JSON.parse(profileRaw)
    setUserProfile(parsed)
  }, [router])



  // 指定された時間ブロックのステータス取得
  const getBlockStatus = (date: string, time: string): string => {
    if (availableBlocks[date]?.includes(time)) return "available"
    if (unavailableBlocks[date]?.includes(time)) return "unavailable"
    if (undecidedBlocks[date]?.includes(time)) return "undecided"
    return "none"
  }

  const timeBlockClass = "h-12 sm:h-14 flex items-center justify-end pr-2 font-semibold text-[#4A7856] text-sm sm:text-base bg-[#F7F7F7] border-b border-gray-200"

  // セルのクリックによるステータス切り替え
  const handleTimeClick = (date: string, time: string) => {
    const currentStatus = getBlockStatus(date, time)

    // 現在の状態を全てクリア
    setAvailableBlocks((prev) => ({ ...prev, [date]: (prev[date] || []).filter((t) => t !== time) }))
    setUnavailableBlocks((prev) => ({ ...prev, [date]: (prev[date] || []).filter((t) => t !== time) }))
    setUndecidedBlocks((prev) => ({ ...prev, [date]: (prev[date] || []).filter((t) => t !== time) }))

    // 次の状態を追加
    if (currentStatus === "none") {
      setAvailableBlocks((prev) => ({ ...prev, [date]: [...(prev[date] || []), time] }))
    } else if (currentStatus === "available") {
      setUnavailableBlocks((prev) => ({ ...prev, [date]: [...(prev[date] || []), time] }))
    } else if (currentStatus === "unavailable") {
      setUndecidedBlocks((prev) => ({ ...prev, [date]: [...(prev[date] || []), time] }))
    }
    // undecided の場合は none に戻す（何もしない）
  }

  // ステータスのループ（none → available → unavailable → undecided → none）
  const nextStatus = (current: string): "available" | "unavailable" | "undecided" | "none" => {
    if (current === "none") return "available"
    if (current === "available") return "unavailable"
    if (current === "unavailable") return "undecided"
    return "none" // undecided の次は none に戻る
  }

  const cycleBlockStatus = (date: string, time: string) => {
    const currentStatus = getBlockStatus(date, time)
    let next: "available" | "unavailable" | "undecided" | "none" = "available"

    if (currentStatus === "none") next = "available"
    else if (currentStatus === "available") next = "unavailable"
    else if (currentStatus === "unavailable") next = "undecided"
    else if (currentStatus === "undecided") next = "none"

    if (next !== "none") {
      setCurrentDragStatus(next) // ドラッグ操作用ステータスに記録
    }

    applyStatus(date, time, next)
  }




  // セルにステータスを適用
  const applyStatus = (date: string, time: string, status: string | null) => {
    const remove = (arr: string[]) => arr.filter((t) => t !== time)
    const add = (arr: string[]) => [...new Set([...arr, time])]

    if (status === "available") {
      setAvailableBlocks((prev) => ({ ...prev, [date]: add(prev[date] || []) }))
      setUnavailableBlocks((prev) => ({ ...prev, [date]: remove(prev[date] || []) }))
      setUndecidedBlocks((prev) => ({ ...prev, [date]: remove(prev[date] || []) }))
    } else if (status === "unavailable") {
      setUnavailableBlocks((prev) => ({ ...prev, [date]: add(prev[date] || []) }))
      setAvailableBlocks((prev) => ({ ...prev, [date]: remove(prev[date] || []) }))
      setUndecidedBlocks((prev) => ({ ...prev, [date]: remove(prev[date] || []) }))
    } else if (status === "undecided") {
      setUndecidedBlocks((prev) => ({ ...prev, [date]: add(prev[date] || []) }))
      setAvailableBlocks((prev) => ({ ...prev, [date]: remove(prev[date] || []) }))
      setUnavailableBlocks((prev) => ({ ...prev, [date]: remove(prev[date] || []) }))
    } else {
      // none: 全て削除
      setAvailableBlocks((prev) => ({ ...prev, [date]: remove(prev[date] || []) }))
      setUnavailableBlocks((prev) => ({ ...prev, [date]: remove(prev[date] || []) }))
      setUndecidedBlocks((prev) => ({ ...prev, [date]: remove(prev[date] || []) }))
    }
  }
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, date: string, time: string) => {
    e.preventDefault()
    const currentStatus = getBlockStatus(date, time)
    const next = nextStatus(currentStatus)
    setIsDragging(true)
    setDragStatus(next)
    applyStatus(date, time, next)
  }

  const handleDragOver = (e: React.MouseEvent | React.TouchEvent, date: string, time: string) => {
    e.preventDefault()
    if (!isDragging || dragStatus === null) return
    applyStatus(date, time, dragStatus)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setDragStatus(null)
  }

  // プロジェクト情報に基づき時間スロットを生成（useMemoで最適化）
  const timeSlots = useMemo(() => {
    if (!project || !project.start_time || !project.end_time) return []
    return generateTimeSlots(project.start_time, project.end_time)
  }, [project])

  // 「全日」チェックボックスの変更時のロジック
  const handleFullDayChange = (date: string, mode: string) => {
    setFullDaySelection((prev) => ({ ...prev, [date]: mode }))
    const allTimes = mode === "available" ? setAvailableBlocks : mode === "unavailable" ? setUnavailableBlocks : setUndecidedBlocks
    allTimes((prev) => ({ ...prev, [date]: timeSlots }))
    if (mode !== "available") setAvailableBlocks((prev) => ({ ...prev, [date]: [] }))
    if (mode !== "unavailable") setUnavailableBlocks((prev) => ({ ...prev, [date]: [] }))
    if (mode !== "undecided") setUndecidedBlocks((prev) => ({ ...prev, [date]: [] }))
  }

  // 回答の保存処理
  const handleSave = async () => {
    const userId = localStorage.getItem("userId")
    if (!userId || !project) return alert("ユーザーまたはプロジェクトが見つかりません")

    const availability: { [date: string]: { available: string[], unavailable: string[], undecided: string[] } } = {}

    for (const date of project.dates) {
      availability[date] = {
        available: availableBlocks[date] || [],
        unavailable: unavailableBlocks[date] || [],
        undecided: undecidedBlocks[date] || []
      }
    }

    const { error } = await supabase.from("answers").upsert([
      { project_id: projectId, user_id: userId, availability }
    ], { onConflict: "project_id, user_id" })

    if (error) {
      console.error("保存エラー:", error.message)
      alert("保存に失敗しました")
    } else {
      alert("保存しました！")
      router.push("/home")
    }
  }

  // ローディング中の表示
  if (loading || !project) return <div>読み込み中...</div>

  // 表示部分のUI構成
  return (
    <div className="min-h-screen bg-[#F8FFF8] flex flex-col">
      {/* ヘッダー：戻るボタンとロゴ、保存ボタン */}
      <header className="bg-[#FFE5E5] shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <Link href="/home" className="text-[#4A7856]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <img src="/logo.png" alt="ロゴ" className="h-10 w-auto" />
            <h1 className="text-lg font-bold text-[#4A7856] tracking-wide truncate">
              Time Matcha
            </h1>
          </div>

          {/* ユーザー情報 */}
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-sm font-medium text-[#333333] truncate">{userProfile?.name || "ゲスト"}</p>
              <p className="text-xs text-[#666666]">ログイン中</p>
            </div>
            <div className="text-2xl leading-none">
              {userProfile?.avatar || "🙂"}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto max-w-full px-2 sm:px-4 py-4">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-0 w-full">
            {/* 説明と入力モードボタン */}
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[#333333] mb-1">
                入力モードを選んで、参加可能な時間帯をドラッグで塗りましょう。
              </h2>
              <p className="text-xs text-gray-600 mb-2">
                下のボタンで入力モードを切り替えてから、時間帯のマスを指やマウスでなぞってください。
              </p>
              <div className="grid grid-cols-2 sm:flex flex-wrap justify-center gap-2">
                {['available', 'unavailable', 'undecided', 'none'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setCurrentDragStatus(mode as any)}
                    className={`text-xs px-3 py-1 rounded-full border shadow-sm font-medium transition
        ${currentDragStatus === mode
                        ? "bg-[#4A7856] text-white border-[#4A7856]"
                        : "bg-white text-[#4A7856] border-[#4A7856] hover:bg-[#f0f8f4]"}`}
                  >
                    {mode === "available" && "✅ 参加できる"}
                    {mode === "unavailable" && "❌ 参加できない"}
                    {mode === "undecided" && "❓ わからない"}
                    {mode === "none" && "🚫 入力しない"}
                  </button>
                ))}
              </div>

            </div>

            {/* スケジュール入力エリア */}
            <div className="overflow-x-auto">
              <div className="flex text-xs">
                <div className="w-14 flex-shrink-0"></div>
                {project.dates.map((date: string) => (
                  <div key={date} className="flex-1 px-0.5">
                    <div className="flex flex-col items-center">
                      <div className="bg-[#FFE5E5] text-[#E85A71] text-center py-1 rounded-t font-medium w-full text-xs">{date}</div>
                      <div className="flex gap-0.5 mt-1">
                        {["available", "unavailable", "undecided"].map((status) => {
                          const isSelected = fullDaySelection[date] === status
                          const label = status === "available" ? "◯" : status === "unavailable" ? "×" : "△"
                          const bgColor = status === "available" ? "bg-[#90C290]" : status === "unavailable" ? "bg-[#F3B3B3]" : "bg-[#FFFACD]"
                          const textColor = status !== "undecided" ? "text-white" : "text-[#666666]"
                          return (
                            <button
                              key={status}
                              onClick={() => handleFullDayChange(date, isSelected ? "" : status)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm font-bold rounded-full flex items-center justify-center border border-[#CCC] ${isSelected ? bgColor : "bg-white"} ${isSelected ? textColor : "text-[#999]"}`}
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex">
                <div className="w-14 flex-shrink-0">
                  {timeSlots.map((time) => (
                    <div key={time} className="h-8 flex items-center justify-end pr-1 text-[11px] text-[#4A7856]">
                      {time}
                    </div>
                  ))}
                </div>
                {project.dates.map((date: string) => (
                  <div key={date} className="flex-1 px-0.5">
                    <div className="bg-white rounded-b shadow-sm">
                      {timeSlots.map((time) => {
                        const status = getBlockStatus(date, time)
                        const backgroundClass = status === "available" ? "bg-[#90C290] text-white" : status === "unavailable" ? "bg-[#F3B3B3] text-white" : status === "undecided" ? "bg-[#FFFACD] text-[#666666]" : "bg-white"
                        return (
                          <div
                            key={`${date}-${time}`}
                            data-date={date}
                            data-time={time}
                            className={`h-8 border-b border-[#F0F0F0] flex items-center justify-start pl-1 text-[10px] ${backgroundClass}`}
                            onMouseDown={(e) => {
                              if ((e.target as HTMLElement).tagName === "BUTTON") return
                              if (!currentDragStatus) return
                              setIsDragging(true)
                              applyStatus(date, time, currentDragStatus)
                            }}
                            onMouseEnter={() => {
                              if (!isDragging || !currentDragStatus) return
                              applyStatus(date, time, currentDragStatus)
                            }}
                            onMouseUp={() => setIsDragging(false)}
                            onTouchStart={() => {
                              if (!currentDragStatus) return
                              setIsDragging(true)
                              applyStatus(date, time, currentDragStatus)
                            }}
                            onTouchMove={(e) => {
                              const target = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY) as HTMLElement
                              if (!isDragging || !currentDragStatus) return
                              if (target?.dataset?.date && target?.dataset?.time) {
                                applyStatus(target.dataset.date, target.dataset.time, currentDragStatus)
                              }
                            }}
                            onTouchEnd={() => setIsDragging(false)}
                          ></div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* フッター：保存とダッシュボードボタン */}
      <div className="sticky bottom-0 z-50 bg-white border-t border-gray-200 py-2 px-2 flex flex-col sm:flex-row justify-center items-center gap-2">
        <Link
          href={`/dashboard/${projectId}`}
          className="w-full sm:w-auto text-sm sm:text-base font-semibold bg-white hover:bg-[#f0f8f4] text-[#4A7856] border border-[#4A7856] py-2 px-4 rounded-xl transition-colors text-center"
        >
          📊 ダッシュボードを見る
        </Link>
        <button
          onClick={handleSave}
          className="w-full sm:w-auto text-sm sm:text-base font-semibold bg-[#4A7856] hover:bg-[#90C290] text-white py-2 px-4 rounded-xl transition-colors"
        >
          ✅ 保存する
        </button>
      </div>
    </div>
  );

}
