# Use cases theo vai trò

Các use case dưới đây mô tả quyền nghiệp vụ mà API và route giao diện áp dụng. Chúng không thay thế authorization ở server: mọi thao tác ghi phải kiểm tra JWT, role và ownership. Contract HTTP tương ứng xem tại [api.md](api.md).

## Quy ước chung

- Người dùng phải có tài khoản `ACTIVE`; role lấy từ access token, không lấy từ dữ liệu do client tự khai.
- `STUDENT`, `LANDLORD` và `ADMIN` là ba role duy nhất. ADMIN không đăng ký ở giao diện; seed tạo tài khoản demo.
- Đăng ký cần ít nhất một định danh: username hoặc email. Người dùng có cả hai có thể đăng nhập bằng một trong hai; username được chuẩn hóa lowercase, unique không phân biệt hoa/thường và không chứa `@`.
- Với resource thuộc sở hữu, service xác minh liên kết thực tế: property/room của landlord, post/profile của student, membership conversation/group, tenant của contract/invoice.
- Public chỉ xem dữ liệu được công khai/không bị ẩn. Các thao tác tạo, sửa, xóa có validation và trả envelope lỗi nhất quán.

## STUDENT

| Use case | Điều kiện | Luồng chính | Kết quả/quyền |
| --- | --- | --- | --- |
| Đăng ký và đăng nhập | Chưa có tài khoản / thông tin hợp lệ | Đăng ký role STUDENT bằng username, email hoặc cả hai; đăng nhập với `identifier` là username/email, nhận JWT rồi xem/cập nhật profile hoặc đổi password | Không tạo ADMIN qua register; phải có ít nhất một định danh; password không trả về client |
| Tìm phòng | Public hoặc STUDENT | Mặc định tìm quanh Đại học Phenikaa; có thể chọn keyword, giá, diện tích, loại, chỗ trống, tiện ích, trường/bán kính và sort | Server lọc/phân trang, không tải toàn bộ rồi lọc ở browser |
| Xem phòng trên bản đồ/chi tiết | Có room công khai | Mở map ưu tiên tâm Đại học Phenikaa, mở marker hoặc room detail, và có thể chọn university khác để xem km/thời gian | Xem tọa độ, tiện ích, giá, review, nearby place và lịch sử giá theo contract |
| So sánh/gợi ý phòng | Có 2–4 room / preference | So sánh trường giá trị; gửi preference cho rule-based scoring | Score 0–100 có lý do, không dùng ML hoặc số liệu giả |
| Quản lý favorite | Đã đăng nhập STUDENT | Thêm/bỏ room; mở danh sách saved | Mỗi room chỉ được lưu một lần cho mỗi student |
| Hồ sơ và tìm người ở ghép | Đã đăng nhập STUDENT | Tạo/cập nhật RoommateProfile, tìm profile, xem matching | Chỉ owner sửa profile; kết quả nêu điểm chung/khác biệt |
| Bài đăng/lời mời ở ghép | Đã đăng nhập STUDENT | Tạo/sửa/đóng/xóa post; gửi, nhận, chấp nhận/từ chối/hủy request | Không có request `PENDING` trùng cho cùng cặp |
| Nhóm thuê | Đã kết nối/đủ quyền | Tạo group, thêm/rời member, chuyển leader | Leader quản lý member theo rule; có thể gắn room và URL Zalo/Telegram |
| Trò chuyện | Là ConversationMember | Mở direct/group conversation, join socket, gửi message và đọc lịch sử | Server lưu message trước khi phát realtime; không đọc/gửi vào conversation lạ |
| Đặt lịch xem | Có room phù hợp | Chọn room, thời điểm, note; theo dõi trạng thái hoặc hủy | Lịch gắn đúng landlord của room |
| Theo dõi thuê | Là ContractTenant | Xem contract và invoice liên quan, trạng thái/hạn thanh toán | Không được đọc hóa đơn/hợp đồng không có quan hệ tenant |
| Review, report, verification | Có điều kiện workflow | Đánh giá sau contract hợp lệ; report đối tượng; gửi yêu cầu xác minh | Một review cho mỗi student/contract; ADMIN duyệt verification/report |
| Notification | Đã đăng nhập | Xem và đánh dấu đã đọc | Chỉ xem notification của chính mình |

