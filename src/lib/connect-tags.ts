// Constants shared by client components and server code alike - kept free of
// any server-only imports (e.g. prisma) so client bundles can import it directly.

// Full interest tag list, shown as selectable chips in the Connect profile
// setup form. Order is preserved from the product spec.
export const CONNECT_TAGS = [
  "ศิลปะ", "วาดรูป", "ออกแบบ", "ดนตรี", "เล่นเครื่องดนตรี", "ร้องเพลง", "คอนเสิร์ต",
  "ภาพยนตร์", "ซีรีส์", "อนิเมะ", "เกม", "บอร์ดเกม", "อ่านหนังสือ", "เขียนนิยาย",
  "ถ่ายภาพ", "ท่องเที่ยว", "เดินป่า", "ตั้งแคมป์", "ทะเล", "ภูเขา", "คาเฟ่",
  "ชิมอาหาร", "ทำอาหาร", "ทำขนม", "กาแฟ", "ชา", "กีฬา", "ฟุตบอล", "บาสเกตบอล",
  "แบดมินตัน", "ว่ายน้ำ", "วิ่ง", "ฟิตเนส", "โยคะ", "เต้น", "ปั่นจักรยาน",
  "ชอบหมา", "ชอบแมว", "รักสัตว์", "อาสาสมัคร", "เทคโนโลยี", "โปรแกรมมิ่ง", "AI",
  "ธุรกิจ", "การลงทุน", "สตาร์ทอัพ", "แฟชั่น", "แต่งตัว", "แต่งหน้า", "สกินแคร์",
  "ถ่ายรูปลงโซเชียล", "TikTok", "Instagram", "เกมกระดาน", "ปาร์ตี้", "Nightlife",
  "บาร์", "คาราโอเกะ", "ดูดาว", "ดูพระอาทิตย์ตก", "จิตวิทยา", "พัฒนาตัวเอง",
  "สมาธิ", "ภาษา", "เรียนรู้สิ่งใหม่", "ประวัติศาสตร์", "วิทยาศาสตร์", "ดาราศาสตร์",
  "รถยนต์", "มอเตอร์ไซค์", "E-sports", "สัตว์เลี้ยง", "ของหวาน", "ชานม", "ไวน์",
  "ดูแลสุขภาพ", "Minimal", "Luxury", "Street Fashion", "Cosplay", "K-Pop", "J-Pop",
  "Hip-Hop", "EDM", "Rock", "Jazz", "Classical", "Meme", "การ์ตูน", "DIY",
  "ปลูกต้นไม้", "ตกปลา", "ช้อปปิ้ง", "สะสมของ", "พระเครื่อง", "ไพ่", "หมากรุก",
  "Sudoku", "Escape Room", "เวิร์กชอป", "Networking", "ถ่าย Vlog", "Content Creator",
] as const;

export const CONNECT_MAX_TAGS = 10;
export const CONNECT_MIN_AGE = 18;

// Photos live in a private Blob store, so the raw stored URL isn't directly
// browsable - route it through our authenticated proxy instead.
export function connectPhotoSrc(storedUrl: string): string {
  return `/api/connect/photo?url=${encodeURIComponent(storedUrl)}`;
}
