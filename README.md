# KTHP-Web-Nang-Cao

## Câu 1: Thành viên

- **LÊ ANH MINH** - 23010228
- **HÀ ĐỨC THẮNG** - 23010284

### Tên GitHub

- `minzzz28`
- `Thangha9900`

## Câu 2: Đề tài

XÂY DỰNG HỆ THỐNG QUẢN LÝ VÀ TÌM KIẾM PHÒNG TRỌ DÀNH CHO SINH VIÊN.

## Câu 3: phân tích
## 1. Phân tích các đối tượng

Hệ thống quản lý và tìm kiếm phòng trọ dành cho sinh viên gồm các đối tượng chính sau:

| STT | Đối tượng | Mô tả |
|---:|---|---|
| 1 | **User** | Đại diện tài khoản người dùng trong hệ thống, gồm Sinh viên, Chủ trọ và Quản trị viên. |
| 2 | **StudentProfile** | Lưu thông tin riêng của sinh viên như mã sinh viên, trường đại học, khoa, khóa học, quê quán và email trường. |
| 3 | **LandlordProfile** | Lưu thông tin bổ sung của chủ trọ như tên cơ sở, thông tin liên hệ và địa chỉ. |
| 4 | **University** | Lưu thông tin trường đại học, địa chỉ và tọa độ để hỗ trợ tìm phòng gần trường. |
| 5 | **Property** | Đại diện một khu trọ hoặc nhà trọ do chủ trọ quản lý. |
| 6 | **Room** | Đại diện một phòng trọ cụ thể, lưu giá thuê, diện tích, sức chứa, số chỗ còn lại, trạng thái và các chi phí liên quan. |
| 7 | **Amenity** | Lưu các tiện ích như Wifi, điều hòa, bình nóng lạnh, máy giặt, chỗ để xe,... |
| 8 | **RoomImage** | Lưu hình ảnh của từng phòng trọ. |
| 9 | **Favorite** | Lưu danh sách các phòng mà sinh viên yêu thích. |
| 10 | **RoomPriceHistory** | Lưu lịch sử thay đổi giá của phòng trọ. |
| 11 | **NearbyPlace** | Lưu các địa điểm xung quanh khu trọ như chợ, siêu thị, nhà thuốc, bệnh viện, trạm xe buýt,... |
| 12 | **RoommateProfile** | Lưu hồ sơ nhu cầu tìm người ở ghép của sinh viên như giới tính, ngân sách, khu vực và thói quen sinh hoạt. |
| 13 | **RoommatePost** | Lưu bài đăng tìm người ở ghép. |
| 14 | **RoommateRequest** | Lưu lời mời kết nối ở ghép giữa các sinh viên. |
| 15 | **RentalGroup** | Đại diện nhóm sinh viên cùng thuê phòng, chứa thông tin số thành viên, ngân sách và ngày dự kiến chuyển vào. |
| 16 | **GroupMember** | Lưu danh sách các thành viên trong nhóm thuê trọ. |
| 17 | **Conversation** | Đại diện cuộc trò chuyện trực tiếp hoặc cuộc trò chuyện nhóm. |
| 18 | **Message** | Lưu nội dung tin nhắn giữa người dùng hoặc trong nhóm. |
| 19 | **ViewingAppointment** | Lưu lịch hẹn xem phòng giữa sinh viên và chủ trọ. |
| 20 | **Contract** | Lưu thông tin hợp đồng thuê phòng như thời gian thuê, tiền thuê, tiền cọc và trạng thái. |
| 21 | **ContractTenant** | Lưu danh sách sinh viên tham gia trong một hợp đồng thuê phòng. |
| 22 | **Invoice** | Lưu hóa đơn thuê phòng theo từng kỳ, gồm tiền phòng, điện, nước, Internet, gửi xe và các dịch vụ khác. |
| 23 | **InvoiceItem** | Lưu chi tiết từng khoản phí trong hóa đơn. |
| 24 | **Review** | Lưu đánh giá của sinh viên về phòng trọ và chủ trọ. |
| 25 | **Report** | Lưu các báo cáo vi phạm liên quan đến phòng, người dùng, bài đăng tìm ở ghép hoặc đánh giá. |
| 26 | **VerificationRequest** | Lưu yêu cầu xác minh tài khoản sinh viên hoặc chủ trọ. |
| 27 | **Notification** | Lưu thông báo gửi đến người dùng như tin nhắn mới, lời mời ở ghép, lịch xem phòng, hợp đồng và hóa đơn. |

## 3.2. Phân tích mối quan hệ giữa các đối tượng

