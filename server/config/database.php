<?php
$db_url = 'postgresql://neondb_owner:npg_LatfA2ZQXKe5@ep-purple-breeze-am58x9ks-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require';
$db_opts = parse_url($db_url);

$host = $db_opts["host"];
$port = isset($db_opts["port"]) ? $db_opts["port"] : 5432;
$user = $db_opts["user"];
$password = $db_opts["pass"];
$dbname = ltrim($db_opts["path"], '/');

// Extract endpoint ID for Neon SNI support on older libpq
$host_parts = explode('.', $host);
$endpoint_id = $host_parts[0];

$dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require;options='endpoint=$endpoint_id'";

try {
    $pdo = new \PDO($dsn, $user, $password);
    $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE, \PDO::FETCH_ASSOC);
} catch (\PDOException $e) {
    // Only send JSON response if it's an API request, otherwise simple message
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database Connection Error: " . $e->getMessage()]);
    exit();
}
