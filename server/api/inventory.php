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
    $stmt = $pdo->query("SELECT id, name, description, price, stock_quantity FROM products ORDER BY name ASC");
    echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->name) && isset($data->price) && isset($data->stock_quantity)) {
        $stmt = $pdo->prepare("INSERT INTO products (name, description, price, stock_quantity) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data->name, $data->description ?? '', $data->price, $data->stock_quantity]);
        echo json_encode(["status" => "success", "message" => "Producto agregado", "id" => $pdo->lastInsertId('products_id_seq')]);
    } else {
         http_response_code(400); echo json_encode(["status" => "error", "message" => "Datos requeridos"]);
    }
} elseif ($method == 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->id) && !empty($data->name)) {
        try {
            $stmt = $pdo->prepare("UPDATE products SET name = ?, description = ?, price = ?, stock_quantity = ? WHERE id = ?");
            $stmt->execute([$data->name, $data->description ?? '', $data->price, $data->stock_quantity, $data->id]);
            echo json_encode(["status" => "success", "message" => "Producto actualizado"]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error al actualizar: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400); echo json_encode(["status" => "error", "message" => "ID y nombre son obligatorios"]);
    }
} elseif ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["status" => "success", "message" => "Producto eliminado"]);
    }
}
?>
