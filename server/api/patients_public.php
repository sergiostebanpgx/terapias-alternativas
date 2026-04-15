<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

function fail($statusCode, $message) {
    http_response_code($statusCode);
    echo json_encode(["status" => "error", "message" => $message]);
    exit();
}

function normalizeDocument($document) {
    $clean = preg_replace('/[^A-Za-z0-9]/', '', (string)$document);
    return strtoupper(trim($clean));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, "Metodo no permitido");
}

$data = json_decode(file_get_contents("php://input"));

$name = trim($data->name ?? '');
$document = normalizeDocument($data->document_number ?? '');
$phone = trim($data->phone ?? '');
$email = trim($data->email ?? '');

if ($name === '' || $document === '' || $phone === '') {
    fail(400, "name, document_number y phone son obligatorios");
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail(400, "El correo no tiene un formato valido");
}

try {
    $stmtExisting = $pdo->prepare("SELECT id, name, document_number FROM users WHERE role = 'patient' AND document_number = ? LIMIT 1");
    $stmtExisting->execute([$document]);
    $existing = $stmtExisting->fetch();

    if ($existing) {
        echo json_encode([
            "status" => "success",
            "message" => "Paciente ya existente. Puedes continuar al agendamiento.",
            "id" => $existing['id'],
            "document_number" => $existing['document_number'],
            "already_exists" => true,
        ]);
        exit();
    }

    $password = password_hash('paciente123', PASSWORD_BCRYPT);
    $emailValue = $email !== '' ? $email : null;

    $stmtInsert = $pdo->prepare(
        "INSERT INTO users (name, email, password, role, phone, document_number)
         VALUES (?, ?, ?, 'patient', ?, ?)"
    );

    $stmtInsert->execute([$name, $emailValue, $password, $phone, $document]);

    echo json_encode([
        "status" => "success",
        "message" => "Paciente registrado correctamente",
        "id" => $pdo->lastInsertId('users_id_seq'),
        "document_number" => $document,
        "already_exists" => false,
    ]);
} catch (\PDOException $e) {
    fail(500, "No fue posible completar el registro publico");
}
