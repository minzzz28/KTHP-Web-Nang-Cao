# Kịch bản demo

Kịch bản này dùng dữ liệu seed và chỉ trình bày kết quả mà API/database trả về. Không thay số liệu review, số chỗ trống, lượt quan tâm hay thời gian di chuyển bằng dữ liệu diễn kịch. Nếu một màn hình chưa có trong build hiện tại, trình bày đúng endpoint REST tương ứng và gọi đó là **demo API**, không gọi là demo UI.

## 1. Chuẩn bị môi trường

1. Cài Node.js 20+ và Docker Desktop.
2. Tạo cấu hình môi trường nếu file chưa tồn tại (không ghi đè secret đang dùng):

   ```powershell
   Copy-Item .env.example .env
   Copy-Item client/.env.example client/.env
   ```

   Sửa `.env` với password MySQL và `JWT_SECRET` riêng; `JWT_SECRET` phải dài ít nhất 32 ký tự. `client/.env` cung cấp `VITE_API_URL` và `VITE_SOCKET_URL` cho Vite.

3. Khởi động MySQL và chuẩn bị dữ liệu:

   ```powershell
   docker compose up -d
   npm install
   npm run prisma:generate
   npm run prisma:deploy --workspace=server
   npm run prisma:seed
   ```

   `prisma:deploy` chỉ áp dụng migration đã có; dùng `npm run prisma:migrate -- --name <ten_thay_doi>` chỉ khi bạn đang chủ động thay đổi schema trong môi trường development.

4. Kiểm tra trước khi mở trình duyệt:

   ```powershell
   npm run test
   npm run build
   npm run dev
   ```

   Mở `http://localhost:5173`; health check phải trả JSON tại `http://localhost:4000/health`. Nếu migration/seed/build/test chưa chạy được, dừng demo và nêu rõ lỗi thay vì bỏ qua.

## 2. Tài khoản seed

| Vai trò | Tên đăng nhập | Email (cách đăng nhập khác) | Password development |
| --- | --- | --- | --- |
| ADMIN | `admin` | `admin@gmail.com` | `123` |
| STUDENT | `student` | `student@gmail.com` | `123` |
| LANDLORD | `landlord` | `chutro@gmail.com` | `123` |

Password này chỉ là seed development và được bcrypt hash trong database. Không dùng cho môi trường public. Mỗi tài khoản trong bảng có thể đăng nhập bằng username hoặc email; username không phân biệt hoa/thường, nhưng luôn trình bày/gõ dạng chữ thường.

## 3. Luồng trình bày chính

### A. Khám phá phòng — public

1. Mở trang chủ và chỉ ra room/trường được lấy qua API, không phải mảng JSON hard-code.
2. Vào **Tìm phòng**, kiểm tra *Đại học Phenikaa* đã được chọn mặc định, bán kính **3 km** và giá tối đa **3.000.000 VNĐ**, rồi áp dụng bộ lọc. Có thể đổi sang trường khác để minh họa lựa chọn vẫn mở.
3. Kiểm tra kết quả phân trang: giá, diện tích, địa chỉ, tiện ích, số chỗ trống và trạng thái phải khớp response API.
4. Chuyển sang **Bản đồ**. Kiểm tra marker/tâm bản đồ của Đại học Phenikaa, rồi click marker phòng để xem giá, địa chỉ, rating và link room detail.
5. Mở một room detail, chọn trường nếu cần và giải thích:
   - khoảng cách dùng Haversine;
   - đi bộ/xe đạp/xe máy là ước tính, không phải routing thật;
   - nearby place và price history là dữ liệu MySQL/seed.

Checkpoint: không có marker/room nào được hiển thị nếu API trả lỗi; trang phải hiện loading, empty hoặc error state phù hợp.

### B. Sinh viên tìm phòng và ở ghép

