import Image from "next/image"
import { Logo } from "@/components/logo"

export default function LoginPage() {
  // 新規ユーザー状態と既存ユーザー状態を切り替えるためのダミーデータ
  const isNewUser = false // trueに変更すると新規ユーザー画面になります
  const existingUsers = [
    { id: 1, username: "さくら", profileImage: "/anime-pink-hair-girl.png" },
    { id: 2, username: "まっちゃ", profileImage: "/placeholder-g1byb.png" },
    { id: 3, username: "みどり", profileImage: "/anime-girl-green-hair.png" },
  ]

  return (
    <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="large" className="justify-center mb-3" />
          <p className="text-[#666666]">あなたの時間を大切に</p>
        </div>

        {isNewUser ? (
          // 新規ユーザー画面
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-24 h-24 mb-4 bg-[#F8FFF8] rounded-full flex items-center justify-center border-2 border-dashed border-[#90C290] cursor-pointer hover:bg-[#D4E9D7] transition-colors">
                <span className="text-[#4A7856] text-4xl">+</span>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <p className="text-sm text-[#666666]">プロフィール画像をアップロード</p>
            </div>

            <div className="mb-6">
              <label htmlFor="username" className="block text-sm font-medium text-[#4A7856] mb-2">
                ユーザー名
              </label>
              <input
                type="text"
                id="username"
                className="w-full px-4 py-2 border border-[#D4E9D7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C290]"
                placeholder="ユーザー名を入力"
              />
            </div>

            <button className="w-full bg-[#E85A71] hover:bg-[#FF8FAB] text-white font-medium py-2 px-4 rounded-md transition-colors">
              このアカウントで始める
            </button>
          </div>
        ) : (
          // 既存ユーザー画面
          <div>
            <h2 className="text-xl font-medium text-[#4A7856] mb-4 text-center">アカウントを選択</h2>

            <div className="space-y-3 mb-6">
              {existingUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg shadow-sm p-4 flex items-center hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-[#FFB7C5]">
                    <Image
                      src={user.profileImage || "/placeholder.svg"}
                      alt={user.username}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium text-[#333333]">{user.username}</p>
                  </div>
                  <button className="text-sm bg-[#90C290] hover:bg-[#4A7856] text-white py-1.5 px-3 rounded-md transition-colors">
                    ログイン
                  </button>
                </div>
              ))}
            </div>

            <button className="w-full border-2 border-dashed border-[#FF8FAB] text-[#E85A71] font-medium py-2 px-4 rounded-md hover:bg-[#FFF0F3] transition-colors flex items-center justify-center">
              <span className="mr-2">+</span> 新しいユーザーを追加
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-sm text-[#666666]">
        <p>© 2025 Time Matcha</p>
      </div>
    </div>
  )
}
