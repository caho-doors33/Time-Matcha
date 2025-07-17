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
    const [isDragging, setIsDragging] = useState(false)
    const [currentCopyStatus, setCurrentCopyStatus] = useState<"available" | "unavailable" | "undecided" | null>(null)
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
    const [activeTab, setActiveTab] = useState<"full" | "mostly" | "custom">("full")
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]) // userId の配列
    const [showMemberSelector, setShowMemberSelector] = useState(false)
    const [addDateOpen, setAddDateOpen] = useState(false)
    const [tempSelectedDates, setTempSelectedDates] = useState<string[]>([])
    const [currentDate, setCurrentDate] = useState(new Date())




    useEffect(() => {
        const handleMouseUp = () => {
            setIsDragging(false)
            setCurrentCopyStatus(null)
        }
        const handleTouchEnd = () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer)
                setLongPressTimer(null)
            }
            setIsDragging(false)
            setCurrentCopyStatus(null)
            window.removeEventListener("touchend", handleTouchEnd)
        }

        window.addEventListener("mouseup", handleMouseUp)
        window.addEventListener("touchend", handleTouchEnd)

        return () => {
            window.removeEventListener("mouseup", handleMouseUp)
            window.removeEventListener("touchend", handleTouchEnd)
        }
    }, [longPressTimer])

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

    useEffect(() => {
        if (activeTab === "custom") {
            setShowMemberSelector(true)
        } else {
            setShowMemberSelector(false)
        }
    }, [activeTab])



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
    },
        [project])

    // ✅ 各日付ごとの "timeSlot → 参加ユーザーID" のマッピングを構築
    const timeParticipation = useMemo(() => {
        const map: {
            [date: string]: {
                [time: string]: string[] // 参加しているuserIdの配列
            }
        } = {}

        if (!project || !timeSlots.length) return map

        for (const date of project.dates) {
            map[date] = {}
            for (const time of timeSlots) {
                const participants: string[] = []

                for (const [uid, user] of Object.entries(groupAnswersByUser)) {
                    const availableTimes = user.availability?.[date]?.available || []
                    if (availableTimes.includes(time)) {
                        participants.push(uid)
                    }
                }

                map[date][time] = participants
            }
        }

        return map
    }, [project, timeSlots, groupAnswersByUser])

    // ✅ 同じ参加者構成の時間帯をまとめる（連続時間帯グループ化）
    const groupedAvailability = useMemo(() => {
        const result: {
            [date: string]: {
                start: string
                end: string
                members: string[]
            }[]
        } = {}

        for (const date of project?.dates || []) {
            const dateMap = timeParticipation[date] || {}
            const groups: typeof result[string] = []

            let prevMembers: string[] = []
            let currentGroup: { start: string; end: string; members: string[] } | null = null

            for (const time of timeSlots) {
                const members = (dateMap[time] || []).sort()
                const sameGroup = JSON.stringify(members) === JSON.stringify(prevMembers)

                if (!sameGroup) {
                    if (currentGroup) {
                        currentGroup.end = time
                        groups.push(currentGroup)
                    }
                    currentGroup = { start: time, end: time, members }
                }

                prevMembers = members
            }

            if (currentGroup) {
                currentGroup.end = timeSlots[timeSlots.length - 1]
                groups.push(currentGroup)
            }

            result[date] = groups.filter(g => g.members.length > 0)
        }

        return result
    }, [timeParticipation, timeSlots])

    const filteredGroups = (date: string) => {
        const groups = groupedAvailability[date] || []
        const total = Object.keys(groupAnswersByUser).length

        if (activeTab === "full") {
            return groups.filter(g => g.members.length === total)
        } else if (activeTab === "mostly") {
            return groups.filter(g => g.members.length >= Math.ceil(total * 0.8))
        } else if (activeTab === "custom") {
            return groups.filter(g =>
                selectedMembers.length > 0 &&
                selectedMembers.every((uid) => g.members.includes(uid))
            )
        }

        return groups
    }



    const applyStatus = (date: string, time: string, status: "available" | "unavailable" | "undecided") => {
        const remove = (arr: string[]) => arr.filter((t) => t !== time)
        const add = (arr: string[]) => [...new Set([...arr, time])]

        setUnavailableBlocks((prev) => ({
            ...prev,
            [date]: status === "unavailable" ? add(prev[date] || []) : remove(prev[date] || []),
        }))
        setUndecidedBlocks((prev) => ({
            ...prev,
            [date]: status === "undecided" ? add(prev[date] || []) : remove(prev[date] || []),
        }))
    }


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

    const getStatus = (date: string, time: string): "available" | "unavailable" | "undecided" => {
        if (unavailableBlocks[date]?.includes(time)) return "unavailable"
        if (undecidedBlocks[date]?.includes(time)) return "undecided"
        return "available"
    }

    const cycleStatus = (date: string, time: string) => {
        const current = getStatus(date, time)
        const next =
            current === "unavailable" ? "undecided" :
                current === "undecided" ? "available" :
                    "unavailable"
        applyStatus(date, time, next)
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



    if (loading || !project) return <p className="p-4">読み込み中...</p>

    return (
        <div className="min-h-screen bg-[#FFF9F9]">
            <Header
                userName={userProfile?.name || "ゲスト"}
                userAvatar={userProfile?.avatar}
                showBackButton={true}
            />

            <main className="max-w-5xl mx-auto px-4 py-6">
                <div className="mb-8 text-start">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[#4A7856] tracking-tight">
                        {project?.name || "none"}
                    </h1>
                    {project?.location && (
                        <p className="text-base sm:text-lg text-[#888] mt-2">📍 {project.location}</p>
                    )}
                </div>


                <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#4A7856]">
                        Dash Board
                    </h2>
                    <button
                        onClick={() => setAddDateOpen(true)}
                        className="bg-[#E85A71] hover:bg-[#FF8FAB] text-white h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-md flex items-center justify-center transition-colors"
                    >
                        <span className="text-base sm:text-xl">＋</span>
                    </button>

                </div>

                {project.dates.map((date: string) => (
                    <div key={date} className="border rounded mb-6 overflow-hidden">
                        <div
                            role="button"
                            onClick={() => setOpenDates((prev) => ({ ...prev, [date]: !prev[date] }))}
                            className="w-full px-4 py-2 bg-[#F8FFF8] text-[#4A7856] font-semibold flex items-center justify-between cursor-pointer"
                        >
                            {/* 左側：日付と削除ボタン */}
                            <div className="flex items-center gap-3">
                                <span>{date}（{getWeekday(date)}）</span>
                                {openDates[date] && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setDeleteTargetDate(date)
                                        }}
                                        className="flex items-center gap-1 bg-[#E85A71] hover:bg-[#cc4c61] text-white text-xs sm:text-sm font-semibold px-3 h-9 sm:h-10 rounded-full transition-colors shadow-sm"
                                    >
                                        <span className="text-lg sm:text-xl">🗑️</span>
                                        <span className="hidden sm:inline">Delete</span>
                                    </button>

                                )}
                            </div>

                            {/* 右側：トグル矢印（常に同じ位置） */}
                            <span className="text-sm">{openDates[date] ? "▲" : "▼"}</span>
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
                                        {savedDates[date] ? "✅ Saved" : "✅ Save"}
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
                                                        data-date={date}
                                                        data-time={time}
                                                        className={`w-14 h-10 border border-white cursor-pointer ${color} hover:opacity-80 transition`}

                                                        // ✅ ダブルクリック（PC）：状態を切り替え
                                                        onDoubleClick={() => {
                                                            cycleStatus(date, time)
                                                        }}

                                                        // ✅ タッチ開始（スマホ）＋長押し判定
                                                        onTouchStart={(e) => {
                                                            const status = getStatus(date, time)
                                                            setCurrentCopyStatus(status)

                                                            const timer = setTimeout(() => {
                                                                cycleStatus(date, time)
                                                            }, 1000)

                                                            setLongPressTimer(timer)
                                                            setIsDragging(true)
                                                            // ドラッグ開始時は状態を変更しない
                                                        }}

                                                        // ✅ タッチ移動でドラッグコピー
                                                        onTouchMove={(e) => {
                                                            const target = document.elementFromPoint(
                                                                e.touches[0].clientX,
                                                                e.touches[0].clientY
                                                            ) as HTMLElement
                                                            if (!target?.dataset?.date || !target?.dataset?.time) return
                                                            if (isDragging && currentCopyStatus) {
                                                                applyStatus(target.dataset.date, target.dataset.time, currentCopyStatus)
                                                            }
                                                        }}

                                                        // ✅ タッチ終了時の処理
                                                        onTouchEnd={(e) => {
                                                            if (longPressTimer) {
                                                                clearTimeout(longPressTimer)
                                                                setLongPressTimer(null)
                                                            }
                                                            if (isDragging && currentCopyStatus) {
                                                                applyStatus(date, time, currentCopyStatus)
                                                            }
                                                        }}

                                                        // ✅ PC: ドラッグ開始
                                                        onMouseDown={(e) => {
                                                            e.preventDefault()
                                                            const status = getStatus(date, time)
                                                            setCurrentCopyStatus(status)
                                                            setIsDragging(true)
                                                            // ドラッグ開始時は状態を変更しない
                                                        }}

                                                        // ✅ PC: ドラッグ中
                                                        onMouseEnter={() => {
                                                            if (isDragging && currentCopyStatus) {
                                                                applyStatus(date, time, currentCopyStatus)
                                                            }
                                                        }}

                                                        // ✅ PC: ドラッグ終了時の処理
                                                        onMouseUp={() => {
                                                            if (isDragging && currentCopyStatus) {
                                                                applyStatus(date, time, currentCopyStatus)
                                                            }
                                                        }}
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
                                                    const available = user.availability?.[date]?.available || []
                                                    const undecided = user.availability?.[date]?.undecided || []
                                                    const isAvailable = available.includes(time)
                                                    const isUndecided = undecided.includes(time)

                                                    let bgColor = "bg-gray-100"
                                                    let title = "不明"

                                                    if (isAvailable) {
                                                        bgColor = "bg-[#D4E9D7]" // 緑
                                                        title = "参加可能"
                                                    } else if (isUndecided) {
                                                        bgColor = "bg-[#FFFACD]" // 黄色
                                                        title = "未定"
                                                    }

                                                    return (
                                                        <div
                                                            key={`${uid}-${time}`}
                                                            className={`w-14 h-6 border border-white ${bgColor}`}
                                                            title={`${time} - ${title}`}
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

                <div className="max-w-5xl mx-auto px-4 pb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#E85A71] mb-4">🎯 Best Time Suggestions</h2>
                    {/* タブUI */}
                    <div className="flex gap-2 mb-4">
                        <button onClick={() => setActiveTab("full")} className={`px-4 py-2 rounded-full text-sm font-semibold border ${activeTab === "full" ? "bg-[#90C290] text-white" : "bg-white text-[#4A7856] border-[#90C290]"}`}>
                            Full
                        </button>
                        <button onClick={() => setActiveTab("mostly")} className={`px-4 py-2 rounded-full text-sm font-semibold border ${activeTab === "mostly" ? "bg-[#FFD580] text-white" : "bg-white text-[#AA8833] border-[#FFD580]"}`}>
                            80% or more
                        </button>
                        <button onClick={() => setActiveTab("custom")} className={`px-4 py-2 rounded-full text-sm font-semibold border ${activeTab === "custom" ? "bg-[#FF8FAB] text-white" : "bg-white text-[#E85A71] border-[#FF8FAB]"}`}>
                            Custom members
                        </button>
                    </div>

                    {activeTab === "custom" && (
                        <div className="mb-4 flex flex-wrap gap-3">
                            {Object.entries(groupAnswersByUser).map(([uid, user]) => {
                                const isSelected = selectedMembers.includes(uid)
                                return (
                                    <label
                                        key={uid}
                                        className={`flex items-center gap-2 px-3 py-1 rounded-full border cursor-pointer transition 
            ${isSelected ? "bg-[#D4E9D7] text-[#4A7856] border-[#90C290]" : "bg-white text-[#666] border-[#ccc]"}
          `}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() =>
                                                setSelectedMembers(prev =>
                                                    isSelected ? prev.filter(id => id !== uid) : [...prev, uid]
                                                )
                                            }
                                            className="w-4 h-4 accent-[#4A7856]"
                                        />
                                        <span className="text-xl">{user.avatar}</span>
                                        <span className="text-sm">{user.name}</span>
                                    </label>
                                )
                            })}
                        </div>
                    )}





                    {project.dates.map((date: string) => {
                        const groups = filteredGroups(date)
                        const hasFull = groups.some(g => g.members.length === Object.keys(groupAnswersByUser).length)

                        return (
                            <div key={date} className="mb-6 border border-[#eee] rounded-md shadow-sm bg-white">
                                <div className="bg-[#F8FFF8] px-4 py-2 flex justify-between items-center text-[#4A7856] font-semibold text-sm sm:text-base">
                                    <span>{date}（{getWeekday(date)}）</span>
                                    {hasFull && (
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs sm:text-sm font-semibold">
                                            Full member! 💯
                                        </span>
                                    )}
                                </div>

                                <div className="px-4 py-3 space-y-2">
                                    {groups.map((g, i) => {
                                        const ratio = g.members.length / Object.keys(groupAnswersByUser).length
                                        const bg =
                                            ratio === 1
                                                ? "bg-[#D4E9D7]"
                                                : ratio >= 0.8
                                                    ? "bg-[#FFF6CC]"
                                                    : ratio >= 0.5
                                                        ? "bg-[#FFE5E5]"
                                                        : "bg-gray-100"

                                        return (
                                            <div
                                                key={`${date}-group-${i}`}
                                                className={`rounded-md ${bg} px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between`}
                                            >
                                                <div className="font-medium text-sm sm:text-base">
                                                    ⏰ {g.start}〜{g.end}
                                                </div>
                                                <div className="relative inline-block group cursor-pointer">
                                                    <div className="text-xl sm:text-2xl">
                                                        {g.members.map((uid) => groupAnswersByUser[uid]?.avatar).join(" ")}
                                                    </div>

                                                    <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity bg-white border border-[#ccc] rounded-md shadow-md px-3 py-2 text-sm text-[#333] whitespace-nowrap pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
                                                        {g.members.map((uid) => (
                                                            <div key={uid} className="flex items-center gap-2">
                                                                <span className="text-xl">{groupAnswersByUser[uid]?.avatar}</span>
                                                                <span>{groupAnswersByUser[uid]?.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                            </div>
                                        )
                                    })}
                                    {groups.length === 0 && (
                                        <p className="text-sm text-[#888]">参加可能な時間帯が見つかりませんでした。</p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </main>
            {addDateOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-bold text-[#4A7856] mb-4">日付を追加</h2>

                        {/* カレンダー */}
                        <div className="flex justify-between items-center mb-2">
                            <button onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}>◀</button>
                            <div className="font-semibold">{year}年{month}月</div>
                            <button onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}>▶</button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-4">
                            {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
                                <div key={i} className="text-xs text-center text-gray-600">{d}</div>
                            ))}
                            {calendarDays.map((item, i) => {
                                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(item.day).padStart(2, "0")}`
                                const isSelected = tempSelectedDates.includes(dateStr)
                                return (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            setTempSelectedDates(prev =>
                                                isSelected ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
                                            )
                                        }}
                                        className={`h-8 w-8 text-sm flex items-center justify-center rounded-full cursor-pointer
                ${!item.isCurrentMonth ? "text-gray-300" : isSelected ? "bg-[#E85A71] text-white" : "hover:bg-[#FFF0F0] text-gray-800"}
              `}
                                    >
                                        {item.day}
                                    </div>
                                )
                            })}
                        </div>

                        {/* 保存・キャンセルボタン */}
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setAddDateOpen(false)} className="text-sm text-gray-500 hover:underline">キャンセル</button>
                            <button
                                className="bg-[#E85A71] hover:bg-[#FF8FAB] text-white py-1 px-3 rounded"
                                onClick={async () => {
                                    const toISOFormat = (iso: string) => {
                                        const d = new Date(iso)
                                        const y = d.getFullYear()
                                        const m = String(d.getMonth() + 1).padStart(2, "0")
                                        const day = String(d.getDate()).padStart(2, "0")
                                        return `${y}-${m}-${day}`
                                    }

                                    const formattedDates = tempSelectedDates.map(toISOFormat)

                                    const newDates = [...new Set([...project.dates, ...formattedDates])].sort()

                                    const { error } = await supabase
                                        .from("projects")
                                        .update({ dates: newDates })
                                        .eq("id", project.id)

                                    if (!error) {
                                        setProject({ ...project, dates: newDates })
                                        setTempSelectedDates([])
                                        setAddDateOpen(false)
                                        setOpenDates(prev => {
                                            const updated = { ...prev }
                                            formattedDates.forEach(date => { updated[date] = true })
                                            return updated
                                        })
                                    } else {
                                        alert("追加に失敗しました")
                                    }
                                }}
                            >
                                追加
                            </button>

                        </div>
                    </div>
                </div>
            )}

            <footer className="sticky bottom-0 z-50 bg-white border-t border-gray-200 py-3">
                <div className="max-w-5xl mx-auto px-4">
                    {project.status === "confirmed" ? (
                        <button
                            onClick={async () => {
                                const { error } = await supabase
                                    .from("projects")
                                    .update({ status: "adjusting" })
                                    .eq("id", project.id)

                                if (!error) {
                                    setProject({ ...project, status: "adjusting" })
                                } else {
                                    alert("再調整への切り替えに失敗しました")
                                }
                            }}
                            className="w-full bg-[#FFB7C5] hover:bg-[#E85A71] text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            🔄 再度日程を調整する
                        </button>
                    ) : (
                        <button
                            onClick={async () => {
                                const { error } = await supabase
                                    .from("projects")
                                    .update({ status: "confirmed" })
                                    .eq("id", project.id)

                                if (!error) {
                                    setProject({ ...project, status: "confirmed" })
                                } else {
                                    alert("日程の確定に失敗しました")
                                }
                            }}
                            className="w-full bg-[#E85A71] hover:bg-[#FF8FAB] text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            ✅ 日程を確定する
                        </button>
                    )}
                </div>
            </footer>


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