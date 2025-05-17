"use client"

import { useState } from "react"

interface CalendarProps {
  selectedDates: string[]
  onDateSelect: (date: string) => void
}

export function Calendar({ selectedDates, onDateSelect }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // 月の最初の日と最後の日を取得
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

  // 月の最初の日の曜日（0: 日曜日, 1: 月曜日, ..., 6: 土曜日）
  const firstDayOfWeek = firstDayOfMonth.getDay()

  // カレンダーに表示する日数
  const daysInMonth = lastDayOfMonth.getDate()

  // 前月と翌月に移動する関数
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // 月の名前を取得
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
  const currentMonthName = monthNames[currentMonth.getMonth()]
  const currentYear = currentMonth.getFullYear()

  // 曜日の名前
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"]

  // 日付をフォーマットする関数（MM/DD形式）
  const formatDate = (year: number, month: number, day: number) => {
    return `${month + 1}/${day}`
  }

  // 日付が選択されているかチェックする関数
  const isDateSelected = (dateStr: string) => {
    return selectedDates.includes(dateStr)
  }

  // カレンダーの日付をレンダリング
  const renderDays = () => {
    const days = []

    // 前月の日を埋める
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8 text-center text-gray-300"></div>)
    }

    // 当月の日を埋める
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(currentYear, currentMonth.getMonth(), day)
      const isSelected = isDateSelected(dateStr)

      days.push(
        <div
          key={`day-${day}`}
          className={`h-8 w-8 flex items-center justify-center rounded-full cursor-pointer text-sm
            ${isSelected ? "bg-[#E85A71] text-white" : "hover:bg-[#FFE5E5] text-[#333333]"}`}
          onClick={() => onDateSelect(dateStr)}
        >
          {day}
        </div>,
      )
    }

    return days
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="text-[#4A7856] hover:text-[#90C290] p-1">
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
        <div className="font-medium text-[#4A7856]">
          {currentYear}年{currentMonthName}
        </div>
        <button onClick={nextMonth} className="text-[#4A7856] hover:text-[#90C290] p-1">
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
        {weekDays.map((day, index) => (
          <div key={index} className="h-8 w-8 flex items-center justify-center text-xs text-[#666666]">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
    </div>
  )
}
