'use client';

import React, { useState } from 'react';

export default function FitnessApp() {
  // 1. Quản lý trạng thái form đầu vào
  const [formData, setFormData] = useState({
    height: 170,
    weight: 65,
    goal: 'Giảm mỡ & Săn chắc',
    budget: 'Tiết kiệm (tự nấu ăn)',
    timePerDay: 30,
  });

  // 2. Trạng thái Streak & Điểm cá nhân
  const [streak, setStreak] = useState(5);
  const [completedToday, setCompletedToday] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 3. Kế hoạch do AI gợi ý (Mẫu phản hồi mô phỏng)
  const [aiPlan, setAiPlan] = useState<any>(null);

  // 4. Dữ liệu Bảng xếp hạng nhóm mẫu
  const [leaderboard, setLeaderboard] = useState([
    { id: 1, name: 'Bạn (Tôi)', points: 450, streak: 5 },
    { id: 2, name: 'Minh Tuấn', points: 420, streak: 4 },
    { id: 3, name: 'Hoàng Nam', points: 380, streak: 3 },
    { id: 4, name: 'Thu Thảo', points: 290, streak: 2 },
  ]);

  // Xử lý tạo kế hoạch AI
  const handleGeneratePlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setAiPlan({
        advice: `Dựa trên chỉ số (BMI ~${(formData.weight / ((formData.height / 100) ** 2)).toFixed(1)}), ngân sách "${formData.budget}" và thời gian ${formData.timePerDay} phút/ngày:`,
        workouts: [
          'Jumping Jacks (Khởi động) - 3 hiệp x 45s',
          'Bodyweight Squat (Thân dưới) - 4 hiệp x 15 lần',
          'Push-up / Chống đẩy quỳ - 3 hiệp x 10-12 lần',
          'Plank siết bụng - 3 hiệp x 30s',
        ],
        nutrition: [
          'Bữa sáng: Trứng luộc 2 quả + 1 củ khoai lang',
          'Bữa trưa: Ức gà xào rau cải + cơm trắng vừa đủ',
          'Bữa tối: Đậu phụ sốt cà chua + canh rau ngót thịt băm',
        ],
      });
      setIsGenerating(false);
    }, 1200);
  };

  // Xử lý điểm danh hoàn thành hôm nay
  const handleCompleteToday = () => {
    if (!completedToday) {
      setCompletedToday(true);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setLeaderboard((prev) =>
        prev
          .map((item) =>
            item.id === 1
              ? { ...item, points: item.points + 50, streak: newStreak }
              : item
          )
          .sort((a, b) => b.points - a.points)
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto font-sans pb-16">
      {/* Header */}
      <header className="mb-6 flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">🔥 AI Fitness Pro</h1>
          <p className="text-xs text-slate-400">Trợ lý tập luyện & Nhóm bạn cùng tiến</p>
        </div>
        <div className="bg-slate-800 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-slate-700">
          <span className="text-base">🔥</span>
          <span className="font-bold text-amber-400 text-sm">{streak} ngày</span>
        </div>
      </header>

      {/* Thông báo hàng ngày */}
      <div className="mb-5 bg-gradient-to-r from-emerald-950 to-slate-800 border-l-4 border-emerald-500 p-3 rounded-r-lg text-xs flex justify-between items-center">
        <span>⏰ <strong>Thông báo hôm nay:</strong> Bạn có 30 phút rảnh lúc 19:30, sẵn sàng tập nhé!</span>
      </div>

      {/* Khối 1: Khảo sát & Kế hoạch sơ lược */}
      <section className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 mb-6 space-y-3">
        <h2 className="text-sm font-semibold text-emerald-300 uppercase tracking-wide">
          1. Thông số & Nhu cầu cá nhân
        </h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-slate-400">Chiều cao (cm)</label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 mt-1 text-white"
            />
          </div>
          <div>
            <label className="text-slate-400">Cân nặng (kg)</label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 mt-1 text-white"
            />
          </div>
        </div>

        <div className="text-xs">
          <label className="text-slate-400">ĐK Tài chính (Chi tiêu ăn uống/tập)</label>
          <select
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 mt-1 text-white"
          >
            <option value="Tiết kiệm (tự nấu ăn sinh viên)">Tiết kiệm (tự nấu ăn sinh viên)</option>
            <option value="Trung bình (tập gym cơ bản)">Trung bình (tập gym cơ bản)</option>
            <option value="Cao cấp (đầy đủ thực phẩm bổ sung)">Cao cấp (đầy đủ thực phẩm bổ sung)</option>
          </select>
        </div>

        <div className="text-xs">
          <label className="text-slate-400">Thời gian có thể dành mỗi ngày (phút)</label>
          <input
            type="number"
            value={formData.timePerDay}
            onChange={(e) => setFormData({ ...formData, timePerDay: Number(e.target.value) })}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 mt-1 text-white"
          />
        </div>

        <button
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold text-white transition flex justify-center items-center gap-1.5"
        >
          {isGenerating ? 'AI đang phân tích...' : '⚡ Trợ lý AI gợi ý kế hoạch'}
        </button>
      </section>

      {/* Khối 2: Kết quả AI gợi ý */}
      {aiPlan && (
        <section className="bg-slate-800/80 p-4 rounded-xl border border-emerald-500/50 mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-emerald-400">📋 Lộ trình gợi ý từ AI</h2>
          <p className="text-xs text-slate-300 italic">{aiPlan.advice}</p>

          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase mb-1">🏋️ Bài tập trong ngày:</h3>
            <ul className="list-disc pl-4 text-xs space-y-1 text-slate-200">
              {aiPlan.workouts.map((w: string, idx: number) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase mb-1">🥗 Thực đơn gợi ý phù hợp tài chính:</h3>
            <ul className="list-disc pl-4 text-xs space-y-1 text-slate-200">
              {aiPlan.nutrition.map((m: string, idx: number) => (
                <li key={idx}>{m}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleCompleteToday}
            disabled={completedToday}
            className={`w-full py-2.5 rounded-lg text-xs font-bold transition mt-3 ${
              completedToday
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950'
            }`}
          >
            {completedToday ? '✅ Đã hoàn thành & Cộng điểm hôm nay' : '🎯 Hoàn thành bài tập (+50 điểm & +1 Streak)'}
          </button>
        </section>
      )}

      {/* Khối 3: Bảng xếp hạng nhóm (Leaderboard) */}
      <section className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-emerald-300 uppercase tracking-wide">
            🏆 BXH Nhóm "Cùng Tiến"
          </h2>
          <span className="text-xs text-slate-400">Chuỗi nhóm: 12 ngày</span>
        </div>

        <div className="space-y-1.5 text-xs">
          {leaderboard.map((user, idx) => (
            <div
              key={user.id}
              className={`flex justify-between items-center p-2 rounded-lg ${
                user.id === 1 ? 'bg-emerald-950/60 border border-emerald-500/40 font-bold' : 'bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-4 text-center ${idx === 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                  #{idx + 1}
                </span>
                <span>{user.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber-400">🔥 {user.streak}d</span>
                <span className="text-emerald-400 font-semibold">{user.points} pts</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}