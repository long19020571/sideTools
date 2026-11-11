# Side Tools

CEP panel extension cho Adobe Illustrator, gom một số công cụ tiện ích hay dùng khi chuẩn bị file.

## Tính năng

- **Make Reference point** — tạo 4 điểm tròn tham chiếu tại góc artboard (tuỳ chọn màu đen/trắng, nằm trong hoặc ngoài mép artboard).
- **Fit Artboard to** — fit artboard hiện tại theo vùng art đang được chọn.
- **Draw Center of Mass** — tính và vẽ 2 đường thẳng (ngang/dọc) đi qua trọng tâm (center of mass) của path/compound path đang chọn, có trừ diện tích các lỗ (holes). Tính chính xác trên đường Bezier, không phải xấp xỉ bounding box.
- **Slice Image** — cắt (clip) một ảnh raster theo các path đang chọn, mỗi path/compound path tạo ra một group riêng trong layer "Clipped Results".

## Yêu cầu

- Adobe Illustrator bản 17.0 trở lên (CC2013+)
- Windows (script cài đặt hiện chỉ hỗ trợ PowerShell trên Windows)

## Cài đặt

Vì extension chưa được ký (unsigned), cần bật debug mode của CEP và trỏ Illustrator vào thư mục này.

Chạy trong PowerShell tại gốc repo:

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```

Script sẽ:
1. Đọc `ExtensionBundleId` từ `CSXS/manifest.xml`.
2. Tạo junction tại `%APPDATA%\Adobe\CEP\extensions\<ExtensionBundleId>` trỏ về thư mục repo (sửa code là có hiệu lực ngay, không cần copy lại).
3. Bật `PlayerDebugMode=1` trong registry cho CSXS.4 → CSXS.12.

Sau khi chạy xong, khởi động lại Illustrator và mở **Window > Extensions > Side Tools**.

Gỡ cài đặt:

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1 -Uninstall
```

## Cấu trúc dự án

```
CSXS/manifest.xml   Khai báo extension (id, host app, kích thước panel...)
index.html          UI của panel
css/style.css       Style cho panel
js/CSInterface.js   Thư viện chuẩn của Adobe để JS panel giao tiếp với Illustrator
js/main.js          Gắn sự kiện UI, gọi hàm ExtendScript qua evalScript
host/host.jsx       Toàn bộ logic ExtendScript (ExtendScript/JSX) chạy trong Illustrator
host/demo.jsx, host/demo2.jsx, host/host_backup.jsx   File nháp/backup, không được load bởi panel
```

## Phát triển

- Sửa UI: `index.html` + `css/style.css`, thêm handler tương ứng trong `js/main.js`.
- Sửa logic Illustrator: thêm hàm vào `host/host.jsx`, gọi từ `js/main.js` bằng `csInterface.evalScript("tenHam(...)")`.
- Sau khi sửa code, chỉ cần đóng/mở lại panel trong Illustrator (không cần chạy lại `install.ps1`, vì đó là junction).
- Nếu panel không load được / báo lỗi, kiểm tra Console qua CEP debug: mở `http://localhost:<port>` (cần khai báo `.debug` file) hoặc dùng DevTools qua CEF debugger nếu cần.
