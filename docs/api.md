# REST API contract

## Base path và quy ước

- Base URL development: `http://localhost:4000`.
- **Mọi REST resource dùng prefix `/api`**, ví dụ `GET /api/rooms`. Không dùng `/api/v1` trong phiên bản này.
- `GET /health` là health check của server, nằm ngoài API prefix.
- Request/response dùng JSON (`Content-Type: application/json`), trừ `POST /api/rooms/:id/images/upload` dùng `multipart/form-data`. Room image vẫn có thể được khai báo bằng URL trong body room; file ảnh đã upload được server phục vụ dưới `/uploads/<tên-file>`.
- Resource riêng tư gửi `Authorization: Bearer <accessToken>`.
- ID trong path là số nguyên dương. Ngày giờ dùng ISO 8601; tiền/toạ độ phải được client format, không cộng trừ bằng float thiếu kiểm soát.

Response thành công dùng một envelope thống nhất:

```json
{
  "success": true,
  "message": "Thành công",
  "data": {},
  "meta": { "page": 1, "limit": 12, "total": 42, "totalPages": 4 }
}
```

`meta` chỉ có ở collection phân trang. Lỗi dùng:

```json
{
  "success": false,
  "message": "Dữ liệu gửi lên không hợp lệ",
  "errors": [{ "field": "price", "message": "…" }]
}
```

Mã lỗi thường gặp: `400` điều kiện nghiệp vụ, `401` không xác thực/tài khoản không active, `403` sai role hoặc ownership, `404` không tìm thấy, `409` dữ liệu unique trùng, `422` Zod validation và `429` vượt rate limit xác thực.

## Phân trang, lọc và quyền

- Collection dùng `page` (mặc định `1`) và `limit` (mặc định `12`, tối đa `50`) khi endpoint hỗ trợ.
- Query room hỗ trợ `q` (hoặc `keyword`), `minPrice`, `maxPrice`, `minArea`, `maxArea`, `type`/`types`, `minCapacity`, `availableOnly`, `amenityIds` (hoặc `amenities`), `amenitySlugs`, `city`, `district`, `universityId`, `radiusKm` (hoặc `radius`), `sort`, `page`, `limit`. Khi không truyền `availableOnly=false`, danh sách chỉ lấy phòng `AVAILABLE` còn chỗ.
- `sort` room: `PRICE_ASC`, `PRICE_DESC`, `RATING_DESC`, `NEWEST`, `DISTANCE_ASC`, `MATCH_DESC`.
- Role trong bảng là **quyền tối thiểu**. Với `LANDLORD`/`STUDENT`, server còn kiểm tra ownership hoặc membership trước khi ghi/đọc dữ liệu riêng.

## Route contract hiện có trong runtime

Tất cả router trong bảng dưới đã được mount bởi `server/src/routes/index.js` dưới `/api`. Để gọi được endpoint trên một máy mới, vẫn cần cấu hình môi trường hợp lệ, MySQL chạy được và Prisma migration đã được áp dụng.

### Tài khoản và danh mục

| Method | Path dưới `/api` | Quyền | Payload/query chính | Mục đích |
| --- | --- | --- | --- | --- |
| GET | `/` | Public | — | Thông tin API cơ bản |
| POST | `/auth/register` | Public | `fullName`, `password`, `role` (`STUDENT`/`LANDLORD`), `username?`, `email?`, `phone?`; cần `username` hoặc `email` | Đăng ký, không tạo ADMIN |
| POST | `/auth/login` | Public | `identifier`, `password` | Đăng nhập bằng tên đăng nhập hoặc email; trả access token và user an toàn |
| POST | `/auth/logout` | Authenticated | — | Xác nhận logout phía server; client xóa token |
| GET | `/auth/me` | Authenticated | — | User từ token |
| PATCH | `/auth/change-password` | Authenticated | `currentPassword`, `newPassword` | Đổi password |
| GET | `/users/me` | Authenticated | — | Tài khoản/hồ sơ của mình |
| PATCH | `/users/me` | Authenticated | Field account cho phép cập nhật | Cập nhật account |
| PATCH | `/users/me/profile` | Authenticated | Field Student/Landlord profile hợp role | Cập nhật profile theo role |
| GET | `/users/:id` | Public | — | User public đã serialize |
| GET | `/universities` | Public | `q`, `page`, `limit` | Danh sách trường, trả `isPrimary` và xếp trường trung tâm trước |
| GET | `/universities/:id` | Public | — | Chi tiết trường/tọa độ |
| POST/PATCH/DELETE | `/universities`, `/universities/:id` | ADMIN | University body, `isPrimary?` | Quản lý danh mục và chọn trường trung tâm |

#### Trường trung tâm

