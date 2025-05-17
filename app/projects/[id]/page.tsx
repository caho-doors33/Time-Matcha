"use client"

import { Logo } from "@/components/logo"

export default function ProjectPage({ params }: { params: { id: string } }) {
  // プロジェクト情報（ダミーデータ）
  const project = {
    id: params.id,
    name: "新商品発表会",
    dates: ["5/6", "5/8", "5/12"],
  }

  // 時間帯（9:00〜21:00）
  const timeSlots = Array.from({ length: 25 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9
    const minute = i % 2 === 0 ? "00" : "30"
    return `${hour}:${minute}`
  })

  // 選択された時間ブロック（ダミーデータ）
  const selectedTimeBlocks = {
    "5/6": ["10:00", "10:30", "11:00", "11:30"],
    "5/8": ["13:00", "13:30", "14:00", "14:30", "15:00"],
    "5/12": ["18:00", "18:30", "19:00"],
  }

  // 時間ブロックが選択されているかチェック
  const isTimeSelected = (date: string, time: string) => {
    return selectedTimeBlocks[date as keyof typeof selectedTimeBlocks]?.includes(time) || false
  }

  return (
    <div className="min-h-screen bg-[#F8FFF8]">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <a href="/home" className="text-[#4A7856] mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
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

      {/* プロジェクト情報 */}
      <div className="bg-white border-b border-[#D4E9D7]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-[#4A7856]">{project.name}</h1>
          <p className="text-sm text-[#666666] mt-1">
            以下の日程から、参加可能な時間帯を選択してください。複数選択可能です。
          </p>
        </div>
      </div>

      {/* メインコンテンツ - スケジュールグリッド */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="overflow-x-auto pb-6">
          <div className="min-w-[768px]">
            {/* 日付ヘッダー */}
            <div className="flex mb-2">
              <div className="w-20 flex-shrink-0"></div>
              {project.dates.map((date) => (
                <div key={date} className="flex-1 px-1">
                  <div className="bg-[#FFE5E5] text-[#E85A71] text-center py-2 rounded-t-lg font-medium">{date}</div>
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
                    className={`h-10 flex items-center justify-end pr-2 text-xs text-[#666666] ${
                      index % 2 === 0 ? "font-medium" : ""
                    }`}
                  >
                    {time}
                  </div>
                ))}
              </div>

              {/* 日付ごとの時間ブロック */}
              {project.dates.map((date) => (
                <div key={date} className="flex-1 px-1">
                  <div className="bg-white rounded-b-lg shadow-sm">
                    {timeSlots.map((time, index) => {
                      const isSelected = isTimeSelected(date, time)
                      const isLastItem = index === timeSlots.length - 1

                      return (
                        <div
                          key={`${date}-${time}`}
                          className={`h-10 border-b border-[#F0F0F0] ${
                            isLastItem ? "border-b-0" : ""
                          } hover:bg-[#FFF0F3] transition-colors cursor-pointer relative ${
                            isSelected ? "bg-[#FFE5E5]" : "bg-white"
                          }`}
                        >
                          {isSelected && <div className="absolute inset-y-0 left-0 w-1 bg-[#E85A71]"></div>}
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            日付を追加
          </button>
          <button className="bg-[#90C290] hover:bg-[#4A7856] text-white font-medium py-2 px-6 rounded-md transition-colors flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
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
