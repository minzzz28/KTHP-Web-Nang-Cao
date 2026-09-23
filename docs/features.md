# Trạng thái chức năng

## Cách đọc trạng thái

Tài liệu này phân biệt rõ phạm vi dữ liệu, API và giao diện. **“Có mã nguồn” không đồng nghĩa “đã nghiệm thu”**: chỉ đánh dấu hoàn tất sau khi migration/seed, test liên quan và build client đã được kiểm tra. Contract chi tiết nằm ở [api.md](api.md); quyền nghiệp vụ ở [use-cases.md](use-cases.md).

| Nhãn | Ý nghĩa |
| --- | --- |
| Có mã nguồn | Có route/service hoặc page/component tương ứng trong repository |
| Theo contract | Schema/seed hoặc contract API đã định nghĩa, nhưng chưa xem là luồng end-to-end |
| Ngoài phạm vi phiên bản đầu | Có chủ ý không tích hợp, không phải dữ liệu giả |

## Năng lực chính

| Nhóm chức năng | Role | Phạm vi đã được thiết kế/cài đặt | Mức xác nhận |
| --- | --- | --- | --- |
| Authentication & profile | Public, mọi role | Đăng ký STUDENT/LANDLORD với ít nhất username hoặc email; đăng nhập bằng một trong hai, JWT, logout, profile và đổi mật khẩu; ADMIN do seed tạo | Có mã nguồn |
| RBAC/ownership | Mọi role | Middleware xác thực, role guard, kiểm tra chủ sở hữu ở workflow riêng | Có mã nguồn; cần test API theo route |
| University & vị trí | Public, ADMIN | Danh sách trường/tọa độ, cờ `isPrimary`; seed chọn Đại học Phenikaa làm trường trung tâm và CRUD quản trị theo contract | Có mã nguồn / theo contract quản trị |
| Property & room | Public, LANDLORD, ADMIN | Khu trọ, phòng, URL hoặc upload ảnh cục bộ, tiện ích, lịch sử giá và nearby place | Có mã nguồn / theo contract |
| Tìm kiếm phòng | Public | Keyword, giá, diện tích, loại, chỗ trống, tiện ích, phân trang/sắp xếp; không lọc room ở frontend | Có mã nguồn / theo contract |
| Gần trường & bản đồ | Public | Haversine, bán kính, ước tính di chuyển, marker Leaflet/OpenStreetMap; mặc định ưu tiên Phenikaa nhưng vẫn đổi trường được | Có mã nguồn / theo contract |
| Gợi ý & so sánh | STUDENT, Public | Rule-based score 0–100 có lý do; bảng so sánh tối đa một nhóm room từ query | Có mã nguồn / theo contract |
| Favorite | STUDENT | Thêm, bỏ, liệt kê; unique `(studentId, roomId)` | Có mã nguồn / theo contract |
| Ở ghép | STUDENT, Public đọc bài | Profile, matching score, post, request, rental group, member; lời mời đã chấp nhận mở được chat riêng | Có mã nguồn / theo contract |
| Chat | Thành viên conversation | Direct/group conversation, lịch sử DB, Socket.IO `message:new` | Có mã nguồn / theo contract |
| Lịch xem | STUDENT, LANDLORD | Tạo và phản hồi/trạng thái lịch xem | Theo contract; xác minh lại route/UI trước demo |
| Contract & tenant | STUDENT, LANDLORD | Hợp đồng, nhiều tenant, trạng thái và quyền đọc liên quan | Theo contract; xác minh lại route/UI trước demo |
| Invoice | STUDENT, LANDLORD | Meter, item, tổng tiền và trạng thái thanh toán | Hàm tính + schema/seed có mã nguồn; workflow xác minh trước demo |
| Review | STUDENT, LANDLORD, ADMIN | Review theo contract/tenant và moderation | Theo contract; xác minh lại route/UI trước demo |
| Report & verification | Mọi role, ADMIN xử lý | Tạo yêu cầu/báo cáo, workflow trạng thái và admin note | Theo contract; xác minh lại route/UI trước demo |
| Notification | Mọi role | Danh sách/read-unread, dữ liệu seed và event nghiệp vụ khi module gọi helper | Theo contract; xác minh lại route/UI trước demo |
| Dashboard quản trị | Theo role | Route UI dành cho STUDENT, LANDLORD, ADMIN và số liệu dashboard theo API | Theo contract; xác minh build client trước demo |

## Bằng chứng nền tảng đã có

- Prisma schema bao phủ các model yêu cầu, migration MySQL và seed quan hệ thay vì fixture JSON frontend.
- `calculation.service.js` hiện thực Haversine, ước tính đi bộ/xe đạp/xe máy, room matching, roommate matching và công thức invoice.
- Lớp server có JWT, bcrypt, Zod, Helmet, CORS, rate limit, error handler và Socket.IO authentication.
- Client dùng React Router, Axios, Bootstrap, Leaflet/react-leaflet, protected route, toast, loading/error/empty-state component.

## Hạn chế có chủ ý

| Hạng mục | Trạng thái/ghi chú |
| --- | --- |
| Routing giao thông thật | Ngoài phạm vi; thời gian di chuyển là ước tính theo khoảng cách |
| Tìm vị trí từ địa chỉ | Chủ trọ nhập địa chỉ rồi chủ động bấm nút để lấy và chọn vị trí; server giới hạn tốc độ/cache Nominatim, không dùng autocomplete |
| Thanh toán trực tuyến | Ngoài phạm vi phiên bản đầu; landlord cập nhật trạng thái invoice |
| Chữ ký số hợp đồng | Ngoài phạm vi; hợp đồng được hiển thị/quản lý như dữ liệu ứng dụng |
| Zalo/Telegram API | Không dùng API không chính thức; chỉ lưu URL do người dùng cung cấp |
| Upload/cloud storage | `POST /api/rooms/:id/images/upload` lưu tối đa 8 ảnh JPEG/PNG/WebP cục bộ dưới `/uploads`; room vẫn nhận URL ảnh JSON. Cloud storage là ngoài phạm vi phiên bản đầu |

## Tiêu chí nghiệm thu một feature

Một feature chỉ chuyển từ “có mã nguồn/theo contract” sang hoàn tất khi có đủ:

1. Schema/migration/seed tương ứng (nếu có dữ liệu).
2. Validation, authentication, role và ownership ở backend.
3. UI lấy dữ liệu qua API, có loading/error/empty state và responsive.
4. Test nghiệp vụ/API liên quan và build package ảnh hưởng chạy thành công.
5. API, database, use case và demo script được cập nhật cùng thay đổi.
