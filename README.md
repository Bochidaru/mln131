# Bảo tàng ảo 3D — Hành trình Chủ nghĩa xã hội khoa học

Trải nghiệm bảo tàng 3D trên trình duyệt với chín không gian, 24 poster minh họa và nội dung tóm lược bảy chương của học phần.

## Chạy cục bộ

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal. Trên desktop, dùng `WASD` để đi, chuột để nhìn và `ESC` để thả chuột. Trên thiết bị cảm ứng, dùng joystick trái và vuốt vùng bên phải.

## Build production

```bash
npm run build
npm run preview
```

Thư mục `dist/` có thể triển khai trực tiếp lên Vercel, Netlify hoặc GitHub Pages.

## Ghi chú nội dung và hình ảnh

- Nội dung được tổ chức tập trung trong `src/data/content.ts` để giao diện 3D và fallback 2D dùng chung.
- 24 poster là hình minh họa AI nguyên bản, không dùng chân dung nhân vật lịch sử, không chứa chữ hoặc biểu trưng.
- Âm thanh ambient, bước chân và click được tổng hợp cục bộ, không dùng bản ghi có bản quyền từ bên ngoài.