`University.isPrimary` xác định trường được client ưu tiên khi mở trang chủ, tìm phòng và bản đồ. `GET /universities` luôn trả field này và sắp bản ghi `isPrimary: true` lên đầu; seed đặt Đại học Phenikaa là trường trung tâm. Khi ADMIN chọn một trường làm trung tâm, service bỏ ưu tiên của trường cũ; không thể xóa trường trung tâm hoặc bỏ ưu tiên của nó nếu chưa có trường thay thế.

#### Định danh đăng nhập

`POST /auth/register` yêu cầu `fullName`, `password`, `role` và ít nhất một trong `username` hoặc `email`. Một tài khoản có thể chỉ có tên đăng nhập, chỉ có email, hoặc có cả hai định danh. `ADMIN` không được tạo qua endpoint này.

- `username`: 3–30 ký tự, bắt đầu bằng chữ cái Latin hoặc chữ số; các ký tự còn lại chỉ dùng chữ cái Latin, chữ số, `.`, `_`, `-`. Ký tự `@` không hợp lệ, nên username không thể bị nhầm với email.
- `username` được chuẩn hóa về chữ thường và kiểm tra unique không phân biệt hoa/thường; vì vậy `Student`, `STUDENT` và `student` đại diện cùng một tên.
- `email`, nếu có, phải là email hợp lệ, được chuẩn hóa về chữ thường và unique.
- Khi đăng nhập, client gửi một trường `identifier`; server chuẩn hóa nó về chữ thường rồi so khớp với username hoặc email đã lưu. Tên đăng nhập không được chứa `@`, nên giao diện có thể hiển thị/kiểm tra giá trị có `@` như email và giá trị còn lại như username. Mật khẩu luôn gửi trong trường `password`.
- Trùng username, email hoặc số điện thoại (nếu có) trả `409`. Phản hồi đăng nhập sai không xác nhận định danh nào đã tồn tại.
- Payload cũ `{ "email": "…", "password": "…" }` vẫn được server chấp nhận tạm thời để tương thích ứng dụng khách cũ; client mới phải dùng `identifier`.

Ví dụ đăng ký chỉ bằng tên đăng nhập:

```json
{
  "fullName": "Nguyễn Minh Anh",
  "username": "minh.anh",
  "password": "mot-mat-khau-manh",
  "role": "STUDENT"
}
```

Ví dụ hai cách đăng nhập cùng một tài khoản seed:

```json
{ "identifier": "student", "password": "123" }
```

```json
{ "identifier": "student@gmail.com", "password": "123" }
```

### Property, room và khám phá phòng

| Method | Path dưới `/api` | Quyền | Payload/query chính | Mục đích |
| --- | --- | --- | --- | --- |
| GET | `/properties` | Authenticated | `page`, `limit`, filter ownership | Danh sách property theo quyền |
| POST | `/properties` | LANDLORD | Name, address, tọa độ, rules/contact | Tạo property của mình |
| GET | `/properties/:id` | Public | — | Chi tiết property |
| PATCH/DELETE | `/properties/:id` | LANDLORD/ADMIN + ownership | Field property | Sửa/xóa có kiểm tra quyền |
| GET | `/properties/:id/nearby-places` | Public | — | Tiện ích quanh property |
| POST/DELETE | `/properties/:id/nearby-places`, `…/:placeId` | LANDLORD/ADMIN + ownership | Nearby-place body | Quản lý tiện ích demo |
| GET | `/rooms` | Public | Room query | Danh sách room có phân trang |
| GET | `/rooms/search` | Public | Room query | Tìm/lọc room |
| GET | `/rooms/nearby` | Public | `universityId`, `radiusKm` + room query | Lọc bán kính bằng Haversine |
| GET | `/rooms/map` | Public | Room query | Dữ liệu marker bản đồ |
| GET | `/rooms/compare` | Public | `ids`, `universityId?` | So sánh các room được chọn |
| POST | `/rooms/recommendations` | STUDENT | `budgetMin?`, `budgetMax?`, `preferredArea?`, `amenityIds?`, `universityId?`, `maxDistanceKm?` | Gợi ý score 0–100 và lý do |
| GET | `/rooms/mine` | LANDLORD/ADMIN | Room query | Room quản lý theo quyền |
| POST | `/rooms` | LANDLORD/ADMIN | Room body, `amenityIds?`, `images?` | Tạo room |
| POST | `/rooms/:id/images/upload` | LANDLORD/ADMIN + ownership | `multipart/form-data`; lặp field `images` 1–8 lần | Tải ảnh cục bộ cho room |
| GET | `/rooms/:id` | Public | `universityId?` | Chi tiết room, review `PUBLISHED`, tiện ích gần đó và distance/travel time nếu có trường |
| GET | `/rooms/:id/price-history` | Public | — | Lịch sử giá |
| PATCH/DELETE | `/rooms/:id` | LANDLORD/ADMIN + ownership | Field room | Cập nhật; `DELETE` ẩn room (`HIDDEN`) để bảo toàn lịch sử |
| GET/POST/DELETE | `/favorites`, `/favorites/:roomId` | STUDENT | `roomId`, phân trang | Liệt kê/thêm/bỏ yêu thích |

