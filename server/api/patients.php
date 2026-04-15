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

function normalizeDocument($document) {
    $clean = preg_replace('/[^A-Za-z0-9]/', '', (string)$document);
    return strtoupper(trim($clean));
}

if ($method == 'GET') {
    $stmt = $pdo->query("SELECT id, name, email, phone, document_number, role, created_at FROM users WHERE role = 'patient' ORDER BY created_at DESC");
    $patients = $stmt->fetchAll();
    echo json_encode(["status" => "success", "data" => $patients]);

} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    $document = normalizeDocument($data->document_number ?? '');

    if (!empty($data->name) && !empty($document)) {
        // Email is optional based on user feedback
        $email = !empty($data->email) ? $data->email : null;
        $phone = !empty($data->phone) ? $data->phone : null;
        
        $password = password_hash('paciente123', PASSWORD_BCRYPT); 
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, phone, document_number) VALUES (?, ?, ?, 'patient', ?, ?)");
        try {
            $stmt->execute([$data->name, $email, $password, $phone, $document]);
            $newId = $pdo->lastInsertId('users_id_seq');
            echo json_encode(["status" => "success", "message" => "Paciente creado correctamente", "id" => $newId, "document_number" => $document]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Ocurrió un error al crear el paciente. El documento o correo podrían estar duplicados."]);
        }
    } else {
         http_response_code(400);
         echo json_encode(["status" => "error", "message" => "Faltan datos requeridos (Nombre y Documento)"]);
    }
} elseif ($method == 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    $document = normalizeDocument($data->document_number ?? '');

    if (!empty($data->id) && !empty($data->name) && !empty($document)) {
        $email = !empty($data->email) ? $data->email : null;
        $phone = !empty($data->phone) ? $data->phone : null;
        
        try {
            $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, phone = ?, document_number = ? WHERE id = ? AND role = 'patient'");
            $stmt->execute([$data->name, $email, $phone, $document, $data->id]);
            echo json_encode(["status" => "success", "message" => "Paciente actualizado"]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error al actualizar: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID, Nombre y Documento son obligatorios"]);
    }
} elseif ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND role = 'patient'");
        $stmt->execute([$id]);
        echo json_encode(["status" => "success", "message" => "Paciente eliminado"]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Falta ID del paciente"]);
    }
}
?>
