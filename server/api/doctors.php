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
    $stmt = $pdo->query("SELECT id, name, specialty, phone, is_active, created_at FROM doctors ORDER BY name ASC");
    echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->name)) {
        $stmt = $pdo->prepare("INSERT INTO doctors (name, specialty, phone, is_active) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data->name,
            $data->specialty ?? null,
            $data->phone ?? null,
            isset($data->is_active) ? (bool)$data->is_active : true,
        ]);

        echo json_encode([
            "status" => "success",
            "message" => "Doctora registrada",
            "id" => $pdo->lastInsertId('doctors_id_seq'),
        ]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "El nombre es obligatorio"]);
    }
} elseif ($method == 'PUT') {
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->id) && !empty($data->name)) {
        $stmt = $pdo->prepare("UPDATE doctors SET name = ?, specialty = ?, phone = ?, is_active = ? WHERE id = ?");
        $stmt->execute([
            $data->name,
            $data->specialty ?? null,
            $data->phone ?? null,
            isset($data->is_active) ? (bool)$data->is_active : true,
            $data->id,
        ]);

        echo json_encode(["status" => "success", "message" => "Doctora actualizada"]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID y nombre son obligatorios"]);
    }
} elseif ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM doctors WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["status" => "success", "message" => "Doctora eliminada"]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Falta ID de la doctora"]);
    }
}
?>