`Room` body yêu cầu tối thiểu property, mã/tên, price/deposit/area/capacity/availableSlots/type và các phí. Validator chặn giá/diện tích không hợp lệ, `availableSlots > capacity`, nhiều hơn một cover image và range query đảo ngược.

#### Tải ảnh room

`POST /api/rooms/:id/images/upload` yêu cầu Bearer token của `LANDLORD` sở hữu room hoặc `ADMIN`. Gửi một hay nhiều part có cùng tên `images`; server nhận tối đa 8 ảnh JPEG, PNG hoặc WebP, với kích thước tối đa 5 MB cho mỗi tệp. Server đối chiếu MIME với magic bytes và tự gán phần mở rộng an toàn, không tin phần mở rộng do client đặt. Client không tự đặt header `Content-Type`, để thư viện HTTP tạo multipart boundary đúng.

Response thành công trả `data.items`, là các bản ghi `RoomImage` mới có `url` dạng `/uploads/<tên-file>`. Ảnh đầu tiên sẽ là cover chỉ khi room chưa có cover; các ảnh mới được thêm sau thứ tự hiện có. Endpoint chỉ lưu local disk, không phải contract cloud storage.

### Ở ghép, nhóm và chat

| Method | Path dưới `/api` | Quyền | Payload/query chính | Mục đích |
| --- | --- | --- | --- | --- |
| GET | `/roommates` | Public | Budget, university, area, pagination | Tìm roommate profile hiển thị |
| GET/POST/PATCH | `/roommates/me` | STUDENT | Profile preference | Xem/tạo/sửa profile của mình |
| GET | `/roommates/:studentId/match` | STUDENT | — | Matching score với một profile |
| GET | `/roommate-posts` | Public | `status`, `area`, `minBudget`, `maxBudget`, `preferredGender`, phân trang | Danh sách post ở ghép |
| GET | `/roommate-posts/mine` | STUDENT | Pagination | Post của mình |
| POST | `/roommate-posts` | STUDENT | Title, content, budget, needed people, … | Tạo post |
| GET/PATCH/DELETE | `/roommate-posts/:id` | Public đọc; STUDENT owner ghi | Post body | Xem/sửa/xóa post |
| POST | `/roommate-posts/:id/close` | STUDENT owner | — | Đóng post |
| GET | `/roommate-requests/sent`, `/roommate-requests/received` | STUDENT | Pagination/status | Lời mời đã gửi/nhận |
| POST | `/roommate-requests` | STUDENT | `recipientId`, `postId?`, `roomId?`, `message?` | Gửi request |
| POST | `/roommate-requests/:id/action` | STUDENT recipient/sender tùy action | `action`: `ACCEPT`, `REJECT` hoặc `CANCEL` | Chuyển trạng thái request |
| GET | `/groups`, `/groups/:id` | Public | Filter/pagination | Xem nhóm công khai |
| GET | `/groups/mine` | STUDENT | Filter/pagination | Nhóm của mình |
| POST/PATCH | `/groups`, `/groups/:id` | STUDENT owner/leader | Group body | Tạo/sửa nhóm |
| POST | `/groups/:id/members`, `/groups/:id/leave`, `/groups/:id/transfer-leadership` | STUDENT theo role nhóm | Member/transfer body | Quản lý thành viên/leader |
| DELETE | `/groups/:id/members/:studentId` | STUDENT leader | — | Xóa member |
| GET | `/conversations` | Authenticated member | Pagination | Danh sách conversation |
| POST | `/conversations/direct` | Authenticated | `participantId` | Tạo/lấy direct conversation |
| GET | `/conversations/:id`, `/conversations/:id/messages` | Authenticated member | Pagination | Conversation/lịch sử message |
| POST/PATCH/DELETE | `/conversations/:id/messages`, `…/:messageId` | Authenticated sender/member | Content | Gửi/sửa/soft-delete message |

### Thuê phòng và hóa đơn

