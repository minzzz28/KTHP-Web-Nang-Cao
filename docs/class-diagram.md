# Biểu đồ lớp — Website quản lý và tìm kiếm phòng trọ sinh viên

Tài liệu này là biểu đồ lớp dùng trước khi triển khai Entity NestJS/TypeORM.
Nó kế thừa dữ liệu và quan hệ từ [ERD](erd.md), nhưng bổ sung lớp cơ sở,
multiplicity và ranh giới nghiệp vụ. Mỗi lớp thực thể được ánh xạ sang một bảng
MySQL bằng `@Entity()`.

## Quy ước thiết kế

- `User` là thực thể tài khoản duy nhất. Sinh viên và chủ trọ là role của
  `User`, kết hợp lần lượt với `StudentProfile` và `LandlordProfile`; không
  dùng kế thừa `Student extends User` hoặc `Landlord extends User`.
- `AbstractIdEntity`, `CreatedEntity` và `AuditedEntity` chỉ tái sử dụng các
  cột kỹ thuật. Các bản ghi lịch sử không có `updated_at` chỉ kế thừa
  `CreatedEntity`.
- Các bảng nối có dữ liệu nghiệp vụ (`RoomAmenity`, `Favorite`,
  `GroupMember`, `ConversationMember`, `ContractTenant`) là Entity riêng.
- Kiểu tiền tệ/toạ độ dùng `DECIMAL`, vì vậy Entity biểu diễn chúng bằng
  `string`, không dùng `number` dễ làm tròn sai.

## Tài khoản, vị trí và tin phòng

```mermaid
classDiagram
  direction LR
  class AbstractIdEntity {
    <<abstract>>
    +int id
  }
  class CreatedEntity {
    <<abstract>>
    +datetime createdAt
  }
  class AuditedEntity {
    <<abstract>>
    +datetime updatedAt
  }
  CreatedEntity --|> AbstractIdEntity
  AuditedEntity --|> CreatedEntity

  class User {
    +string? username
    +string? email
    +string passwordHash
    +UserRole role
    +UserStatus status
  }
  class StudentProfile {
    +int userId
    +string? studentCode
    +int? universityId
  }
  class LandlordProfile {
    +int userId
    +string? nationalId
  }
  class VerificationRequest {
    +int userId
    +int? reviewedById
    +VerificationStatus status
  }
  class University {
    +string code
    +string name
    +decimal latitude
    +decimal longitude
  }
  class Property {
    +int landlordId
    +string slug
    +string address
  }
  class NearbyPlace {
    +int propertyId
    +NearbyPlaceCategory category
  }
  class Room {
    +int propertyId
    +string code
    +decimal price
    +RoomStatus status
  }
  class RoomImage {
    +int roomId
    +string url
    +boolean isCover
  }
  class Amenity {
    +string slug
    +string name
  }
  class RoomAmenity {
    +int roomId
    +int amenityId
  }
  class Favorite {
    +int studentId
    +int roomId
  }
  class RoomPriceHistory {
    +int roomId
    +int? changedById
    +decimal newPrice
  }
  class RoomView {
    +int roomId
    +int? viewerId
    +datetime viewedAt
  }

  User --|> AuditedEntity
  StudentProfile --|> AuditedEntity
  LandlordProfile --|> AuditedEntity
  VerificationRequest --|> AuditedEntity
  University --|> AuditedEntity
  Property --|> AuditedEntity
  NearbyPlace --|> AuditedEntity
  Room --|> AuditedEntity
  Amenity --|> AuditedEntity
  RoomImage --|> CreatedEntity
  Favorite --|> CreatedEntity
  RoomPriceHistory --|> CreatedEntity
  RoomView --|> AbstractIdEntity

  User "1" --> "0..1" StudentProfile : student profile
  User "1" --> "0..1" LandlordProfile : landlord profile
  University "1" --> "0..*" StudentProfile
  User "1" --> "0..*" VerificationRequest : requests/reviews
  User "1" --> "0..*" Property : owns
  Property "1" --> "0..*" Room
  Property "1" --> "0..*" NearbyPlace
  Room "1" --> "0..*" RoomImage
  Room "1" --> "0..*" RoomAmenity
  Amenity "1" --> "0..*" RoomAmenity
  User "1" --> "0..*" Favorite
  Room "1" --> "0..*" Favorite
  Room "1" --> "0..*" RoomPriceHistory
  Room "1" --> "0..*" RoomView
```

## Ở ghép và trò chuyện

