<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

const SLOT_MINUTES = 20;

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
}

function fail($statusCode, $message) {
    http_response_code($statusCode);
    echo json_encode(["status" => "error", "message" => $message]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

function parseDateTimeOrFail($rawValue) {
    $timestamp = strtotime((string)$rawValue);
    if ($timestamp === false) {
        fail(400, "Formato de fecha invalido");
    }
    return date('Y-m-d H:i:s', $timestamp);
}

function isSlotAligned($dateTime, $slotMinutes) {
    $minutes = (int)date('i', strtotime($dateTime));
    return $minutes % $slotMinutes === 0;
}

function parseTimeToMinutes($timeString) {
    if (!$timeString || !preg_match('/^\d{2}:\d{2}/', $timeString)) {
        return null;
    }
    $parts = explode(':', substr($timeString, 0, 5));
    return ((int)$parts[0] * 60) + (int)$parts[1];
}

function buildAvailableSlots($startTime, $endTime, $takenSlots, $targetDate) {
    $startMinutes = parseTimeToMinutes($startTime);
    $endMinutes = parseTimeToMinutes($endTime);

    if ($startMinutes === null || $endMinutes === null || $startMinutes >= $endMinutes) {
        return [];
    }

    $available = [];
    $now = date('Y-m-d H:i:s');

    for ($cursor = $startMinutes; $cursor + SLOT_MINUTES <= $endMinutes; $cursor += SLOT_MINUTES) {
        $hour = str_pad((string)floor($cursor / 60), 2, '0', STR_PAD_LEFT);
        $minute = str_pad((string)($cursor % 60), 2, '0', STR_PAD_LEFT);
        $slotDateTime = $targetDate . ' ' . $hour . ':' . $minute . ':00';

        if (in_array($slotDateTime, $takenSlots, true)) {
            continue;
        }
        if ($slotDateTime <= $now) {
            continue;
        }

        $available[] = [
            'value' => date('Y-m-d\TH:i', strtotime($slotDateTime)),
            'label' => date('H:i', strtotime($slotDateTime)),
        ];
    }

    return $available;
}

function getDoctorScheduleForDate($pdo, $doctorId, $targetDate) {
    $dayOfWeek = (int)date('w', strtotime($targetDate));

    $stmt = $pdo->prepare("SELECT day_of_week, start_time, end_time, is_active FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ? LIMIT 1");
    $stmt->execute([$doctorId, $dayOfWeek]);

    return $stmt->fetch();
}

try {
    ensureDoctorScheduleSchema($pdo);
} catch (Throwable $e) {
    fail(500, "No fue posible preparar disponibilidad de agenda");
}

function isInsideWorkingHours($appointmentDateTime, $scheduleRow) {
    if (!$scheduleRow || !(bool)$scheduleRow['is_active']) {
        return false;
    }

    $targetMinutes = (int)date('H', strtotime($appointmentDateTime)) * 60 + (int)date('i', strtotime($appointmentDateTime));
    $startMinutes = parseTimeToMinutes($scheduleRow['start_time']);
    $endMinutes = parseTimeToMinutes($scheduleRow['end_time']);

    if ($startMinutes === null || $endMinutes === null) {
        return false;
    }

    return ($targetMinutes >= $startMinutes) && (($targetMinutes + SLOT_MINUTES) <= $endMinutes);
}

if ($method === 'GET') {
    $doctorId = $_GET['doctor_id'] ?? null;
    $date = $_GET['date'] ?? null;
    $fromDate = $_GET['from'] ?? null;

    if (!$doctorId) {
        fail(400, "doctor_id es obligatorio");
    }

    if ($date) {
        $targetDate = date('Y-m-d', strtotime($date));
        if ($targetDate === '1970-01-01') {
            fail(400, "date es invalido");
        }

        $stmtDoctor = $pdo->prepare("SELECT id, name FROM doctors WHERE id = ? AND is_active = TRUE LIMIT 1");
        $stmtDoctor->execute([$doctorId]);
        $doctor = $stmtDoctor->fetch();
        if (!$doctor) {
            fail(404, "La doctora seleccionada no esta disponible");
        }

        $schedule = getDoctorScheduleForDate($pdo, $doctorId, $targetDate);

        if (!$schedule || !(bool)$schedule['is_active']) {
            echo json_encode([
                "status" => "success",
                "doctor_name" => $doctor['name'],
                "date" => $targetDate,
                "duration_minutes" => SLOT_MINUTES,
                "data" => [],
            ]);
            exit();
        }

        $stmtTaken = $pdo->prepare("SELECT appointment_date FROM appointments WHERE doctor_id = ? AND status = 'scheduled' AND appointment_date::date = ? ORDER BY appointment_date ASC");
        $stmtTaken->execute([$doctorId, $targetDate]);
        $taken = array_map(function ($row) {
            return date('Y-m-d H:i:s', strtotime($row['appointment_date']));
        }, $stmtTaken->fetchAll());

        echo json_encode([
            "status" => "success",
            "doctor_name" => $doctor['name'],
            "date" => $targetDate,
            "duration_minutes" => SLOT_MINUTES,
            "data" => buildAvailableSlots($schedule['start_time'], $schedule['end_time'], $taken, $targetDate),
        ]);
        exit();
    }

    $params = [$doctorId];
    $sql = "SELECT id, appointment_date, status FROM appointments WHERE doctor_id = ? AND status = 'scheduled'";

    if ($fromDate) {
        $normalizedFrom = parseDateTimeOrFail($fromDate);
        $sql .= " AND appointment_date >= ?";
        $params[] = $normalizedFrom;
    }

    $sql .= " ORDER BY appointment_date ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(["status" => "success", "duration_minutes" => SLOT_MINUTES, "data" => $stmt->fetchAll()]);
    exit();
}

if ($method !== 'POST') {
    fail(405, "Metodo no permitido");
}

$data = json_decode(file_get_contents("php://input"));
$documentNumber = trim($data->document_number ?? '');
$doctorId = $data->doctor_id ?? null;
$appointmentDate = $data->appointment_date ?? null;
$notes = trim($data->notes ?? '');

if ($documentNumber === '' || !$doctorId || !$appointmentDate) {
    fail(400, "document_number, doctor_id y appointment_date son obligatorios");
}

$appointmentDate = parseDateTimeOrFail($appointmentDate);
$appointmentTimestamp = strtotime($appointmentDate);

if ($appointmentTimestamp < (time() - 60)) {
    fail(400, "La cita debe ser en una fecha futura");
}

if (!isSlotAligned($appointmentDate, SLOT_MINUTES)) {
    fail(400, "La hora seleccionada no coincide con intervalos de 20 minutos");
}

try {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    $stmtPatient = $pdo->prepare("SELECT id, name FROM users WHERE document_number = ? AND role = 'patient' LIMIT 1");
    $stmtPatient->execute([$documentNumber]);
    $patient = $stmtPatient->fetch();

    if (!$patient) {
        throw new Exception("No existe un paciente con ese documento");
    }

    $stmtDoctor = $pdo->prepare("SELECT id, name FROM doctors WHERE id = ? AND is_active = TRUE FOR UPDATE");
    $stmtDoctor->execute([$doctorId]);
    $doctor = $stmtDoctor->fetch();

    if (!$doctor) {
        throw new Exception("La doctora seleccionada no esta disponible");
    }

    $schedule = getDoctorScheduleForDate($pdo, $doctorId, date('Y-m-d', strtotime($appointmentDate)));
    if (!isInsideWorkingHours($appointmentDate, $schedule)) {
        throw new Exception("La hora seleccionada esta fuera del horario laboral de la doctora");
    }

    $pdo->beginTransaction();

    $stmtDoctorLock = $pdo->prepare("SELECT id FROM doctors WHERE id = ? AND is_active = TRUE FOR UPDATE");
    $stmtDoctorLock->execute([$doctorId]);
    if (!$stmtDoctorLock->fetch()) {
        throw new Exception("La doctora seleccionada no esta disponible");
    }

    $stmtSlot = $pdo->prepare("SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status = 'scheduled' FOR UPDATE");
    $stmtSlot->execute([$doctorId, $appointmentDate]);

    if ($stmtSlot->fetch()) {
        throw new Exception("Ese horario ya no esta disponible");
    }

    $stmtDuplicate = $pdo->prepare("SELECT id FROM appointments WHERE patient_id = ? AND appointment_date = ? AND status = 'scheduled' FOR UPDATE");
    $stmtDuplicate->execute([$patient['id'], $appointmentDate]);
    if ($stmtDuplicate->fetch()) {
        throw new Exception("Ya tienes una cita programada en ese horario");
    }

    $stmtInsert = $pdo->prepare("INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, notes) VALUES (?, ?, ?, 'scheduled', ?)");
    $stmtInsert->execute([
        $patient['id'],
        $doctorId,
        $appointmentDate,
        $notes,
    ]);

    $appointmentId = $pdo->lastInsertId('appointments_id_seq');
    $pdo->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Cita creada exitosamente",
        "id" => $appointmentId,
        "appointment_date" => $appointmentDate,
        "doctor_name" => $doctor['name'],
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    $message = $e->getMessage();
    if (strpos($message, 'SQLSTATE[25P02]') !== false) {
        fail(500, "Error de transaccion al confirmar cita. Intenta nuevamente.");
    }

    fail(400, $message);
}
?>