| Method | Path dưới `/api` | Quyền | Payload/query chính | Mục đích |
| --- | --- | --- | --- | --- |
| GET/POST | `/appointments` | Authenticated; STUDENT tạo | Room, time, note; query status | Lịch xem room |
| GET | `/appointments/:id` | Participant | — | Chi tiết lịch |
| POST | `/appointments/:id/respond` | LANDLORD/ADMIN owner | Action/note/proposed time | Chấp nhận, từ chối, dời lịch |
| POST | `/appointments/:id/cancel` | STUDENT owner | — | Hủy lịch |
| GET/POST | `/contracts` | Authenticated đọc; LANDLORD/ADMIN tạo | Contract, tenants, list query | Hợp đồng/liệt kê theo quyền |
| GET | `/contracts/:id` | Landlord/tenant/Admin liên quan | — | Chi tiết contract |
| POST | `/contracts/:id/status` | LANDLORD/ADMIN owner | `status`: `ACTIVE`, `EXPIRED` hoặc `TERMINATED` | Chuyển trạng thái contract theo workflow |

### Hóa đơn, tin cậy và quản trị

| Method | Path dưới `/api` | Quyền | Payload/query chính | Mục đích |
| --- | --- | --- | --- | --- |
| GET | `/invoices` | Authenticated participant | `status`, phân trang | Invoice liên quan user |
| POST | `/invoices` | LANDLORD/ADMIN + contract ownership | Kỳ, meter, đơn giá/khoản phí | Tạo invoice và item/tổng tiền |
| GET | `/invoices/:id` | Contract participant/Admin | — | Chi tiết invoice |
| PATCH | `/invoices/:id` | LANDLORD/ADMIN + ownership | `status`: `PAID` hoặc `CANCELLED` | Cập nhật trạng thái invoice; không sửa meter/tổng tiền sau khi phát hành |
| GET | `/reviews` | Public | `roomId?`, `landlordId?`, phân trang | Đánh giá `PUBLISHED` công khai |
| POST/PATCH/DELETE | `/reviews`, `/reviews/:id` | STUDENT author + contract eligibility | Review/rating body | Tạo/sửa; `DELETE` ẩn review của mình |
| PATCH | `/reviews/:id/moderation` | ADMIN | Moderation status/note | Ẩn/hiện hoặc moderation review |
| GET/POST | `/reports` | Authenticated | Filter; report target/reason | Liệt kê theo quyền, tạo report |
| GET | `/reports/:id` | Reporter hoặc ADMIN | — | Chi tiết report |
| PATCH | `/reports/:id/process` | ADMIN | Report status, `adminNote` | Xử lý report |
| GET | `/notifications`, `/notifications/unread-count` | Authenticated owner | `isRead?`, phân trang | Danh sách/số unread |
| POST | `/notifications/read-all` | Authenticated owner | — | Đánh dấu tất cả đã đọc |
| PATCH/DELETE | `/notifications/:id/read`, `/notifications/:id` | Authenticated owner | — | Đánh dấu read/xóa notification |
| GET | `/verifications/me` | Authenticated owner | Pagination | Verification của mình |
| POST | `/verifications` | STUDENT/LANDLORD | `type` phải khớp role, document/profile data | Gửi yêu cầu xác minh |
| GET | `/verifications` | ADMIN | Status/pagination | Hàng chờ xác minh |
| PATCH | `/verifications/:id/review` | ADMIN | Quyết định, reviewer note | Duyệt/từ chối verification |
| GET | `/admin/dashboard`, `/admin/users` | ADMIN | User filters/pagination | Dashboard và quản lý user |
| PATCH | `/admin/users/:id/status`, `/admin/rooms/:id/status` | ADMIN | Status | Khóa/mở user hoặc đổi trạng thái room |

Các route trong toàn bộ bảng API có router/controller/service trong source và đã được mount dưới `/api`. Sự sẵn sàng end-to-end vẫn phụ thuộc migration/seed MySQL và các kiểm tra runtime; xem [features.md](features.md) để phân biệt “có mã nguồn” với “đã nghiệm thu”.

## Socket.IO contract

Kết nối Socket.IO gửi token tại `socket.auth.token`. Server từ chối handshake không có JWT hợp lệ.

| Client gửi | Payload | Server phản hồi/phát |
| --- | --- | --- |
| `conversation:join` | `{ conversationId }` | Callback `{ ok, message? }`; chỉ join nếu là member |
| `message:send` | `{ conversationId, content }` | Lưu `Message`, callback `{ ok, message? }`, phát `message:new` tới room conversation |

Server còn phát `notification:unread-message` tới room user của người gửi trong implementation hiện tại. Client không được tin event để bỏ qua authorization; REST/Socket đều kiểm tra membership ở server.

## Nguyên tắc thay đổi contract

Mọi route mới phải được mount dưới `/api`, có validator, response envelope, authorization/ownership và cập nhật tài liệu này. Khi thay đổi schema request/response hoặc trạng thái workflow, cập nhật migration, seed, test và [demo-script.md](demo-script.md) cùng một thay đổi.
