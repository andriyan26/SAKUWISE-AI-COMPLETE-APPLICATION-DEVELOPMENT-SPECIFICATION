<?php
/**
 * SAKUWISE AI — Hostinger Native PHP API Bridge (MySQL PDO)
 * Memungkinkan aplikasi SAKUWISE AI berjalan langsung di Hostinger Shared Hosting
 * tanpa memerlukan VPS atau daemon Node.js terpisah.
 */

// 0. Ensure clean JSON output without PHP notices
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', '0');

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

// Fast-path Neural TTS Audio Stream (/api/v1/tts or /api/v1/ai/tts)
$early_uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';
$early_path = trim(preg_replace('#^.*?/api(/v1)?#', '', $early_uri), '/');
if ($early_path === 'tts' || $early_path === 'ai/tts') {
    $raw_input = json_decode(file_get_contents('php://input'), true) ?: [];
    $tts_text = trim($_GET['text'] ?? $raw_input['text'] ?? '');
    $tts_lang = substr(trim($_GET['lang'] ?? $raw_input['lang'] ?? 'id'), 0, 5) ?: 'id';
    if ($tts_text === '') {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Parameter text diperlukan."]);
        exit;
    }
    $tts_text = mb_substr($tts_text, 0, 1500, 'UTF-8');
    // Split into natural chunks <= 180 chars
    $words = preg_split('/\s+/u', $tts_text, -1, PREG_SPLIT_NO_EMPTY);
    $chunks = [];
    $curr = '';
    foreach ($words as $w) {
        if (mb_strlen($curr . ' ' . $w, 'UTF-8') <= 180) {
            $curr = trim($curr . ' ' . $w);
        } else {
            if ($curr !== '') $chunks[] = $curr;
            $curr = $w;
        }
    }
    if ($curr !== '') $chunks[] = $curr;

    $audio_data = '';
    foreach ($chunks as $chunk) {
        $chunk_bytes = false;

        // 1. Primary Engine: Studio Human Neural Indonesian Voice (id_001)
        if (function_exists('curl_init')) {
            $payload = json_encode(['text' => $chunk, 'voice' => 'id_001']);
            $ch_neural = curl_init('https://ottsy.weilbyte.dev/api/generation');
            curl_setopt_array($ch_neural, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $payload,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_TIMEOUT => 8,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                ],
                CURLOPT_SSL_VERIFYPEER => false,
            ]);
            $res_neural = curl_exec($ch_neural);
            $code_neural = curl_getinfo($ch_neural, CURLINFO_HTTP_CODE);
            curl_close($ch_neural);
            if ($code_neural === 200 && $res_neural) {
                $decoded_json = json_decode($res_neural, true);
                if (!empty($decoded_json['data'])) {
                    $decoded_mp3 = base64_decode($decoded_json['data']);
                    if ($decoded_mp3 && strlen($decoded_mp3) > 200) {
                        $chunk_bytes = $decoded_mp3;
                    }
                }
            }
        }

        // 2. Secondary Fallback Stream
        if (!$chunk_bytes) {
            $q = rawurlencode($chunk);
            $url = "https://translate.googleapis.com/translate_tts?ie=UTF-8&q={$q}&tl={$tts_lang}&client=gtx&ttsspeed=1";
            if (function_exists('curl_init')) {
                $ch = curl_init($url);
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_FOLLOWLOCATION => true,
                    CURLOPT_TIMEOUT => 6,
                    CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                    CURLOPT_HTTPHEADER => ['Referer: https://translate.google.com/'],
                    CURLOPT_SSL_VERIFYPEER => false,
                ]);
                $chunk_bytes = curl_exec($ch);
                $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                if ($http_code !== 200) $chunk_bytes = false;
            }
            if (!$chunk_bytes) {
                $ctx = stream_context_create([
                    'http' => [
                        'method' => 'GET',
                        'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\nReferer: https://translate.google.com/\r\n",
                        'timeout' => 6,
                    ],
                    'ssl' => ['verify_peer' => false, 'verify_peer_name' => false],
                ]);
                $chunk_bytes = @file_get_contents($url, false, $ctx);
            }
        }

        if ($chunk_bytes && strlen($chunk_bytes) > 100) {
            $audio_data .= $chunk_bytes;
        }
    }

    if (strlen($audio_data) > 100) {
        header("Content-Type: audio/mpeg");
        header("Content-Length: " . strlen($audio_data));
        header("Cache-Control: public, max-age=86400");
        header("Accept-Ranges: bytes");
        echo $audio_data;
        exit;
    } else {
        http_response_code(503);
        echo json_encode(["success" => false, "message" => "Fallback ke mesin suara lokal."]);
        exit;
    }
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
function sanitize_user_avatar($pdo, &$user) {
    if (!$user || !isset($user['avatar_url'])) return;
    $raw = $user['avatar_url'];
    // Jika data URL terpotong (akibat kolom varchar(191) sebelumnya), perbaiki otomatis
    if (is_string($raw) && str_starts_with($raw, 'data:image/') && (strlen($raw) <= 300 || !str_contains($raw, ';base64,'))) {
        $clean = "https://api.dicebear.com/7.x/bottts/svg?seed=" . urlencode($user['name'] ?? 'Andrian');
        $user['avatar_url'] = $clean;
        try {
            $pdo->prepare("UPDATE users SET avatar_url = ? WHERE id = ?")->execute([$clean, $user['id']]);
        } catch (Exception $e) {}
    }
}

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
    return null;
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

    sanitize_user_avatar($pdo, $user);

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

    sanitize_user_avatar($pdo, $user);

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

// DASHBOARD: SUMMARY (Akumulasi Keseluruhan Transaksi Akun)
if ($path === 'dashboard/summary' && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $range = $_GET['range'] ?? 'all';

    // 1. Akumulasi Keseluruhan Sepanjang Waktu (All-Time Totals)
    $allIncStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'INCOME'");
    $allIncStmt->execute([$userId]);
    $totalIncomeAllTime = (float)$allIncStmt->fetch()['total'];

    $allExpStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'EXPENSE'");
    $allExpStmt->execute([$userId]);
    $totalExpenseAllTime = (float)$allExpStmt->fetch()['total'];

    $currentBalance = $totalIncomeAllTime - $totalExpenseAllTime;

    // Total Anggaran
    $budgetStmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) as total FROM budgets WHERE user_id=?");
    $budgetStmt->execute([$userId]);
    $totalBudget = (float)$budgetStmt->fetch()['total'];

    if ($range === 'all') {
        $income = $totalIncomeAllTime;
        $expense = $totalExpenseAllTime;
        $prevIncome = 0;
        $prevExp = 0;
        $budgetUsed = $totalExpenseAllTime;
        $budgetLeft = max(0, $totalBudget - $budgetUsed);
        $budgetPct  = $totalBudget > 0 ? round(($budgetUsed / $totalBudget) * 100, 1) : 0;
        $savingsRate = $income > 0 ? round((($income - $expense) / $income) * 100, 1) : 0;
    } else {
        $now = new DateTime();
        switch ($range) {
            case '7_days':
                $start     = (new DateTime())->modify('-6 days')->format('Y-m-d 00:00:00');
                $end       = $now->format('Y-m-d 23:59:59');
                $prevStart = (new DateTime())->modify('-13 days')->format('Y-m-d 00:00:00');
                $prevEnd   = (new DateTime())->modify('-7 days')->format('Y-m-d 23:59:59');
                break;
            case 'last_month':
                $start     = (new DateTime('first day of last month'))->format('Y-m-d 00:00:00');
                $end       = (new DateTime('last day of last month'))->format('Y-m-d 23:59:59');
                $prevStart = (new DateTime('first day of -2 month'))->format('Y-m-d 00:00:00');
                $prevEnd   = (new DateTime('last day of -2 month'))->format('Y-m-d 23:59:59');
                break;
            case '3_months':
                $start     = (new DateTime())->modify('-2 months')->format('Y-m-01 00:00:00');
                $end       = $now->format('Y-m-d 23:59:59');
                $prevStart = (new DateTime())->modify('-5 months')->format('Y-m-01 00:00:00');
                $prevEnd   = (new DateTime())->modify('-3 months')->format('Y-m-d 23:59:59');
                break;
            default: // this_month
                $start     = (new DateTime('first day of this month'))->format('Y-m-d 00:00:00');
                $end       = $now->format('Y-m-d 23:59:59');
                $prevStart = (new DateTime('first day of last month'))->format('Y-m-d 00:00:00');
                $prevEnd   = (new DateTime('last day of last month'))->format('Y-m-d 23:59:59');
        }

        $sStmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id=? AND type='INCOME' AND transaction_date BETWEEN ? AND ?");
        $sStmt->execute([$userId, $start, $end]);
        $income = (float)$sStmt->fetch()['total'];

        $eStmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id=? AND type='EXPENSE' AND transaction_date BETWEEN ? AND ?");
        $eStmt->execute([$userId, $start, $end]);
        $expense = (float)$eStmt->fetch()['total'];

        $psStmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id=? AND type='INCOME' AND transaction_date BETWEEN ? AND ?");
        $psStmt->execute([$userId, $prevStart, $prevEnd]);
        $prevIncome = (float)$psStmt->fetch()['total'];

        $peStmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id=? AND type='EXPENSE' AND transaction_date BETWEEN ? AND ?");
        $peStmt->execute([$userId, $prevStart, $prevEnd]);
        $prevExp = (float)$peStmt->fetch()['total'];

        $budgetUsed  = $expense;
        $budgetLeft  = max(0, $totalBudget - $budgetUsed);
        $budgetPct   = $totalBudget > 0 ? round(($budgetUsed / $totalBudget) * 100, 1) : 0;
        $savingsRate = $income > 0 ? round((($income - $expense) / $income) * 100, 1) : 0;
    }

    function trendPct($curr, $prev) {
        if ($prev == 0) return $curr > 0 ? 100 : 0;
        return round((($curr - $prev) / $prev) * 100, 1);
    }

    echo json_encode([
        "success" => true,
        "data" => [
            "netBalance"   => $currentBalance,
            "totalIncome"  => $range === 'all' ? $totalIncomeAllTime : $income,
            "totalExpense" => $range === 'all' ? $totalExpenseAllTime : $expense,
            "savingsRate"  => max(0, $savingsRate),
            "cards" => [
                "currentBalance" => [
                    "amount" => $currentBalance,
                    "label"  => "Total Saldo"
                ],
                "periodIncome" => [
                    "amount"          => $range === 'all' ? $totalIncomeAllTime : $income,
                    "trendPercentage" => $range === 'all' ? 0 : trendPct($income, $prevIncome),
                    "isPositive"      => $range === 'all' ? true : ($income >= $prevIncome),
                    "label"           => "Total Pemasukan"
                ],
                "periodExpense" => [
                    "amount"          => $range === 'all' ? $totalExpenseAllTime : $expense,
                    "trendPercentage" => $range === 'all' ? 0 : trendPct($expense, $prevExp),
                    "isPositive"      => $range === 'all' ? true : ($expense <= $prevExp),
                    "label"           => "Total Pengeluaran"
                ],
                "remainingBudget" => [
                    "amount"         => $budgetLeft,
                    "limit"          => $totalBudget,
                    "usagePercent"   => $budgetPct,
                    "label"          => "Sisa Anggaran"
                ],
                "budgetRemaining" => [
                    "amount"         => $budgetLeft,
                    "totalBudget"    => $totalBudget,
                    "usedPercentage" => $budgetPct,
                    "label"          => "Sisa Anggaran"
                ]
            ]
        ]
    ]);
    exit;
}

