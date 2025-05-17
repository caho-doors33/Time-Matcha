import Image from "next/image"
import { Logo } from "@/components/logo"
import Link from "next/link"

export default function HomePage() {
  // ダミープロジェクトデータ（ステータス情報を追加）
  const projects = [
    {
      id: 1,
      name: "社内会議の準備",
      createdAt: "2025年5月1日",
      status: "adjusting", // 予定調整中
    },
    {
      id: 2,
      name: "新商品発表会",
      createdAt: "2025年5月3日",
      status: "confirmed", // 予定確定済み
    },
    {
      id: 3,
      name: "週末の旅行計画",
      createdAt: "2025年5月5日",
      status: "adjusting", // 予定調整中
    },
    {
      id: 4,
      name: "誕生日パーティー",
      createdAt: "2025年5月10日",
      status: "confirmed", // 予定確定済み
    },
  ]

  return (
    <div className="min-h-screen bg-[#F8FFF8]">
      {/* トップバー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo />

          <div className="flex items-center">
            <div className="text-right mr-3">
              <p className="text-sm font-medium text-[#333333]">まっちゃ</p>
              <p className="text-xs text-[#666666]">ログイン中</p>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#90C290]">
              <Image
                src="/placeholder-g1byb.png"
                alt="ユーザーアイコン"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#4A7856]">プロジェクト一覧</h2>
          <p className="text-sm text-[#666666]">合計: {projects.length}件</p>
        </div>

        {/* プロジェクトリスト */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border-l-4 border-[#FFB7C5]"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-[#333333]">{project.name}</h3>
                <div className="flex space-x-2">
                  <Link href={`/projects/${project.id}`}>
                    <button className="text-xs bg-[#D4E9D7] hover:bg-[#90C290] text-[#4A7856] hover:text-white py-1 px-2 rounded transition-colors">
                      編集
                    </button>
                  </Link>
                  <button className="text-xs bg-[#FFE5E5] hover:bg-[#FF8FAB] text-[#E85A71] hover:text-white py-1 px-2 rounded transition-colors">
                    削除
                  </button>
                </div>
              </div>

              {/* ステータス表示を追加 */}
              <div className="flex items-center mb-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    project.status === "adjusting" ? "bg-[#FF8FAB]" : "bg-[#90C290]"
                  }`}
                ></span>
                <span className="text-xs text-[#666666]">
                  {project.status === "adjusting" ? "予定調整中" : "予定確定済み"}
                </span>
              </div>

              <p className="text-xs text-[#666666]">作成日: {project.createdAt}</p>
            </div>
          ))}
        </div>

        {/* 新規プロジェクト作成ボタン */}
        <div className="fixed bottom-6 right-6">
          <Link href="/projects/new">
            <button className="bg-[#E85A71] hover:bg-[#FF8FAB] text-white h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-colors">
              <span className="text-2xl">+</span>
            </button>
          </Link>
        </div>
      </main>
    </div>
  )
}
