"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Logo } from "@/components/logo"
import Image from "next/image"
import Link from "next/link"
import Header from "@/components/header"

export default function ConfirmationPage() {
    const router = useRouter()
    const params = useParams() as { id?: string }
    const projectId = params?.id
    const [userProfile, setUserProfile] = useState<{ name: string; avatar?: string } | null>(null)
    const [status, setStatus] = useState<"adjusting" | "confirmed">("adjusting")
    const [project, setProject] = useState<any | null>(null)
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [openDates, setOpenDates] = useState<{ [date: string]: boolean }>({})


    const timeSlots = Array.from({ length: 13 }, (_, i) => `${i + 9}:00`)

    const fetchData = useCallback(async () => {
        if (!projectId) return
        const { data: projectData, error: projectError } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .single()

        const { data: responseData, error: responseError } = await supabase
            .from("answers")
            .select("*")
            .eq("project_id", projectId)

        if (projectError || responseError) {
            console.error(projectError || responseError)
            return
        }

        setProject(projectData)
        setStatus(projectData.status || "adjusting")

        const grouped: any = {}
        responseData.forEach((res: any) => {
            const availability = res.availability
            if (!availability) return

            const name = res.name || "ゲスト"
            const avatar = res.avatar || "🌿"

            if (!grouped[res.user_id]) {
                grouped[res.user_id] = {
                    name,
                    avatar,
                    availability: {}
                }
            }

            Object.entries(availability).forEach(([date, slots]: [string, any]) => {
                const availableTimes = slots.available || []
                if (!grouped[res.user_id].availability[date]) {
                    grouped[res.user_id].availability[date] = []
                }
                grouped[res.user_id].availability[date].push(...availableTimes)
            })
        })

        const userList = Object.entries(grouped).map(([id, data]: any) => ({
            id,
            name: data.name,
            avatar: data.avatar,
            availability: data.availability
        }))

        setUsers(userList)
        setLoading(false)
    }, [projectId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

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

    const handleConfirm = async () => {
        if (!project) return
        const { error } = await supabase
            .from("projects")
            .update({ status: "confirmed" })
            .eq("id", project.id)
        if (!error) await fetchData()
    }

    const handleUnconfirm = async () => {
        if (!project) return
        const { error } = await supabase
            .from("projects")
            .update({ status: "adjusting" })
            .eq("id", project.id)
        if (!error) await fetchData()
    }

    const handleDeleteDate = async (dateToDelete: string) => {
        if (!project) return
        const newDates = project.dates.filter((d: string) => d !== dateToDelete)
        const { error } = await supabase
            .from("projects")
            .update({ dates: newDates })
            .eq("id", project.id)
        if (!error) {
            setProject({ ...project, dates: newDates })
        } else {
            alert("削除に失敗しました")
        }
    }

    const calculateOverlap = (date: string) => {
        const countByTime: Record<string, number> = {}
        users.forEach((user) => {
            const times = user.availability[date] || []
            times.forEach((time: string) => {
                countByTime[time] = (countByTime[time] || 0) + 1
            })
        })
        return countByTime
    }

    const findOptimalTimes = () => {
        const optimalTimes: Record<string, { time: string; count: number }[]> = {}
        project?.dates.forEach((date: string) => {
            const overlap = calculateOverlap(date)
            const times = Object.entries(overlap)
                .map(([time, count]) => ({ time, count }))
                .sort((a, b) => b.count - a.count)
            optimalTimes[date] = times.filter((item) => item.count > 0)
        })
        return optimalTimes
    }

    const optimalTimes = findOptimalTimes()

    const renderAvailabilityBar = (date: string, userId: string) => {
        const user = users.find((u) => u.id === userId)
        if (!user) return null
        const userAvailability = user.availability[date] || []

        return (
            <div className="flex">
                {timeSlots.map((time) => {
                    const isAvailable = userAvailability.includes(time)
                    return (
                        <div
                            key={`${userId}-${date}-${time}`}
                            className={`w-14 h-6 ${isAvailable ? "bg-[#D4E9D7]" : "bg-gray-100"} border-r border-white`}
                            title={`${time} - ${isAvailable ? "参加可能" : "参加不可"}`}
                        ></div>
                    )
                })}
            </div>
        )
    }


    if (loading || !project) return <p className="p-4">読み込み中...</p>

    return (
        <div className="min-h-screen bg-[#FFF9F9]">
            <Header
                userName={userProfile?.name || "ゲスト"}
                userAvatar={userProfile?.avatar}
                showBackButton={true}
            />

            <main className="max-w-6xl mx-auto px-4 py-6 overflow-x-hidden">
                <div className="min-h-screen bg-[#FFF9F9]">
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h2 className="text-xl font-bold text-[#E85A71] mb-4">参加メンバー</h2>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
                            {users.map((user) => (
                                <div key={user.id} className="flex items-center px-2 py-1 w-full sm:w-auto">
                                    <div className="text-2xl sm:text-3xl mr-2">{user.avatar}</div>
                                    <span className="text-sm sm:text-base text-[#333333] break-words">{user.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h2 className="text-xl font-bold text-[#E85A71] mb-6">詳細な空き状況</h2>

                        {project.dates.map((date: string) => (
                            <div key={date} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0 mb-4">
                                {/* 日付と削除ボタン */}
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-medium text-[#4A7856]">{date}</h3>
                                    <button
                                        onClick={() => handleDeleteDate(date)}
                                        className="text-xs bg-[#FCD5CE] hover:bg-[#E85A71] text-[#B91C1C] hover:text-white font-medium px-3 py-1 rounded-md transition-colors"
                                    >
                                        この日を削除🗑️
                                    </button>
                                </div>

                                {/* 横スクロール内包エリア */}
                                <div className="overflow-x-auto">
                                    <div className="min-w-fit">

                                        {/* 時間ラベル行 */}
                                        <div className="flex mb-2">
                                            {/* 固定幅の名前列スペース */}
                                            <div className="w-40 shrink-0"></div>
                                            {/* 時間ラベル */}
                                            {timeSlots.map((time) => (
                                                <div
                                                    key={`time-${time}`}
                                                    className="w-14 text-xs text-center text-[#666666] whitespace-nowrap"
                                                >
                                                    {time}
                                                </div>
                                            ))}
                                        </div>

                                        {/* 各ユーザーのスロット */}
                                        <div className="space-y-2">
                                            {users.map((user) => (
                                                <div key={`user-${user.id}-${date}`} className="flex items-center">
                                                    {/* 名前列：固定幅 */}
                                                    <div className="w-40 shrink-0 pr-2 flex items-center">
                                                        <div className="text-2xl sm:text-3xl mr-2">{user.avatar || "🙂"}</div>
                                                        <span className="text-sm sm:text-base text-[#333333] break-words">
                                                            {user.name}
                                                        </span>
                                                    </div>

                                                    {/* タイムスロット列 */}
                                                    <div className="flex">
                                                        {timeSlots.map((time) => {
                                                            const userAvailability = user.availability[date] || []
                                                            const isAvailable = userAvailability.includes(time)
                                                            return (
                                                                <div
                                                                    key={`slot-${user.id}-${date}-${time}`}
                                                                    className={`w-14 h-6 ${isAvailable ? "bg-[#D4E9D7]" : "bg-gray-100"} border-r border-white`}
                                                                    title={`${time} - ${isAvailable ? "参加可能" : "参加不可"}`}
                                                                />
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>

                    <div className="min-h-screen bg-[#FFF9F9] mt-8">
                        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                            <h2 className="text-xl font-bold text-[#E85A71] mb-4">最適な時間帯</h2>
                            <div className="space-y-4">
                                {project.dates.map((date: string) => {
                                    const isOpen = openDates[date] || false
                                    const times = optimalTimes[date] || []

                                    return (
                                        <div key={date} className="border rounded-md">
                                            <button
                                                onClick={() => setOpenDates(prev => ({ ...prev, [date]: !prev[date] }))}
                                                className="w-full px-4 py-2 flex justify-between items-center bg-[#F8FFF8] text-left text-[#4A7856] font-medium"
                                            >
                                                <span>{date}</span>
                                                <span className="text-sm">{isOpen ? "▲" : "▼"}</span>
                                            </button>

                                            {isOpen && (
                                                <div className="px-4 py-2 space-y-2">
                                                    {times.length > 0 ? (
                                                        <>
                                                            {times.filter(item => item.count === users.length).map(item => (
                                                                <div key={`optimal-${date}-${item.time}`} className="bg-[#D4E9D7] text-[#4A7856] px-4 py-2 rounded-md flex justify-between items-center">
                                                                    <div className="font-medium">{item.time}</div>
                                                                    <div className="text-sm">全員参加可能</div>
                                                                </div>
                                                            ))}
                                                            {times.filter(item => item.count < users.length && item.count > users.length / 2).map(item => (
                                                                <div key={`optimal-${date}-${item.time}`} className="bg-[#FFE5E5] text-[#E85A71] px-4 py-2 rounded-md flex justify-between items-center">
                                                                    <div className="font-medium">{item.time}</div>
                                                                    <div className="text-sm">{item.count}人参加可能</div>
                                                                </div>
                                                            ))}
                                                        </>
                                                    ) : (
                                                        <p className="text-[#666666]">この日は全員の予定が合う時間がありません。</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}

                            </div>
                        </div>
                    </div>
                </div>
            </main >
            {/* フッター：保存と切り替えボタン */}
            <div className="sticky bottom-0 z-50 bg-white border-t border-gray-200 py-2 px-2 flex flex-col sm:flex-row justify-center items-center gap-2" >
                {status === "confirmed" ? (
                    <button
                        onClick={handleUnconfirm}
                        className="bg-[#FFB7C5] hover:bg-[#E85A71] text-white font-medium py-2 px-6 rounded-md transition-colors"
                    >
                        再度日程を調整する
                    </button>
                ) : (
                    <button
                        onClick={handleConfirm}
                        className="bg-[#E85A71] hover:bg-[#FF8FAB] text-white font-medium py-2 px-6 rounded-md transition-colors"
                    >
                        日程を確定する
                    </button>
                )
                }
            </div >
        </div >
    )
}
