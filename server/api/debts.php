<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

require_once '../config/database.php';
require_once '../config/jwt.php';

$token = getBearerToken();
if (!verifyJWT($token, "terapias_alternativas_secret_key_123!")) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $patientId = $_GET['patient_id'] ?? null;

    $sql = "SELECT d.id, d.patient_id, u.name as patient_name, d.debt_type, d.product_id, p.name as product_name, d.quantity, d.concept, d.total_amount, d.pending_amount, d.status, d.created_at, d.updated_at
            FROM patient_debts d
            JOIN users u ON u.id = d.patient_id
            LEFT JOIN products p ON p.id = d.product_id
            WHERE d.status IN ('pending', 'partial')";

    $params = [];
    if ($patientId) {
        $sql .= " AND d.patient_id = ?";
        $params[] = $patientId;
    }

    $sql .= " ORDER BY d.created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->patient_id) || empty($data->concept) || !isset($data->total_amount)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "patient_id, concept y total_amount son obligatorios"]);
        exit();
    }

    $total = (float)$data->total_amount;
    $pending = isset($data->pending_amount) ? (float)$data->pending_amount : $total;
    $status = $pending <= 0 ? 'paid' : ($pending < $total ? 'partial' : 'pending');

    $stmt = $pdo->prepare("INSERT INTO patient_debts (patient_id, debt_type, product_id, quantity, concept, total_amount, pending_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data->patient_id,
        $data->debt_type ?? 'control',
        $data->product_id ?? null,
        $data->quantity ?? 1,
        $data->concept,
        $total,
        $pending,
        $status,
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "Deuda registrada",
        "id" => $pdo->lastInsertId('patient_debts_id_seq'),
    ]);
} elseif ($method == 'PUT') {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->id) || !isset($data->pending_amount)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "id y pending_amount son obligatorios"]);
        exit();
    }

    $pending = (float)$data->pending_amount;

    $stmt = $pdo->prepare("SELECT total_amount FROM patient_debts WHERE id = ?");
    $stmt->execute([$data->id]);
    $existing = $stmt->fetch();

    if (!$existing) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Deuda no encontrada"]);
        exit();
    }

    $total = (float)$existing['total_amount'];
    $status = $pending <= 0 ? 'paid' : ($pending < $total ? 'partial' : 'pending');

    $stmtUpdate = $pdo->prepare("UPDATE patient_debts SET pending_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    $stmtUpdate->execute([$pending, $status, $data->id]);

    echo json_encode(["status" => "success", "message" => "Deuda actualizada"]);
} elseif ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Falta ID de la deuda"]);
        exit();
    }

    $stmt = $pdo->prepare("DELETE FROM patient_debts WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(["status" => "success", "message" => "Deuda eliminada"]);
}
?>