const mysql = require('mysql2');
const path = require('path');

// Đọc biến môi trường từ file .env ở thư mục gốc "đồ án"
require('dotenv').config({
    path: path.resolve(__dirname, '../../../.env'),
    quiet: true
});

// 1. Cấu hình kết nối đến MySQL
const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 13306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'student_rental'
});

// 2. Thiết lập kết nối
const establishConnection = () => {
    return new Promise((resolve, reject) => {
        connection.connect((err) => {
            if (err) {
                console.error('========================================');
                console.error('KẾT NỐI CƠ SỞ DỮ LIỆU THẤT BẠI');
                console.error('Lỗi:', err.message);
                console.error('========================================');
                return reject(err);
            }

            console.log('========================================');
            console.log('KẾT NỐI CƠ SỞ DỮ LIỆU THÀNH CÔNG');
            console.log('Đề tài: Website quản lý và tìm kiếm phòng trọ');
            console.log('Hệ quản trị CSDL: MySQL 8.4');
            console.log(
                'Database:',
                process.env.MYSQL_DATABASE || 'student_rental'
            );
            console.log('Host: 127.0.0.1');
            console.log(
                'Port:',
                process.env.MYSQL_PORT || '13306'
            );
            console.log('Trạng thái: Connected');
            console.log('========================================');

            resolve();
        });
    });
};

// 3.1. Thực hiện câu truy vấn SELECT
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        connection.query(sql, params, (error, results) => {
            if (error) {
                return reject(error);
            }

            resolve(results);
        });
    });
};

// 3.2. Thực hiện INSERT / UPDATE / DELETE bằng Transaction
const commitQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        connection.beginTransaction((error) => {
            if (error) {
                return reject(error);
            }

            connection.query(sql, params, (error, results) => {
                if (error) {
                    return connection.rollback(() => {
                        reject(error);
                    });
                }

                connection.commit((error) => {
                    if (error) {
                        return connection.rollback(() => {
                            reject(error);
                        });
                    }

                    resolve(results);
                });
            });
        });
    });
};

// 4. Đóng kết nối
const endConnection = () => {
    return new Promise((resolve, reject) => {
        connection.end((err) => {
            if (err) {
                console.error(
                    'Lỗi khi đóng kết nối:',
                    err.message
                );
                return reject(err);
            }

            console.log('Đã đóng kết nối cơ sở dữ liệu.');
            resolve();
        });
    });
};

// Xuất các hàm để có thể sử dụng ở file khác
module.exports = {
    connection,
    establishConnection,
    query,
    commitQuery,
    endConnection
};


// ==================================================
// CHƯƠNG TRÌNH KIỂM TRA KẾT NỐI DATABASE
// Chỉ chạy khi gọi:
// node src/config/dbConnection.js
// ==================================================

if (require.main === module) {

    const testDatabaseConnection = async () => {
        try {

            // Kết nối database
            await establishConnection();

            // Kiểm tra database hiện tại và phiên bản MySQL
            const databaseInfo = await query(`
                SELECT
                    DATABASE() AS database_name,
                    VERSION() AS mysql_version
            `);

            console.log('');
            console.log('THÔNG TIN DATABASE:');
            console.table(databaseInfo);

            // Kiểm tra bảng rooms của đồ án
            const roomCount = await query(`
                SELECT COUNT(*) AS total_rooms
                FROM rooms
            `);

            console.log('');
            console.log('KIỂM TRA DỮ LIỆU PHÒNG TRỌ:');
            console.table(roomCount);

            console.log('');
            console.log('>>> Database của đồ án hoạt động bình thường.');

        } catch (error) {

            console.error('');
            console.error('Không thể kiểm tra database.');
            console.error(error.message);

        } finally {

            try {
                await endConnection();
            } catch (error) {
                // Không xử lý thêm
            }
        }
    };

    testDatabaseConnection();
}
