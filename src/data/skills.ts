export type UltimateSkillId = 'momentum' | 'veil' | 'blink' | 'overdrive' | 'feather' | 'rewind'

export interface UltimateSkillDefinition {
  id: UltimateSkillId
  name: string
  shortName: string
  description: string
  duration: string
  cooldown: number
  price: number
  accent: string
}

export const DEFAULT_ULTIMATE_SKILL: UltimateSkillId = 'momentum'
export const ULTIMATE_SKILL_PRICE = 20

export const ultimateSkills: UltimateSkillDefinition[] = [
  {
    id: 'momentum',
    name: 'Đà Tiến',
    shortName: 'Đà Tiến',
    description: 'Tăng 25% tốc độ di chuyển trong thời gian ngắn. Ultimate cân bằng dành cho mọi người chơi.',
    duration: '4 giây',
    cooldown: 30,
    price: 0,
    accent: '#d8b16c',
  },
  {
    id: 'veil',
    name: 'Màn Ảnh',
    shortName: 'Tàng Hình',
    description: 'Ẩn model khỏi đối thủ trong 3 giây. Bắn súng sẽ làm hiệu ứng kết thúc ngay.',
    duration: '3 giây',
    cooldown: 30,
    price: ULTIMATE_SKILL_PRICE,
    accent: '#78d7c4',
  },
  {
    id: 'blink',
    name: 'Dịch Chuyển',
    shortName: 'Blink',
    description: 'Lập tức dịch chuyển tối đa 10 m theo hướng tâm ngắm, tự dừng trước tường và vật cản.',
    duration: 'Tức thời',
    cooldown: 30,
    price: ULTIMATE_SKILL_PRICE,
    accent: '#67b8ff',
  },
  {
    id: 'overdrive',
    name: 'Quá Tốc',
    shortName: 'Quá Tốc',
    description: 'Tăng 60% tốc độ di chuyển trong 5 giây để đổi góc bắn hoặc thoát giao tranh.',
    duration: '5 giây',
    cooldown: 30,
    price: ULTIMATE_SKILL_PRICE,
    accent: '#ff8b55',
  },
  {
    id: 'feather',
    name: 'Khinh Thân',
    shortName: 'Khinh Thân',
    description: 'Giảm 55% trọng lực trong 6 giây, giúp những cú nhảy xa và khó đoán hơn.',
    duration: '6 giây',
    cooldown: 30,
    price: ULTIMATE_SKILL_PRICE,
    accent: '#df9cff',
  },
  {
    id: 'rewind',
    name: 'Hồi Vị',
    shortName: 'Hồi Vị',
    description: 'Quay về vị trí của chính bạn cách đây 3 giây mà không thay đổi HP hay điểm số.',
    duration: 'Tức thời',
    cooldown: 30,
    price: ULTIMATE_SKILL_PRICE,
    accent: '#9ee06f',
  },
]

export const ultimateSkillById = Object.fromEntries(ultimateSkills.map((skill) => [skill.id, skill])) as Record<UltimateSkillId, UltimateSkillDefinition>
