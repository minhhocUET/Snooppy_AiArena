# SS - Snoopy Stylist (frontend)

React + Vite + Express: thử đồ 2D và gợi ý phối đồ qua Gemini API.

## Cấu trúc thư mục

```
frontend/
├── public/           # Tài nguyên tĩnh (ảnh nền, mock item, introduction.txt)
├── src/
│   ├── components/
│   ├── data/         # Mock catalog (đồng bộ với API server)
│   ├── pages/
│   └── types/
├── docs/             # Đặc tả / ghi chú nội bộ
├── server.ts         # API + phục vụ Vite trong dev
├── index.html
└── metadata.json     # Metadata AI Studio (nếu deploy từ AI Studio)
```

Thư mục `knowledge/` ở root repo chứa dữ liệu tri thức (JSON) dùng cho mở rộng sau này.

## Chạy local

1. Cài dependency: `npm install` hoặc `bun install`
2. Sao chép `.env.example` → `.env` và đặt `GEMINI_API_KEY`
3. `npm run dev` — mặc định port 3000

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Dev server (Express + Vite) |
| `npm run build` | Build SPA vào `dist/` |
| `npm run start` | Chạy production (cần `NODE_ENV=production` + build trước) |
| `npm run lint` | Kiểm tra TypeScript |

## Chỉnh nội dung intro

Sửa `public/introduction.txt` — trang Intro fetch file này lúc runtime.
