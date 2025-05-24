"use client"

import { Logo } from "@/components/logo"
import { useParams } from "next/navigation"
import { useState } from "react"
import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function ProjectPage() {
  const params = useParams() as { id: string }
  const projectId = params.id

  const [fullDaySelection, setFullDaySelection] = useState<{ [date: string]: string }>({})
  const [availableBlocks, setAvailableBlocks] = useState<{ [date: string]: string[] }>({})
  const [unavailableBlocks, setUnavailableBlocks] = useState<{ [date: string]: string[] }>({})
  const [undecidedBlocks, setUndecidedBlocks] = useState<{ [date: string]: string[] }>({})

  const [selectedMode, setSelectedMode] = useState<"available" | "unavailable" | "undecided">("available");
  const [project, setProject] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single()

      if (error) {
        console.error("プロジェクト取得失敗:", error)
      } else {
        setProject(data)
      }

      setLoading(false)
    }

    fetchProject()
  }, [projectId])

  if (loading) return <div>読み込み中...</div>
  if (!project) return <div>プロジェクトが見つかりません</div>

  const timeSlots = Array.from({ length: 25 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9
    const minute = i % 2 === 0 ? "00" : "30"
    return `${hour}:${minute}`
  })

  const handleFullDayChange = (date: string, mode: string) => {
    setFullDaySelection((prev) => ({ ...prev, [date]: mode }))

    if (mode === "available") {
      setAvailableBlocks((prev) => ({ ...prev, [date]: timeSlots }))
      setUnavailableBlocks((prev) => ({ ...prev, [date]: [] }))
      setUndecidedBlocks((prev) => ({ ...prev, [date]: [] }))
    } else if (mode === "unavailable") {
      setUnavailableBlocks((prev) => ({ ...prev, [date]: timeSlots }))
      setAvailableBlocks((prev) => ({ ...prev, [date]: [] }))
      setUndecidedBlocks((prev) => ({ ...prev, [date]: [] }))
    } else if (mode === "undecided") {
      setUndecidedBlocks((prev) => ({ ...prev, [date]: timeSlots }))
      setAvailableBlocks((prev) => ({ ...prev, [date]: [] }))
      setUnavailableBlocks((prev) => ({ ...prev, [date]: [] }))
    }
  }

  const getBlockStatus = (date: string, time: string): string => {
    if (availableBlocks[date]?.includes(time)) return "available"
    if (unavailableBlocks[date]?.includes(time)) return "unavailable"
    if (undecidedBlocks[date]?.includes(time)) return "undecided"
    return "none"
  }

  const handleTimeClick = (date: string, time: string) => {
    const isAlreadySelected =
      (selectedMode === "available" && availableBlocks[date]?.includes(time)) ||
      (selectedMode === "unavailable" && unavailableBlocks[date]?.includes(time)) ||
      (selectedMode === "undecided" && undecidedBlocks[date]?.includes(time));

    if (isAlreadySelected) {
      // 🔄 選択を解除（none）
      if (selectedMode === "available") {
        setAvailableBlocks((prev) => ({
          ...prev,
          [date]: prev[date]?.filter((t) => t !== time) || [],
        }));
      } else if (selectedMode === "unavailable") {
        setUnavailableBlocks((prev) => ({
          ...prev,
          [date]: prev[date]?.filter((t) => t !== time) || [],
        }));
      } else if (selectedMode === "undecided") {
        setUndecidedBlocks((prev) => ({
          ...prev,
          [date]: prev[date]?.filter((t) => t !== time) || [],
        }));
      }
    } else {
      // 🆕 選択されたモードに追加し、他の状態からは除外
      if (selectedMode === "available") {
        setAvailableBlocks((prev) => ({
          ...prev,
          [date]: [...(prev[date] || []), time],
        }));
        setUnavailableBlocks((prev) => ({
          ...prev,
          [date]: prev[date]?.filter((t) => t !== time) || [],
        }));
        setUndecidedBlocks((prev) => ({
          ...prev,
          [date]: prev[date]?.filter((t) => t !== time) || [],
        }));
      } else if (selectedMode === "unavailable") {
        setUnavailableBlocks((prev) => ({
          ...prev,
          [date]: [...(prev[date] || []), time],
        }));
        setAvailableBlocks((prev) => ({
          ...prev,
          [date]: prev[date]?.filter((t) => t !== time) || [],
        }));
        setUndecidedBlocks((prev) => ({
          ...prev,
          [date]: prev[date]?.filter((t) => t !== time) || [],
        }));
      } else if (selectedMode === "undecided") {
        setUndecidedBlocks((prev) => ({
          ...prev,
          [date]: [...(prev[date] || []), time],
        }));
        setAvailableBlocks((prev) => ({
          ...prev,
          [date]: prev[date]?.filter((t) => t !== time) || [],
        }));
        setUnavailableBlocks((prev) => ({
          ...prev,
          [date]: prev[date]?.filter((t) => t !== time) || [],
        }));
      }
    }
  }


  return (
    <div className="min-h-screen bg-[#F8FFF8]">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <a href="/home" className="text-[#4A7856] mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <Logo />
          </div>
          <div className="flex items-center">
            <div className="text-sm text-[#666666] mr-4">最終更新: 2025年5月1日</div>
            <button className="text-sm bg-[#D4E9D7] hover:bg-[#90C290] text-[#4A7856] py-1.5 px-3 rounded-md transition-colors">
              保存
            </button>
          </div>
        </div>
      </header>

      <div className="flex justify-center gap-2 mt-4">
        {["available", "unavailable", "undecided"].map((mode) => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode as typeof selectedMode)}
            className={`text-sm px-3 py-1 rounded-md border transition-colors ${selectedMode === mode
              ? "bg-[#4A7856] text-white"
              : "bg-white text-[#4A7856] border-[#4A7856]"
              }`}
          >
            {mode === "available" && "出席可能"}
            {mode === "unavailable" && "出席不可"}
            {mode === "undecided" && "未定"}
          </button>
        ))}
      </div>


      {/* プロジェクト情報 */}
      <div className="bg-white border-b border-[#D4E9D7]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-[#4A7856]">{project.name}</h1>
          <p className="text-sm text-[#666666] mt-1">
            以下の日程から、参加可能な時間帯を選択してください。複数選択可能です。
          </p>
        </div>
      </div>

      {/* スケジュールグリッド */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="overflow-x-auto pb-6">
          <div className="min-w-[768px]">
            {/* 日付ヘッダー */}
            <div className="flex mb-2">
              <div className="w-20 flex-shrink-0"></div>
              {(project?.dates as string[])?.map((date) => (
                <div key={date} className="flex-1 px-1">
                  <div className="flex flex-col items-center">
                    <div className="bg-[#FFE5E5] text-[#E85A71] text-center py-2 rounded-t-lg font-medium w-full">
                      {date}
                    </div>
                    <select
                      className="mt-1 text-xs border border-[#E85A71] text-[#E85A71] rounded px-1 py-0.5"
                      value={fullDaySelection[date] || ""}
                      onChange={(e) => handleFullDayChange(date, e.target.value)}
                    >
                      <option value="">終日選択</option>
                      <option value="available">終日OK</option>
                      <option value="unavailable">終日不可</option>
                      <option value="undecided">終日未定</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* 時間グリッド */}
            <div className="flex">
              {/* 時間ラベル */}
              <div className="w-20 flex-shrink-0">
                {timeSlots.map((time, index) => (
                  <div
                    key={time}
                    className={`h-10 flex items-center justify-end pr-2 text-xs text-[#666666] ${index % 2 === 0 ? "font-medium" : ""
                      }`}
                  >
                    {time}
                  </div>
                ))}
              </div>

              {/* 日付ごとのブロック */}
              {(project?.dates as string[])?.map((date) => (
                <div key={date} className="flex-1 px-1">

                  <div className="bg-white rounded-b-lg shadow-sm">
                    {timeSlots.map((time, index) => {
                      const isLastItem = index === timeSlots.length - 1
                      const status = getBlockStatus(date, time)
                      const backgroundClass =
                        status === "available"
                          ? "bg-[#FFE5E5]"
                          : status === "unavailable"
                            ? "bg-[#E0E0E0]"
                            : status === "undecided"
                              ? "bg-[#FFFACD]"
                              : "bg-white"

                      return (
                        <div
                          key={`${date}-${time}`}
                          onClick={() => handleTimeClick(date, time)}
                          className={`h-10 border-b border-[#F0F0F0] ${isLastItem ? "border-b-0" : ""
                            } hover:bg-[#FFF0F3] transition-colors cursor-pointer relative ${backgroundClass}`}
                        >
                          {status === "available" && (
                            <div className="absolute inset-y-0 left-0 w-1 bg-[#E85A71]"></div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <button className="bg-[#FFE5E5] hover:bg-[#FF8FAB] text-[#E85A71] hover:text-white font-medium py-2 px-6 rounded-md transition-colors flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            日付を追加
          </button>
          <button className="bg-[#90C290] hover:bg-[#4A7856] text-white font-medium py-2 px-6 rounded-md transition-colors flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            メンバーの空き状況を確認
          </button>
        </div>
      </main>
    </div>
  )
}
