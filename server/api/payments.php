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

function fail($code, $message) {
    http_response_code($code);
    echo json_encode(["status" => "error", "message" => $message]);
    exit();
}

if ($method == 'GET') {
    $stmt = $pdo->query("SELECT p.id, p.patient_id, u.name as patient_name, p.amount, p.total_amount, p.description, p.payment_method, p.payment_category, p.product_id, pr.name as product_name, p.quantity, p.debt_id, p.payment_status, p.transaction_date FROM payments p JOIN users u ON p.patient_id = u.id LEFT JOIN products pr ON p.product_id = pr.id ORDER BY p.transaction_date DESC");
    echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    $patientId = $data->patient_id ?? null;
    $paymentMethod = trim($data->payment_method ?? '');
    $description = trim($data->description ?? '');
    $category = strtolower(trim($data->payment_category ?? 'control'));

    if (!$patientId || !$paymentMethod || !$description) {
        fail(400, "Paciente, método de pago y motivo/descripción son obligatorios");
    }

    $allowedCategories = ['control', 'product', 'abono'];
    if (!in_array($category, $allowedCategories, true)) {
        fail(400, "Categoría de pago inválida");
    }

    $pdo->beginTransaction();

    try {
        $totalAmount = 0;
        $paidAmount = 0;
        $quantity = max(1, (int)($data->quantity ?? 1));
        $productId = null;
        $debtId = null;

        if ($category === 'product') {
            $productId = $data->product_id ?? null;
            if (!$productId) {
                throw new Exception("Debe seleccionar un producto");
            }

            $stmtProduct = $pdo->prepare("SELECT id, name, price, stock_quantity FROM products WHERE id = ? FOR UPDATE");
            $stmtProduct->execute([$productId]);
            $product = $stmtProduct->fetch();

            if (!$product) {
                throw new Exception("Producto no encontrado");
            }

            if ((int)$product['stock_quantity'] < $quantity) {
                throw new Exception("Stock insuficiente para completar la venta");
            }

            $totalAmount = round((float)$product['price'] * $quantity, 2);
            $paidAmount = isset($data->amount) ? round((float)$data->amount, 2) : $totalAmount;

            if ($paidAmount <= 0 || $paidAmount > $totalAmount) {
                throw new Exception("Monto pagado inválido para la venta del producto");
            }

            $stmtStock = $pdo->prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?");
            $stmtStock->execute([$quantity, $productId]);
        } elseif ($category === 'abono') {
            $debtId = $data->debt_id ?? null;
            $paidAmount = isset($data->amount) ? round((float)$data->amount, 2) : 0;

            if (!$debtId || $paidAmount <= 0) {
                throw new Exception("Debe seleccionar una deuda y un monto de abono válido");
            }

            $stmtDebt = $pdo->prepare("SELECT id, patient_id, total_amount, pending_amount FROM patient_debts WHERE id = ? FOR UPDATE");
            $stmtDebt->execute([$debtId]);
            $debt = $stmtDebt->fetch();

            if (!$debt) {
                throw new Exception("La deuda seleccionada no existe");
            }

            if ((int)$debt['patient_id'] !== (int)$patientId) {
                throw new Exception("La deuda no pertenece al paciente seleccionado");
            }

            if ($paidAmount > (float)$debt['pending_amount']) {
                throw new Exception("El abono supera el saldo pendiente");
            }

            $newPending = round((float)$debt['pending_amount'] - $paidAmount, 2);
            $newStatus = $newPending <= 0 ? 'paid' : 'partial';
            $stmtUpdateDebt = $pdo->prepare("UPDATE patient_debts SET pending_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmtUpdateDebt->execute([$newPending, $newStatus, $debtId]);

            $totalAmount = $paidAmount;
            $quantity = 1;
        } else {
            $totalAmount = isset($data->total_amount) ? round((float)$data->total_amount, 2) : round((float)($data->amount ?? 0), 2);
            $paidAmount = isset($data->amount) ? round((float)$data->amount, 2) : 0;

            if ($totalAmount <= 0 || $paidAmount <= 0) {
                throw new Exception("Monto total y monto pagado deben ser mayores a cero");
            }

            if ($paidAmount > $totalAmount) {
                throw new Exception("El pago no puede ser mayor al valor total");
            }
        }

        $stmtInsert = $pdo->prepare("INSERT INTO payments (patient_id, amount, total_amount, description, payment_method, payment_category, product_id, quantity, debt_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmtInsert->execute([
            $patientId,
            $paidAmount,
            $totalAmount,
            $description,
            $paymentMethod,
            $category,
            $productId,
            $quantity,
            $debtId,
        ]);

        $paymentId = $pdo->lastInsertId('payments_id_seq');

        if ($category === 'product') {
            $stmtMovement = $pdo->prepare("INSERT INTO inventory_movements (product_id, payment_id, movement_type, quantity, note) VALUES (?, ?, 'sale', ?, ?)");
            $stmtMovement->execute([$productId, $paymentId, -$quantity, $description]);
        }

        $pendingAmount = round($totalAmount - $paidAmount, 2);
        if (($category === 'control' || $category === 'product') && $pendingAmount > 0) {
            $stmtDebtInsert = $pdo->prepare("INSERT INTO patient_debts (patient_id, debt_type, product_id, quantity, concept, total_amount, pending_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmtDebtInsert->execute([
                $patientId,
                $category,
                $productId,
                $quantity,
                $description,
                $totalAmount,
                $pendingAmount,
                'partial',
            ]);

            $newDebtId = $pdo->lastInsertId('patient_debts_id_seq');
            $stmtAttachDebt = $pdo->prepare("UPDATE payments SET debt_id = ? WHERE id = ?");
            $stmtAttachDebt->execute([$newDebtId, $paymentId]);
            $debtId = $newDebtId;
        }

        $pdo->commit();

        echo json_encode([
            "status" => "success",
            "message" => "Pago registrado",
            "id" => $paymentId,
            "debt_id" => $debtId,
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        fail(400, $e->getMessage());
    }
} elseif ($method == 'PUT') {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->id) || empty($data->amount) || empty($data->description) || empty($data->payment_method)) {
        fail(400, "ID, monto, descripción y método son obligatorios");
    }

    $stmtCurrent = $pdo->prepare("SELECT payment_category, debt_id FROM payments WHERE id = ?");
    $stmtCurrent->execute([$data->id]);
    $current = $stmtCurrent->fetch();

    if (!$current) {
        fail(404, "Pago no encontrado");
    }

    if ($current['payment_category'] !== 'control' || !empty($current['debt_id'])) {
        fail(400, "Solo se permite editar pagos de control sin deuda vinculada");
    }

    $amount = round((float)$data->amount, 2);
    if ($amount <= 0) {
        fail(400, "Monto inválido");
    }

    try {
        $stmt = $pdo->prepare("UPDATE payments SET patient_id = ?, amount = ?, total_amount = ?, description = ?, payment_method = ? WHERE id = ?");
        $stmt->execute([$data->patient_id, $amount, $amount, $data->description, $data->payment_method, $data->id]);
        echo json_encode(["status" => "success", "message" => "Pago actualizado"]);
    } catch (\PDOException $e) {
        fail(500, "Error al actualizar: " . $e->getMessage());
    }
} elseif ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        fail(400, "Falta ID del pago");
    }

    $pdo->beginTransaction();
    try {
        $stmtPayment = $pdo->prepare("SELECT * FROM payments WHERE id = ? FOR UPDATE");
        $stmtPayment->execute([$id]);
        $payment = $stmtPayment->fetch();

        if (!$payment) {
            throw new Exception("Pago no encontrado");
        }

        if ($payment['payment_category'] === 'product' && !empty($payment['product_id'])) {
            $stmtRestore = $pdo->prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?");
            $stmtRestore->execute([(int)$payment['quantity'], $payment['product_id']]);

            $stmtMovement = $pdo->prepare("INSERT INTO inventory_movements (product_id, payment_id, movement_type, quantity, note) VALUES (?, ?, 'sale_reversal', ?, ?)");
            $stmtMovement->execute([
                $payment['product_id'],
                $id,
                (int)$payment['quantity'],
                'Reversión de pago: ' . $payment['description'],
            ]);
        }

        if ($payment['payment_category'] === 'abono' && !empty($payment['debt_id'])) {
            $stmtDebt = $pdo->prepare("SELECT total_amount, pending_amount FROM patient_debts WHERE id = ? FOR UPDATE");
            $stmtDebt->execute([$payment['debt_id']]);
            $debt = $stmtDebt->fetch();

            if ($debt) {
                $newPending = round((float)$debt['pending_amount'] + (float)$payment['amount'], 2);
                $newStatus = $newPending >= (float)$debt['total_amount'] ? 'pending' : 'partial';

                $stmtDebtUpdate = $pdo->prepare("UPDATE patient_debts SET pending_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
                $stmtDebtUpdate->execute([$newPending, $newStatus, $payment['debt_id']]);
            }
        }

        if (($payment['payment_category'] === 'control' || $payment['payment_category'] === 'product') && !empty($payment['debt_id'])) {
            $stmtAbonos = $pdo->prepare("SELECT COUNT(*) FROM payments WHERE debt_id = ? AND payment_category = 'abono' AND id <> ?");
            $stmtAbonos->execute([$payment['debt_id'], $id]);
            $abonosCount = (int)$stmtAbonos->fetchColumn();

            if ($abonosCount > 0) {
                throw new Exception("No se puede eliminar este pago porque la deuda tiene abonos asociados");
            }

            $stmtDeleteDebt = $pdo->prepare("DELETE FROM patient_debts WHERE id = ?");
            $stmtDeleteDebt->execute([$payment['debt_id']]);
        }

        $stmtDelete = $pdo->prepare("DELETE FROM payments WHERE id = ?");
        $stmtDelete->execute([$id]);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Pago eliminado"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        fail(400, $e->getMessage());
    }
}
?>