```mermaid
classDiagram
  direction LR
  class RoommateProfile {
    +int studentId
    +decimal budgetMin
    +decimal budgetMax
    +SocialPreference socialPreference
  }
  class RoommatePost {
    +int studentId
    +int? roomId
    +RoommatePostStatus status
  }
  class RoommateRequest {
    +int senderId
    +int recipientId
    +RoommateRequestStatus status
    +string? activePairKey
  }
  class RentalGroup {
    +int creatorId
    +int? roomId
    +RentalGroupStatus status
  }
  class GroupMember {
    +int groupId
    +int studentId
    +GroupMemberRole role
  }
  class Conversation {
    +ConversationType type
    +string? directPairKey
    +int? rentalGroupId
  }
  class ConversationMember {
    +int conversationId
    +int userId
    +datetime? lastReadAt
  }
  class Message {
    +int conversationId
    +int senderId
    +MessageType type
    +string content
  }

  User "1" --> "0..1" RoommateProfile
  University "1" --> "0..*" RoommateProfile
  User "1" --> "0..*" RoommatePost : creates
  Room "0..1" --> "0..*" RoommatePost
  User "1" --> "0..*" RoommateRequest : sender/recipient
  RoommatePost "0..1" --> "0..*" RoommateRequest
  Room "0..1" --> "0..*" RoommateRequest
  User "1" --> "0..*" RentalGroup : creates
  Room "0..1" --> "0..*" RentalGroup
  RentalGroup "1" --> "0..*" GroupMember
  User "1" --> "0..*" GroupMember
  RentalGroup "0..1" --> "1" Conversation : group chat
  Conversation "1" --> "0..*" ConversationMember
  User "1" --> "0..*" ConversationMember
  Conversation "1" --> "0..*" Message
  User "1" --> "0..*" Message : sends
```

## Thuê phòng, hoá đơn và kiểm duyệt

```mermaid
classDiagram
  direction LR
  class ViewingAppointment {
    +int roomId
    +int studentId
    +int landlordId
    +ViewingAppointmentStatus status
  }
  class Contract {
    +string contractNumber
    +int roomId
    +int landlordId
    +ContractStatus status
  }
  class ContractTenant {
    +int contractId
    +int studentId
    +boolean isPrimaryTenant
  }
  class Invoice {
    +string invoiceNumber
    +int contractId
    +decimal totalAmount
    +InvoiceStatus status
  }
  class InvoiceItem {
    +int invoiceId
    +InvoiceItemType type
    +decimal amount
  }
  class Review {
    +int contractId
    +int studentId
    +int roomId
    +int landlordId
    +int rating
  }
  class Report {
    +int reporterId
    +ReportTargetType targetType
    +ReportReason reason
    +ReportStatus status
  }
  class Notification {
    +int userId
    +NotificationType type
    +boolean isRead
  }

  Room "1" --> "0..*" ViewingAppointment
  User "1" --> "0..*" ViewingAppointment : student/landlord
  Room "1" --> "0..*" Contract
  User "1" --> "0..*" Contract : landlord
  Contract "1" --> "1..*" ContractTenant
  User "1" --> "0..*" ContractTenant
  Contract "1" --> "0..*" Invoice
  Invoice "1" --> "1..*" InvoiceItem
  Contract "1" --> "0..*" Review
  Room "1" --> "0..*" Review
  User "1" --> "0..*" Review : author/landlord/moderator
  User "1" --> "0..*" Report : reporter/target/reviewer
  Room "0..1" --> "0..*" Report
  RoommatePost "0..1" --> "0..*" Report
  Review "0..1" --> "0..*" Report
  User "1" --> "0..*" Notification
```

## Quy tắc không thể biểu diễn hoàn toàn bằng decorator

- `username` hoặc `email` phải tồn tại; profile phải phù hợp `User.role`.
- `availableSlots` không vượt `capacity`; chỉ một ảnh cover; các tổng hoá đơn,
  ngày hợp đồng và meter phải hợp lệ.
- `RoommateRequest.activePairKey` chỉ unique khi request `PENDING`; direct
  conversation cần `directPairKey`, group conversation cần `rentalGroupId`.
- `Report` phải có đúng một target tương ứng với `targetType`; review,
  appointment, thành viên chat và hợp đồng phải thoả quan hệ nghiệp vụ.

Các quy tắc trên sẽ nằm trong DTO, service và transaction của các feature
module NestJS, không đặt trong Entity.
