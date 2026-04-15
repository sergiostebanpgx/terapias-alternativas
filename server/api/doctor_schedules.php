<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

ob_start();

set_error_handler(function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

register_shutdown_function(function () {
    $error = error_get_last();
    if (!$error) {
        return;
    }

    if (!headers_sent()) {
        http_response_code(500);
        header("Content-Type: application/json; charset=UTF-8");
    }

    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    echo json_encode([
        "status" => "error",
        "message" => "Fallo interno en agenda de doctoras"
    ]);
});

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../config/jwt.php';

$token = getBearerToken();
if (!verifyJWT($token, "terapias_alternativas_secret_key_123!")) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit();
}

function fail($statusCode, $message) {
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    http_response_code($statusCode);
    echo json_encode(["status" => "error", "message" => $message]);
    exit();
}

function ensureDoctorScheduleSchema($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS doctor_schedules (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        day_of_week SMALLINT NOT NULL,
        start_time TIME,
        end_time TIME,
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT doctor_schedules_day_range CHECK (day_of_week >= 0 AND day_of_week <= 6),
        CONSTRAINT doctor_schedules_time_order CHECK (
            (is_active = FALSE) OR
            (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
        ),
        UNIQUE (doctor_id, day_of_week)
    )");

    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_day ON doctor_schedules(doctor_id, day_of_week)");
}

function validateTime($time) {
    return is_string($time) && preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $time);
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    ensureDoctorScheduleSchema($pdo);
} catch (Throwable $e) {
    fail(500, "No fue posible preparar la agenda de doctoras");
}

if ($method === 'GET') {
    try {
        $doctorId = isset($_GET['doctor_id']) ? (int)$_GET['doctor_id'] : 0;
        if ($doctorId <= 0) {
            fail(400, "doctor_id es obligatorio");
        }

        $stmtDoctor = $pdo->prepare("SELECT id, name FROM doctors WHERE id = ?");
        $stmtDoctor->execute([$doctorId]);
        $doctor = $stmtDoctor->fetch();

        if (!$doctor) {
            fail(404, "Doctora no encontrada");
        }

        $stmt = $pdo->prepare("SELECT day_of_week, start_time, end_time, is_active FROM doctor_schedules WHERE doctor_id = ? ORDER BY day_of_week ASC");
        $stmt->execute([$doctorId]);
        $existing = $stmt->fetchAll();

        $byDay = [];
        foreach ($existing as $row) {
            $byDay[(int)$row['day_of_week']] = [
                'day_of_week' => (int)$row['day_of_week'],
                'is_active' => (bool)$row['is_active'],
                'start_time' => $row['start_time'] ? substr($row['start_time'], 0, 5) : null,
                'end_time' => $row['end_time'] ? substr($row['end_time'], 0, 5) : null,
            ];
        }

        $schedule = [];
        for ($day = 0; $day <= 6; $day++) {
            if (isset($byDay[$day])) {
                $schedule[] = $byDay[$day];
            } else {
                $schedule[] = [
                    'day_of_week' => $day,
                    'is_active' => false,
                    'start_time' => null,
                    'end_time' => null,
                ];
            }
        }

        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        echo json_encode([
            "status" => "success",
            "doctor" => $doctor,
            "duration_minutes" => 20,
            "data" => $schedule,
        ]);
        exit();
    } catch (Throwable $e) {
        fail(500, "No fue posible cargar la agenda");
    }
}

if ($method === 'PUT') {
    try {
        $rawBody = file_get_contents("php://input");
        $data = json_decode($rawBody);

        if (json_last_error() !== JSON_ERROR_NONE || !is_object($data)) {
            fail(400, "JSON invalido en la solicitud");
        }

        $doctorId = isset($data->doctor_id) ? (int)$data->doctor_id : 0;
        $schedules = isset($data->schedules) && is_array($data->schedules) ? $data->schedules : null;

        if ($doctorId <= 0 || $schedules === null) {
            fail(400, "doctor_id y schedules son obligatorios");
        }

        if (count($schedules) !== 7) {
            fail(400, "Debes enviar exactamente 7 dias de agenda");
        }

        $stmtDoctor = $pdo->prepare("SELECT id FROM doctors WHERE id = ?");
        $stmtDoctor->execute([$doctorId]);
        if (!$stmtDoctor->fetch()) {
            fail(404, "Doctora no encontrada");
        }

        $normalized = [];
        $seenDays = [];

        foreach ($schedules as $row) {
            $day = isset($row->day_of_week) ? (int)$row->day_of_week : -1;
            $isActive = !empty($row->is_active);
            $start = isset($row->start_time) ? trim((string)$row->start_time) : '';
            $end = isset($row->end_time) ? trim((string)$row->end_time) : '';

            if ($day < 0 || $day > 6) {
                fail(400, "day_of_week debe estar entre 0 y 6");
            }
            if (isset($seenDays[$day])) {
                fail(400, "No se permite repetir dias en la agenda");
            }
            $seenDays[$day] = true;

            if ($isActive) {
                if (!validateTime($start) || !validateTime($end)) {
                    fail(400, "Formato de hora invalido. Usa HH:MM");
                }
                if ($start >= $end) {
                    fail(400, "La hora de inicio debe ser menor a la de fin");
                }
                $normalized[] = [$day, true, $start, $end];
            } else {
                // Keep concrete times for compatibility with older schemas where times may be NOT NULL.
                $normalized[] = [$day, false, '08:00', '17:00'];
            }
        }

        $pdo->beginTransaction();

            $stmtUpdate = $pdo->prepare(
                "UPDATE doctor_schedules
                 SET is_active = ?, start_time = ?, end_time = ?
                 WHERE doctor_id = ? AND day_of_week = ?"
            );

            $stmtInsert = $pdo->prepare(
                "INSERT INTO doctor_schedules (doctor_id, day_of_week, is_active, start_time, end_time)
                 VALUES (?, ?, ?, ?, ?)"
            );

        foreach ($normalized as $row) {
                $day = $row[0];
            $active = $row[1] ? 'true' : 'false';
                $start = $row[2];
                $end = $row[3];

                $stmtUpdate->execute([$active, $start, $end, $doctorId, $day]);
                if ($stmtUpdate->rowCount() === 0) {
                    $stmtInsert->execute([$doctorId, $day, $active, $start, $end]);
                }
        }

        $pdo->commit();

        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        echo json_encode(["status" => "success", "message" => "Agenda actualizada"]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        fail(500, "No fue posible actualizar la agenda: " . $e->getMessage());
    }
    exit();
}

fail(405, "Metodo no permitido");