Các đối tượng trong hệ thống có mối quan hệ với nhau như sau:

| Mối quan hệ | Kiểu quan hệ | Mô tả |
|---|---|---|
| **User - StudentProfile** | 1 - 0..1 | Một tài khoản sinh viên có tối đa một hồ sơ sinh viên. |
| **User - LandlordProfile** | 1 - 0..1 | Một tài khoản chủ trọ có tối đa một hồ sơ chủ trọ. |
| **University - StudentProfile** | 1 - N | Một trường đại học có nhiều sinh viên; một sinh viên có thể thuộc một trường. |
| **User (Landlord) - Property** | 1 - N | Một chủ trọ có thể quản lý nhiều khu trọ. |
| **Property - Room** | 1 - N | Một khu trọ có thể có nhiều phòng trọ. |
| **Room - Amenity** | N - N | Một phòng có nhiều tiện ích và một tiện ích có thể được sử dụng bởi nhiều phòng. |
| **Student - Favorite - Room** | N - N | Một sinh viên có thể yêu thích nhiều phòng và một phòng có thể được nhiều sinh viên yêu thích. |
| **Student - RoommateProfile** | 1 - 0..1 | Một sinh viên có thể có một hồ sơ tìm người ở ghép. |
| **Student - RoommatePost** | 1 - N | Một sinh viên có thể tạo nhiều bài đăng tìm người ở ghép. |
| **Student - RoommateRequest - Student** | N - N | Sinh viên có thể gửi và nhận nhiều lời mời ở ghép. |
| **RentalGroup - GroupMember - User** | N - N | Một nhóm có nhiều thành viên và một sinh viên có thể tham gia nhóm thuê trọ. |
| **Conversation - Message** | 1 - N | Một cuộc trò chuyện có thể chứa nhiều tin nhắn. |
| **User - Message** | 1 - N | Một người dùng có thể gửi nhiều tin nhắn. |
| **Room - ViewingAppointment** | 1 - N | Một phòng có thể có nhiều lịch hẹn xem phòng. |
| **Student - ViewingAppointment** | 1 - N | Một sinh viên có thể đặt nhiều lịch xem phòng. |
| **Landlord - ViewingAppointment** | 1 - N | Một chủ trọ có thể tiếp nhận nhiều lịch xem phòng. |
| **Room - Contract** | 1 - N | Một phòng có thể phát sinh nhiều hợp đồng ở các thời điểm khác nhau. |
| **Contract - ContractTenant - Student** | N - N | Một hợp đồng có thể có nhiều sinh viên thuê chung và một sinh viên có thể có nhiều hợp đồng theo thời gian. |
| **Contract - Invoice** | 1 - N | Một hợp đồng có thể phát sinh nhiều hóa đơn theo từng kỳ thanh toán. |
| **Invoice - InvoiceItem** | 1 - N | Một hóa đơn gồm nhiều khoản phí chi tiết. |
| **Student - Review - Room** | N - N | Sinh viên sau khi thuê có thể đánh giá phòng; một phòng có thể nhận nhiều đánh giá. |
| **User - VerificationRequest** | 1 - N | Một người dùng có thể gửi yêu cầu xác minh tài khoản. |
| **User - Notification** | 1 - N | Một người dùng có thể nhận nhiều thông báo từ hệ thống. |
| **Property - NearbyPlace** | 1 - N | Một khu trọ có thể có nhiều địa điểm tiện ích xung quanh. |
| **Room - RoomPriceHistory** | 1 - N | Một phòng có thể có nhiều bản ghi lịch sử thay đổi giá. |

Nhìn tổng thể, `User` là đối tượng trung tâm của hệ thống. Sinh viên tương tác với phòng trọ thông qua tìm kiếm, yêu thích, lịch xem phòng, hợp đồng, hóa đơn, đánh giá và các chức năng tìm người ở ghép. Chủ trọ quản lý khu trọ, phòng, hợp đồng và hóa đơn. Quản trị viên quản lý tài khoản, xác minh và xử lý báo cáo vi phạm.

Các mối quan hệ này giúp hệ thống quản lý xuyên suốt quá trình:

**Tìm phòng → Tìm người ở ghép → Tạo nhóm → Chat → Đặt lịch xem phòng → Thuê phòng → Quản lý hợp đồng → Quản lý hóa đơn → Đánh giá và báo cáo.** 
## 3. UML Class Diagram tổng thể

Sơ đồ UML Class Diagram dưới đây mô tả các lớp chính và mối quan hệ giữa các đối tượng trong hệ thống quản lý và tìm kiếm phòng trọ dành cho sinh viên.

