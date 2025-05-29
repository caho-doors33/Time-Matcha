
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Logo } from "@/components/logo"
import Image from "next/image"

export default function ConfirmationPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { id: projectId } = params

    const [project, setProject] = useState<any | null>(null)
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const timeSlots = Array.from({ length: 13 }, (_, i) => `${i + 9}:00`)

    useEffect(() => {
        const fetchData = async () => {
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

            const grouped: any = {}
            responseData.forEach((res: any) => {
                if (!grouped[res.user_id]) {
                    grouped[res.user_id] = {
                        name: res.name,
                        avatar: res.avatar,
                        availability: {}
                    }
                }
                if (!grouped[res.user_id].availability[res.date]) {
                    grouped[res.user_id].availability[res.date] = []
                }
                grouped[res.user_id].availability[res.date].push(res.time)
            })

            const userList = Object.entries(grouped).map(([id, data]: any) => ({
                id,
                name: data.name,
                profileImage: data.avatar,
                availability: data.availability
            }))

            setUsers(userList)
            setLoading(false)
        }

        fetchData()
    }, [projectId])

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
            <div className="flex h-6">
                {timeSlots.map((time) => {
                    const isAvailable = userAvailability.includes(time)
                    return (
                        <div
                            key={`${userId}-${date}-${time}`}
                            className={`flex-1 ${isAvailable ? "bg-[#D4E9D7] border-r border-white" : "bg-gray-100 border-r border-white"
                                }`}
                            title={`${time} - ${isAvailable ? "参加可能" : "参加不可"}`}
                        ></div>
                    )
                })}
            </div>
        )
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

    if (loading || !project) return <p className="p-4">読み込み中...</p>

    return (
        <div className="min-h-screen bg-[#FFF9F9]">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                        <a href={`/projects/${project.id}`} className="text-[#4A7856] mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

            <main className="max-w-6xl mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold text-[#E85A71] mb-4">参加メンバー</h2>
                    <div className="flex flex-wrap gap-4">
                        {users.map((user) => (
                            <div key={user.id} className="flex items-center">
                                <div className="w-8 h-8 rounded-full overflow-hidden mr-2 border border-[#FFB7C5]">
                                    <Image src={user.profileImage || "/placeholder.svg"} alt={user.name} width={32} height={32} className="object-cover" />
                                </div>
                                <span className="text-sm text-[#333333]">{user.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold text-[#E85A71] mb-4">最適な時間帯</h2>
                    <div className="space-y-6">
                        {project.dates.map((date: string) => (
                            <div key={date} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                                <h3 className="text-lg font-medium text-[#4A7856] mb-2">{date}</h3>
                                {optimalTimes[date]?.length > 0 ? (
                                    <div className="space-y-2">
                                        {optimalTimes[date].filter((item) => item.count === users.length).map((item) => (
                                            <div key={`optimal-${date}-${item.time}`} className="bg-[#D4E9D7] text-[#4A7856] px-4 py-2 rounded-md flex justify-between items-center">
                                                <div className="font-medium">{item.time}</div>
                                                <div className="text-sm">全員参加可能</div>
                                            </div>
                                        ))}
                                        {optimalTimes[date].filter((item) => item.count < users.length && item.count > users.length / 2).map((item) => (
                                            <div key={`optimal-${date}-${item.time}`} className="bg-[#FFE5E5] text-[#E85A71] px-4 py-2 rounded-md flex justify-between items-center">
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

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-[#E85A71] mb-6">詳細な空き状況</h2>
                    <div className="space-y-8">
                        {project.dates.map((date: string) => (
                            <div key={date} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-medium text-[#4A7856]">{date}</h3>
                                    <button onClick={() => handleDeleteDate(date)} className="text-xs text-red-500 hover:underline">
                                        この日を削除
                                    </button>
                                </div>
                                <div className="mb-2 pl-20 flex">
                                    {timeSlots.map((time) => (
                                        <div key={`scale-${time}`} className="flex-1 text-xs text-center text-[#666666]">
                                            {time}
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-3">
                                    {users.map((user) => (
                                        <div key={`user-${user.id}-${date}`} className="flex items-center">
                                            <div className="w-20 flex items-center">
                                                <div className="w-8 h-8 rounded-full overflow-hidden mr-2 border border-[#FFB7C5]">
                                                    <Image src={user.profileImage || "/placeholder.svg"} alt={user.name} width={32} height={32} className="object-cover" />
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

                <div className="flex justify-center mt-8">
                    <button className="bg-[#90C290] hover:bg-[#4A7856] text-white font-medium py-2 px-8 rounded-md transition-colors">
                        日程調整を続ける
                    </button>
                </div>
            </main>
        </div>
    )
}
