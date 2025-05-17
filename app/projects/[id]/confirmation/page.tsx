"use client"

import { Logo } from "@/components/logo"
import Image from "next/image"

export default function ConfirmationPage({ params }: { params: { id: string } }) {
  // プロジェクト情報（ダミーデータ）
  const project = {
    id: params.id,
    name: "新商品発表会",
    dates: ["5/6", "5/8", "5/12"],
  }

  // 時間帯（簡略化のため、1時間単位で表示）
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    return `${i + 9}:00`
  })

  // ユーザーとその空き状況（ダミーデータ）
  const users = [
    {
      id: 1,
      name: "さくら",
      profileImage: "/anime-pink-hair-girl.png",
      availability: {
        "5/6": ["9:00", "10:00", "11:00", "12:00"],
        "5/8": ["13:00", "14:00", "15:00", "16:00"],
        "5/12": ["18:00", "19:00", "20:00"],
      },
    },
    {
      id: 2,
      name: "まっちゃ",
      profileImage: "/placeholder-g1byb.png",
      availability: {
        "5/6": ["10:00", "11:00", "12:00", "13:00"],
        "5/8": ["14:00", "15:00", "16:00"],
        "5/12": ["17:00", "18:00", "19:00"],
      },
    },
    {
      id: 3,
      name: "みどり",
      profileImage: "/anime-girl-green-hair.png",
      availability: {
        "5/6": ["11:00", "12:00", "13:00", "14:00"],
        "5/8": ["15:00", "16:00", "17:00"],
        "5/12": ["18:00", "19:00", "20:00", "21:00"],
      },
    },
  ]

  // 重複する時間帯を計算
  const calculateOverlap = (date: string) => {
    const countByTime: Record<string, number> = {}

    // 各ユーザーの空き時間をカウント
    users.forEach((user) => {
      const times = user.availability[date as keyof typeof user.availability] || []
      times.forEach((time) => {
        countByTime[time] = (countByTime[time] || 0) + 1
      })
    })

    return countByTime
  }

  // 最適な時間帯を特定（最も多くのユーザーが参加可能な時間）
  const findOptimalTimes = () => {
    const optimalTimes: Record<string, { time: string; count: number }[]> = {}

    project.dates.forEach((date) => {
      const overlap = calculateOverlap(date)
      const times = Object.entries(overlap)
        .map(([time, count]) => ({ time, count }))
        .sort((a, b) => b.count - a.count)

      optimalTimes[date] = times.filter((item) => item.count > 0)
    })

    return optimalTimes
  }

  const optimalTimes = findOptimalTimes()

  // ユーザーの空き状況を視覚化
  const renderAvailabilityBar = (date: string, userId: number) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return null

    const userAvailability = user.availability[date as keyof typeof user.availability] || []

    return (
      <div className="flex h-6">
        {timeSlots.map((time) => {
          const isAvailable = userAvailability.includes(time)
          return (
            <div
              key={`${userId}-${date}-${time}`}
              className={`flex-1 ${
                isAvailable ? "bg-[#D4E9D7] border-r border-white" : "bg-gray-100 border-r border-white"
              }`}
              title={`${time} - ${isAvailable ? "参加可能" : "参加不可"}`}
            ></div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF9F9]">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <a href={`/projects/${project.id}`} className="text-[#4A7856] mr-3">
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

          <button className="text-sm bg-[#E85A71] hover:bg-[#FF8FAB] text-white py-1.5 px-3 rounded-md transition-colors">
            日程を確定する
          </button>
        </div>
      </header>

      {/* プロジェクト情報 */}
      <div className="bg-white border-b border-[#D4E9D7]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-[#4A7856]">{project.name}</h1>
          <p className="text-sm text-[#666666] mt-1">メンバーの空き状況確認</p>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 最適な時間帯 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-[#E85A71] mb-4">最適な時間帯</h2>

          <div className="space-y-6">
            {project.dates.map((date) => (
              <div key={date} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                <h3 className="text-lg font-medium text-[#4A7856] mb-2">{date}</h3>

                {optimalTimes[date]?.length > 0 ? (
                  <div className="space-y-2">
                    {optimalTimes[date]
                      .filter((item) => item.count === users.length) // 全員参加可能な時間帯
                      .map((item) => (
                        <div
                          key={`optimal-${date}-${item.time}`}
                          className="bg-[#D4E9D7] text-[#4A7856] px-4 py-2 rounded-md flex justify-between items-center"
                        >
                          <div className="font-medium">{item.time}</div>
                          <div className="text-sm">全員参加可能</div>
                        </div>
                      ))}

                    {optimalTimes[date]
                      .filter((item) => item.count < users.length && item.count > users.length / 2) // 過半数参加可能な時間帯
                      .map((item) => (
                        <div
                          key={`optimal-${date}-${item.time}`}
                          className="bg-[#FFE5E5] text-[#E85A71] px-4 py-2 rounded-md flex justify-between items-center"
                        >
                          <div className="font-medium">{item.time}</div>
                          <div className="text-sm">{item.count}人参加可能</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-[#666666]">この日は全員の予定が合う時間がありません。</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 詳細な空き状況 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-[#E85A71] mb-6">詳細な空き状況</h2>

          <div className="space-y-8">
            {project.dates.map((date) => (
              <div key={date} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                <h3 className="text-lg font-medium text-[#4A7856] mb-4">{date}</h3>

                {/* 時間スケール */}
                <div className="mb-2 pl-20 flex">
                  {timeSlots.map((time) => (
                    <div key={`scale-${time}`} className="flex-1 text-xs text-center text-[#666666]">
                      {time}
                    </div>
                  ))}
                </div>

                {/* ユーザーごとの空き状況 */}
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={`user-${user.id}-${date}`} className="flex items-center">
                      <div className="w-20 flex items-center">
                        <div className="w-8 h-8 rounded-full overflow-hidden mr-2 border border-[#FFB7C5]">
                          <Image
                            src={user.profileImage || "/placeholder.svg"}
                            alt={user.name}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        </div>
                        <span className="text-sm text-[#333333]">{user.name}</span>
                      </div>
                      <div className="flex-1">{renderAvailabilityBar(date, user.id)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex justify-center mt-8">
          <button className="bg-[#90C290] hover:bg-[#4A7856] text-white font-medium py-2 px-8 rounded-md transition-colors">
            日程調整を続ける
          </button>
        </div>
      </main>
    </div>
  )
}
