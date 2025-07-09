// UnifiedProjectPage.tsx
"use client"

import { Logo } from "@/components/logo"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Header from "@/components/header"
import ConfirmDeleteModal from "@/components/ui/delete_modal"
import Link from "next/link"

export default function ProjectPage() {
    const { id: projectId } = useParams() as { id: string }
    const router = useRouter()
    const [project, setProject] = useState<any | null>(null)
    const [userProfile, setUserProfile] = useState<{ name: string; avatar?: string } | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [answers, setAnswers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [openDates, setOpenDates] = useState<{ [date: string]: boolean }>({})
    const [unavailableBlocks, setUnavailableBlocks] = useState<{ [date: string]: string[] }>({})
    const [undecidedBlocks, setUndecidedBlocks] = useState<{ [date: string]: string[] }>({})
    const [savedDates, setSavedDates] = useState<{ [date: string]: boolean }>({})
    const [deleteTargetDate, setDeleteTargetDate] = useState<string | null>(null)


    useEffect(() => {
        const profileRaw = localStorage.getItem("userProfile")
        const uid = localStorage.getItem("userId")
        if (!profileRaw || !uid) {
            router.push(`/login?redirect=/projects/${projectId}`)
            return
        }
        setUserProfile(JSON.parse(profileRaw))
        setUserId(uid)
    }, [router, projectId])

    const fetchData = useCallback(async () => {
        if (!projectId) return

        const { data: projectData } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .single()

        const { data: answerData } = await supabase
            .from("answers")
            .select("*")
            .eq("project_id", projectId)

        if (projectData) setProject(projectData)
        if (answerData) setAnswers(answerData)

        const myAnswer = answerData?.find((a) => a.user_id === userId)
        if (myAnswer?.availability) {
            const unavail: { [date: string]: string[] } = {}
            const undecid: { [date: string]: string[] } = {}

            for (const date in myAnswer.availability) {
                unavail[date] = myAnswer.availability[date].unavailable || []
                undecid[date] = myAnswer.availability[date].undecided || []
            }

            setUnavailableBlocks(unavail)
            setUndecidedBlocks(undecid)
        }

        setLoading(false)
    }, [projectId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const timeSlots = useMemo(() => {
        if (!project?.start_time || !project?.end_time) return []
        const slots = []
        let [h, m] = project.start_time.split(":").map(Number)
        const [endH, endM] = project.end_time.split(":").map(Number)
        while (h < endH || (h === endH && m < endM)) {
            slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
            m += 30
            if (m >= 60) {
                m = 0
                h++
            }
        }
        return slots
    }, [project])

    const handleSaveOneDate = async (date: string) => {
        if (!userId || !project) return

        const unavailable = unavailableBlocks[date] || []
        const undecided = undecidedBlocks[date] || []
        const available = timeSlots.filter(t => !unavailable.includes(t) && !undecided.includes(t))

        const singleAvailability = {
            [date]: { available, unavailable, undecided }
        }

        const { error } = await supabase.from("answers").upsert([
            {
                project_id: projectId,
                user_id: userId,
                name: userProfile?.name,
                avatar: userProfile?.avatar,
                availability: singleAvailability,
            }
        ], { onConflict: "project_id, user_id", ignoreDuplicates: false })

        if (error) {
            console.error("保存エラー:", error.message)
        } else {
            // ✅ 保存成功 → savedDates に記録
            setSavedDates(prev => ({ ...prev, [date]: true }))
            // ✅ 数秒後に非表示に戻す（任意）
            setTimeout(() => {
                setSavedDates(prev => ({ ...prev, [date]: false }))
            }, 4000)
            // 更新も任意
            fetchData()
        }
    }



    const groupAnswersByUser = useMemo(() => {
        const map: { [userId: string]: { name: string; avatar: string; availability: any } } = {}
        for (const a of answers) {
            if (!a.availability) continue
            map[a.user_id] = {
                name: a.name || "ゲスト",
                avatar: a.avatar || "🌿",
                availability: a.availability,
            }
        }
        return map
    }, [answers])

    const getStatus = (date: string, time: string): "available" | "unavailable" | "undecided" => {
        if (unavailableBlocks[date]?.includes(time)) return "unavailable"
        if (undecidedBlocks[date]?.includes(time)) return "undecided"
        return "available"
    }

    const cycleStatus = (date: string, time: string) => {
        const current = getStatus(date, time)
        const remove = (arr: string[]) => arr.filter((t) => t !== time)
        const add = (arr: string[]) => [...new Set([...arr, time])]

        if (current === "available") {
            setUnavailableBlocks((prev) => ({ ...prev, [date]: add(prev[date] || []) }))
            setUndecidedBlocks((prev) => ({ ...prev, [date]: remove(prev[date] || []) }))
        } else if (current === "unavailable") {
            setUnavailableBlocks((prev) => ({ ...prev, [date]: remove(prev[date] || []) }))
            setUndecidedBlocks((prev) => ({ ...prev, [date]: add(prev[date] || []) }))
        } else {
            setUnavailableBlocks((prev) => ({ ...prev, [date]: remove(prev[date] || []) }))
            setUndecidedBlocks((prev) => ({ ...prev, [date]: remove(prev[date] || []) }))
        }
    }

    const getWeekday = (dateStr: string): string => {
        const date = new Date(dateStr)
        const weekdays = ["日", "月", "火", "水", "木", "金", "土"]
        return weekdays[date.getDay()]
    }

    const handleDelete = async () => {
        if (!deleteTargetDate || !project) return

        const newDates = project.dates.filter((d: string) => d !== deleteTargetDate)
        const { error } = await supabase
            .from("projects")
            .update({ dates: newDates })
            .eq("id", project.id)

        if (!error) {
            setProject({ ...project, dates: newDates }) // state更新
            setDeleteTargetDate(null) // モーダル閉じる
        } else {
            alert("削除に失敗しました")
        }
    }



    if (loading || !project) return <p className="p-4">読み込み中...</p>

    return (
        <div className="min-h-screen bg-[#FFF9F9]">
            <Header
                userName={userProfile?.name || "ゲスト"}
                userAvatar={userProfile?.avatar}
                showBackButton={true}
            />

            <main className="max-w-5xl mx-auto px-4 py-6">
                <h2 className="text-xl font-bold text-[#4A7856] mb-4"> Dash Board </h2>

                {project.dates.map((date: string) => (
                    <div key={date} className="border rounded mb-6 overflow-hidden">
                        <div
                            role="button"
                            onClick={() => setOpenDates((prev) => ({ ...prev, [date]: !prev[date] }))}
                            className="w-full px-4 py-2 bg-[#F8FFF8] text-left text-[#4A7856] font-semibold flex justify-between cursor-pointer"
                        >
                            <span>
                                {date}（{getWeekday(date)}）
                            </span>

                            <span className="flex items-center gap-2">
                                {openDates[date] ? "▲" : "▼"}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setDeleteTargetDate(date)
                                    }}
                                    className="text-[#B91C1C] hover:text-white bg-[#FCD5CE] hover:bg-[#E85A71] text-xs px-2 py-1 rounded-md transition-colors"
                                >
                                    🗑️
                                </button>
                            </span>
                        </div>



                        {openDates[date] && (
                            <div className="px-4 py-4 bg-white">
                                <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4 mb-3">
                                    {/* 左側：見出し */}
                                    <h3 className="text-sm text-[#4A4A4A]">あなたの空き状況（タップで編集）</h3>

                                    {/* 右側：保存ボタン（角丸） */}
                                    <button
                                        onClick={() => handleSaveOneDate(date)}
                                        disabled={savedDates[date]}
                                        className={`text-xs sm:text-sm font-medium py-1.5 px-4 rounded-md shadow-sm transition ${savedDates[date]
                                            ? "bg-[#90C290] text-white cursor-default"
                                            : "bg-[#4A7856] hover:bg-[#90C290] text-white"}`}
                                    >
                                        {savedDates[date] ? "✅ 保存済み" : "✅ 保存"}
                                    </button>

                                </div>

                                <div className="flex flex-wrap gap-2 sm:gap-3 mb-3">
                                    {/* 終日未定（△） */}
                                    <label className={`flex items-center gap-2 px-3 py-1 rounded-full border border-[#FFFACD] bg-[#FFFDE7] text-[#888800] text-sm cursor-pointer hover:bg-[#FFFBCC] transition`}>
                                        <input
                                            type="checkbox"
                                            className="accent-[#DDD700] w-4 h-4"
                                            checked={(undecidedBlocks[date] || []).length === timeSlots.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setUndecidedBlocks((prev) => ({ ...prev, [date]: timeSlots }))
                                                    setUnavailableBlocks((prev) => ({ ...prev, [date]: [] }))
                                                } else {
                                                    setUndecidedBlocks((prev) => ({ ...prev, [date]: [] }))
                                                }
                                            }}
                                        />
                                        終日△
                                    </label>

                                    {/* 終日参加不可（×） */}
                                    <label className={`flex items-center gap-2 px-3 py-1 rounded-full border border-[#F3B3B3] bg-[#FFF5F5] text-[#B22222] text-sm cursor-pointer hover:bg-[#FFE5E5] transition`}>
                                        <input
                                            type="checkbox"
                                            className="accent-[#E85A71] w-4 h-4"
                                            checked={(unavailableBlocks[date] || []).length === timeSlots.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setUnavailableBlocks((prev) => ({ ...prev, [date]: timeSlots }))
                                                    setUndecidedBlocks((prev) => ({ ...prev, [date]: [] }))
                                                } else {
                                                    setUnavailableBlocks((prev) => ({ ...prev, [date]: [] }))
                                                }
                                            }}
                                        />
                                        終日❌
                                    </label>


                                </div>

                                <div className="overflow-x-auto mb-4">
                                    <div className="min-w-fit">
                                        <div className="flex mb-1">
                                            <div className="w-0"></div> {/* ← 左余白ゼロ化 */}
                                            {timeSlots.map((time) => (
                                                <div key={time} className="w-14 text-[11px] text-center text-[#666] py-1">{time}</div>
                                            ))}
                                        </div>
                                        <div className="flex items-center mb-1">
                                            <div className="w-0"></div> {/* ← 左余白ゼロ化 */}
                                            {timeSlots.map((time) => {
                                                const status = getStatus(date, time)
                                                const color =
                                                    status === "available" ? "bg-[#D4E9D7]" :
                                                        status === "unavailable" ? "bg-[#F3B3B3]" :
                                                            "bg-[#FFFACD]"; // for "undecided"

                                                return (
                                                    <div
                                                        key={`${date}-${time}`}
                                                        onClick={() => cycleStatus(date, time)}
                                                        className={`w-14 h-10 border border-white cursor-pointer ${color} hover:opacity-80 transition`}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>


                                <h3 className="text-sm text-[#888] mb-2">他のメンバーの空き状況</h3>
                                <div className="overflow-x-auto">
                                    <div className="min-w-fit">
                                        <div className="flex mb-1">
                                            <div className="w-32"></div>
                                            {timeSlots.map((time) => (
                                                <div key={time} className="w-14 text-[11px] text-center text-[#666]">{time}</div>
                                            ))}
                                        </div>

                                        {Object.entries(groupAnswersByUser).map(([uid, user]) => (
                                            <div key={uid} className="flex items-center mb-1">
                                                <div className="w-32 flex items-center pr-2">
                                                    <span className="text-xl mr-1">{user.avatar}</span>
                                                    <span className="text-sm text-[#333]">{user.name}</span>
                                                </div>
                                                {timeSlots.map((time) => {
                                                    const times = user.availability?.[date]?.available || []
                                                    const isAvailable = times.includes(time)
                                                    return (
                                                        <div
                                                            key={`${uid}-${time}`}
                                                            className={`w-14 h-6 border border-white ${isAvailable ? "bg-[#D4E9D7]" : "bg-gray-100"}`}
                                                            title={`${time} - ${isAvailable ? "参加可能" : "不明"}`}
                                                        ></div>
                                                    )
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </main>
            <ConfirmDeleteModal
                open={!!deleteTargetDate}
                onClose={() => setDeleteTargetDate(null)}
                onConfirm={handleDelete}
                title={`${deleteTargetDate} を削除しますか？`}
                description="この日を削除すると、他のユーザーの回答もすべて削除され、元に戻せません。本当によろしいですか？"
                confirmText="完全に削除する"
                cancelText="キャンセル"
            />

        </div>

    )
}