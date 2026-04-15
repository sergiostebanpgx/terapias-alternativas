<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../config/jwt.php';

$token = getBearerToken();
$user_data = verifyJWT($token, "terapias_alternativas_secret_key_123!");

if (!$user_data) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $patient_id = $_GET['patient_id'] ?? null;
    if ($patient_id) {
        $stmt = $pdo->prepare("SELECT w.id, w.weight_kg, w.date, w.notes, u.name as patient_name FROM weight_controls w JOIN users u ON w.patient_id = u.id WHERE w.patient_id = ? ORDER BY w.date DESC");
        $stmt->execute([$patient_id]);
    } else {
        $stmt = $pdo->query("SELECT w.id, w.weight_kg, w.date, w.notes, u.name as patient_name, w.patient_id FROM weight_controls w JOIN users u ON w.patient_id = u.id ORDER BY w.date DESC");
    }
    $weights = $stmt->fetchAll();
    echo json_encode(["status" => "success", "data" => $weights]);

} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->patient_id) && !empty($data->weight_kg)) {
        $stmt = $pdo->prepare("INSERT INTO weight_controls (patient_id, weight_kg, notes) VALUES (?, ?, ?)");
        try {
            $stmt->execute([$data->patient_id, $data->weight_kg, $data->notes ?? null]);
            $newId = $pdo->lastInsertId('weight_controls_id_seq');
            echo json_encode(["status" => "success", "message" => "Registro guardado", "id" => $newId]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error de BD: " . $e->getMessage()]);
        }
    } else {
         http_response_code(400);
         echo json_encode(["status" => "error", "message" => "Faltan datos requeridos"]);
    }
} elseif ($method == 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->id) && !empty($data->weight_kg)) {
        try {
            $stmt = $pdo->prepare("UPDATE weight_controls SET weight_kg = ?, notes = ? WHERE id = ?");
            $stmt->execute([$data->weight_kg, $data->notes ?? null, $data->id]);
            echo json_encode(["status" => "success", "message" => "Registro actualizado"]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error al actualizar: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID y Peso son obligatorios"]);
    }
} elseif ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM weight_controls WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["status" => "success", "message" => "Registro eliminado"]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Falta ID de registro"]);
    }
}
?>
