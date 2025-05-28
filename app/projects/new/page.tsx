"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { useEffect } from "react"
import ShareModal from "@/components/ShareModal"

export default function CreateProjectPage() {
  const router = useRouter()

  const [projectName, setProjectName] = useState("")
  const [location, setLocation] = useState("")
  const [useDeadline, setUseDeadline] = useState<boolean>(false)
  const [deadlineDate, setDeadlineDate] = useState("")
  const [deadlineTime, setDeadlineTime] = useState("")
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [userId, setUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ name: string; avatar?: string } | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem("userId")
    const profile = localStorage.getItem("userProfile")
    if (id) setUserId(id)
    if (profile) setUserProfile(JSON.parse(profile))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ 必須バリデーション
    if (!projectName.trim()) {
      alert("プロジェクト名を入力してください")
      return
    }

    if (selectedDates.length === 0) {
      alert("スケジュール候補日を1つ以上選択してください")
      return
    }

    const payload = {
      name: projectName,
      location,
      deadline: formatDeadline(),
      dates: selectedDates,
      status: "adjusting",
      user_id: userId,
      user_name: userProfile?.name,
    }

    console.log("🟨 Supabase送信データ:", JSON.stringify(payload, null, 2))

    const { data, error } = await supabase.from("projects").insert([payload]).select().single()

    if (error || !data) {
      alert("保存に失敗しました")
      console.error("🟥 Supabaseエラー詳細:", JSON.stringify(error, null, 2))
    } else {
      setCreatedProjectId(data.id) // ✅ ID保持
      setIsModalOpen(true)         // ✅ モーダル表示
    }
  }

  // 月移動
  const goToPreviousMonth = () => {
    const prev = new Date(currentDate)
    prev.setMonth(prev.getMonth() - 1)
    setCurrentDate(prev)
  }

  const goToNextMonth = () => {
    const next = new Date(currentDate)
    next.setMonth(next.getMonth() + 1)
    setCurrentDate(next)
  }


  // カレンダー生成
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const firstDayOfWeek = firstDay.getDay()

    const days = []

    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: prevMonthLastDay - firstDayOfWeek + i + 1, isCurrentMonth: false })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true })
    }

    return days
  }

  const calendarDays = generateCalendarDays()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  const addDate = (date: string) => {
    if (!selectedDates.includes(date)) {
      setSelectedDates([...selectedDates, date])
    }
  }

  const removeDate = (date: string) => {
    setSelectedDates(selectedDates.filter((d) => d !== date))
  }

  const formatDeadline = () => {
    if (!useDeadline || !deadlineDate) return null
    const time = deadlineTime?.match(/^\d{4}$/)
      ? `${deadlineTime.slice(0, 2)}:${deadlineTime.slice(2)}`
      : deadlineTime || "24:00"

    return `${deadlineDate}T${time}`
  }


  return (
    <div className="min-h-screen bg-[#FFF9F9]">
      {/* トップバー */}
      <header className="bg-[#FFE5E5] shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between relative">

          <div className="flex items-center space-x-3">
            <Link href="/home" className="text-[#4A7856] mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 sm:h-12 w-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

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
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-[#4A7856] mb-6 text-center">新規プロジェクト作成</h1>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">



          <form onSubmit={handleSubmit}>
            {/* プロジェクト名 */}
            <div className="mb-6">
              <label htmlFor="projectName" className="block text-sm font-medium text-[#4A7856] mb-2">
                プロジェクト名
              </label>
              <input
                type="text"
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 py-2 border border-[#D4E9D7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C290]"
                placeholder="プロジェクト名を入力"
              />
            </div>

            {/* 締め切り */}
            <div className="mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useDeadline}
                  onChange={() => setUseDeadline(!useDeadline)}
                />
                <span className="text-sm text-[#4A7856]">回答締め切りを設定する</span>
              </label>
            </div>

            {useDeadline && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#4A7856] mb-2">回答締め切り</label>
                <div className="flex flex-col sm:flex-row sm:space-x-4">
                  {/* 日付入力 */}
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="mb-2 sm:mb-0 px-4 py-2 border border-[#D4E9D7] rounded-md"
                  />
                  {/* 時間入力 */}
                  <input
                    type="text"
                    placeholder="例: 0900 または 09:00"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    className="px-4 py-2 border border-[#D4E9D7] rounded-md"
                  />
                </div>
                <p className="text-xs text-[#666666] mt-1">未入力時は 24:00 に自動設定されます</p>
              </div>
            )}

            {/* 場所 */}
            <div className="mb-6">
              <label htmlFor="location" className="block text-sm font-medium text-[#4A7856] mb-2">
                場所
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border border-[#D4E9D7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C290]"
                placeholder="場所を入力"
              />
            </div>

            {/* スケジュール候補日 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-[#4A7856] mb-3">スケジュール候補日</label>

              {/* カレンダーUI */}
              <div className="bg-[#F8FFF8] rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  {/* ◀ 前月ボタン */}
                  <button type="button" onClick={goToPreviousMonth} className="text-[#4A7856] hover:text-[#90C290] p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* 表示中の年月 */}
                  <div className="font-medium text-[#4A7856]">
                    {year}年{month}月
                  </div>

                  {/* ▶ 次月ボタン */}
                  <button type="button" onClick={goToNextMonth} className="text-[#4A7856] hover:text-[#90C290] p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["日", "月", "火", "水", "木", "金", "土"].map((day, index) => (
                    <div key={index} className="h-8 w-8 flex items-center justify-center text-xs text-[#666666]">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((item, index) => {
                    const dateStr = `${month}/${item.day}`
                    // month を2桁にしたいなら String(month).padStart(2, "0")

                    const isSelected = item.isCurrentMonth && selectedDates.includes(dateStr)
                    const today = new Date()
                    const isToday =
                      item.isCurrentMonth &&
                      item.day === today.getDate() &&
                      currentDate.getMonth() === today.getMonth() &&
                      currentDate.getFullYear() === today.getFullYear()


                    return (
                      <div
                        key={`day-${index}`}
                        className={`h-8 w-8 flex items-center justify-center rounded-full cursor-pointer text-sm
                        ${!item.isCurrentMonth
                            ? "text-gray-300"
                            : isSelected
                              ? "bg-[#E85A71] text-white"
                              : isToday
                                ? "border border-[#90C290] text-[#4A7856]"
                                : "hover:bg-[#FFE5E5] text-[#333333]"
                          }`}
                        onClick={() => item.isCurrentMonth && (isSelected ? removeDate(dateStr) : addDate(dateStr))}
                      >
                        {item.day}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 選択された日付のチップ表示 */}
              <div className="mt-4">
                <p className="text-sm text-[#666666] mb-2">選択された日付:</p>
                <div className="flex flex-wrap gap-3">
                  {selectedDates.length > 0 ? (
                    selectedDates.map((date, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 rounded-full text-sm font-medium bg-[#FFB7C5] text-white flex items-center"
                      >
                        {date}
                        <button type="button" className="ml-2 focus:outline-none" onClick={() => removeDate(date)}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#666666]">日付が選択されていません</p>
                  )}
                </div>
                <p className="mt-2 text-xs text-[#666666]">※ カレンダーから複数選択可能です</p>
              </div>
            </div>

            {/* 作成ボタン */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-[#90C290] hover:bg-[#4A7856] text-white font-medium py-3 px-8 rounded-md transition-colors shadow-sm"
              >
                プロジェクトを作成
              </button>
            </div>
          </form >
        </div >
      </main >


      {/* ✅ モーダルをここに移動 */}
      {
        isModalOpen && createdProjectId && (
          <ShareModal projectId={createdProjectId} onClose={() => setIsModalOpen(false)} />
        )
      }

    </div >
  )
}
