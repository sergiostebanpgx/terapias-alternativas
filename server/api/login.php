<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../config/jwt.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    $email = $data->email;
    $password = $data->password;

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $secret = "terapias_alternativas_secret_key_123!"; // in reality, should be in env
        $payload = [
            "id" => $user['id'],
            "name" => $user['name'],
            "role" => $user['role'],
            "exp" => time() + (60 * 60 * 24) // 1 day expiration
        ];
        $token = generateJWT($payload, $secret);

        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Login successful",
            "token" => $token,
            "user" => [
                "id" => $user['id'],
                "name" => $user['name'],
                "role" => $user['role'],
                "email" => $user['email']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Credenciales inválidas"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Faltan datos de inicio de sesión"]);
}
?>
