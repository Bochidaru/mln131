# Bảo tàng Tri thức MLN131

Trải nghiệm bảo tàng 3D tương tác về học phần Chủ nghĩa xã hội khoa học. Người xem bắt đầu trước cổng chính, tự đi qua quảng trường và đại sảnh, sau đó khám phá tám phòng chuyên đề trên một mặt bằng bảo tàng hoàn chỉnh.

## Chạy tại máy

```powershell
Set-Location 'D:\virtual-museum'
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

Mở `http://127.0.0.1:4173` trong Chrome hoặc Edge.

### Điều khiển

- `W A S D` hoặc phím mũi tên: di chuyển.
- Chuột: quan sát; nhấp vào cảnh 3D để khóa chuột, `Q` để bật/tắt chế độ điều khiển.
- `Space`: nhảy.
- `Shift`: đi nhanh.
- `E` hoặc nhấp chuột: xem hiện vật đang được ngắm; `E` hoặc `Esc` để đóng và tiếp tục di chuyển.
- Điện thoại: joystick bên trái để đi, vuốt nửa phải để nhìn.

## Kiểm tra trước khi triển khai

```powershell
npm run lint
npm run build
npm run smoke -- http://127.0.0.1:4173
npm run capture -- http://127.0.0.1:4173 final
```

`smoke` dùng Chrome cài trên Windows để kiểm tra mở/đóng hồ sơ hiện vật. `capture` ghi các góc intro, cổng, sảnh, hành lang, gallery và mobile vào `_artifacts/` để duyệt trực quan.

## Cấu trúc chính

- `src/data/content.ts`: nội dung 9 khu và 29 hiện vật.
- `src/data/layout.ts`: mặt bằng dùng chung cho cảnh 3D, collision và minimap.
- `src/components/Exterior.tsx`: cổng, sân, cảnh quan và mặt tiền.
- `src/components/MuseumInterior.tsx`: sảnh, hành lang, gallery, biển tên và nội thất.
- `public/posters/`: 29 poster WebP của triển lãm.

Thư mục `dist/` được tạo bởi `npm run build` và có thể triển khai lên dịch vụ host tĩnh hỗ trợ Vite.
