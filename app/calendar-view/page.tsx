"use client"

import { useState } from "react"
import { ArrowLeft, Calendar, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// サンプルデータ
const initialDates = [
  {
    id: 1,
    date: "2024-05-10",
    dayOfWeek: "金",
    timeSlots: Array(48).fill(null).map((_, i) => ({
      hour: Math.floor(i / 2),
      minute: i % 2 === 0 ? 0 : 30,
      status: "none",
    })),
  },
  {
    id: 2,
    date: "2024-05-11",
    dayOfWeek: "土",
    timeSlots: Array(48).fill(null).map((_, i) => ({
      hour: Math.floor(i / 2),
      minute: i % 2 === 0 ? 0 : 30,
      status: "none",
    })),
  },
  {
    id: 3,
    date: "2024-05-12",
    dayOfWeek: "日",
    timeSlots: Array(48).fill(null).map((_, i) => ({
      hour: Math.floor(i / 2),
      minute: i % 2 === 0 ? 0 : 30,
      status: "none",
    })),
  },
]

export default function CalendarView() {
  const [dates, setDates] = useState(initialDates)
  const [selectionMode, setSelectionMode] = useState<"available" | "unavailable">("available")
  const [isDragging, setIsDragging] = useState(false)
  const [lastTouchedHour, setLastTouchedHour] = useState<{ dateId: number; hour: number } | null>(null)

  // 時間スロットの状態を更新する関数
  const updateTimeSlot = (dateId: number, hour: number) => {
    setDates((prevDates) =>
      prevDates.map((date) => {
        if (date.id === dateId) {
          return {
            ...date,
            timeSlots: date.timeSlots.map((slot) => {
              if (slot.hour === hour) {
                return {
                  ...slot,
                  status: selectionMode === "available" ? "available" : "unavailable",
                }
              }
              return slot
            }),
          }
        }
        return date
      }),
    )
  }

  // ドラッグ開始時の処理
  const handleMouseDown = (dateId: number, hour: number) => {
    setIsDragging(true)
    setLastTouchedHour({ dateId, hour })
    updateTimeSlot(dateId, hour)
  }

  // ドラッグ中の処理
  const handleMouseEnter = (dateId: number, hour: number) => {
    if (isDragging && lastTouchedHour) {
      if (dateId === lastTouchedHour.dateId) {
        updateTimeSlot(dateId, hour)
        setLastTouchedHour({ dateId, hour })
      }
    }
  }

  // ドラッグ終了時の処理
  const handleMouseUp = () => {
    setIsDragging(false)
    setLastTouchedHour(null)
  }

  // 新しい日付を追加する関数
  const addNewDate = () => {
    const lastDate = dates[dates.length - 1]
    const newDate = new Date(lastDate.date)
    newDate.setDate(newDate.getDate() + 1)

    const dateString = newDate.toISOString().split("T")[0]
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][newDate.getDay()]

    setDates([
      ...dates,
      {
        id: dates.length + 1,
        date: dateString,
        dayOfWeek,
        timeSlots: Array(24)
          .fill(null)
          .map((_, i) => ({
            hour: i,
            status: "none",
          })),
      },
    ])
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* ナビゲーションバー */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/projects" className="flex items-center text-gray-600">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>戻る</span>
          </Link>
          <h1 className="font-bold text-xl text-gray-800 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-emerald-500" />
            チームミーティング
          </h1>
          <div className="w-20"></div> {/* スペーサー */}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-6">
        {/* モード切り替え */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="selection-mode"
                checked={selectionMode === "available"}
                onCheckedChange={(checked) => setSelectionMode(checked ? "available" : "unavailable")}
              />
              <Label htmlFor="selection-mode">
                {selectionMode === "available" ? "利用可能時間を選択" : "利用不可時間を選択"}
              </Label>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-emerald-400 rounded-sm mr-1"></div>
              <span className="text-sm">利用可能</span>
            </div>
            <div className="flex items-center ml-3">
              <div className="w-4 h-4 bg-red-400 rounded-sm mr-1"></div>
              <span className="text-sm">利用不可</span>
            </div>
          </div>
        </div>

        {/* カレンダービュー */}
        <div className="space-y-6">
  {dates.map((date) => (
    <div key={date.id} className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="font-semibold text-gray-800 mb-4">
        {date.date} ({date.dayOfWeek})
      </h2>
      <div className="grid grid-cols-[80px_1fr] gap-2">
        {date.timeSlots.map((slot) => (
          <div
            key={slot.hour}
            className="flex items-center"
            onMouseDown={() => handleMouseDown(date.id, slot.hour)}
            onMouseEnter={() => handleMouseEnter(date.id, slot.hour)}
          >
            {/* 時間ラベル */}
            <div className="text-sm text-gray-500 w-20">{`${String(slot.hour).padStart(2, '0')}:00`}</div>

            {/* スロット */}
            <div
              className={cn(
                "flex-1 h-6 rounded cursor-pointer transition-colors border",
                slot.status === "available" && "bg-emerald-400",
                slot.status === "unavailable" && "bg-red-400",
                slot.status === "none" && "bg-gray-100 hover:bg-gray-200"
              )}
            ></div>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>


        {/* 日付追加ボタン */}
        <div className="mt-6">
          <Button variant="outline" className="w-full border-dashed border-gray-300 text-gray-600" onClick={addNewDate}>
            <Plus className="h-4 w-4 mr-2" />
            日付を追加
          </Button>
        </div>
      </main>

      {/* フッターボタン */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4">
        <div className="container mx-auto flex flex-col space-y-3">
          <Button className="w-full bg-emerald-500 hover:bg-emerald-600">送信する</Button>
          <Button variant="destructive" className="w-full">
            <Trash2 className="h-4 w-4 mr-2" />
            プロジェクトを削除
          </Button>
        </div>
      </div>
    </div>
  )
}
