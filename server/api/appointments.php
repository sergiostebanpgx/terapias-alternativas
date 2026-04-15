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
    http_response_code(401); echo json_encode(["status" => "error", "message" => "Unauthorized"]); exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $stmt = $pdo->query("SELECT a.id, a.appointment_date, a.status, a.notes, a.patient_id, a.doctor_id, u.name as patient_name, d.name as doctor_name FROM appointments a JOIN users u ON a.patient_id = u.id LEFT JOIN doctors d ON a.doctor_id = d.id ORDER BY a.appointment_date ASC");
    echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->patient_id) && !empty($data->appointment_date)) {
        $doctorId = !empty($data->doctor_id) ? $data->doctor_id : null;
        $stmt = $pdo->prepare("INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, notes) VALUES (?, ?, ?, 'scheduled', ?)");
        $stmt->execute([$data->patient_id, $doctorId, $data->appointment_date, $data->notes ?? '']);
        echo json_encode(["status" => "success", "message" => "Cita guardada", "id" => $pdo->lastInsertId('appointments_id_seq')]);
    }
} elseif ($method == 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->id)) {
        // Support both status-only updates and full record updates
        if (isset($data->patient_id) && isset($data->appointment_date)) {
            $doctorId = !empty($data->doctor_id) ? $data->doctor_id : null;
            $stmt = $pdo->prepare("UPDATE appointments SET patient_id = ?, doctor_id = ?, appointment_date = ?, status = ?, notes = ? WHERE id = ?");
            $stmt->execute([$data->patient_id, $doctorId, $data->appointment_date, $data->status, $data->notes ?? '', $data->id]);
            echo json_encode(["status" => "success", "message" => "Cita actualizada"]);
        } else if (isset($data->status)) {
            $stmt = $pdo->prepare("UPDATE appointments SET status = ? WHERE id = ?");
            $stmt->execute([$data->status, $data->id]);
            echo json_encode(["status" => "success", "message" => "Estado actualizado"]);
        }
    }
} elseif ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM appointments WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["status" => "success", "message" => "Cita eliminada"]);
    }
}
?>
