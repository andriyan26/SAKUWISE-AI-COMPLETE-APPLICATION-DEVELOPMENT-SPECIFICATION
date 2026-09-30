<?php
/**
 * SAKUWISE AI — Hostinger Native PHP API Bridge (MySQL PDO)
 * Memungkinkan aplikasi SAKUWISE AI berjalan langsung di Hostinger Shared Hosting
 * tanpa memerlukan VPS atau daemon Node.js terpisah.
 */

// 1. CORS & Security Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Database Configuration
// Prioritas kredensial Hostinger yang telah dibuat pengguna
$is_local = (isset($_SERVER['SERVER_NAME']) && in_array($_SERVER['SERVER_NAME'], ['localhost', '127.0.0.1']));

if ($is_local) {
    $db_host = getenv('DB_HOST') ?: 'localhost';
    $db_name = getenv('DB_NAME') ?: 'sakuwise_ai';
    $db_user = getenv('DB_USER') ?: 'root';
    $db_pass = getenv('DB_PASS') ?: '';
} else {
    // Kredensial Hostinger sesuai database user di hPanel
    $db_host = getenv('DB_HOST') ?: 'localhost';
    $db_name = getenv('DB_NAME') ?: 'u975115372_Sakuwiseai123';
    $db_user = getenv('DB_USER') ?: 'u975115372_Sakuwiseai123';
    $db_pass = getenv('DB_PASS') ?: 'Sakuwiseai123';
}

try {
    $pdo = new PDO(
        "mysql:host={$db_host};dbname={$db_name};charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Gagal terhubung ke database Hostinger MySQL: " . $e->getMessage() . ". Pastikan database u975115372_Sakuwiseai123 sudah diimpor melalui phpMyAdmin."
    ]);
    exit;
}

// 3. Helper Functions
function generate_uuid() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

function get_bearer_token() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function get_current_user_id($pdo) {
    $token = get_bearer_token();
    if ($token) {
        $decoded = json_decode(base64_decode($token), true);
        if ($decoded && isset($decoded['userId'])) {
            return $decoded['userId'];
        }
    }
    // Fallback: pick first user if demo
    $stmt = $pdo->query("SELECT id FROM users LIMIT 1");
    $row = $stmt->fetch();
    return $row ? $row['id'] : null;
}

// 4. Parse Route Path
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Normalize URI removing /api/v1 or /api
$path = preg_replace('#^.*?/api(/v1)?#', '', $uri);
$path = trim($path, '/');
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?: [];

// 5. Routes Handling
// -------------------------------------------------------------

// Health Check
if ($path === 'health' || $path === '') {
    echo json_encode([
        "status" => "ok",
        "application" => "SAKUWISE AI Hostinger API",
        "database" => "connected",
        "timestamp" => date('Y-m-d H:i:s')
    ]);
    exit;
}