```mermaid
classDiagram

class User {
    +int id
    +string username
    +string email
    +string password
    +string fullName
    +string phone
    +Role role
    +Status status
}

class StudentProfile {
    +int id
    +string studentCode
    +string schoolEmail
    +string faculty
    +string academicYear
    +string hometown
}

class LandlordProfile {
    +int id
    +string businessName
    +string nationalId
    +string contactAddress
}

class University {
    +int id
    +string name
    +string address
    +decimal latitude
    +decimal longitude
}

class Property {
    +int id
    +string name
    +string address
    +string district
    +string city
    +decimal latitude
    +decimal longitude
}

class Room {
    +int id
    +string name
    +decimal price
    +decimal area
    +int capacity
    +int availableSlots
    +RoomStatus status
}

class Amenity {
    +int id
    +string name
    +string category
}

class Favorite {
    +int id
    +datetime createdAt
}

class RoommateProfile {
    +int id
    +Gender gender
    +decimal budgetMin
    +decimal budgetMax
    +string preferredArea
    +decimal maxDistanceKm
}

class RoommatePost {
    +int id
    +string title
    +string content
    +decimal budgetPerPerson
    +int neededPeople
    +PostStatus status
}

class RoommateRequest {
    +int id
    +string message
    +RequestStatus status
}

class RentalGroup {
    +int id
    +string name
    +int maxMembers
    +decimal budgetPerPerson
    +date moveInDate
    +GroupStatus status
}

class GroupMember {
    +int id
    +GroupRole role
    +datetime joinedAt
}

class Conversation {
    +int id
    +ConversationType type
    +string title
}

class Message {
    +int id
    +string content
    +datetime createdAt
}

class ViewingAppointment {
    +int id
    +datetime scheduledAt
    +AppointmentStatus status
}

class Contract {
    +int id
    +string contractNumber
    +date startDate
    +date endDate
    +decimal rent
    +decimal deposit
    +ContractStatus status
}

class ContractTenant {
    +int id
    +boolean isPrimaryTenant
    +date moveInDate
    +date moveOutDate
}

class Invoice {
    +int id
    +string invoiceNumber
    +date dueDate
    +decimal totalAmount
    +InvoiceStatus status
}

class InvoiceItem {
    +int id
    +string type
    +decimal quantity
    +decimal unitPrice
    +decimal amount
}

class Review {
    +int id
    +int rating
    +int roomQuality
    +int security
    +int cleanliness
    +string comment
}

class Report {
    +int id
    +ReportTargetType targetType
    +ReportStatus status
}

class VerificationRequest {
    +int id
    +VerificationType type
    +VerificationStatus status
}

class Notification {
    +int id
    +string type
    +string title
    +string content
    +boolean isRead
}

User "1" --> "0..1" StudentProfile
User "1" --> "0..1" LandlordProfile

University "1" --> "0..*" StudentProfile

User "1" --> "0..*" Property : owns
Property "1" --> "0..*" Room

Room "0..*" --> "0..*" Amenity

User "1" --> "0..*" Favorite
Room "1" --> "0..*" Favorite

User "1" --> "0..1" RoommateProfile
User "1" --> "0..*" RoommatePost
Room "1" --> "0..*" RoommatePost

User "1" --> "0..*" RoommateRequest : sends
User "1" --> "0..*" RoommateRequest : receives
RoommatePost "1" --> "0..*" RoommateRequest

User "1" --> "0..*" RentalGroup : creates
Room "1" --> "0..*" RentalGroup

RentalGroup "1" --> "1..*" GroupMember
User "1" --> "0..*" GroupMember

RentalGroup "0..1" --> "0..1" Conversation
Conversation "1" --> "0..*" Message
User "1" --> "0..*" Message : sends

Room "1" --> "0..*" ViewingAppointment
User "1" --> "0..*" ViewingAppointment : student
User "1" --> "0..*" ViewingAppointment : landlord

Room "1" --> "0..*" Contract
User "1" --> "0..*" Contract : landlord

Contract "1" --> "1..*" ContractTenant
User "1" --> "0..*" ContractTenant : student

Contract "1" --> "0..*" Invoice
Invoice "1" --> "1..*" InvoiceItem

Contract "1" --> "0..*" Review
Room "1" --> "0..*" Review
User "1" --> "0..*" Review

User "1" --> "0..*" Report
User "1" --> "0..*" VerificationRequest
User "1" --> "0..*" Notification


<img width="1475" height="728" alt="image" src="https://github.com/user-attachments/assets/1b0d8251-1653-4873-9f96-4e7cfa57d73b" />
