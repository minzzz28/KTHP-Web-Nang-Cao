# Thiết kế cơ sở dữ liệu

## Nguồn chuẩn và migration

- Database: **MySQL** với `utf8mb4`/`utf8mb4_unicode_ci`.
- Entity TypeORM: [`server/src/database/entities`](../server/src/database/entities).
- Prisma schema hiện hữu: [`server/prisma/schema.prisma`](../server/prisma/schema.prisma),
  dùng làm baseline để đối chiếu trong giai đoạn chuyển đổi.
- Migration khởi đầu: `server/prisma/migrations/20260907160000_init/`.
- Migration trường trung tâm: `server/prisma/migrations/20260911020000_add_primary_university/`.
- Dữ liệu demo lặp lại an toàn bằng upsert: [`server/prisma/seed.js`](../server/prisma/seed.js).

Entity TypeORM và migration TypeORM là hướng quản lý schema mới. Repository vẫn giữ
migration Prisma khởi đầu để dựng database legacy, nhưng một thay đổi schema chỉ
được sở hữu bởi **một** ORM. Không bật `synchronize` trên database dùng chung và
không sửa trực tiếp dữ liệu production để “vá” schema.

```bash
npm run migration:generate --workspace=server -- src/database/migrations/<ten_thay_doi>
npm run migration:run --workspace=server
```

Trong môi trường triển khai dùng migration TypeORM đã review. Chỉ dùng lệnh
`prisma:*` cũ để tái tạo baseline legacy khi cần, không dùng đồng thời với
migration TypeORM mới.

## Các nhóm bảng đã chuẩn hóa

| Nhóm | Bảng | Mục đích |
| --- | --- | --- |
| Tài khoản | `users`, `student_profiles`, `landlord_profiles`, `verification_requests` | Lưu định danh đăng nhập `username` và/hoặc `email`, hồ sơ theo role và quy trình xác minh |
| Vị trí/tin đăng | `universities`, `properties`, `rooms`, `room_images`, `amenities`, `room_amenities`, `nearby_places` | Tách khu trọ, phòng, ảnh, tiện ích N–N, tiện ích lân cận và trường trung tâm (`universities.is_primary`) |
| Quan tâm/tìm kiếm | `favorites`, `room_price_histories`, `room_views` | Lưu quan hệ sinh viên–phòng và lịch sử không bị mất khi giá thay đổi |
| Ở ghép | `roommate_profiles`, `roommate_posts`, `roommate_requests`, `rental_groups`, `group_members` | Hồ sơ sở thích, bài đăng, lời mời và thành viên nhóm |
| Chat | `conversations`, `conversation_members`, `messages` | Conversation N–N với người dùng và lịch sử tin nhắn bền vững |
| Thuê/hóa đơn | `viewing_appointments`, `contracts`, `contract_tenants`, `invoices`, `invoice_items` | Lịch xem, hợp đồng nhiều người thuê, hóa đơn theo kỳ và dòng chi tiết |
| Kiểm duyệt | `reviews`, `reports`, `notifications` | Đánh giá có căn cứ hợp đồng, xử lý báo cáo và thông báo cá nhân |

Mỗi thực thể có khóa số nguyên tự tăng. Hầu hết bảng có `created_at`/`updated_at`; các bản ghi lịch sử như `room_views`, `room_price_histories` và `invoice_items` giữ timestamp cần thiết. `messages` lưu `sent_at` nhưng có hỗ trợ sửa nội dung và soft-delete (`edited_at`, `is_deleted`), vì vậy không được mô tả như log bất biến.

## Quan hệ và ràng buộc quan trọng

