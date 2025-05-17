"use client"

import { useState } from "react"
import Link from "next/link"
import { Logo } from "@/components/logo"

export default function CreateProjectPage() {
  // 選択された日付の状態
  const [selectedDates, setSelectedDates] = useState<string[]>(["5/8", "5/15"])

  // 日付を削除する関数
  const removeDate = (date: string) => {
    setSelectedDates(selectedDates.filter((d) => d !== date))
  }

  // 日付を追加する関数
  const addDate = (date: string) => {
    if (!selectedDates.includes(date)) {
      setSelectedDates([...selectedDates, date])
    }
  }

  // 現在の月のカレンダーデータを生成
  const generateCalendarDays = () => {
    // 簡易的なカレンダーデータ（5月）
    const daysInMonth = 31
    const firstDayOfWeek = 3 // 水曜日から始まる（0が日曜）

    const days = []

    // 前月の日を埋める
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: 30 - firstDayOfWeek + i + 1, isCurrentMonth: false })
    }

    // 当月の日を埋める
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true })
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  return (
    <div className="min-h-screen bg-[#FFF9F9]">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
          <Link href="/home" className="text-[#4A7856] mr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <Logo />
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-[#4A7856] mb-6 text-center">新規プロジェクト作成</h1>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <form>
            {/* プロジェクト名 */}
            <div className="mb-6">
              <label htmlFor="projectName" className="block text-sm font-medium text-[#4A7856] mb-2">
                プロジェクト名
              </label>
              <input
                type="text"
                id="projectName"
                className="w-full px-4 py-2 border border-[#D4E9D7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C290]"
                placeholder="プロジェクト名を入力"
              />
            </div>

            {/* 締め切り */}
            <div className="mb-6">
              <label htmlFor="deadline" className="block text-sm font-medium text-[#4A7856] mb-2">
                締め切り
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  id="deadline"
                  className="w-full px-4 py-2 border border-[#D4E9D7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C290]"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-[#90C290]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* 場所 */}
            <div className="mb-6">
              <label htmlFor="location" className="block text-sm font-medium text-[#4A7856] mb-2">
                場所
              </label>
              <input
                type="text"
                id="location"
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
                  <button type="button" className="text-[#4A7856] hover:text-[#90C290] p-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="font-medium text-[#4A7856]">2025年5月</div>
                  <button type="button" className="text-[#4A7856] hover:text-[#90C290] p-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
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
                    const dateStr = `5/${item.day}`
                    const isSelected = item.isCurrentMonth && selectedDates.includes(dateStr)
                    const isToday = item.day === 8 && item.isCurrentMonth // 仮の今日

                    return (
                      <div
                        key={`day-${index}`}
                        className={`h-8 w-8 flex items-center justify-center rounded-full cursor-pointer text-sm
                        ${
                          !item.isCurrentMonth
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
          </form>
        </div>
      </main>
    </div>
  )
}