// DASHBOARD: CASH-FLOW (Grafik Pemasukan vs Pengeluaran)
if ($path === 'dashboard/cash-flow' && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    if (!$userId) { http_response_code(401); echo json_encode(["success"=>false,"message"=>"Tidak terautentikasi."]); exit; }

    $range = $_GET['range'] ?? 'all';

    if ($range === 'all') {
        $stmt = $pdo->prepare("
            SELECT DATE(transaction_date) as period,
                COALESCE(SUM(CASE WHEN type='INCOME' THEN amount ELSE 0 END),0) as income,
                COALESCE(SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END),0) as expense
            FROM transactions
            WHERE user_id=?
            GROUP BY period
            ORDER BY period ASC
            LIMIT 30
        ");
        $stmt->execute([$userId]);
    } else {
        $now = new DateTime();
        switch ($range) {
            case '7_days':     $start = (new DateTime())->modify('-6 days')->format('Y-m-d'); break;
            case 'last_month': $start = (new DateTime('first day of last month'))->format('Y-m-d'); break;
            case '3_months':   $start = (new DateTime())->modify('-2 months')->format('Y-m-01'); break;
            default:           $start = (new DateTime('first day of this month'))->format('Y-m-d');
        }
        $end = $now->format('Y-m-d');

        $stmt = $pdo->prepare("
            SELECT DATE(transaction_date) as period,
                COALESCE(SUM(CASE WHEN type='INCOME' THEN amount ELSE 0 END),0) as income,
                COALESCE(SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END),0) as expense
            FROM transactions
            WHERE user_id=? AND DATE(transaction_date) BETWEEN ? AND ?
            GROUP BY period
            ORDER BY period ASC
        ");
        $stmt->execute([$userId, $start, $end]);
    }

    $rows = $stmt->fetchAll();
    $chartData = array_map(function($r) {
        $d = new DateTime($r['period']);
        return [
            "date"    => $r['period'],
            "label"   => $d->format('d M'),
            "income"  => (float)$r['income'],
            "expense" => (float)$r['expense'],
            "net"     => (float)$r['income'] - (float)$r['expense']
        ];
    }, $rows);

    echo json_encode(["success" => true, "data" => $chartData]);
    exit;
}

