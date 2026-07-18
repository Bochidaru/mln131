import type { SeatPose } from '../store/useStore'

// Danh sách chỗ ngồi đang có trong cảnh. Ghế tự đăng ký khi mount để vòng lặp
// của Player tìm chỗ ngồi gần nhất mà không cần đọc scene-graph mỗi khung hình.
export const seatRegistry: SeatPose[] = []

export function registerSeat(seat: SeatPose) {
  seatRegistry.push(seat)
  return () => {
    const index = seatRegistry.indexOf(seat)
    if (index >= 0) seatRegistry.splice(index, 1)
  }
}