1. Đăng nhập bằng username `student` rồi mở profile/favorite. Đây là luồng không cần email.
2. Từ room detail, thêm một phòng vào favorite; reload danh sách favorite để chứng minh dữ liệu được lưu. Thử thêm lại để minh họa unique constraint/feedback thay vì tạo bản ghi trùng.
3. Chọn 2–4 phòng ở kết quả, mở **So sánh** và giải thích từng trường giá trị bằng response API.
4. Mở **Roommate profile**, xem một profile khác và matching score. Nêu rõ score là weighted/rule-based, kèm các điểm chung/khác biệt trả về.
5. Tạo hoặc mở bài tìm người ở ghép, gửi request tới một profile seed. Ở tài khoản nhận (một browser profile/phiên riêng), chấp nhận hoặc từ chối request.
6. Mở **Nhóm thuê**, tạo/thêm thành viên theo quyền leader. Chỉ dùng link Zalo/Telegram do người dùng tự nhập; không trình bày tích hợp API Zalo/Telegram.
7. Mở chat nhóm hoặc direct chat, gửi một câu ngắn, tải lại trang và kiểm tra message còn trong lịch sử. Đây là điểm chứng minh Socket.IO **và** persistence database.

### C. Lịch xem, hợp đồng và hóa đơn

1. Với STUDENT, tạo lịch xem một room: thời điểm và ghi chú hợp lệ.
2. Đăng nhập LANDLORD, mở appointment của room sở hữu và chọn chấp nhận/từ chối/dời lịch. Quay lại STUDENT để xem trạng thái đã thay đổi.
3. Với dữ liệu contract/invoice seed, mở contract mà student là tenant và invoice liên quan. Kiểm tra không thể xem contract/invoice của người khác.
4. LANDLORD tạo hoặc cập nhật invoice: nêu rõ công thức `điện = chỉ số cuối − chỉ số đầu`, `nước = chỉ số cuối − chỉ số đầu`, và tổng là tổng các khoản. Nhập chỉ số cuối nhỏ hơn đầu để minh họa validation; không “sửa tay” tổng tiền.
5. STUDENT mở invoice sau khi landlord cập nhật trạng thái, rồi tạo review nếu contract đủ điều kiện.

### D. Quản trị và tin cậy

1. Đăng nhập bằng email `admin@gmail.com` trong một phiên riêng. Như vậy demo thể hiện cả hai cách định danh: username ở luồng sinh viên và email ở luồng quản trị.
2. Mở danh sách verification pending trong seed, duyệt hoặc từ chối và nhập note. Kiểm tra trạng thái/badge của account được cập nhật qua API.
3. Mở một report seed, chuyển trạng thái hợp lệ và ghi `adminNote`.
4. Minh họa role guard bằng cách mở một route admin trong phiên STUDENT: server/UI phải từ chối, không chỉ ẩn nút.

## 4. Fallback demo API (khi UI chưa được tích hợp)

Sử dụng PowerShell hoặc Postman; không bịa màn hình. Ví dụ lấy token rồi gọi resource dưới prefix `/api`:

```powershell
$login = Invoke-RestMethod -Method Post -Uri 'http://localhost:4000/api/auth/login' `
  -ContentType 'application/json' `
  -Body '{"identifier":"student","password":"123"}'
$headers = @{ Authorization = "Bearer $($login.data.accessToken)" }

$universities = Invoke-RestMethod 'http://localhost:4000/api/universities?limit=50'
$phenikaa = $universities.data.items | Where-Object { $_.code -eq 'PHENIKAA' } | Select-Object -First 1

Invoke-RestMethod "http://localhost:4000/api/rooms/nearby?universityId=$($phenikaa.id)&radiusKm=3&maxPrice=3000000&limit=12"
Invoke-RestMethod -Method Get -Uri 'http://localhost:4000/api/favorites' -Headers $headers
```

Khi dùng endpoint ghi, lưu response ID được trả về và dùng đúng account/ownership. API contract đầy đủ ở [api.md](api.md).

## 5. Checklist kết thúc demo

- [ ] `/health` và `/api` trả envelope thành công.
- [ ] Migration và seed hoàn tất; ba tài khoản demo đăng nhập được bằng username hoặc email.
- [ ] Search/bán kính/map trả dữ liệu database, không phải fixture frontend.
- [ ] Favorite và message còn sau reload; authorization chặn resource không thuộc user.
- [ ] Appointment/hóa đơn hoặc fallback API nêu rõ status thực tế, không che giấu phần chưa mount/chưa build.
- [ ] Test/build đã được chạy và kết quả được báo cáo trung thực.
- [ ] Các giới hạn: routing thật, payment, chữ ký số, geocoding online và Zalo/Telegram API được nói rõ.
