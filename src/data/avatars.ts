export type Avatar = {
  id: string
  name: string
  description: string
  icon: string
  suit: string
  accent: string
  skin: string
}

// Original low-poly archetypes: light enough to render for every remote player.
export const avatars: Avatar[] = [
  { id: 'block-explorer', name: 'Nhà thám hiểm khối', description: 'Phiêu lưu pixel', icon: '◼', suit: '#5b8fd8', accent: '#e4bd5b', skin: '#d6a27d' },
  { id: 'forest-scout', name: 'Trinh sát rừng', description: 'Lá ngụy trang', icon: '▲', suit: '#487550', accent: '#c9df89', skin: '#c88e69' },
  { id: 'mushroom-captain', name: 'Đội trưởng nấm', description: 'Nhỏ mà có võ', icon: '●', suit: '#d94b43', accent: '#f4e3c5', skin: '#efbd91' },
  { id: 'neon-ninja', name: 'Ninja neon', description: 'Bóng đêm thành phố', icon: '◆', suit: '#35305f', accent: '#6ee7d4', skin: '#9c6e58' },
  { id: 'space-marshal', name: 'Cảnh vệ vũ trụ', description: 'Từ một thiên hà xa', icon: '✦', suit: '#dadde1', accent: '#cc4e4a', skin: '#8f6252' },
  { id: 'rubber-duck', name: 'Vịt cao su', description: 'Meme thư giãn', icon: '◒', suit: '#efc538', accent: '#f5803e', skin: '#f1c934' },
  { id: 'banana-agent', name: 'Đặc vụ chuối', description: 'Nhiệm vụ tối mật', icon: '⌒', suit: '#e4d152', accent: '#332f2a', skin: '#f4d75c' },
  { id: 'capybara-king', name: 'Vua capybara', description: 'Bình tĩnh tuyệt đối', icon: '▬', suit: '#876247', accent: '#e0b069', skin: '#9c7151' },
  { id: 'pixel-knight', name: 'Hiệp sĩ pixel', description: 'Giáp sáng lấp lánh', icon: '✚', suit: '#6c7590', accent: '#d8b16c', skin: '#d0a078' },
  { id: 'robo-gecko', name: 'Tắc kè robot', description: 'Đổi màu theo ý thích', icon: '≋', suit: '#3f9b88', accent: '#e7607d', skin: '#78cbb7' },
]

export const defaultAvatarId = avatars[0].id

export function getAvatar(id?: string) {
  return avatars.find((avatar) => avatar.id === id) ?? avatars[0]
}
