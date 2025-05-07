import { CalendarClock, LogOut, Plus, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

// サンプルデータ
const projects = [
  {
    id: 1,
    name: "チームミーティング",
    members: 8,
    lastUpdated: "2024-05-05",
    responded: true,
  },
  {
    id: 2,
    name: "プロジェクト計画",
    members: 5,
    lastUpdated: "2024-05-03",
    responded: false,
  },
  {
    id: 3,
    name: "週次振り返り",
    members: 12,
    lastUpdated: "2024-05-01",
    responded: true,
  },
  {
    id: 4,
    name: "クライアントプレゼン",
    members: 4,
    lastUpdated: "2024-04-28",
    responded: false,
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CalendarClock className="h-6 w-6 text-emerald-500" />
            <span className="font-bold text-xl text-gray-800">スケジュールアプリ</span>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-600">
            <LogOut className="h-4 w-4 mr-2" />
            ログアウト
          </Button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">プロジェクト一覧</h1>
        </div>

        {/* プロジェクトカードのグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold text-gray-800">{project.name}</h2>
                  <Badge variant={project.responded ? "success" : "destructive"}>
                    {project.responded ? "応答済み" : "未応答"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center text-gray-600 mb-2">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{project.members}人のメンバー</span>
                </div>
                <div className="text-sm text-gray-500">
                  最終更新: {new Date(project.lastUpdated).toLocaleDateString("ja-JP")}
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 pt-3 pb-3">
                <Link href={`/projects/${project.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    詳細を見る
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* 新規プロジェクト作成ボタン */}
        <div className="fixed bottom-8 right-8">
          <Button className="rounded-full h-14 w-14 p-0 shadow-lg bg-emerald-500 hover:bg-emerald-600">
            <Plus className="h-6 w-6" />
            <span className="sr-only">新規プロジェクト作成</span>
          </Button>
        </div>
      </main>
    </div>
  )
}
