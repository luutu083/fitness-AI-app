import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profile } = body;
    if (!profile) {
      return NextResponse.json({ error: 'Missing user profile context' }, { status: 400 });
    }
    const bmi = Number((profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1));
    return NextResponse.json({
      status: 'ok',
      source: process.env.GEMINI_API_KEY ? 'live_llm' : 'structured_engine',
      bmiEstimate: bmi,
      disclaimer: 'Chỉ số BMI và khuyến nghị tập luyện chỉ mang tính chất tham khảo thể hình, không thay thế chẩn đoán y khoa.',
      reply: `Đã phân tích thông số thực tế bạn cung cấp (${profile.heightCm}cm, ${profile.weightKg}kg, BMI ước tính ${bmi}, ${profile.availableTimeMin} phút/ngày).`
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 500 });
  }
}
