"use client"

import { Logo } from "@/components/logo"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function ProjectPage() {
  const params = useParams() as { id: string }
  const projectId = params.id
  const router = useRouter()

  const [project, setProject] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [fullDaySelection, setFullDaySelection] = useState<{ [date: string]: string }>({})
  const [availableBlocks, setAvailableBlocks] = useState<{ [date: string]: string[] }>({})
  const [unavailableBlocks, setUnavailableBlocks] = useState<{ [date: string]: string[] }>({})
  const [undecidedBlocks, setUndecidedBlocks] = useState<{ [date: string]: string[] }>({})
  const [selectedMode, setSelectedMode] = useState<"available" | "unavailable" | "undecided">("available")

  const timeSlots = Array.from({ length: 25 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9
    const minute = i % 2 === 0 ? "00" : "30"
    return `${hour}:${minute}`
  })

  useEffect(() => {
    const fetchData = async () => {
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

      const userId = localStorage.getItem("userId")
      if (!userId) {
        setLoading(false)
        return
      }

      const { data: answerData, error: answerError } = await supabase
        .from("answers")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .single()

      if (answerError) {
        console.warn("回答なし、または取得失敗:", answerError.message)
      }

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

  const getBlockStatus = (date: string, time: string): string => {
    if (availableBlocks[date]?.includes(time)) return "available"
    if (unavailableBlocks[date]?.includes(time)) return "unavailable"
    if (undecidedBlocks[date]?.includes(time)) return "undecided"
    return "none"
  }

  const handleTimeClick = (date: string, time: string) => {
    const updateBlock = (setter: any, target: string[]) => setter((prev: any) => ({
      ...prev,
      [date]: target
    }))

    const remove = (arr: string[]) => arr.filter((t) => t !== time)
    const add = (arr: string[]) => [...arr, time]

    const current = {
      available: availableBlocks[date] || [],
      unavailable: unavailableBlocks[date] || [],
      undecided: undecidedBlocks[date] || []
    }

    const isSelected = current[selectedMode].includes(time)

    if (isSelected) {
      updateBlock(
        selectedMode === "available" ? setAvailableBlocks : selectedMode === "unavailable" ? setUnavailableBlocks : setUndecidedBlocks,
        remove(current[selectedMode])
      )
    } else {
      updateBlock(
        selectedMode === "available" ? setAvailableBlocks : selectedMode === "unavailable" ? setUnavailableBlocks : setUndecidedBlocks,
        add(current[selectedMode])
      )
      setAvailableBlocks((prev) => ({ ...prev, [date]: remove(prev[date] || []) }))
      setUnavailableBlocks((prev) => ({ ...prev, [date]: remove(prev[date] || []) }))
      setUndecidedBlocks((prev) => ({ ...prev, [date]: remove(prev[date] || []) }))
    }
  }

  const handleFullDayChange = (date: string, mode: string) => {
    setFullDaySelection((prev) => ({ ...prev, [date]: mode }))
    const allTimes = mode === "available" ? setAvailableBlocks : mode === "unavailable" ? setUnavailableBlocks : setUndecidedBlocks
    allTimes((prev) => ({ ...prev, [date]: timeSlots }))
    if (mode !== "available") setAvailableBlocks((prev) => ({ ...prev, [date]: [] }))
    if (mode !== "unavailable") setUnavailableBlocks((prev) => ({ ...prev, [date]: [] }))
    if (mode !== "undecided") setUndecidedBlocks((prev) => ({ ...prev, [date]: [] }))
  }

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

  if (loading || !project) return <div>読み込み中...</div>

  return (
    <div className="min-h-screen bg-[#F8FFF8]">
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
          <button onClick={handleSave} className="text-sm bg-[#D4E9D7] hover:bg-[#90C290] text-[#4A7856] py-1.5 px-3 rounded-md transition-colors">
            保存
          </button>
        </div>
      </header>

      <div className="flex justify-center gap-2 mt-4">
        {["available", "unavailable", "undecided"].map((mode) => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode as typeof selectedMode)}
            className={`text-sm px-3 py-1 rounded-md border transition-colors ${selectedMode === mode
              ? "bg-[#4A7856] text-white"
              : "bg-white text-[#4A7856] border-[#4A7856]"}`}
          >
            {mode === "available" && "出席可能"}
            {mode === "unavailable" && "出席不可"}
            {mode === "undecided" && "未定"}
          </button>
        ))}
      </div>

      <div className="bg-white border-b border-[#D4E9D7]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-[#4A7856]">{project.name}</h1>
          <p className="text-sm text-[#666666] mt-1">以下の日程から、参加可能な時間帯を選択してください。複数選択可能です。</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="overflow-x-auto pb-6">
          <div className="min-w-[768px]">
            <div className="flex mb-2">
              <div className="w-20 flex-shrink-0"></div>
              {project.dates.map((date: string) => (
                <div key={date} className="flex-1 px-1">
                  <div className="flex flex-col items-center">
                    <div className="bg-[#FFE5E5] text-[#E85A71] text-center py-2 rounded-t-lg font-medium w-full">{date}</div>
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

            <div className="flex">
              <div className="w-20 flex-shrink-0">
                {timeSlots.map((time, index) => (
                  <div
                    key={time}
                    className={`h-10 flex items-center justify-end pr-2 text-xs text-[#666666] ${index % 2 === 0 ? "font-medium" : ""}`}
                  >
                    {time}
                  </div>
                ))}
              </div>

              {project.dates.map((date: string) => (
                <div key={date} className="flex-1 px-1">
                  <div className="bg-white rounded-b-lg shadow-sm">
                    {timeSlots.map((time, index) => {
                      const isLastItem = index === timeSlots.length - 1
                      const status = getBlockStatus(date, time)
                      const backgroundClass =
                        status === "available" ? "bg-[#FFE5E5]" :
                        status === "unavailable" ? "bg-[#E0E0E0]" :
                        status === "undecided" ? "bg-[#FFFACD]" : "bg-white"

                      return (
                        <div
                          key={`${date}-${time}`}
                          onClick={() => handleTimeClick(date, time)}
                          className={`h-10 border-b border-[#F0F0F0] ${isLastItem ? "border-b-0" : ""} hover:bg-[#FFF0F3] transition-colors cursor-pointer relative ${backgroundClass}`}
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
      </main>
    </div>
  )
}