- `users` có tối đa một `student_profiles` và một `landlord_profiles`; service kiểm tra profile phù hợp role.
- `users.username` và `users.email` đều có thể `NULL` ở cấp schema để hỗ trợ đăng ký chỉ bằng một định danh, nhưng validator/service bắt buộc có ít nhất một giá trị. Mỗi giá trị có unique riêng; username được lưu/so sánh lowercase để tránh trùng khác hoa/thường.
- `universities.is_primary` đánh dấu trường trung tâm được ưu tiên khi khám phá phòng. Service giao dịch khi đổi trường trung tâm, không cho xóa trường đang được ưu tiên và không cho bỏ cờ của trường đó khi chưa có trường thay thế.
- Một `Property` thuộc một landlord và có nhiều `Room`; mã phòng chỉ duy nhất trong một property: `(property_id, code)`.
- `Room` và `Amenity` là N–N qua `room_amenities` có khóa chính kép. Ảnh có thứ tự duy nhất theo `(room_id, sort_order)`.
- Favorite không thể trùng nhờ `(student_id, room_id)`. Giá cũ/mới nằm trong `room_price_histories`, không xóa khi cập nhật phòng.
- `RoommateRequest.activePairKey` chỉ được set khi trạng thái `PENDING`, nhờ đó chặn một lời mời chờ trùng cho cùng cặp; service xóa key khi kết thúc workflow.
- Thành viên nhóm, conversation và hợp đồng dùng bảng nối có thuộc tính nghiệp vụ: `group_members`, `conversation_members`, `contract_tenants`.
- Direct conversation dùng `direct_pair_key` đã sắp xếp ID; mỗi rental group tối đa có một conversation qua `rental_group_id` unique.
- Một invoice là duy nhất theo `(contract_id, period_start, period_end)` và có số hóa đơn unique. Một sinh viên chỉ review một hợp đồng một lần qua `(contract_id, student_id)`.
- Report có `target_type` và đúng một đích (`target_user_id`, `room_id`, `roommate_post_id` hoặc `review_id`) do validator/service bảo đảm.

ERD đầy đủ theo nhóm có tại [erd.md](erd.md).

## Kiểu dữ liệu và chỉ mục

- Tiền tệ dùng `DECIMAL(12,2)`; diện tích `DECIMAL(8,2)`; tọa độ `DECIMAL(10,7)` để tránh lỗi làm tròn floating point.
- Các enum biểu diễn trạng thái role, room, request, contract, invoice, report và notification, ngăn dữ liệu trạng thái tự do.
- Index phục vụ các luồng thường dùng: `rooms(status, price)`, `rooms(type, status)`, `properties(city, district)`, tọa độ property/university, thời điểm tạo room, profile/roommate, appointment, contract, invoice, review, report và notification.
- Key unique bảo vệ username, email, số điện thoại (nếu có), mã/school email sinh viên, mã/tên trường, slug property, mã hợp đồng/hóa đơn và các bảng nối nêu trên.

## Xóa dữ liệu và lịch sử

Quan hệ phụ thuần túy (ảnh phòng, mapping tiện ích, favorite, room view, notification) dùng cascade khi cha bị xóa. Dữ liệu có ý nghĩa lịch sử như room, property, contract, invoice, review, report, message hoặc appointment dùng `RESTRICT`/`SET NULL` phù hợp để tránh mất lịch sử thuê và kiểm duyệt. Quyết định xóa room/property phải đi qua service, không gọi cascade tùy tiện.

## Bất biến tính toán

Các điều kiện không biểu diễn trọn vẹn bằng FK/enum được kiểm tra ở Zod/service:

- Giá, diện tích và sức chứa hợp lệ; `availableSlots` không vượt `capacity`.
- `endDate` của hợp đồng sau `startDate`.
- Chỉ số điện/nước cuối không nhỏ hơn chỉ số đầu.
- `electricityUsage = end - start`, `waterUsage = end - start`.
- `totalAmount = rent + electricityAmount + waterAmount + internet + parking + service + other`.
- Rating nằm trong thang hợp lệ; review phải gắn với tenant/contract đủ điều kiện.
- Latitude/longitude, role/ownership và đích report được kiểm tra trước khi ghi dữ liệu.
- Trường trung tâm phải được duy trì qua service; seed luôn có một trường `is_primary` (Đại học Phenikaa).

## Seed demo

Seed tạo ADMIN, STUDENT và LANDLORD demo với cả username lowercase và email `@gmail.com`, cùng trường đại học, khu trọ, phòng, tiện ích, tọa độ, favorite, luồng ở ghép/chat, lịch xem, hợp đồng, hóa đơn, review, report, notification và nearby place. Đại học Phenikaa được seed với `is_primary: true`, kèm các phòng mẫu quanh trường. Mật khẩu demo được bcrypt hash; `123` chỉ dùng cho môi trường phát triển. Danh sách tài khoản và cách khởi chạy ở [README](../README.md).