## LANDLORD

| Use case | Điều kiện | Luồng chính | Kết quả/quyền |
| --- | --- | --- | --- |
| Profile và xác minh | Đã đăng nhập LANDLORD | Cập nhật hồ sơ/liên hệ, gửi verification | Chỉ thay đổi dữ liệu của mình; admin là người quyết định trạng thái |
| Quản lý khu trọ | Đã đăng nhập LANDLORD | Tạo/xem/sửa Property, quản lý nearby place; xóa Property chỉ khi không còn room | Ownership kiểm tra theo `property.landlordId` |
| Quản lý phòng | Sở hữu Property | Tạo/sửa/ẩn Room, URL hoặc upload ảnh cục bộ/tiện ích; thay đổi giá | `POST /rooms/:id/images/upload` yêu cầu ownership; `DELETE /rooms/:id` chuyển room sang `HIDDEN` để giữ lịch sử; mã room unique trong property |
| Theo dõi người thuê | Sở hữu room/contract | Xem tenant và lịch sử liên quan | Không xem tenant của landlord khác |
| Xử lý lịch xem | Là landlord của room | Chấp nhận, từ chối, đề xuất thời điểm mới hoặc hoàn thành lịch | Chỉ cập nhật appointment thuộc room mình |
| Quản lý hợp đồng/hóa đơn | Sở hữu room | Tạo contract/tenant, chuyển trạng thái contract, nhập meter để phát hành invoice và đánh dấu paid/cancelled | Endpoint invoice update hiện chỉ đổi trạng thái; kiểm tra ngày hợp đồng, meter và tổng tiền ở server |
| Trò chuyện và review | Là conversation member / landlord được review | Chat sinh viên, xem review của listing liên quan | Membership/ownership luôn được kiểm tra |

## ADMIN

| Use case | Điều kiện | Luồng chính | Kết quả/quyền |
| --- | --- | --- | --- |
| Quản lý tài khoản | JWT role ADMIN | Liệt kê/xem người dùng, khóa/mở theo policy | Không dựa vào thao tác ẩn trên UI để bảo vệ quyền |
| Quản lý danh mục/tin đăng | JWT role ADMIN | Quản lý university, gồm chọn trường trung tâm; xem danh sách property theo quyền ADMIN và đổi trạng thái room | Không thể xóa trường trung tâm khi chưa thay trường khác; dùng trạng thái/ẩn listing thay vì phá hủy lịch sử thuê |
| Duyệt xác minh | Có VerificationRequest | Xem yêu cầu pending, quyết định VERIFIED/REJECTED và ghi note | Lưu reviewer, note và thời điểm duyệt |
| Xử lý report | Có Report | Chuyển PROCESSING/RESOLVED/REJECTED, thêm admin note | Giữ reporter, target và lịch sử xử lý |
| Kiểm duyệt review | Có Review | Ẩn/hiện hoặc ghi moderation note theo policy | Không sửa nội dung để tạo đánh giá giả |
| Xem vận hành | JWT role ADMIN | Xem dashboard/statistics từ DB | Chỉ trình bày số liệu truy vấn được; không fake urgency/review |

## Ngoại lệ và lỗi cần trình bày khi demo

- 401: token thiếu/hết hạn/tài khoản không `ACTIVE`; 403: role hoặc ownership không hợp lệ.
- 404: resource không tồn tại hoặc không được phép suy ra sự tồn tại tùy endpoint.
- 409: unique conflict như username/email, favorite hoặc request pending trùng.
- 422: Zod validation trả lỗi theo field; 400: điều kiện nghiệp vụ như meter/dates không hợp lệ.
- UI phải giữ loading, error, empty state và confirmation cho thao tác xóa; quyền backend vẫn là lớp quyết định cuối.
