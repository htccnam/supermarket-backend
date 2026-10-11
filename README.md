# Supermarket Backend

REST API quản lý siêu thị bằng Node.js, Express, TypeScript, Prisma và PostgreSQL.

## Chạy local

```powershell
npm install
docker compose up -d db
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

API mặc định chạy tại `http://localhost:3000`.

## Chức năng

- JWT trong HttpOnly Cookie và phân quyền STAFF/ADMIN.
- Sản phẩm, tồn kho, hóa đơn và thanh toán tiền mặt/thẻ.
- Transaction khi tạo/hủy hóa đơn để bảo toàn tồn kho.
- Admin dashboard, quản lý nhân sự và audit log.
- OpenAPI contract tại `openapi.yaml`.
- Chạy độc lập bằng Docker Compose.
