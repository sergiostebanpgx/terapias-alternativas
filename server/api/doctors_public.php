<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Metodo no permitido"]);
    exit();
}

require_once '../config/database.php';

try {
    $stmt = $pdo->query("SELECT id, name, specialty FROM doctors WHERE is_active = TRUE ORDER BY name ASC");
    echo json_encode([
        "status" => "success",
        "data" => $stmt->fetchAll(),
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "No fue posible consultar doctoras"]);
}
?>
