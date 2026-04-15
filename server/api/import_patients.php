<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

require_once '../config/database.php';
require_once '../config/jwt.php';

$token = getBearerToken();
if (!verifyJWT($token, "terapias_alternativas_secret_key_123!")) {
    http_response_code(401); echo json_encode(["status" => "error", "message" => "Unauthorized"]); exit();
}

$data = json_decode(file_get_contents("php://input"));

function normalizeDocument($document) {
    $clean = preg_replace('/[^A-Za-z0-9]/', '', (string)$document);
    return strtoupper(trim($clean));
}

if (!empty($data->patients) && is_array($data->patients)) {
    $inserted = 0;
    $updated = 0;
    $errors = 0;
    
    $password = password_hash('paciente123', PASSWORD_BCRYPT);

    foreach ($data->patients as $patient) {
        $name = !empty($patient->name) ? $patient->name : null;
        $document = normalizeDocument($patient->document_number ?? '');
        $phone = !empty($patient->phone) ? $patient->phone : null;
        $email = !empty($patient->email) ? $patient->email : null;

        if (!$name || !$phone || !$document) {
            $errors++;
            continue;
        }

        // Check if exists by document number
        $stmt = $pdo->prepare("SELECT id FROM users WHERE document_number = ? AND role = 'patient'");
        $stmt->execute([$document]);
        $existing = $stmt->fetch();

        if ($existing) {
            // UPDATE
            $stmtUpdate = $pdo->prepare("UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?");
            $stmtUpdate->execute([$name, $email, $phone, $existing['id']]);
            $updated++;
        } else {
            // INSERT
            try {
                $stmtInsert = $pdo->prepare("INSERT INTO users (name, email, phone, password, role, document_number) VALUES (?, ?, ?, ?, 'patient', ?)");
                $stmtInsert->execute([$name, $email, $phone, $password, $document]);
                $inserted++;
            } catch (\PDOException $e) {
                // likely duplicate document or email
                $errors++;
            }
        }
    }

    echo json_encode([
        "status" => "success",
        "message" => "Importación completada",
        "details" => [
            "inserted" => $inserted,
            "updated" => $updated,
            "errors" => $errors
        ]
    ]);
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Datos de pacientes no encontrados o inválidos"]);
}
?>
