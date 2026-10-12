# Báo cáo tiến độ đợt 2

- Hoàn thiện tạo hóa đơn trong database transaction.
- Trừ tồn khi bán và hoàn tồn khi hủy hóa đơn.
- Bổ sung quản lý sản phẩm, điều chỉnh tồn kho và trạng thái kinh doanh.
- Bổ sung quản lý nhân sự, phân quyền và chặn khóa Admin cuối cùng.
- Bổ sung dashboard doanh thu, sản phẩm bán chạy, tồn kho thấp và audit log.
- Đã chạy `npm test` với Vitest cho đăng nhập và service tạo hóa đơn: credential không hợp lệ, số lượng không dương và bán vượt tồn.
- Đã chạy `npm run build` để kiểm tra TypeScript compile.

## Lead mindset và kiểm soát mã nguồn
- `git log --oneline --stat`: kiểm tra commit có mục tiêu rõ ràng, phạm vi thay đổi và tiến độ theo thời gian.
- `git diff --check`: phát hiện whitespace lỗi trước khi commit; `git diff --cached` dùng để review đúng phần chuẩn bị commit.
- Tiêu chí thành viên hiệu quả: commit nhỏ, mô tả đúng nội dung, thay đổi có liên quan, có test/build làm bằng chứng và không để thay đổi chưa giải thích trong worktree.
