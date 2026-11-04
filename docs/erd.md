# ERD

ERD dưới đây phản ánh quan hệ trong Prisma schema. Tên entity là tên model Prisma; tên bảng MySQL dùng `snake_case` tương ứng. Xem [database.md](database.md) để biết key/index và [schema.prisma](../server/prisma/schema.prisma) là nguồn chuẩn cho mọi field.

## Tài khoản, tin đăng và tìm kiếm

```mermaid
erDiagram
  USER ||--o| STUDENT_PROFILE : "co"
  USER ||--o| LANDLORD_PROFILE : "co"
  UNIVERSITY ||--o{ STUDENT_PROFILE : "duoc chon boi"
  USER ||--o{ VERIFICATION_REQUEST : "gui"
  USER ||--o{ VERIFICATION_REQUEST : "duyet"

  USER ||--o{ PROPERTY : "so huu"
  PROPERTY ||--o{ ROOM : "gom"
  PROPERTY ||--o{ NEARBY_PLACE : "co"
  ROOM ||--o{ ROOM_IMAGE : "co"
  ROOM ||--o{ ROOM_AMENITY : "gan"
  AMENITY ||--o{ ROOM_AMENITY : "duoc gan"
  USER ||--o{ FAVORITE : "luu"
  ROOM ||--o{ FAVORITE : "duoc luu"
  ROOM ||--o{ ROOM_PRICE_HISTORY : "doi gia"
  USER ||--o{ ROOM_PRICE_HISTORY : "thay doi"
  ROOM ||--o{ ROOM_VIEW : "duoc xem"
  USER o|--o{ ROOM_VIEW : "xem"

  USER {
    int id PK
    string username UK
    string email UK
    enum role
    enum status
  }
  UNIVERSITY {
    int id PK
    string code UK
    decimal latitude
    decimal longitude
    boolean is_primary
  }
  PROPERTY {
    int id PK
    int landlord_id FK
    string slug UK
  }
  ROOM {
    int id PK
    int property_id FK
    string code
    decimal price
    enum status
  }
  FAVORITE {
    int id PK
    int student_id FK
    int room_id FK
  }
```

## Ở ghép và trò chuyện

```mermaid
erDiagram
  USER ||--o| ROOMMATE_PROFILE : "lap ho so"
  UNIVERSITY ||--o{ ROOMMATE_PROFILE : "thuoc"
  USER ||--o{ ROOMMATE_POST : "dang"
  ROOM o|--o{ ROOMMATE_POST : "gan voi"
  USER ||--o{ ROOMMATE_REQUEST : "gui"
  USER ||--o{ ROOMMATE_REQUEST : "nhan"
  ROOMMATE_POST o|--o{ ROOMMATE_REQUEST : "tham chieu"
  ROOM o|--o{ ROOMMATE_REQUEST : "tham chieu"

  USER ||--o{ RENTAL_GROUP : "tao"
  ROOM o|--o{ RENTAL_GROUP : "du kien thue"
  RENTAL_GROUP ||--o{ GROUP_MEMBER : "co"
  USER ||--o{ GROUP_MEMBER : "tham gia"
  RENTAL_GROUP o|--o| CONVERSATION : "chat nhom"
  CONVERSATION ||--o{ CONVERSATION_MEMBER : "co"
  USER ||--o{ CONVERSATION_MEMBER : "tham gia"
  CONVERSATION ||--o{ MESSAGE : "chua"
  USER ||--o{ MESSAGE : "gui"

  ROOMMATE_PROFILE {
    int id PK
    int student_id FK
    decimal budget_min
    decimal budget_max
  }
  ROOMMATE_REQUEST {
    int id PK
    int sender_id FK
    int recipient_id FK
    string active_pair_key UK
    enum status
  }
  RENTAL_GROUP {
    int id PK
    int creator_id FK
    int room_id FK
    enum status
  }
  CONVERSATION {
    int id PK
    enum type
    string direct_pair_key UK
    int rental_group_id UK
  }
```

## Thuê phòng, hóa đơn và kiểm duyệt

```mermaid
erDiagram
  ROOM ||--o{ VIEWING_APPOINTMENT : "dat lich"
  USER ||--o{ VIEWING_APPOINTMENT : "sinh vien"
  USER ||--o{ VIEWING_APPOINTMENT : "chu tro"

  ROOM ||--o{ CONTRACT : "duoc thue theo"
  USER ||--o{ CONTRACT : "chu tro"
  CONTRACT ||--o{ CONTRACT_TENANT : "gom"
  USER ||--o{ CONTRACT_TENANT : "nguoi thue"
  CONTRACT ||--o{ INVOICE : "phat hanh"
  INVOICE ||--o{ INVOICE_ITEM : "chi tiet"
  CONTRACT ||--o{ REVIEW : "co danh gia"
  ROOM ||--o{ REVIEW : "duoc danh gia"
  USER ||--o{ REVIEW : "viet"

  USER ||--o{ REPORT : "bao cao"
  USER o|--o{ REPORT : "doi tuong"
  ROOM o|--o{ REPORT : "doi tuong"
  ROOMMATE_POST o|--o{ REPORT : "doi tuong"
  REVIEW o|--o{ REPORT : "doi tuong"
  USER ||--o{ REPORT : "xu ly"
  USER ||--o{ NOTIFICATION : "nhan"

  VIEWING_APPOINTMENT {
    int id PK
    int room_id FK
    int student_id FK
    int landlord_id FK
    enum status
  }
  CONTRACT {
    int id PK
    string contract_number UK
    int room_id FK
    int landlord_id FK
    enum status
  }
  INVOICE {
    int id PK
    string invoice_number UK
    int contract_id FK
    decimal total_amount
    enum status
  }
  REVIEW {
    int id PK
    int contract_id FK
    int student_id FK
    int room_id FK
  }
  REPORT {
    int id PK
    int reporter_id FK
    enum target_type
    enum status
  }
```

## Bảng nối và uniqueness

| Bảng | Quan hệ biểu diễn | Ràng buộc chống trùng |
| --- | --- | --- |
| `room_amenities` | Room N–N Amenity | PK kép `(roomId, amenityId)` |
| `favorites` | Student N–N Room | `(studentId, roomId)` unique |
| `group_members` | Student N–N RentalGroup | `(groupId, studentId)` unique |
| `conversation_members` | User N–N Conversation | `(conversationId, userId)` unique |
| `contract_tenants` | Student N–N Contract | `(contractId, studentId)` unique |
| `roommate_requests` | Workflow sender–recipient | `activePairKey` unique khi request đang `PENDING` |

`directPairKey` ngăn tạo trùng cuộc trò chuyện trực tiếp; `(contractId, periodStart, periodEnd)` ngăn hóa đơn trùng kỳ; `(contractId, studentId)` ngăn review lặp cho cùng hợp đồng. Các quan hệ xóa/cập nhật chi tiết nằm trong Prisma schema và migration, không suy ra từ sơ đồ khái niệm này.

Trong `USER`, `username` và `email` đều có thể để trống riêng lẻ, nhưng ứng dụng bắt buộc ít nhất một định danh khi đăng ký. Cả hai đều unique; username được chuẩn hóa lowercase và không dùng ký tự `@`, nên có thể phân biệt rõ với email khi đăng nhập.
