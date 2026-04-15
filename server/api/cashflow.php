<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

require_once '../config/database.php';
require_once '../config/jwt.php';

$token = getBearerToken();
if (!verifyJWT($token, "terapias_alternativas_secret_key_123!")) {
    http_response_code(401); echo json_encode(["status" => "error", "message" => "Unauthorized"]); exit();
}

// Calculate today's summary
// 1. Total Daily Sales (Payments)
$stmt = $pdo->query("SELECT SUM(amount) as total FROM payments WHERE DATE(transaction_date) = CURRENT_DATE");
$daily_revenue = $stmt->fetchColumn() ?: 0;

// 2. Upcoming appointments today
$stmt = $pdo->query("SELECT COUNT(*) FROM appointments WHERE DATE(appointment_date) = CURRENT_DATE");
$daily_appointments = $stmt->fetchColumn() ?: 0;

// 3. New Patients today
$stmt = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'patient' AND DATE(created_at) = CURRENT_DATE");
$new_patients = $stmt->fetchColumn() ?: 0;

// 4. Products low on stock
$stmt = $pdo->query("SELECT COUNT(*) FROM products WHERE stock_quantity <= 5");
$low_stock = $stmt->fetchColumn() ?: 0;

// 5. Breakdown by payment method
$stmt = $pdo->query("SELECT payment_method, SUM(amount) as total FROM payments WHERE DATE(transaction_date) = CURRENT_DATE GROUP BY payment_method");
$payment_breakdown = $stmt->fetchAll();

// Recent payments
$stmt = $pdo->query("SELECT p.amount, p.description, p.transaction_date, u.name as patient_name, p.payment_method FROM payments p JOIN users u ON p.patient_id = u.id ORDER BY p.transaction_date DESC LIMIT 5");
$recent_payments = $stmt->fetchAll();

echo json_encode([
    "status" => "success", 
    "data" => [
        "dailyRevenue" => $daily_revenue,
        "dailyAppointments" => $daily_appointments,
        "newPatients" => $new_patients,
        "lowStockItems" => $low_stock,
        "paymentBreakdown" => $payment_breakdown,
        "recentPayments" => $recent_payments
    ]
]);
?>
