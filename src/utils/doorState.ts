// Trạng thái mở của cửa tự động ở lối vào (0 = đóng, 1 = mở hết).
// Đặt ngoài store React/zustand để vòng lặp animation (EntranceDoor) ghi và
// bộ giải va chạm (useCollision) đọc mỗi khung hình mà không gây re-render.
export const entranceDoorState = { openAmount: 0 }
