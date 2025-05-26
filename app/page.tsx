"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Share2, Users, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"

export default function TimeMatchaLanding() {
    return (
        <div className="min-h-screen bg-[#FFF9F9]">
            {/* Header */}
            <header className="bg-[#FFE5E5] shadow-sm sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    {/* テキストロゴ */}
                    <div className="text-2xl font-bold text-[#4A7856] tracking-wide">
                        Time Matcha
                    </div>

                    {/* ログインボタン */}
                    <Link href="/login">
                        <Button
                            className="bg-[#90C290] text-white font-semibold px-5 py-2 rounded-lg hover:bg-[#E85A71] transition-colors duration-300 shadow-sm"
                        >
                            ログイン
                        </Button>
                    </Link>
                </div>
            </header>


            {/* Hero Section */}
            <section className="py-20 px-4 bg-white text-center">
                <div className="max-w-4xl mx-auto">

                    <Badge className="mb-6 bg-[#FFE5E5] text-[#E85A71] hover:bg-[#FF8FAB] rounded-full">
                        スケジュール調整がもっと簡単に
                    </Badge>
                    <img
                        src="/logo.png" // ← ここをあなたの画像ファイル名に置き換え（例: public/logo.png）
                        alt="Time Matcha ロゴ"
                        className="mx-auto mb-8 w-64 h-auto" // ← w-64 = 約256px、大きく表示されます
                    />
                    <h1 className="text-4xl md:text-6xl font-bold text-[#4A7856] leading-tight">
                        Let's Match Our Time<br />
                        <span className="text-[#4A7856]">with Time Matcha</span>
                    </h1>
                    <p className="text-lg md:text-xl text-[#666666] mb-8 max-w-2xl mx-auto leading-relaxed">
                        友達やグループとのスケジュール調整を、抹茶のように心地よく、シンプルに。
                        みんなの都合を一目で確認して、最適な時間を見つけましょう。
                    </p>
                    <Link href="/login">
                        <Button
                            size="lg"
                            className="bg-[#90C290] hover:bg-[#FF8FAB] text-white px-8 py-6 text-lg rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            Start Scheduling
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* 3-Step Guide */}
            <section className="py-16 px-4 bg-[#FFF9F9]">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-[#333333] mb-12">たった3ステップで完了</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[{
                            title: "1. プロジェクトを作成",
                            icon: <Calendar className="w-8 h-8 text-white" />,
                            text: "イベント名と候補日時を設定するだけ。シンプルで直感的な操作です。"
                        }, {
                            title: "2. リンクをシェア",
                            icon: <Share2 className="w-8 h-8 text-white" />,
                            text: "生成されたリンクを友達に送るだけ。アプリのダウンロードは不要です。"
                        }, {
                            title: "3. みんなの都合を確認",
                            icon: <Users className="w-8 h-8 text-white" />,
                            text: "全員の回答が集まったら、最適な時間を一目で確認できます。"
                        }].map((item, i) => (
                            <Card key={i} className="border-l-4 border-[#FF8FAB] hover:shadow-md transition-shadow rounded-lg">
                                <CardContent className="p-8 text-center">
                                    <div className="w-16 h-16 bg-[#90C290] rounded-lg flex items-center justify-center mx-auto mb-6">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold text-[#333333] mb-4">{item.title}</h3>
                                    <p className="text-[#666666] text-sm">{item.text}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-20 px-4 bg-[#FFE5E5]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#333333] mb-6">
                        友達にリンクを送って、<br />
                        最適な時間を一緒に見つけよう
                    </h2>
                    <p className="text-[#E85A71] text-lg mb-8 max-w-2xl mx-auto">
                        学生グループ、サークル、カジュアルな集まりに最適。Time Matchaで、みんなが参加しやすい時間を見つけましょう。
                    </p>
                    <Button
                        size="lg"
                        onClick={async () => {
                            try {
                                await navigator.clipboard.writeText(window.location.href)
                                alert("リンクをコピーしました！")
                            } catch (err) {
                                alert("コピーに失敗しました")
                            }
                        }}
                        className="bg-white text-[#E85A71] hover:bg-[#FFF9F9] px-8 py-6 text-lg rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                    >
                        リンクをシェアする🫶
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white text-[#666666] py-12 px-4">
                <div className="max-w-6xl mx-auto text-center text-sm">
                    <p>&copy; 2024 Time Matcha. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