// AUTH: REGISTER
if ($path === 'auth/register' && $method === 'POST') {
    $name = trim($body['name'] ?? '');
    $email = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';

    if (empty($name)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Harap masukkan nama lengkap Anda."]);
        exit;
    }
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Format alamat email tidak valid."]);
        exit;
    }
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Kata sandi harus minimal 6 karakter."]);
        exit;
    }

    // Check if email already registered
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda."]);
        exit;
    }

    $userId = generate_uuid();
    $password_hash = password_hash($password, PASSWORD_BCRYPT);
    $avatar_url = "https://api.dicebear.com/7.x/bottts/svg?seed=" . urlencode($name);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("
            INSERT INTO users (id, name, email, password_hash, avatar_url, currency, timezone, theme_preference, onboarding_completed, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'IDR', 'Asia/Jakarta', 'dark', 0, NOW(), NOW())
        ");
        $stmt->execute([$userId, $name, $email, $password_hash, $avatar_url]);

        // Seed default categories
        $default_cats = [
            ['Makan & Minum', 'EXPENSE', 'Utensils', '#EF4444'],
            ['Transportasi', 'EXPENSE', 'Car', '#F97316'],
            ['Belanja', 'EXPENSE', 'ShoppingBag', '#EC4899'],
            ['Tagihan', 'EXPENSE', 'FileText', '#EAB308'],
            ['Hiburan', 'EXPENSE', 'Film', '#8B5CF6'],
            ['Kesehatan', 'EXPENSE', 'Activity', '#06B6D4'],
            ['Pendidikan', 'EXPENSE', 'BookOpen', '#3B82F6'],
            ['Tempat Tinggal', 'EXPENSE', 'Home', '#10B981'],
            ['Langganan', 'EXPENSE', 'CreditCard', '#6366F1'],
            ['Lainnya (Pengeluaran)', 'EXPENSE', 'MoreHorizontal', '#64748B'],
            ['Gaji', 'INCOME', 'Briefcase', '#16A34A'],
            ['Freelance', 'INCOME', 'Laptop', '#0EA5E9'],
            ['Bisnis', 'INCOME', 'TrendingUp', '#14B8A6'],
            ['Investasi', 'INCOME', 'BarChart2', '#8B5CF6'],
            ['Hadiah', 'INCOME', 'Gift', '#F59E0B'],
        ];

        $catStmt = $pdo->prepare("
            INSERT INTO categories (id, user_id, name, type, icon, color, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        foreach ($default_cats as $cat) {
            $catStmt->execute([generate_uuid(), $userId, $cat[0], $cat[1], $cat[2], $cat[3]]);
        }

        // Welcome notification
        $notifStmt = $pdo->prepare("
            INSERT INTO notifications (id, user_id, type, title, message, created_at)
            VALUES (?, ?, 'SYSTEM', 'Selamat Datang di SAKUWISE AI! 🎉', 'Mulai kelola keuanganmu dengan bijak dan raih tujuan finansialmu bersama kami.', NOW())
        ");
        $notifStmt->execute([generate_uuid(), $userId]);

        $pdo->commit();

        $token = base64_encode(json_encode([
            "userId" => $userId,
            "email" => $email,
            "created" => time()
        ]));

        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Registrasi berhasil!",
            "data" => [
                "token" => $token,
                "user" => [
                    "id" => $userId,
                    "name" => $name,
                    "email" => $email,
                    "avatarUrl" => $avatar_url,
                    "currency" => "IDR",
                    "themePreference" => "dark",
                    "onboardingCompleted" => false
                ]
            ]
        ]);
        exit;
    } catch (Exception $ex) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Gagal menyimpan akun baru ke database: " . $ex->getMessage()]);
        exit;
    }
}

// AUTH: LOGIN
if ($path === 'auth/login' && $method === 'POST') {
    $email = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Harap masukkan email dan kata sandi Anda."]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Email atau kata sandi tidak cocok. Silakan coba lagi."]);
        exit;
    }

    $token = base64_encode(json_encode([
        "userId" => $user['id'],
        "email" => $user['email'],
        "created" => time()
    ]));

    echo json_encode([
        "success" => true,
        "message" => "Login berhasil!",
        "data" => [
            "token" => $token,
            "user" => [
                "id" => $user['id'],
                "name" => $user['name'],
                "email" => $user['email'],
                "avatarUrl" => $user['avatar_url'],
                "currency" => $user['currency'] ?? 'IDR',
                "themePreference" => $user['theme_preference'] ?? 'dark',
                "onboardingCompleted" => (bool)($user['onboarding_completed'] ?? false)
            ]
        ]
    ]);
    exit;
}

// AUTH: ME
if ($path === 'auth/me' && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Sesi Anda telah berakhir. Silakan login kembali."]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id, name, email, avatar_url, currency, theme_preference, onboarding_completed FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Pengguna tidak ditemukan."]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "data" => [
            "id" => $user['id'],
            "name" => $user['name'],
            "email" => $user['email'],
            "avatarUrl" => $user['avatar_url'],
            "currency" => $user['currency'] ?? 'IDR',
            "themePreference" => $user['theme_preference'] ?? 'dark',
            "onboardingCompleted" => (bool)($user['onboarding_completed'] ?? false)
        ]
    ]);
    exit;
}

// AUTH: LOGOUT
if ($path === 'auth/logout' && $method === 'POST') {
    echo json_encode(["success" => true, "message" => "Logout berhasil."]);
    exit;
}

