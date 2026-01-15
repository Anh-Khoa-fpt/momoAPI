# MoMo Test API (Node.js)

API nhỏ dùng để test thanh toán MoMo (capture wallet) từ frontend tĩnh trên Vercel hoặc bất kỳ host nào.

## Các bước

1. Sao chép `.env.example` thành `.env` và chỉnh lại các biến:
   - `PARTNER_CODE`, `ACCESS_KEY`, `SECRET_KEY`: lấy từ trang quản trị MoMo.
   - `REDIRECT_URL`, `IPN_URL`: URL frontend của bạn hoặc webhook thử nghiệm.
2. Chạy `npm install` để cài dependencies (`express`, `axios`, `dotenv`).
3. Khởi chạy server: `npm start`. Mặc định chạy port `3000`, có thể ghi đè bằng `PORT`.
4. Từ frontend static, gọi tới:
   ```bash
   POST /api/momo/create-payment
   Content-Type: application/json
   ```

   Body ví dụ:
   ```json
   {
     "amount": 50000,
     "orderInfo": "Test giao dịch",
     "redirectUrl": "https://your-frontend/return",
     "ipnUrl": "https://your-frontend/ipn"
   }
   ```

   Server trả về JSON từ endpoint MoMo, bạn chỉ cần redirect người dùng tới `payUrl`.

5. Không quên tắt Miền CORS/guard nếu cần (Vercel cũng hỗ trợ buil-in proxy nếu cần).

## CORS

- `ALLOWED_ORIGINS` trong `.env` lưu danh sách origin cho phép gọi API (`http://localhost:19006,http://localhost:19000` mặc định). Nếu frontend của bạn chạy ở URL khác, thêm vào danh sách để tránh lỗi CORS.


## Routes hỗ trợ

- `GET /` — kiểm tra server đang chạy.
- `POST /api/momo/create-payment` — tạo payload theo docs MoMo và lấy URL thanh toán.
- `POST /api/momo/ipn` — endpoint đơn giản để nhận callback (in payload ra console).