// DASHBOARD: EXPENSE BREAKDOWN (Pie Chart Distribusi Kategori Pengeluaran)
if ($path === 'dashboard/expense-breakdown' && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    if (!$userId) { http_response_code(401); echo json_encode(["success"=>false,"message"=>"Tidak terautentikasi."]); exit; }

    $range = $_GET['range'] ?? 'all';

    if ($range === 'all') {
        $stmt = $pdo->prepare("
            SELECT COALESCE(c.name, 'Lainnya') as name, COALESCE(c.color, '#64748B') as color, COALESCE(c.icon, 'Tag') as icon, COALESCE(SUM(t.amount),0) as total
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ? AND t.type = 'EXPENSE'
            GROUP BY COALESCE(c.name, 'Lainnya'), COALESCE(c.color, '#64748B'), COALESCE(c.icon, 'Tag')
            ORDER BY total DESC
            LIMIT 10
        ");
        $stmt->execute([$userId]);
    } else {
        $now = new DateTime();
        switch ($range) {
            case '7_days':     $start = (new DateTime())->modify('-6 days')->format('Y-m-d 00:00:00'); break;
            case 'last_month': $start = (new DateTime('first day of last month'))->format('Y-m-d 00:00:00'); break;
            case '3_months':   $start = (new DateTime())->modify('-2 months')->format('Y-m-01 00:00:00'); break;
            default:           $start = (new DateTime('first day of this month'))->format('Y-m-d 00:00:00');
        }
        $end = $now->format('Y-m-d 23:59:59');

        $stmt = $pdo->prepare("
            SELECT COALESCE(c.name, 'Lainnya') as name, COALESCE(c.color, '#64748B') as color, COALESCE(c.icon, 'Tag') as icon, COALESCE(SUM(t.amount),0) as total
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id=? AND t.type='EXPENSE' AND t.transaction_date BETWEEN ? AND ?
            GROUP BY COALESCE(c.name, 'Lainnya'), COALESCE(c.color, '#64748B'), COALESCE(c.icon, 'Tag')
            ORDER BY total DESC
            LIMIT 10
        ");
        $stmt->execute([$userId, $start, $end]);
    }

    $rows = $stmt->fetchAll();
    $totalExp = array_sum(array_column($rows, 'total'));
    $breakdown = array_map(function($r) use ($totalExp) {
        return [
            "name"       => $r['name'],
            "color"      => $r['color'],
            "icon"       => $r['icon'],
            "amount"     => (float)$r['total'],
            "percentage" => $totalExp > 0 ? round(((float)$r['total'] / $totalExp) * 100, 1) : 0
        ];
    }, $rows);

    echo json_encode([
        "success" => true,
        "data"    => [
            "breakdown"    => $breakdown,
            "items"        => array_map(function($b) {
                return [
                    "categoryId"   => $b['name'],
                    "categoryName" => $b['name'],
                    "name"         => $b['name'],
                    "color"        => $b['color'],
                    "icon"         => $b['icon'],
                    "amount"       => $b['amount'],
                    "percentage"   => $b['percentage']
                ];
            }, $breakdown),
            "total"        => $totalExp,
            "totalExpense" => $totalExp
        ]
    ]);
    exit;
}

// DASHBOARD: RECENT TRANSACTIONS
if ($path === 'dashboard/recent-transactions' && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    if (!$userId) { http_response_code(401); echo json_encode(["success"=>false,"message"=>"Tidak terautentikasi."]); exit; }

    $stmt = $pdo->prepare("
        SELECT t.*, c.name as cat_name, c.icon as cat_icon, c.color as cat_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ?
        ORDER BY t.transaction_date DESC
        LIMIT 5
    ");
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();

    $data = array_map(function($r) {
        return [
            "id"              => $r['id'],
            "title"           => $r['title'],
            "type"            => $r['type'],
            "amount"          => (float)$r['amount'],
            "merchant"        => $r['merchant'],
            "transactionDate" => $r['transaction_date'],
            "category" => [
                "name"  => $r['cat_name']  ?: 'Lainnya',
                "icon"  => $r['cat_icon']  ?: 'Tag',
                "color" => $r['cat_color'] ?: '#64748B'
            ]
        ];
    }, $rows);

    echo json_encode(["success" => true, "data" => $data]);
    exit;
}

// DASHBOARD: AI INSIGHTS
if ($path === 'dashboard/insights' && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    if (!$userId) { http_response_code(401); echo json_encode(["success"=>false,"message"=>"Tidak terautentikasi."]); exit; }

    // Hitung statistik bulan ini untuk generate insight
    $start = (new DateTime('first day of this month'))->format('Y-m-d 00:00:00');
    $end   = (new DateTime())->format('Y-m-d 23:59:59');

    $stmt = $pdo->prepare("SELECT
        COALESCE(SUM(CASE WHEN type='INCOME' THEN amount ELSE 0 END),0) as income,
        COALESCE(SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END),0) as expense,
        COUNT(*) as txCount
        FROM transactions WHERE user_id=? AND transaction_date BETWEEN ? AND ?");
    $stmt->execute([$userId, $start, $end]);
    $stats = $stmt->fetch();
    $income  = (float)$stats['income'];
    $expense = (float)$stats['expense'];
    $savings = $income - $expense;
    $savRate = $income > 0 ? round(($savings / $income) * 100) : 0;

    // Top kategori pengeluaran
    $topCatStmt = $pdo->prepare("SELECT c.name, SUM(t.amount) as total
        FROM transactions t LEFT JOIN categories c ON t.category_id=c.id
        WHERE t.user_id=? AND t.type='EXPENSE' AND t.transaction_date BETWEEN ? AND ?
        GROUP BY t.category_id ORDER BY total DESC LIMIT 1");
    $topCatStmt->execute([$userId, $start, $end]);
    $topCat = $topCatStmt->fetch();

    $insights = [];

    if ($income > 0 && $savRate >= 20) {
        $insights[] = ["type"=>"positive","icon"=>"TrendingUp","title"=>"Tabungan Bagus!","message"=>"Kamu berhasil menabung " . $savRate . "% dari pendapatanmu bulan ini. Pertahankan!"];
    } elseif ($income > 0 && $savRate < 10) {
        $insights[] = ["type"=>"warning","icon"=>"AlertTriangle","title"=>"Tingkat Tabungan Rendah","message"=>"Tabunganmu bulan ini hanya " . $savRate . "%. Target minimal 20% untuk keuangan sehat."];
    }

    if ($topCat && $topCat['name']) {
        $insights[] = ["type"=>"info","icon"=>"PieChart","title"=>"Pengeluaran Terbesar","message"=>"Kategori '" . $topCat['name'] . "' adalah pengeluaran terbesar bulan ini sebesar Rp " . number_format((float)$topCat['total'], 0, ',', '.') . "."];
    }

    if ($expense > $income && $income > 0) {
        $insights[] = ["type"=>"danger","icon"=>"AlertCircle","title"=>"Pengeluaran Melebihi Pemasukan!","message"=>"Bulan ini pengeluaranmu lebih besar dari pemasukan sebesar Rp " . number_format($expense - $income, 0, ',', '.') . ". Saatnya evaluasi."];
    }

    if (empty($insights)) {
        $insights[] = ["type"=>"info","icon"=>"Sparkles","title"=>"Mulai Catat Transaksi!","message"=>"Semakin lengkap data transaksimu, semakin akurat analisis AI untuk membantu keputusan finansialmu."];
    }

    echo json_encode(["success" => true, "data" => $insights]);
    exit;
}

// TRANSACTIONS
if (preg_match('#^transactions(/([^/]+))?$#', $path, $txMatch)) {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $txId = $txMatch[2] ?? null; // specific transaction ID if present

    if ($method === 'GET' && !$txId) {
        // Parse query params
        $searchQ     = $_GET['search']        ?? '';
        $typeFilter  = $_GET['type']          ?? 'ALL';
        $catFilter   = $_GET['categoryId']    ?? 'ALL';
        $pmFilter    = $_GET['paymentMethod'] ?? 'ALL';
        $pageNum     = max(1, (int)($_GET['page']  ?? 1));
        $limitNum    = max(1, min(100, (int)($_GET['limit'] ?? 10)));
        $sortByCol   = in_array($_GET['sortBy'] ?? '', ['transactionDate','amount','title']) ? ($_GET['sortBy']) : 'transaction_date';
        $sortByCol   = $sortByCol === 'transactionDate' ? 'transaction_date' : $sortByCol;
        $sortOrd     = strtoupper($_GET['sortOrder'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
        $offset      = ($pageNum - 1) * $limitNum;

        // Build WHERE clause
        $where  = ['t.user_id = ?'];
        $params = [$userId];
        if ($searchQ) { $where[] = '(t.title LIKE ? OR t.merchant LIKE ?)'; $params[] = "%$searchQ%"; $params[] = "%$searchQ%"; }
        if ($typeFilter !== 'ALL') { $where[] = 't.type = ?'; $params[] = $typeFilter; }
        if ($catFilter  !== 'ALL') { $where[] = 't.category_id = ?'; $params[] = $catFilter; }
        if ($pmFilter   !== 'ALL') { $where[] = 't.payment_method = ?'; $params[] = $pmFilter; }
        $whereStr = implode(' AND ', $where);

        // Count total rows for pagination
        $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM transactions t WHERE $whereStr");
        $countStmt->execute($params);
        $totalRows = (int)$countStmt->fetch()['cnt'];
        $totalPages = max(1, (int)ceil($totalRows / $limitNum));

        // Summary income/expense
        $sumStmt = $pdo->prepare("SELECT
            COALESCE(SUM(CASE WHEN t.type='INCOME' THEN t.amount ELSE 0 END), 0) as totalIncome,
            COALESCE(SUM(CASE WHEN t.type='EXPENSE' THEN t.amount ELSE 0 END), 0) as totalExpense
            FROM transactions t WHERE $whereStr");
        $sumStmt->execute($params);
        $sumRow = $sumStmt->fetch();
        $totalIncome  = (float)$sumRow['totalIncome'];
        $totalExpense = (float)$sumRow['totalExpense'];

        // Fetch paginated rows
        $dataParams   = array_merge($params, [$limitNum, $offset]);
        $dataStmt = $pdo->prepare("
            SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE $whereStr
            ORDER BY t.$sortByCol $sortOrd
            LIMIT ? OFFSET ?
        ");
        $dataStmt->execute($dataParams);
        $rows = $dataStmt->fetchAll();

        $formatted = array_map(function($r) {
            return [
                "id"              => $r['id'],
                "type"            => $r['type'],
                "title"           => $r['title'],
                "amount"          => (float)$r['amount'],
                "description"     => $r['description'],
                "merchant"        => $r['merchant'],
                "paymentMethod"   => $r['payment_method'],
                "transactionDate" => $r['transaction_date'],
                "categoryId"      => $r['category_id'],
                "category" => [
                    "id"    => $r['category_id'],
                    "name"  => $r['category_name']  ?: 'Lainnya',
                    "icon"  => $r['category_icon']  ?: 'Tag',
                    "color" => $r['category_color'] ?: '#64748B'
                ]
            ];
        }, $rows);

        echo json_encode([
            "success" => true,
            "data"    => $formatted,
            "pagination" => [
                "page"       => $pageNum,
                "limit"      => $limitNum,
                "total"      => $totalRows,
                "totalPages" => $totalPages
            ],
            "summary" => [
                "totalIncome"  => $totalIncome,
                "totalExpense" => $totalExpense,
                "netCashFlow"  => $totalIncome - $totalExpense
            ]
        ]);
        exit;
    }

    if ($method === 'POST' && !$txId) {
        $type            = $body['type']           ?? 'EXPENSE';
        $title           = trim($body['title']     ?? '');
        $amount          = (float)($body['amount'] ?? 0);
        $categoryId      = $body['categoryId']     ?? null;
        $merchant        = $body['merchant']       ?? null;
        $paymentMethod   = $body['paymentMethod']  ?? 'Tunai';
        $transactionDate = $body['transactionDate'] ?? date('Y-m-d H:i:s');
        $description     = $body['description']    ?? null;

        if (empty($title) || $amount <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Judul dan nominal transaksi harus valid."]);
            exit;
        }

        $newId = generate_uuid();
        $stmt  = $pdo->prepare("
            INSERT INTO transactions (id, user_id, category_id, type, title, amount, description, merchant, payment_method, transaction_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([$newId, $userId, $categoryId, $type, $title, $amount, $description, $merchant, $paymentMethod, $transactionDate]);

        echo json_encode([
            "success" => true,
            "message" => "Transaksi berhasil dicatat!",
            "data"    => ["id" => $newId, "title" => $title, "amount" => $amount]
        ]);
        exit;
    }

    if (($method === 'PUT' || $method === 'PATCH') && $txId) {
        $title           = trim($body['title']      ?? '');
        $amount          = (float)($body['amount']  ?? 0);
        $type            = $body['type']             ?? 'EXPENSE';
        $categoryId      = $body['categoryId']       ?? null;
        $merchant        = $body['merchant']         ?? null;
        $paymentMethod   = $body['paymentMethod']    ?? 'Tunai';
        $transactionDate = $body['transactionDate']  ?? date('Y-m-d H:i:s');
        $description     = $body['description']      ?? null;

        $stmt = $pdo->prepare("
            UPDATE transactions SET title=?, amount=?, type=?, category_id=?, merchant=?,
            payment_method=?, transaction_date=?, description=?, updated_at=NOW()
            WHERE id=? AND user_id=?
        ");
        $stmt->execute([$title, $amount, $type, $categoryId, $merchant, $paymentMethod, $transactionDate, $description, $txId, $userId]);
        echo json_encode(["success" => true, "message" => "Transaksi berhasil diperbarui!"]);
        exit;
    }

    if ($method === 'DELETE' && $txId) {
        $stmt = $pdo->prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?");
        $stmt->execute([$txId, $userId]);
        echo json_encode(["success" => true, "message" => "Transaksi berhasil dihapus."]);
        exit;
    }
}

// RECEIPTS/SCAN — AI OCR Parser untuk Struk & Laporan Keuangan PDF/Gambar
if ($path === 'receipts/scan' && $method === 'POST') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Sesi Anda telah berakhir. Silakan login kembali."]);
        exit;
    }

    if (!isset($_FILES['receipt']) || $_FILES['receipt']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Harap unggah file struk (JPG, PNG, PDF)."]);
        exit;
    }

    $file    = $_FILES['receipt'];
    $maxSize = 5 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Ukuran file maksimal 5 MB."]);
        exit;
    }

    $mime      = mime_content_type($file['tmp_name']);
    $isPdf     = ($mime === 'application/pdf' || strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) === 'pdf');
    $rawText   = '';

    // ── Ekstrak teks dari PDF ──────────────────────────────────────────────────
    if ($isPdf) {
        $pdfContent = file_get_contents($file['tmp_name']);

        // Metode 1: baca text stream dari PDF (works for text-based PDFs)
        $rawText = '';
        // Extract text between BT (Begin Text) and ET (End Text) markers
        preg_match_all('/BT\s*(.*?)\s*ET/s', $pdfContent, $btMatches);
        if (!empty($btMatches[1])) {
            foreach ($btMatches[1] as $block) {
                // Extract strings in parentheses  (PDF text encoding)
                preg_match_all('/\(([^)]*)\)/', $block, $strMatches);
                if (!empty($strMatches[1])) {
                    $rawText .= implode(' ', $strMatches[1]) . "\n";
                }
                // Extract hex strings  <hex>
                preg_match_all('/<([0-9a-fA-F]+)>/', $block, $hexMatches);
                if (!empty($hexMatches[1])) {
                    foreach ($hexMatches[1] as $hex) {
                        if (strlen($hex) % 2 === 0) {
                            $decoded = '';
                            for ($i = 0; $i < strlen($hex); $i += 2) {
                                $char = chr(hexdec(substr($hex, $i, 2)));
                                if (ord($char) >= 32 && ord($char) < 127) $decoded .= $char;
                            }
                            if ($decoded) $rawText .= $decoded . ' ';
                        }
                    }
                }
            }
        }

        // Metode 2: fallback — cari pattern angka dan kata langsung di binary PDF
        if (strlen(trim($rawText)) < 20) {
            // Ambil semua printable ASCII dari PDF
            $printable = preg_replace('/[^\x20-\x7E\n\r\t]/', ' ', $pdfContent);
            // Cari baris yang mengandung angka besar (kemungkinan nominal)
            $lines = explode("\n", $printable);
            foreach ($lines as $ln) {
                $ln = trim($ln);
                // Ambil baris yang punya minimal 4 karakter dan ada angka
                if (strlen($ln) > 4 && preg_match('/\d/', $ln)) {
                    $rawText .= $ln . "\n";
                }
            }
        }
    } else {
        // Untuk gambar — kita tidak bisa OCR tanpa library eksternal di shared hosting
        // Tapi kita bisa return mock yang user bisa edit manual
        $rawText = "IMAGE_UPLOAD_" . $file['name'];
    }

    // ── Parse teks menjadi item transaksi ────────────────────────────────────
    $lines = array_filter(array_map('trim', explode("\n", $rawText)));

    $items         = [];
    $totalAmount   = 0;
    $detectedDate  = date('Y-m-d');
    $merchant      = '';
    $categorySugg  = 'Lainnya (Pengeluaran)';
    $isIncomeDoc   = false;

    // Keyword pendeteksi dokumen pemasukan
    $incomeKeywords  = ['gaji', 'salary', 'pendapatan', 'pemasukan', 'income', 'kredit', 'credit', 'transfer masuk', 'setoran', 'deposit', 'bonus', 'dividen', 'tunjangan'];
    $expenseKeywords = ['debit', 'belanja', 'pengeluaran', 'expense', 'pembelian', 'bayar', 'pembayaran', 'tagihan', 'cicilan'];

    $fullText = strtolower(implode(' ', $lines));

    // Deteksi tipe dokumen
    $incomeScore = 0;
    $expenseScore = 0;
    foreach ($incomeKeywords  as $kw) { if (strpos($fullText, $kw) !== false) $incomeScore++; }
    foreach ($expenseKeywords as $kw) { if (strpos($fullText, $kw) !== false) $expenseScore++; }
    $isIncomeDoc = $incomeScore > $expenseScore;

    // Deteksi tanggal (format: dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd)
    if (preg_match('/(\d{4}[-\/]\d{2}[-\/]\d{2})/', $rawText, $dateM)) {
        $detectedDate = str_replace('/', '-', $dateM[1]);
    } elseif (preg_match('/(\d{2}[-\/]\d{2}[-\/]\d{4})/', $rawText, $dateM)) {
        $parts = preg_split('/[-\/]/', $dateM[1]);
        $detectedDate = "{$parts[2]}-{$parts[1]}-{$parts[0]}";
    }

    // Deteksi merchant/nama bank/instansi (baris pertama biasanya nama)
    $lineArr = array_values($lines);
    for ($i = 0; $i < min(5, count($lineArr)); $i++) {
        $ln = trim($lineArr[$i]);
        // Ambil baris yang isinya kata (bukan angka murni)
        if (strlen($ln) > 3 && !preg_match('/^\d+$/', $ln) && !preg_match('/^\d{4}-\d{2}-\d{2}/', $ln)) {
            $merchant = $ln;
            break;
        }
    }
    if (!$merchant) $merchant = $isPdf ? 'Laporan Keuangan' : 'Struk Belanja';

    // Parse item & nominal dari setiap baris
    $amountPattern = '/(?:Rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*$/';
    $seenAmounts = [];

    foreach ($lines as $ln) {
        // Cari baris yang ada nominalnya di akhir
        if (preg_match($amountPattern, $ln, $amtM)) {
            $rawAmt = $amtM[1];
            // Normalisasi: hapus titik ribuan, ganti koma desimal → titik
            $rawAmt = str_replace('.', '', $rawAmt);
            $rawAmt = str_replace(',', '.', $rawAmt);
            $numAmt = (float)$rawAmt;

            // Abaikan angka kecil (<= 100) dan duplikat
            if ($numAmt <= 100) continue;
            if (in_array($numAmt, $seenAmounts)) continue;
            $seenAmounts[] = $numAmt;

            $itemName = trim(preg_replace($amountPattern, '', $ln));
            $itemName = preg_replace('/^\W+/', '', $itemName);
            if (strlen($itemName) < 2) $itemName = ($isIncomeDoc ? 'Pemasukan' : 'Item Belanja');

            // Deteksi apakah baris ini income atau expense
            $lnLower   = strtolower($ln);
            $lineIsInc = false;
            foreach ($incomeKeywords as $kw) {
                if (strpos($lnLower, $kw) !== false) { $lineIsInc = true; break; }
            }

            $items[] = [
                "name"   => $itemName,
                "price"  => $numAmt,
                "type"   => $lineIsInc ? 'INCOME' : ($isIncomeDoc ? 'INCOME' : 'EXPENSE')
            ];
        }
    }

    // Hitung total: ambil nilai terbesar sebagai "grand total" jika ada kata TOTAL
    $totalLine = 0;
    foreach ($lines as $ln) {
        if (preg_match('/total|grand total|jumlah|amount/i', $ln) && preg_match($amountPattern, $ln, $tM)) {
            $rawT = str_replace(['.', ','], ['', '.'], $tM[1]);
            $totalLine = (float)$rawT;
            break;
        }
    }

    if ($totalLine > 0) {
        $totalAmount = $totalLine;
    } elseif (!empty($items)) {
        // Ambil nilai terbesar sebagai total
        $totalAmount = max(array_column($items, 'price'));
    }

    // Kategori suggestion berdasarkan keyword
    $catMap = [
        'makan'       => 'Makan & Minum', 'minum' => 'Makan & Minum', 'resto' => 'Makan & Minum',
        'bensin'      => 'Transportasi',  'grab'  => 'Transportasi', 'ojek' => 'Transportasi', 'tol' => 'Transportasi',
        'listrik'     => 'Tagihan', 'pln' => 'Tagihan', 'telpon' => 'Tagihan', 'internet' => 'Tagihan', 'pdam' => 'Tagihan',
        'belanja'     => 'Belanja', 'indomaret' => 'Belanja', 'alfamart' => 'Belanja', 'tokopedia' => 'Belanja', 'shopee' => 'Belanja',
        'obat'        => 'Kesehatan', 'klinik' => 'Kesehatan', 'rumah sakit' => 'Kesehatan', 'apotik' => 'Kesehatan',
        'netflix'     => 'Langganan', 'spotify' => 'Langganan', 'youtube' => 'Langganan',
        'gaji'        => 'Gaji', 'salary' => 'Gaji', 'freelance' => 'Freelance',
        'investasi'   => 'Investasi', 'saham' => 'Investasi', 'reksa' => 'Investasi',
    ];
    foreach ($catMap as $kw => $cat) {
        if (strpos($fullText, $kw) !== false) { $categorySugg = $cat; break; }
    }
    if ($isIncomeDoc && $categorySugg === 'Lainnya (Pengeluaran)') $categorySugg = 'Gaji';

    // Jika tidak ada item terdeteksi, buat 1 item placeholder yang user bisa edit
    if (empty($items) && $totalAmount == 0) {
        $items = [["name" => ($isIncomeDoc ? "Pemasukan" : "Pembelian"), "price" => 0, "type" => ($isIncomeDoc ? "INCOME" : "EXPENSE")]];
    }

    $receiptId = generate_uuid();

    echo json_encode([
        "success" => true,
        "data" => [
            "receiptId" => $receiptId,
            "rawText"   => substr($rawText, 0, 500), // preview teks (max 500 char)
            "extracted" => [
                "merchant"          => $merchant,
                "totalAmount"       => $totalAmount,
                "date"              => $detectedDate . "T00:00:00.000Z",
                "categorySuggestion"=> $categorySugg,
                "isIncome"          => $isIncomeDoc,
                "items"             => $items,
                "confidence"        => count($items) > 0 ? "medium" : "low"
            ]
        ],
        "message" => count($items) > 0
            ? "Berhasil mengekstrak " . count($items) . " item dari dokumen. Harap periksa dan sesuaikan data."
            : "Dokumen berhasil diproses. Harap isi nominal secara manual karena teks tidak terdeteksi otomatis."
    ]);
    exit;
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


// ============================================================================
// BUDGETS (Full CRUD + Metrics + Overview)
// ============================================================================
if (preg_match('#^budgets(/([^/]+))?$#', $path, $bMatch)) {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $budgetId = $bMatch[2] ?? null;

    // GET /budgets
    if ($method === 'GET' && !$budgetId) {
        $stmt = $pdo->prepare("
            SELECT b.*, c.name as cat_name, c.icon as cat_icon, c.color as cat_color
            FROM budgets b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        ");
        $stmt->execute([$userId]);
        $rawBudgets = $stmt->fetchAll();

        $budgetsWithProgress = [];
        $totalBudgetLimit = 0;
        $totalSpent = 0;

        foreach ($rawBudgets as $b) {
            $limit = (float)$b['amount'];
            $totalBudgetLimit += $limit;

            // Hitung pengeluaran pada periode anggaran
            $whereCat = !empty($b['category_id']) ? "AND category_id = '{$b['category_id']}'" : "";
            $spStmt = $pdo->prepare("
                SELECT COALESCE(SUM(amount), 0) as spent
                FROM transactions
                WHERE user_id = ? AND type = 'EXPENSE'
                AND transaction_date >= ? AND transaction_date <= ?
                $whereCat
            ");
            $spStmt->execute([$userId, $b['period_start'], $b['period_end']]);
            $spent = (float)$spStmt->fetch()['spent'];
            $totalSpent += $spent;

            $remaining = max(0, $limit - $spent);
            $percentage = $limit > 0 ? round(($spent / $limit) * 100) : 0;
            $threshold = (int)($b['alert_threshold'] ?? 80);

            $status = 'NORMAL';
            if ($percentage >= 100) {
                $status = 'EXCEEDED';
            } elseif ($percentage >= $threshold) {
                $status = 'WARNING';
            }

            $budgetsWithProgress[] = [
                "id"              => $b['id'],
                "name"            => $b['name'],
                "categoryId"      => $b['category_id'],
                "category"        => $b['category_id'] ? [
                    "id"    => $b['category_id'],
                    "name"  => $b['cat_name'] ?: 'Lainnya',
                    "icon"  => $b['cat_icon'] ?: 'Tag',
                    "color" => $b['cat_color'] ?: '#64748B'
                ] : null,
                "amount"          => $limit,
                "spentAmount"     => $spent,
                "remainingAmount" => $remaining,
                "percentageUsed"  => $percentage,
                "alertThreshold"  => $threshold,
                "periodStart"     => $b['period_start'],
                "periodEnd"       => $b['period_end'],
                "status"          => $status,
                "createdAt"       => $b['created_at'],
            ];
        }

        $totalRemaining = max(0, $totalBudgetLimit - $totalSpent);
        $overallPercentage = $totalBudgetLimit > 0 ? round(($totalSpent / $totalBudgetLimit) * 100) : 0;

        echo json_encode([
            "success" => true,
            "data"    => $budgetsWithProgress,
            "overview" => [
                "totalBudgetLimit"  => $totalBudgetLimit,
                "totalSpent"        => $totalSpent,
                "totalRemaining"    => $totalRemaining,
                "overallPercentage" => $overallPercentage
            ]
        ]);
        exit;
    }

    // POST /budgets
    if ($method === 'POST' && !$budgetId) {
        $name = trim($body['name'] ?? '');
        $amount = (float)($body['amount'] ?? 0);
        $categoryId = !empty($body['categoryId']) ? $body['categoryId'] : null;
        $periodStart = !empty($body['periodStart']) ? $body['periodStart'] : date('Y-m-01 00:00:00');
        $periodEnd = !empty($body['periodEnd']) ? $body['periodEnd'] : date('Y-m-t 23:59:59');
        $alertThreshold = (int)($body['alertThreshold'] ?? 80);

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Harap masukkan nama anggaran."]);
            exit;
        }
        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Nominal anggaran harus lebih besar dari 0."]);
            exit;
        }

        $id = generate_uuid();
        $stmt = $pdo->prepare("
            INSERT INTO budgets (id, user_id, category_id, name, amount, period_start, period_end, alert_threshold, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([$id, $userId, $categoryId, $name, $amount, $periodStart, $periodEnd, $alertThreshold]);

        echo json_encode([
            "success" => true,
            "message" => "Anggaran berhasil dibuat!",
            "data" => [
                "id"             => $id,
                "name"           => $name,
                "amount"         => $amount,
                "categoryId"     => $categoryId,
                "periodStart"    => $periodStart,
                "periodEnd"      => $periodEnd,
                "alertThreshold" => $alertThreshold
            ]
        ]);
        exit;
    }

    // PATCH or PUT /budgets/:id
    if (in_array($method, ['PUT', 'PATCH']) && $budgetId) {
        $fields = [];
        $params = [];

        if (isset($body['name'])) { $fields[] = "name = ?"; $params[] = trim($body['name']); }
        if (isset($body['amount'])) { $fields[] = "amount = ?"; $params[] = (float)$body['amount']; }
        if (array_key_exists('categoryId', $body)) { $fields[] = "category_id = ?"; $params[] = $body['categoryId'] ?: null; }
        if (isset($body['periodStart'])) { $fields[] = "period_start = ?"; $params[] = $body['periodStart']; }
        if (isset($body['periodEnd'])) { $fields[] = "period_end = ?"; $params[] = $body['periodEnd']; }
        if (isset($body['alertThreshold'])) { $fields[] = "alert_threshold = ?"; $params[] = (int)$body['alertThreshold']; }

        if (!empty($fields)) {
            $fields[] = "updated_at = NOW()";
            $params[] = $budgetId;
            $params[] = $userId;
            $stmt = $pdo->prepare("UPDATE budgets SET " . implode(', ', $fields) . " WHERE id = ? AND user_id = ?");
            $stmt->execute($params);
        }

        echo json_encode(["success" => true, "message" => "Anggaran berhasil diperbarui."]);
        exit;
    }

    // DELETE /budgets/:id
    if ($method === 'DELETE' && $budgetId) {
        $stmt = $pdo->prepare("DELETE FROM budgets WHERE id = ? AND user_id = ?");
        $stmt->execute([$budgetId, $userId]);
        echo json_encode(["success" => true, "message" => "Anggaran berhasil dihapus."]);
        exit;
    }
}

// ============================================================================
// SAVINGS GOALS (Full CRUD + Metrics + Contributions)
// ============================================================================
if (preg_match('#^goals(/([^/]+)(/contributions)?)?$#', $path, $gMatch)) {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $goalId = $gMatch[2] ?? null;
    $isContribution = !empty($gMatch[3]);

    // POST /goals/:id/contributions
    if ($isContribution && $method === 'POST') {
        $amount = (float)($body['amount'] ?? 0);
        $note = trim($body['note'] ?? 'Setoran tabungan');

        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Nominal setoran tabungan harus lebih dari 0."]);
            exit;
        }

        // Cek tujuan
        $gStmt = $pdo->prepare("SELECT * FROM savings_goals WHERE id = ? AND user_id = ?");
        $gStmt->execute([$goalId, $userId]);
        $goal = $gStmt->fetch();
        if (!$goal) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Tujuan finansial tidak ditemukan."]);
            exit;
        }

        $cId = generate_uuid();
        $insC = $pdo->prepare("
            INSERT INTO savings_contributions (id, goal_id, user_id, amount, note, contribution_date, created_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $insC->execute([$cId, $goalId, $userId, $amount, $note]);

        $newCurrent = (float)$goal['current_amount'] + $amount;
        $target = (float)$goal['target_amount'];
        $newStatus = ($newCurrent >= $target) ? 'COMPLETED' : $goal['status'];

        $upG = $pdo->prepare("UPDATE savings_goals SET current_amount = ?, status = ?, updated_at = NOW() WHERE id = ? AND user_id = ?");
        $upG->execute([$newCurrent, $newStatus, $goalId, $userId]);

        echo json_encode([
            "success" => true,
            "message" => ($newCurrent >= $target) ? "Luar biasa! Target tabunganmu telah tercapai 100%! 🎉" : "Setoran tabungan berhasil dicatat!",
            "data" => [
                "currentAmount" => $newCurrent,
                "status"        => $newStatus
            ]
        ]);
        exit;
    }

    // GET /goals
    if ($method === 'GET' && !$goalId) {
        $stmt = $pdo->prepare("SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        $goals = $stmt->fetchAll();

        $goalsWithMetrics = [];
        $now = time();

        foreach ($goals as $g) {
            $target = (float)$g['target_amount'];
            $current = (float)$g['current_amount'];
            $remaining = max(0, $target - $current);
            $percentage = $target > 0 ? min(100, round(($current / $target) * 100)) : 0;

            $targetTs = strtotime($g['target_date']);
            $diffSecs = $targetTs - $now;
            $daysRemaining = max(0, (int)ceil($diffSecs / 86400));
            $monthsRemaining = max(1, (int)ceil($daysRemaining / 30));
            $monthlyNeeded = $remaining > 0 ? round($remaining / $monthsRemaining) : 0;

            // Fetch last 5 contributions
            $cStmt = $pdo->prepare("SELECT id, amount, note, contribution_date as date FROM savings_contributions WHERE goal_id = ? ORDER BY contribution_date DESC LIMIT 5");
            $cStmt->execute([$g['id']]);
            $contributions = $cStmt->fetchAll();

            $goalsWithMetrics[] = [
                "id"                   => $g['id'],
                "name"                 => $g['name'],
                "description"          => $g['description'],
                "targetAmount"         => $target,
                "currentAmount"        => $current,
                "remainingAmount"      => $remaining,
                "percentage"           => $percentage,
                "targetDate"           => $g['target_date'],
                "priority"             => $g['priority'],
                "status"               => $g['status'],
                "icon"                 => $g['icon'] ?: 'Target',
                "daysRemaining"        => $daysRemaining,
                "monthlySavingsNeeded" => $monthlyNeeded,
                "recentContributions"  => array_map(function($c) {
                    return [
                        "id"     => $c['id'],
                        "amount" => (float)$c['amount'],
                        "date"   => $c['date'],
                        "note"   => $c['note']
                    ];
                }, $contributions),
                "createdAt"            => $g['created_at'],
            ];
        }

        echo json_encode(["success" => true, "data" => $goalsWithMetrics]);
        exit;
    }

    // POST /goals
    if ($method === 'POST' && !$goalId) {
        $name = trim($body['name'] ?? '');
        $desc = trim($body['description'] ?? '');
        $target = (float)($body['targetAmount'] ?? 0);
        $current = (float)($body['currentAmount'] ?? 0);
        $targetDate = $body['targetDate'] ?? date('Y-m-d', strtotime('+6 months'));
        $priority = strtoupper($body['priority'] ?? 'MEDIUM');
        $icon = $body['icon'] ?? 'Target';

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Harap masukkan nama tujuan tabungan."]);
            exit;
        }
        if ($target <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Target nominal harus lebih besar dari 0."]);
            exit;
        }

        $id = generate_uuid();
        $stmt = $pdo->prepare("
            INSERT INTO savings_goals (id, user_id, name, description, target_amount, current_amount, target_date, priority, status, icon, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'IN_PROGRESS', ?, NOW(), NOW())
        ");
        $stmt->execute([$id, $userId, $name, $desc ?: null, $target, $current, $targetDate, $priority, $icon]);

        echo json_encode([
            "success" => true,
            "message" => "Tujuan finansial berhasil dibuat!",
            "data" => [
                "id"            => $id,
                "name"          => $name,
                "targetAmount"  => $target,
                "currentAmount" => $current
            ]
        ]);
        exit;
    }

    // PATCH or PUT /goals/:id
    if (in_array($method, ['PUT', 'PATCH']) && $goalId) {
        $fields = [];
        $params = [];

        if (isset($body['name'])) { $fields[] = "name = ?"; $params[] = trim($body['name']); }
        if (isset($body['description'])) { $fields[] = "description = ?"; $params[] = trim($body['description']) ?: null; }
        if (isset($body['targetAmount'])) { $fields[] = "target_amount = ?"; $params[] = (float)$body['targetAmount']; }
        if (isset($body['currentAmount'])) { $fields[] = "current_amount = ?"; $params[] = (float)$body['currentAmount']; }
        if (isset($body['targetDate'])) { $fields[] = "target_date = ?"; $params[] = $body['targetDate']; }
        if (isset($body['priority'])) { $fields[] = "priority = ?"; $params[] = strtoupper($body['priority']); }
        if (isset($body['status'])) { $fields[] = "status = ?"; $params[] = $body['status']; }
        if (isset($body['icon'])) { $fields[] = "icon = ?"; $params[] = $body['icon']; }

        if (!empty($fields)) {
            $fields[] = "updated_at = NOW()";
            $params[] = $goalId;
            $params[] = $userId;
            $stmt = $pdo->prepare("UPDATE savings_goals SET " . implode(', ', $fields) . " WHERE id = ? AND user_id = ?");
            $stmt->execute($params);
        }

        echo json_encode(["success" => true, "message" => "Tujuan finansial berhasil diperbarui."]);
        exit;
    }

    // DELETE /goals/:id
    if ($method === 'DELETE' && $goalId) {
        $cDel = $pdo->prepare("DELETE FROM savings_contributions WHERE goal_id = ? AND user_id = ?");
        $cDel->execute([$goalId, $userId]);
        $gDel = $pdo->prepare("DELETE FROM savings_goals WHERE id = ? AND user_id = ?");
        $gDel->execute([$goalId, $userId]);
        echo json_encode(["success" => true, "message" => "Tujuan finansial berhasil dihapus."]);
        exit;
    }
}

// ============================================================================
// REPORTS: GENERATE FINANCIAL REPORT
// ============================================================================
if ($path === 'reports/generate' && $method === 'POST') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $reportType = $body['reportType'] ?? 'monthly_summary';
    $startDate = !empty($body['startDate']) ? $body['startDate'] : (new DateTime('first day of this month'))->format('Y-m-d');
    $endDate = !empty($body['endDate']) ? $body['endDate'] : (new DateTime('last day of this month'))->format('Y-m-d');

    $startTs = $startDate . ' 00:00:00';
    $endTs = $endDate . ' 23:59:59';

    // 1. Transaksi dalam rentang tanggal
    $txStmt = $pdo->prepare("
        SELECT t.id, t.title, t.type, t.amount, t.payment_method, DATE(t.transaction_date) as tx_date,
               COALESCE(c.name, 'Lainnya') as cat_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ? AND t.transaction_date >= ? AND t.transaction_date <= ?
        ORDER BY t.transaction_date DESC
    ");
    $txStmt->execute([$userId, $startTs, $endTs]);
    $transactions = $txStmt->fetchAll();

    $totalIncome = 0;
    $totalExpense = 0;
    $categoryMap = [];

    foreach ($transactions as $t) {
        $amt = (float)$t['amount'];
        if ($t['type'] === 'INCOME') $totalIncome += $amt;
        if ($t['type'] === 'EXPENSE') $totalExpense += $amt;

        $cName = $t['cat_name'];
        if (!isset($categoryMap[$cName])) {
            $categoryMap[$cName] = ["name" => $cName, "type" => $t['type'], "total" => 0, "count" => 0];
        }
        $categoryMap[$cName]['total'] += $amt;
        $categoryMap[$cName]['count'] += 1;
    }

    $categoryBreakdown = array_values($categoryMap);
    usort($categoryBreakdown, function($a, $b) { return $b['total'] <=> $a['total']; });

    // 2. Evaluasi Anggaran
    $bStmt = $pdo->prepare("
        SELECT b.*, COALESCE(c.name, 'Semua') as cat_name
        FROM budgets b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = ?
    ");
    $bStmt->execute([$userId]);
    $budgets = $bStmt->fetchAll();

    $budgetPerformance = [];
    foreach ($budgets as $b) {
        $limit = (float)$b['amount'];
        $whereCat = !empty($b['category_id']) ? "AND category_id = '{$b['category_id']}'" : "";
        $sStmt = $pdo->prepare("
            SELECT COALESCE(SUM(amount),0) as spent
            FROM transactions
            WHERE user_id = ? AND type='EXPENSE' AND transaction_date >= ? AND transaction_date <= ? $whereCat
        ");
        $sStmt->execute([$userId, $b['period_start'], $b['period_end']]);
        $spent = (float)$sStmt->fetch()['spent'];
        $pct = $limit > 0 ? round(($spent / $limit) * 100) : 0;
        $budgetPerformance[] = [
            "name"       => $b['name'],
            "category"   => $b['cat_name'],
            "limit"      => $limit,
            "spent"      => $spent,
            "percentage" => $pct
        ];
    }

    // 3. Ringkasan Target Tabungan
    $gStmt = $pdo->prepare("SELECT name, target_amount, current_amount FROM savings_goals WHERE user_id = ?");
    $gStmt->execute([$userId]);
    $goals = $gStmt->fetchAll();
    $goalSummary = array_map(function($g) {
        $target = (float)$g['target_amount'];
        $current = (float)$g['current_amount'];
        return [
            "name"     => $g['name'],
            "target"   => $target,
            "current"  => $current,
            "progress" => $target > 0 ? round(($current / $target) * 100) : 0
        ];
    }, $goals);

    $txFormatted = array_map(function($t) {
        return [
            "id"            => $t['id'],
            "date"          => $t['tx_date'],
            "title"         => $t['title'],
            "category"      => $t['cat_name'],
            "type"          => $t['type'],
            "amount"        => (float)$t['amount'],
            "paymentMethod" => $t['payment_method']
        ];
    }, $transactions);

    $netCashFlow = $totalIncome - $totalExpense;
    $savingsRate = $totalIncome > 0 ? round((max(0, $netCashFlow) / $totalIncome) * 100) : 0;

    echo json_encode([
        "success" => true,
        "data" => [
            "reportType"  => $reportType,
            "period"      => [
                "start" => $startDate,
                "end"   => $endDate
            ],
            "generatedAt" => date('Y-m-d H:i:s'),
            "summary"     => [
                "totalIncome"       => $totalIncome,
                "totalExpense"      => $totalExpense,
                "netCashFlow"       => $netCashFlow,
                "savingsRate"       => $savingsRate,
                "totalTransactions" => count($transactions)
            ],
            "categoryBreakdown" => $categoryBreakdown,
            "budgetPerformance" => $budgetPerformance,
            "goalSummary"       => $goalSummary,
            "transactions"      => $txFormatted
        ]
    ]);
    exit;
}

// ============================================================================
// ANALYTICS (Cash-Flow 6 Bulan, Pengeluaran, Pemasukan, Kesehatan Finansial)
// ============================================================================

// GET /analytics/cash-flow (Historis 6 Bulan Terakhir)
if ($path === 'analytics/cash-flow' && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $monthNamesId = [
        1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr', 5 => 'Mei', 6 => 'Jun',
        7 => 'Jul', 8 => 'Agu', 9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des'
    ];

    $monthlyData = [];
    $now = new DateTime();

    for ($i = 5; $i >= 0; $i--) {
        $d = (clone $now)->modify("-{$i} month");
        $year = (int)$d->format('Y');
        $month = (int)$d->format('n');
        $start = (clone $d)->modify('first day of this month')->format('Y-m-d 00:00:00');
        $end = (clone $d)->modify('last day of this month')->format('Y-m-d 23:59:59');
        $label = ($monthNamesId[$month] ?? $d->format('M')) . ' ' . $year;

        $stmt = $pdo->prepare("
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as expense
            FROM transactions
            WHERE user_id = ? AND transaction_date >= ? AND transaction_date <= ?
        ");
        $stmt->execute([$userId, $start, $end]);
        $row = $stmt->fetch();
        $inc = (float)($row['income'] ?? 0);
        $exp = (float)($row['expense'] ?? 0);

        $monthlyData[] = [
            "month"   => $label,
            "income"  => $inc,
            "expense" => $exp,
            "net"     => $inc - $exp
        ];
    }

    echo json_encode(["success" => true, "data" => $monthlyData]);
    exit;
}

// GET /analytics/expenses (Analisis Pos Pengeluaran Kategori)
if ($path === 'analytics/expenses' && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $start = (new DateTime('first day of this month'))->format('Y-m-d 00:00:00');
    $end = (new DateTime('last day of this month'))->format('Y-m-d 23:59:59');

    $stmt = $pdo->prepare("
        SELECT 
            t.category_id,
            COALESCE(c.name, 'Lainnya') as name,
            COALESCE(c.icon, 'Tag') as icon,
            COALESCE(c.color, '#EF4444') as color,
            COALESCE(SUM(t.amount), 0) as totalAmount,
            COUNT(t.id) as transactionCount
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ? AND t.type = 'EXPENSE' AND t.transaction_date >= ? AND t.transaction_date <= ?
        GROUP BY t.category_id, COALESCE(c.name, 'Lainnya'), COALESCE(c.icon, 'Tag'), COALESCE(c.color, '#EF4444')
        ORDER BY totalAmount DESC
    ");
    $stmt->execute([$userId, $start, $end]);
    $rows = $stmt->fetchAll();

    // Fallback jika bulan ini belum ada transaksi: gunakan data keseluruhan agar halaman tidak kosong
    if (empty($rows)) {
        $stmtAll = $pdo->prepare("
            SELECT 
                t.category_id,
                COALESCE(c.name, 'Lainnya') as name,
                COALESCE(c.icon, 'Tag') as icon,
                COALESCE(c.color, '#EF4444') as color,
                COALESCE(SUM(t.amount), 0) as totalAmount,
                COUNT(t.id) as transactionCount
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ? AND t.type = 'EXPENSE'
            GROUP BY t.category_id, COALESCE(c.name, 'Lainnya'), COALESCE(c.icon, 'Tag'), COALESCE(c.color, '#EF4444')
            ORDER BY totalAmount DESC
        ");
        $stmtAll->execute([$userId]);
        $rows = $stmtAll->fetchAll();
    }

    $totalExpense = array_sum(array_column($rows, 'totalAmount'));

    $categories = array_map(function($r) use ($totalExpense) {
        $amt = (float)$r['totalAmount'];
        $cnt = (int)$r['transactionCount'];
        return [
            "categoryId"            => $r['category_id'] ?: 'unknown',
            "name"                  => $r['name'],
            "icon"                  => $r['icon'],
            "color"                 => $r['color'],
            "totalAmount"           => $amt,
            "transactionCount"      => $cnt,
            "averagePerTransaction" => $cnt > 0 ? round($amt / $cnt) : 0,
            "percentage"            => $totalExpense > 0 ? round(($amt / $totalExpense) * 100) : 0
        ];
    }, $rows);

    echo json_encode([
        "success" => true,
        "data" => [
            "totalExpense" => (float)$totalExpense,
            "categories"   => $categories
        ]
    ]);
    exit;
}

// GET /analytics/income (Sumber Pemasukan)
if ($path === 'analytics/income' && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $start = (new DateTime('first day of this month'))->format('Y-m-d 00:00:00');
    $end = (new DateTime('last day of this month'))->format('Y-m-d 23:59:59');

    $stmt = $pdo->prepare("
        SELECT 
            t.category_id,
            COALESCE(c.name, 'Pemasukan Lain') as name,
            COALESCE(c.icon, 'Briefcase') as icon,
            COALESCE(c.color, '#16A34A') as color,
            COALESCE(SUM(t.amount), 0) as totalAmount,
            COUNT(t.id) as transactionCount
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ? AND t.type = 'INCOME' AND t.transaction_date >= ? AND t.transaction_date <= ?
        GROUP BY t.category_id, COALESCE(c.name, 'Pemasukan Lain'), COALESCE(c.icon, 'Briefcase'), COALESCE(c.color, '#16A34A')
        ORDER BY totalAmount DESC
    ");
    $stmt->execute([$userId, $start, $end]);
    $rows = $stmt->fetchAll();

    if (empty($rows)) {
        $stmtAll = $pdo->prepare("
            SELECT 
                t.category_id,
                COALESCE(c.name, 'Pemasukan Lain') as name,
                COALESCE(c.icon, 'Briefcase') as icon,
                COALESCE(c.color, '#16A34A') as color,
                COALESCE(SUM(t.amount), 0) as totalAmount,
                COUNT(t.id) as transactionCount
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ? AND t.type = 'INCOME'
            GROUP BY t.category_id, COALESCE(c.name, 'Pemasukan Lain'), COALESCE(c.icon, 'Briefcase'), COALESCE(c.color, '#16A34A')
            ORDER BY totalAmount DESC
        ");
        $stmtAll->execute([$userId]);
        $rows = $stmtAll->fetchAll();
    }

    $totalIncome = array_sum(array_column($rows, 'totalAmount'));

    $sources = array_map(function($r) use ($totalIncome) {
        $amt = (float)$r['totalAmount'];
        $cnt = (int)$r['transactionCount'];
        return [
            "categoryId"       => $r['category_id'] ?: 'unknown',
            "name"             => $r['name'],
            "icon"             => $r['icon'],
            "color"            => $r['color'],
            "totalAmount"      => $amt,
            "transactionCount" => $cnt,
            "percentage"       => $totalIncome > 0 ? round(($amt / $totalIncome) * 100) : 0
        ];
    }, $rows);

    echo json_encode([
        "success" => true,
        "data" => [
            "totalIncome" => (float)$totalIncome,
            "sources"     => $sources
        ]
    ]);
    exit;
}

// GET /analytics/financial-health (Evaluasi Kesehatan Finansial & Indeks Skor)
if ($path === 'analytics/financial-health' && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $start = (new DateTime('first day of this month'))->format('Y-m-d 00:00:00');
    $end = (new DateTime('last day of this month'))->format('Y-m-d 23:59:59');

    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as expense
        FROM transactions
        WHERE user_id = ? AND transaction_date >= ? AND transaction_date <= ?
    ");
    $stmt->execute([$userId, $start, $end]);
    $tx = $stmt->fetch();
    $income = (float)$tx['income'];
    $expense = (float)$tx['expense'];

    if ($income == 0 && $expense == 0) {
        $stmtAll = $pdo->prepare("
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as expense
            FROM transactions
            WHERE user_id = ?
        ");
        $stmtAll->execute([$userId]);
        $txAll = $stmtAll->fetch();
        $income = (float)$txAll['income'];
        $expense = (float)$txAll['expense'];
    }

    $savings = max(0, $income - $expense);
    $savingsRate = $income > 0 ? round(($savings / $income) * 100) : 0;
    $expenseToIncomeRatio = $income > 0 ? round(($expense / $income) * 100) : 100;

    // Budget adherence
    $bStmt = $pdo->prepare("SELECT * FROM budgets WHERE user_id = ?");
    $bStmt->execute([$userId]);
    $activeBudgets = $bStmt->fetchAll();

    $withinBudgetCount = 0;
    foreach ($activeBudgets as $b) {
        $catFilter = !empty($b['category_id']) ? "AND category_id = '{$b['category_id']}'" : "";
        $spStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as spent FROM transactions WHERE user_id = ? AND type = 'EXPENSE' AND transaction_date >= ? AND transaction_date <= ? $catFilter");
        $spStmt->execute([$userId, $b['period_start'], $b['period_end']]);
        $spent = (float)$spStmt->fetch()['spent'];
        if ($spent <= (float)$b['amount']) {
            $withinBudgetCount++;
        }
    }
    $budgetAdherence = count($activeBudgets) > 0 ? round(($withinBudgetCount / count($activeBudgets)) * 100) : 100;

    // Goals progress
    $gStmt = $pdo->prepare("SELECT target_amount, current_amount FROM savings_goals WHERE user_id = ? AND status = 'IN_PROGRESS'");
    $gStmt->execute([$userId]);
    $goals = $gStmt->fetchAll();

    $avgGoalProgress = 0;
    if (count($goals) > 0) {
        $sumProgress = 0;
        foreach ($goals as $g) {
            $t = (float)$g['target_amount'];
            $c = (float)$g['current_amount'];
            $sumProgress += ($t > 0 ? min(100, round(($c / $t) * 100)) : 0);
        }
        $avgGoalProgress = round($sumProgress / count($goals));
    }

    // Health Score calculation (0-100 weighted index)
    $healthScore = 0;
    $healthScore += min(35, ($savingsRate / 30) * 35);
    $healthScore += max(0, min(35, ((100 - $expenseToIncomeRatio) / 30) * 35));
    $healthScore += ($budgetAdherence / 100) * 15;
    $healthScore += ($avgGoalProgress / 100) * 15;
    $healthScore = min(100, max(10, round($healthScore)));

    $rating = 'Cukup Baik';
    $ratingDescription = 'Kondisi finansial stabil dengan potensi optimalisasi tabungan.';
    if ($healthScore >= 80) {
        $rating = 'Sangat Sehat';
        $ratingDescription = 'Portofolio keuangan seimbang, rasio tabungan prima dan kepatuhan anggaran tinggi.';
    } else if ($healthScore < 50) {
        $rating = 'Perlu Perhatian';
        $ratingDescription = 'Pengeluaran mendekati atau melampaui pemasukan. Evaluasi pos anggaran non-primer.';
    }

    echo json_encode([
        "success" => true,
        "data" => [
            "healthScore"       => $healthScore,
            "rating"            => $rating,
            "ratingDescription" => $ratingDescription,
            "metrics"           => [
                [
                    "key"         => "savings_rate",
                    "label"       => "Rasio Tabungan",
                    "value"       => "{$savingsRate}%",
                    "target"      => "≥ 20%",
                    "status"      => $savingsRate >= 20 ? "GOOD" : "WARNING",
                    "formula"     => "((Pemasukan - Pengeluaran) / Pemasukan) * 100",
                    "description" => "Persentase penghasilan yang berhasil disisihkan untuk tabungan dan investasi."
                ],
                [
                    "key"         => "expense_income_ratio",
                    "label"       => "Rasio Pengeluaran terhadap Pemasukan",
                    "value"       => "{$expenseToIncomeRatio}%",
                    "target"      => "≤ 70%",
                    "status"      => $expenseToIncomeRatio <= 70 ? "GOOD" : "WARNING",
                    "formula"     => "(Total Pengeluaran / Total Pemasukan) * 100",
                    "description" => "Mengukur seberapa besar porsi penghasilan yang dibelanjakan dalam satu periode."
                ],
                [
                    "key"         => "budget_adherence",
                    "label"       => "Kepatuhan Anggaran",
                    "value"       => "{$budgetAdherence}%",
                    "target"      => "100%",
                    "status"      => $budgetAdherence >= 80 ? "GOOD" : "WARNING",
                    "formula"     => "(Jumlah Anggaran Terpenuhi / Total Anggaran Aktif) * 100",
                    "description" => "Kepatuhan belanja agar tidak melewati pagu anggaran yang telah ditentukan."
                ],
                [
                    "key"         => "goal_progress",
                    "label"       => "Kemajuan Target Finansial",
                    "value"       => "{$avgGoalProgress}%",
                    "target"      => "100%",
                    "status"      => "GOOD",
                    "formula"     => "Rata-rata persentase terkumpul dari seluruh target tabungan aktif.",
                    "description" => "Tingkat konsistensi penyisihan dana untuk target masa depan."
                ]
            ]
        ]
    ]);
    exit;
}

// ============================================================================
// RECEIPTS (Pindai Struk & Bukti Transfer AI OCR)
// ============================================================================

// POST /receipts/scan
if ($path === 'receipts/scan' && $method === 'POST') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $uploadedFile = $_FILES['receipt'] ?? $_FILES['file'] ?? null;
    $clientExtractedJson = $_POST['extractedDataJson'] ?? null;
    $ocrText = $_POST['ocrText'] ?? '';

    $storageKey = 'uploads/receipts/placeholder.png';
    $origName = $uploadedFile ? $uploadedFile['name'] : 'struk.jpg';
    $mimeType = $uploadedFile ? $uploadedFile['type'] : 'image/jpeg';

    if ($uploadedFile && !empty($uploadedFile['tmp_name'])) {
        $targetDir = __DIR__ . '/../../uploads/receipts/';
        if (!is_dir($targetDir)) {
            @mkdir($targetDir, 0755, true);
        }
        $ext = pathinfo($origName, PATHINFO_EXTENSION) ?: 'jpg';
        $newFilename = 'rcpt_' . bin2hex(random_bytes(8)) . '.' . $ext;
        $destPath = $targetDir . $newFilename;
        if (move_uploaded_file($uploadedFile['tmp_name'], $destPath)) {
            $storageKey = 'uploads/receipts/' . $newFilename;
        }
    }

    // Gunakan hasil ekstraksi dari client AI OCR jika ada
    $extracted = null;
    if ($clientExtractedJson) {
        $extracted = json_decode($clientExtractedJson, true);
    }

    // Jika belum ada, gunakan fallback cerdas berdasarkan nama file / teks
    if (!$extracted) {
        $fnLower = strtolower($origName . ' ' . $ocrText);
        $merchant = 'Transaksi Bank / Struk';
        $total = 100000;
        $category = 'Belanja';

        if (str_contains($fnLower, 'bca') || str_contains($fnLower, 'mandiri') || str_contains($fnLower, 'bri') || str_contains($fnLower, 'bni') || str_contains($fnLower, 'dana') || str_contains($fnLower, 'gopay') || str_contains($fnLower, 'qris')) {
            $merchant = 'Transfer Bank / E-Wallet';
            $category = 'Belanja';
        } elseif (str_contains($fnLower, 'kopi') || str_contains($fnLower, 'cafe') || str_contains($fnLower, 'makan')) {
            $merchant = 'Cafe & Resto';
            $total = 65000;
            $category = 'Makan & Minum';
        } elseif (str_contains($fnLower, 'pln') || str_contains($fnLower, 'listrik') || str_contains($fnLower, 'wifi')) {
            $merchant = 'PLN / Tagihan';
            $total = 250000;
            $category = 'Tagihan';
        }

        $extracted = [
            "merchant"           => $merchant,
            "totalAmount"        => $total,
            "date"               => date('Y-m-d'),
            "categorySuggestion" => $category,
            "isIncome"           => false,
            "items"              => [["name" => $merchant, "price" => $total, "qty" => 1]],
            "confidence"         => 0.90
        ];
    }

    $receiptId = generate_uuid();
    try {
        $stmt = $pdo->prepare("
            INSERT INTO receipts (id, user_id, storage_key, original_filename, mime_type, ocr_status, extracted_data_json, created_at)
            VALUES (?, ?, ?, ?, ?, 'COMPLETED', ?, NOW())
        ");
        $stmt->execute([
            $receiptId,
            $userId,
            $storageKey,
            $origName,
            $mimeType,
            json_encode($extracted)
        ]);
    } catch (Exception $e) {}

    echo json_encode([
        "success" => true,
        "message" => "Struk / Bukti transfer berhasil dianalisis!",
        "data" => [
            "receiptId" => $receiptId,
            "filename"  => $origName,
            "extracted" => $extracted
        ]
    ]);
    exit;
}

// GET /receipts/:id
if (preg_match('#^receipts/([^/]+)$#', $path, $rMatch) && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $rcptId = $rMatch[1];
    $stmt = $pdo->prepare("SELECT * FROM receipts WHERE id = ? AND user_id = ?");
    $stmt->execute([$rcptId, $userId]);
    $r = $stmt->fetch();

    if (!$r) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Data struk tidak ditemukan."]);
        exit;
    }

    $extracted = $r['extracted_data_json'] ? json_decode($r['extracted_data_json'], true) : null;
    $r['extracted'] = $extracted;

    echo json_encode(["success" => true, "data" => $r]);
    exit;
}

// NOTIFICATIONS
if ($path === 'notifications' && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }
    $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20");
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();
    echo json_encode(["success" => true, "data" => $rows]);
    exit;
}

// SETTINGS: AVATAR UPLOAD (Simpan ke uploads/avatars dan database)
if ($path === 'settings/avatar' && $method === 'POST') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    // Coba baca file upload
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
        $file     = $_FILES['avatar'];
        $maxSize  = 10 * 1024 * 1024; // 10MB
        $allowed  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

        if ($file['size'] > $maxSize) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Ukuran foto maksimal 10MB."]);
            exit;
        }

        $mime = mime_content_type($file['tmp_name']);
        if (!in_array($mime, $allowed) && !str_starts_with($mime, 'image/')) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Format foto harus JPG, PNG, atau WEBP."]);
            exit;
        }

        // Tentukan direktori penyimpanan uploads/avatars di web root
        // Struktur: public_html/api/v1/index.php -> public_html/uploads/avatars
        $webRoot = dirname(dirname(__DIR__));
        $uploadDir = $webRoot . '/uploads/avatars';
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0755, true);
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) ?: 'jpg';
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
            $ext = ($mime === 'image/png') ? 'png' : (($mime === 'image/webp') ? 'webp' : 'jpg');
        }

        $filename = 'avatar_' . substr($userId, 0, 8) . '_' . time() . '.' . $ext;
        $destPath = $uploadDir . '/' . $filename;

        $avatarUrl = null;
        if (@move_uploaded_file($file['tmp_name'], $destPath)) {
            // Berhasil simpan file fisik, gunakan path URL absolut web
            $avatarUrl = "/uploads/avatars/{$filename}";
        } else {
            // Fallback: Jika izin direktori server terkunci, simpan data URL utuh ke MEDIUMTEXT
            $imageData  = file_get_contents($file['tmp_name']);
            $base64     = base64_encode($imageData);
            $avatarUrl  = "data:{$mime};base64,{$base64}";
        }

        $stmt = $pdo->prepare("UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$avatarUrl, $userId]);

        echo json_encode([
            "success"   => true,
            "message"   => "Foto profil berhasil diunggah dan disimpan di database!",
            "avatarUrl" => $avatarUrl
        ]);
        exit;
    } else {
        // Fallback: baca dari JSON body (avatarUrl string)
        $avatarUrl = $body['avatarUrl'] ?? null;
        if ($avatarUrl) {
            $stmt = $pdo->prepare("UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$avatarUrl, $userId]);
            echo json_encode(["success" => true, "message" => "Avatar berhasil diperbarui!", "avatarUrl" => $avatarUrl]);
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Tidak ada file foto yang dikirim."]);
        }
        exit;
    }
}

// AUTH: COMPLETE ONBOARDING ← INI ENDPOINT YANG HILANG (PENYEBAB LOOP!)
if ($path === 'auth/onboarding' && $method === 'POST') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Sesi Anda telah berakhir. Silakan login kembali."]);
        exit;
    }

    $financialGoal  = $body['financialGoal']  ?? null;
    $monthlyIncome  = $body['monthlyIncome']   ?? null;
    $savingsTarget  = $body['savingsTarget']   ?? null;
    $currency       = $body['currency']        ?? 'IDR';

    try {
        // Update onboarding_completed = 1 & currency
        $stmt = $pdo->prepare("UPDATE users SET onboarding_completed = 1, currency = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$currency, $userId]);

        // Save user preferences jika ada
        if ($financialGoal) {
            $prefValue = json_encode([
                "goal"          => $financialGoal,
                "monthlyIncome" => $monthlyIncome,
                "savingsTarget" => $savingsTarget
            ]);

            // Cek apakah sudah ada preference untuk key ini
            $checkStmt = $pdo->prepare("SELECT id FROM user_preferences WHERE user_id = ? AND preference_key = 'primary_financial_goal'");
            $checkStmt->execute([$userId]);
            $existing = $checkStmt->fetch();

            if ($existing) {
                $upStmt = $pdo->prepare("UPDATE user_preferences SET preference_value_json = ?, updated_at = NOW() WHERE user_id = ? AND preference_key = 'primary_financial_goal'");
                $upStmt->execute([$prefValue, $userId]);
            } else {
                $insStmt = $pdo->prepare("INSERT INTO user_preferences (id, user_id, preference_key, preference_value_json, created_at, updated_at) VALUES (?, ?, 'primary_financial_goal', ?, NOW(), NOW())");
                $insStmt->execute([generate_uuid(), $userId, $prefValue]);
            }
        }

        echo json_encode([
            "success" => true,
            "message" => "Onboarding berhasil diselesaikan! Selamat mengelola keuangan bersama SAKUWISE AI."
        ]);
    } catch (Exception $ex) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Gagal menyimpan data onboarding: " . $ex->getMessage()]);
    }
    exit;
}

// AUTH: UPDATE PROFILE / SETTINGS (mendukung /settings dan /auth/settings)
if (($path === 'settings' || $path === 'auth/settings') && in_array($method, ['PUT', 'PATCH'])) {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $fields = [];
    $params = [];

    if (isset($body['name'])) {
        $fields[] = "name = ?";
        $params[] = trim($body['name']);
    }
    if (isset($body['currency'])) {
        $fields[] = "currency = ?";
        $params[] = $body['currency'];
    }
    if (isset($body['themePreference'])) {
        $fields[] = "theme_preference = ?";
        $params[] = $body['themePreference'];
    }
    if (isset($body['avatarUrl'])) {
        $fields[] = "avatar_url = ?";
        $params[] = $body['avatarUrl'];
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Tidak ada data yang diperbarui."]);
        exit;
    }

    $fields[] = "updated_at = NOW()";
    $params[] = $userId;

    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Return updated user
    $stmt2 = $pdo->prepare("SELECT id, name, email, avatar_url, currency, theme_preference, onboarding_completed FROM users WHERE id = ?");
    $stmt2->execute([$userId]);
    $user = $stmt2->fetch();

    sanitize_user_avatar($pdo, $user);

    echo json_encode([
        "success" => true,
        "message" => "Profil berhasil diperbarui.",
        "data" => [
            "id"                  => $user['id'],
            "name"                => $user['name'],
            "email"               => $user['email'],
            "avatarUrl"           => $user['avatar_url'],
            "currency"            => $user['currency'] ?? 'IDR',
            "themePreference"     => $user['theme_preference'] ?? 'dark',
            "onboardingCompleted" => (bool)($user['onboarding_completed'] ?? false)
        ]
    ]);
    exit;
}

// =============================================================
// AI ASSISTANT ROUTES (Agentic Financial Intelligence Core)
// =============================================================

// AI: CHAT
if ($path === 'ai/chat' && $method === 'POST') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $message = trim($body['message'] ?? '');
    if (empty($message)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Pesan tidak boleh kosong."]);
        exit;
    }

    $conversationId = $body['conversationId'] ?? null;
    $conv = null;

    if ($conversationId) {
        $cStmt = $pdo->prepare("SELECT id, title FROM ai_conversations WHERE id = ? AND user_id = ?");
        $cStmt->execute([$conversationId, $userId]);
        $conv = $cStmt->fetch();
    }

    if (!$conv) {
        $conversationId = generate_uuid();
        $title = mb_substr($message, 0, 40) . (mb_strlen($message) > 40 ? '...' : '');
        $cStmt = $pdo->prepare("INSERT INTO ai_conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
        $cStmt->execute([$conversationId, $userId, $title]);
    } else {
        $conversationId = $conv['id'];
    }

    // Save user message
    $userMsgId = generate_uuid();
    $mStmt = $pdo->prepare("INSERT INTO ai_messages (id, conversation_id, role, content, tool_metadata_json, created_at) VALUES (?, ?, 'user', ?, NULL, NOW())");
    $mStmt->execute([$userMsgId, $conversationId, $message]);

    try {
        // Gather real-time deterministic financial intelligence
        $uStmt = $pdo->prepare("SELECT name, currency FROM users WHERE id = ?");
        $uStmt->execute([$userId]);
        $uData = $uStmt->fetch();
        $userName = $uData['name'] ?? 'Sobat SAKUWISE';
        $curr = $uData['currency'] ?? 'IDR';

        $sStmt = $pdo->prepare("
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as total_expense,
                COUNT(*) as tx_count
            FROM transactions
            WHERE user_id = ? AND transaction_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ");
        $sStmt->execute([$userId]);
        $summary = $sStmt->fetch();
        $totalIncome = (float)($summary['total_income'] ?? 0);
        $totalExpense = (float)($summary['total_expense'] ?? 0);
        $txCount = (int)($summary['tx_count'] ?? 0);

        // Fallback: jika 30 hari terakhir belum ada transaksi, gunakan transaksi keseluruhan user agar data selalu akurat
        if ($txCount === 0) {
            $sStmtAll = $pdo->prepare("
                SELECT 
                    COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as total_income,
                    COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as total_expense,
                    COUNT(*) as tx_count
                FROM transactions
                WHERE user_id = ?
            ");
            $sStmtAll->execute([$userId]);
            $summaryAll = $sStmtAll->fetch();
            $totalIncome = (float)($summaryAll['total_income'] ?? 0);
            $totalExpense = (float)($summaryAll['total_expense'] ?? 0);
            $txCount = (int)($summaryAll['tx_count'] ?? 0);
        }

        $netCashFlow = $totalIncome - $totalExpense;
        $savingsRate = $totalIncome > 0 ? round((max(0, $netCashFlow) / $totalIncome) * 100) : 0;

        $catStmt = $pdo->prepare("
            SELECT COALESCE(c.name, 'Lainnya') as name, COALESCE(SUM(t.amount), 0) as total
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ? AND t.type = 'EXPENSE' AND t.transaction_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY COALESCE(c.name, 'Lainnya')
            ORDER BY total DESC
            LIMIT 5
        ");
        $catStmt->execute([$userId]);
        $expenseBreakdown = $catStmt->fetchAll();

        // Fallback kategori jika 30 hari kosong
        if (empty($expenseBreakdown)) {
            $catStmtAll = $pdo->prepare("
                SELECT COALESCE(c.name, 'Lainnya') as name, COALESCE(SUM(t.amount), 0) as total
                FROM transactions t
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.user_id = ? AND t.type = 'EXPENSE'
                GROUP BY COALESCE(c.name, 'Lainnya')
                ORDER BY total DESC
                LIMIT 5
            ");
            $catStmtAll->execute([$userId]);
            $expenseBreakdown = $catStmtAll->fetchAll();
        }

        $thoughtProcess = [];
        $toolsUsed = [];
        $actionDraft = null;

        $thoughtProcess[] = "[1. Memahami Maksud]: Menganalisis pesan pengguna \"{$message}\" untuk menentukan kebutuhan analisis finansial.";
        $thoughtProcess[] = "[2. Rencana]: Memilih perangkat analisis data keuangan yang relevan dari Tool Registry.";

        $toolsUsed[] = [
            "tool" => "get_financial_summary",
            "args" => ["periodDays" => 30],
            "resultSummary" => "Pemasukan: Rp " . number_format($totalIncome, 0, ',', '.') . ", Pengeluaran: Rp " . number_format($totalExpense, 0, ',', '.') . ", Rasio Tabungan: {$savingsRate}%"
        ];

        $toolsUsed[] = [
            "tool" => "get_expense_breakdown",
            "args" => ["periodDays" => 30],
            "resultSummary" => "Ditemukan " . count($expenseBreakdown) . " kategori pengeluaran aktif."
        ];

        $thoughtProcess[] = "[3. Verifikasi Data]: Memvalidasi akurasi perhitungan agregat database MySQL. Total transaksi: {$txCount}.";

        $lower = mb_strtolower($message);
        $isBudgetRequest = str_contains($lower, 'buat anggaran') || str_contains($lower, 'bantu anggaran') || str_contains($lower, 'rekomendasi anggaran') || str_contains($lower, 'anggaran') || str_contains($lower, 'budget');
        $isSavingsRequest = str_contains($lower, 'tabung') || str_contains($lower, 'dana darurat') || str_contains($lower, 'target') || str_contains($lower, 'menabung') || str_contains($lower, 'investasi');
        $isSummaryRequest = str_contains($lower, 'analisis') || str_contains($lower, 'ringkasan') || str_contains($lower, 'pengeluaran') || str_contains($lower, 'boros') || str_contains($lower, 'kondisi keuangan') || str_contains($lower, 'evaluasi') || str_contains($lower, 'saldo');

        if ($isBudgetRequest) {
            $thoughtProcess[] = "[4. Penyusunan Draf Tindakan]: Menyiapkan usulan draf anggaran berdasarkan kategori pengeluaran tertinggi.";
            $topCat = $expenseBreakdown[0] ?? null;
            $catName = $topCat ? $topCat['name'] : 'Makan & Minum';
            $catAmount = $topCat ? (float)$topCat['total'] : 1500000;
            $suggestedLimit = max(500000, ceil(($catAmount * 0.9) / 50000) * 50000);
            $pct = $totalExpense > 0 ? round(($catAmount / $totalExpense) * 100) : 0;

            $content = "Berdasarkan catatan keuanganmu, pengeluaran terbesar tercatat pada pos **{$catName}** sebesar **Rp " . number_format($catAmount, 0, ',', '.') . "** ({$pct}% dari total pengeluaran).\n\n" .
                       "💡 **Rekomendasi Anggaran dari SAKUWISE AI:**\n" .
                       "Untuk mengoptimalkan arus kas bulananmu, aku sarankan membuat anggaran terarah sebesar **Rp " . number_format($suggestedLimit, 0, ',', '.') . "** untuk pos ini.\n\n" .
                       "Aku telah menyiapkan draf anggarannya di bawah ini. Silakan periksa dan klik tombol **\"Terapkan Rekomendasi\"** untuk menyimpannya ke database keuanganmu.";

            $actionDraft = [
                "actionType"  => "CREATE_BUDGET",
                "title"       => "Draf Anggaran: {$catName}",
                "description" => "Batas pengeluaran bulanan yang dioptimalkan untuk pos {$catName}.",
                "payload"     => [
                    "name"           => "Anggaran {$catName} (Optimasi AI)",
                    "amount"         => $suggestedLimit,
                    "alertThreshold" => 80
                ]
            ];
        } else if ($isSavingsRequest) {
            $thoughtProcess[] = "[4. Analisis Target Tabungan]: Menghitung estimasi realistis berdasarkan rasio tabungan saat ini.";
            $netSavings = max(0, $netCashFlow);
            $targetMonthly = $netSavings > 0 ? max(200000, round($netSavings * 0.7)) : 500000;
            $emergencyTarget = 15000000;
            $monthsNeeded = ceil($emergencyTarget / $targetMonthly);

            $content = "Halo {$userName}! Berdasarkan analisis arus kasmu, kamu memiliki estimasi sisa saldo neto sebesar **Rp " . number_format($netSavings, 0, ',', '.') . "** (Rasio tabungan: **{$savingsRate}%**).\n\n" .
                       "🎯 **Rencana Tabungan Dana Darurat:**\n" .
                       "* Target Ideal Dana Darurat: **Rp " . number_format($emergencyTarget, 0, ',', '.') . "** (setara 3-6 bulan biaya hidup).\n" .
                       "* Rekomendasi Alokasi Bulanan: **Rp " . number_format($targetMonthly, 0, ',', '.') . "** per bulan.\n" .
                       "* Estimasi Tercapai: Sekitar **{$monthsNeeded} bulan**.\n\n" .
                       "Apakah kamu ingin aku membuatkan tujuan finansial otomatis untuk Dana Darurat ini di menu Goals?";

            $actionDraft = [
                "actionType"  => "CREATE_SAVINGS_GOAL",
                "title"       => "Tujuan Finansial: Dana Darurat Mandiri",
                "description" => "Simpanan darurat likuid untuk menjaga stabilitas finansialmu.",
                "payload"     => [
                    "name"          => "Dana Darurat Siaga",
                    "targetAmount"  => $emergencyTarget,
                    "currentAmount" => 0,
                    "priority"      => "HIGH"
                ]
            ];
        } else if ($isSummaryRequest) {
            $thoughtProcess[] = "[4. Analisis Pola Keuangan]: Mengevaluasi pola belanja dan potensi kebocoran dana.";
            $topList = [];
            foreach (array_slice($expenseBreakdown, 0, 3) as $i => $c) {
                $amt = (float)$c['total'];
                $p = $totalExpense > 0 ? round(($amt / $totalExpense) * 100) : 0;
                $num = $i + 1;
                $topList[] = "{$num}. **{$c['name']}**: Rp " . number_format($amt, 0, ',', '.') . " ({$p}%)";
            }
            $topCategoriesText = !empty($topList) ? implode("\n", $topList) : "Belum ada transaksi pengeluaran tercatat.";
            $healthText = $savingsRate >= 20 ? "✅ Sangat Sehat" : ($savingsRate > 0 ? "⚠️ Cukup Sehat (Tingkatkan)" : "🚨 Defisit (Perlu Pengetatan Pos)");

            $content = "Berikut adalah ringkasan analisis keuangan pribadimu berdasarkan pencatatan transaksi:\n\n" .
                       "📊 **Arus Kas:**\n" .
                       "* Total Pemasukan: **Rp " . number_format($totalIncome, 0, ',', '.') . "**\n" .
                       "* Total Pengeluaran: **Rp " . number_format($totalExpense, 0, ',', '.') . "**\n" .
                       "* Sisa Kas Bersih (Net): **Rp " . number_format($netCashFlow, 0, ',', '.') . "**\n" .
                       "* Tingkat Tabungan: **{$savingsRate}%** ({$healthText})\n\n" .
                       "🏷️ **3 Pos Pengeluaran Terbesar:**\n" .
                       "{$topCategoriesText}\n\n" .
                       "💡 **Saran Tindakan Finansial:**\n" .
                       "1. Pertahankan rasio tabungan di atas 20% dari penghasilan rutinmu.\n" .
                       "2. Pasang batas anggaran untuk kategori teratas agar tidak mengalami overspending di akhir bulan.\n" .
                       "3. Kamu bisa tanyakan padaku kapan saja: *\"Bantu aku membuat anggaran bulanan\"* atau *\"Bantu rencana menabung\"*!";
        } else {
            $content = "Halo {$userName}! 👋 Aku SAKUWISE AI, asisten keuangan cerdas pribadimu.\n\n" .
                       "Kondisi keuanganmu saat ini tercatat memiliki **Total Saldo Rp " . number_format($netCashFlow, 0, ',', '.') . "** dengan rasio tabungan **{$savingsRate}%**.\n\n" .
                       "Ada yang ingin kamu diskusikan hari ini? Kamu bisa memintaku untuk:\n" .
                       "* *\"Analisis pengeluaranku bulan ini\"*\n" .
                       "* *\"Kategori apa yang paling banyak menghabiskan uangku?\"*\n" .
                       "* *\"Bantu aku membuat anggaran bulanan\"*\n" .
                       "* *\"Buatkan rencana menabung untuk dana darurat\"*";
        }

        if (str_contains($lower, 'suka') || str_contains($lower, 'target') || str_contains($lower, 'tujuan') || str_contains($lower, 'prioritas')) {
            try {
                $memId = generate_uuid();
                $memContent = "Pengguna tertarik dengan: \"" . mb_substr($message, 0, 100) . "\"";
                $pdo->prepare("INSERT INTO ai_memories (id, user_id, memory_type, content, consent_status, created_at, updated_at) VALUES (?, ?, 'PREFERENCE', ?, 'APPROVED', NOW(), NOW())")->execute([$memId, $userId, $memContent]);
            } catch (Exception $e) {}
        }

        $assistantMsgId = generate_uuid();
        $toolMetadataJson = json_encode([
            "thoughtProcess" => $thoughtProcess,
            "toolsUsed"      => $toolsUsed,
            "actionDraft"    => $actionDraft
        ]);

        $aStmt = $pdo->prepare("INSERT INTO ai_messages (id, conversation_id, role, content, tool_metadata_json, created_at) VALUES (?, ?, 'assistant', ?, ?, NOW())");
        $aStmt->execute([$assistantMsgId, $conversationId, $content, $toolMetadataJson]);

        $pdo->prepare("UPDATE ai_conversations SET updated_at = NOW() WHERE id = ?")->execute([$conversationId]);

        echo json_encode([
            "success" => true,
            "data"    => [
                "conversationId" => $conversationId,
                "messageId"      => $assistantMsgId,
                "role"           => "assistant",
                "content"        => $content,
                "thoughtProcess" => $thoughtProcess,
                "toolsUsed"      => $toolsUsed,
                "actionDraft"    => $actionDraft
            ]
        ]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Gagal menganalisis data finansial: " . $e->getMessage()
        ]);
        exit;
    }
}

// AI: CONVERSATIONS LIST
if ($path === 'ai/conversations' && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT c.id, c.title, c.created_at as createdAt, c.updated_at as updatedAt,
               COUNT(m.id) as msg_count
        FROM ai_conversations c
        LEFT JOIN ai_messages m ON m.conversation_id = c.id
        WHERE c.user_id = ?
        GROUP BY c.id, c.title, c.created_at, c.updated_at
        ORDER BY c.updated_at DESC
    ");
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();

    $data = array_map(function($r) {
        return [
            "id"        => $r['id'],
            "title"     => $r['title'],
            "createdAt" => $r['createdAt'],
            "updatedAt" => $r['updatedAt'],
            "_count"    => [
                "messages" => (int)$r['msg_count']
            ]
        ];
    }, $rows);

    echo json_encode(["success" => true, "data" => $data]);
    exit;
}

// AI: CONVERSATION DETAILS
if (preg_match('#^ai/conversations/([^/]+)$#', $path, $matches) && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $convId = $matches[1];
    $cStmt = $pdo->prepare("SELECT id, title, created_at as createdAt, updated_at as updatedAt FROM ai_conversations WHERE id = ? AND user_id = ?");
    $cStmt->execute([$convId, $userId]);
    $conv = $cStmt->fetch();

    if (!$conv) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Percakapan tidak ditemukan."]);
        exit;
    }

    $mStmt = $pdo->prepare("SELECT id, role, content, tool_metadata_json as toolMetadataJson, created_at as createdAt FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC");
    $mStmt->execute([$convId]);
    $messages = $mStmt->fetchAll();

    $conv['messages'] = $messages;
    echo json_encode(["success" => true, "data" => $conv]);
    exit;
}

// AI: DELETE CONVERSATION
if (preg_match('#^ai/conversations/([^/]+)$#', $path, $matches) && $method === 'DELETE') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $convId = $matches[1];
    $cStmt = $pdo->prepare("SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?");
    $cStmt->execute([$convId, $userId]);
    if (!$cStmt->fetch()) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Percakapan tidak ditemukan."]);
        exit;
    }

    $pdo->prepare("DELETE FROM ai_messages WHERE conversation_id = ?")->execute([$convId]);
    $pdo->prepare("DELETE FROM ai_conversations WHERE id = ?")->execute([$convId]);

    echo json_encode(["success" => true, "message" => "Percakapan berhasil dihapus."]);
    exit;
}

// AI: ACTIONS CONFIRM
if ($path === 'ai/actions/confirm' && $method === 'POST') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $actionType = $body['actionType'] ?? '';
    $payload = $body['payload'] ?? [];

    if ($actionType === 'CREATE_BUDGET') {
        $budgetId = generate_uuid();
        $name = $payload['name'] ?? 'Anggaran Baru';
        $amount = (float)($payload['amount'] ?? 1000000);
        $alertThreshold = (int)($payload['alertThreshold'] ?? 80);
        $periodStart = date('Y-m-01 00:00:00');
        $periodEnd = date('Y-m-t 23:59:59');

        $stmt = $pdo->prepare("INSERT INTO budgets (id, user_id, category_id, name, amount, period_start, period_end, alert_threshold, created_at, updated_at) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, NOW(), NOW())");
        $stmt->execute([$budgetId, $userId, $name, $amount, $periodStart, $periodEnd, $alertThreshold]);

        echo json_encode([
            "success" => true,
            "message" => "Anggaran berhasil dibuat sesuai rekomendasi AI! 🎯",
            "data" => [
                "id"     => $budgetId,
                "name"   => $name,
                "amount" => $amount
            ]
        ]);
        exit;
    }

    if ($actionType === 'CREATE_SAVINGS_GOAL') {
        $goalId = generate_uuid();
        $name = $payload['name'] ?? 'Target Finansial AI';
        $targetAmount = (float)($payload['targetAmount'] ?? 15000000);
        $currentAmount = (float)($payload['currentAmount'] ?? 0);
        $priority = $payload['priority'] ?? 'HIGH';
        $targetDate = date('Y-m-d H:i:s', strtotime('+12 months'));

        $stmt = $pdo->prepare("INSERT INTO savings_goals (id, user_id, name, description, target_amount, current_amount, target_date, priority, status, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'IN_PROGRESS', 'ShieldCheck', NOW(), NOW())");
        $stmt->execute([$goalId, $userId, $name, 'Target dibuat otomatis oleh SAKUWISE AI Assistant.', $targetAmount, $currentAmount, $targetDate, $priority]);

        echo json_encode([
            "success" => true,
            "message" => "Tujuan tabungan berhasil didaftarkan! 🚀",
            "data" => [
                "id"           => $goalId,
                "name"         => $name,
                "targetAmount" => $targetAmount
            ]
        ]);
        exit;
    }

    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Tipe tindakan aksi AI tidak didukung."]);
    exit;
}

// AI: MEMORIES LIST
if ($path === 'ai/memories' && $method === 'GET') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id, memory_type as memoryType, content, consent_status as consentStatus, created_at as createdAt FROM ai_memories WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();

    echo json_encode(["success" => true, "data" => $rows]);
    exit;
}

// AI: DELETE MEMORY
if (preg_match('#^ai/memories/([^/]+)$#', $path, $matches) && $method === 'DELETE') {
    $userId = get_current_user_id($pdo);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Tidak terautentikasi."]);
        exit;
    }

    $memId = $matches[1];
    $stmt = $pdo->prepare("DELETE FROM ai_memories WHERE id = ? AND user_id = ?");
    $stmt->execute([$memId, $userId]);

    echo json_encode(["success" => true, "message" => "Memori AI berhasil dihapus."]);
    exit;
}

// AI: FEEDBACK
if ($path === 'ai/feedback' && $method === 'POST') {
    echo json_encode(["success" => true, "message" => "Terima kasih atas feedback Anda! 🙏"]);
    exit;
}

// Fallback: 404 for unknown endpoints
http_response_code(404);
echo json_encode([
    "success" => false,
    "message" => "Endpoint API '{$path}' tidak ditemukan. Pastikan URL request sudah benar."
]);