// DASHBOARD: SUMMARY
if ($path === 'dashboard/summary' && $method === 'GET') {
    $userId = get_current_user_id($pdo);

    $incomeStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'INCOME'");
    $incomeStmt->execute([$userId]);
    $totalIncome = (float)$incomeStmt->fetch()['total'];

    $expenseStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'EXPENSE'");
    $expenseStmt->execute([$userId]);
    $totalExpense = (float)$expenseStmt->fetch()['total'];

    $netBalance = $totalIncome - $totalExpense;
    $savingsRate = $totalIncome > 0 ? round((($totalIncome - $totalExpense) / $totalIncome) * 100, 1) : 0;

    echo json_encode([
        "success" => true,
        "data" => [
            "netBalance" => $netBalance,
            "totalIncome" => $totalIncome,
            "totalExpense" => $totalExpense,
            "savingsRate" => max(0, $savingsRate)
        ]
    ]);
    exit;
}

// TRANSACTIONS
if ($path === 'transactions') {
    $userId = get_current_user_id($pdo);

    if ($method === 'GET') {
        $stmt = $pdo->prepare("
            SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color 
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ?
            ORDER BY t.transaction_date DESC
            LIMIT 50
        ");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();

        $formatted = array_map(function($r) {
            return [
                "id" => $r['id'],
                "type" => $r['type'],
                "title" => $r['title'],
                "amount" => (float)$r['amount'],
                "description" => $r['description'],
                "merchant" => $r['merchant'],
                "paymentMethod" => $r['payment_method'],
                "transactionDate" => $r['transaction_date'],
                "category" => [
                    "id" => $r['category_id'],
                    "name" => $r['category_name'] ?: 'Lainnya',
                    "icon" => $r['category_icon'] ?: 'Tag',
                    "color" => $r['category_color'] ?: '#64748B'
                ]
            ];
        }, $rows);

        echo json_encode(["success" => true, "data" => $formatted]);
        exit;
    }

    if ($method === 'POST') {
        $type = $body['type'] ?? 'EXPENSE';
        $title = trim($body['title'] ?? '');
        $amount = (float)($body['amount'] ?? 0);
        $categoryId = $body['categoryId'] ?? null;
        $merchant = $body['merchant'] ?? null;
        $paymentMethod = $body['paymentMethod'] ?? 'Tunai';
        $transactionDate = $body['transactionDate'] ?? date('Y-m-d H:i:s');
        $description = $body['description'] ?? null;

        if (empty($title) || $amount <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Judul dan nominal transaksi harus valid."]);
            exit;
        }

        $txId = generate_uuid();
        $stmt = $pdo->prepare("
            INSERT INTO transactions (id, user_id, category_id, type, title, amount, description, merchant, payment_method, transaction_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([$txId, $userId, $categoryId, $type, $title, $amount, $description, $merchant, $paymentMethod, $transactionDate]);

        echo json_encode([
            "success" => true,
            "message" => "Transaksi berhasil dicatat!",
            "data" => ["id" => $txId, "title" => $title, "amount" => $amount]
        ]);
        exit;
    }
}

// CATEGORIES
if ($path === 'categories' && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    $stmt = $pdo->prepare("SELECT id, name, type, icon, color FROM categories WHERE user_id = ? OR user_id IS NULL");
    $stmt->execute([$userId]);
    $cats = $stmt->fetchAll();
    echo json_encode(["success" => true, "data" => $cats]);
    exit;
}

// BUDGETS
if ($path === 'budgets') {
    $userId = get_current_user_id($pdo);
    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM budgets WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();
        echo json_encode(["success" => true, "data" => $rows]);
        exit;
    }
}

// SAVINGS GOALS
if ($path === 'goals') {
    $userId = get_current_user_id($pdo);
    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();
        echo json_encode(["success" => true, "data" => $rows]);
        exit;
    }
}

// NOTIFICATIONS
if ($path === 'notifications' && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20");
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();
    echo json_encode(["success" => true, "data" => $rows]);
    exit;
}

// Fallback: 404 for unknown endpoints
http_response_code(404);
echo json_encode([
    "success" => false,
    "message" => "Endpoint API '{$path}' tidak ditemukan."
]);
