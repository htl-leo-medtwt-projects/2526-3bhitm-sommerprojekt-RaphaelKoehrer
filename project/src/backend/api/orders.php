<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload']);
    $conn->close();
    exit;
}

$customerName = trim((string)($data['customer_name'] ?? ''));
$customerEmail = trim((string)($data['customer_email'] ?? ''));
$items = $data['items'] ?? [];

if ($customerName === '' || $customerEmail === '' || !filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Bitte Name und gueltige E-Mail angeben']);
    $conn->close();
    exit;
}

if (!is_array($items) || count($items) === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Mindestens ein Produkt ist erforderlich']);
    $conn->close();
    exit;
}

$productIds = [];
$quantities = [];
foreach ($items as $item) {
    $productId = (int)($item['product_id'] ?? 0);
    $qty = max(1, (int)($item['quantity'] ?? 1));
    if ($productId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ungueltige Produktdaten']);
        $conn->close();
        exit;
    }
    $productIds[] = $productId;
    $quantities[$productId] = ($quantities[$productId] ?? 0) + $qty;
}

$productIds = array_values(array_unique($productIds));
$placeholders = implode(',', array_fill(0, count($productIds), '?'));
$types = str_repeat('i', count($productIds));

$sql = "SELECT product_id, price, stock FROM products WHERE product_id IN ($placeholders) AND is_active = 1";
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$productIds);
$stmt->execute();
$result = $stmt->get_result();

$products = [];
while ($row = $result->fetch_assoc()) {
    $products[(int)$row['product_id']] = $row;
}
$stmt->close();

if (count($products) !== count($productIds)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ein oder mehrere Produkte wurden nicht gefunden']);
    $conn->close();
    exit;
}

$totalAmount = 0.0;
foreach ($quantities as $productId => $qty) {
    $stock = (int)$products[$productId]['stock'];
    if ($qty > $stock) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Nicht genug Lagerbestand fuer Produkt-ID ' . $productId]);
        $conn->close();
        exit;
    }
    $totalAmount += ((float)$products[$productId]['price']) * $qty;
}

$conn->begin_transaction();

try {
    $orderStmt = $conn->prepare("INSERT INTO orders (customer_name, customer_email, total_amount, status) VALUES (?, ?, ?, 'pending')");
    if (!$orderStmt) {
        throw new RuntimeException('Order statement failed: ' . $conn->error);
    }
    $orderStmt->bind_param('ssd', $customerName, $customerEmail, $totalAmount);
    $orderStmt->execute();
    $orderId = $conn->insert_id;
    $orderStmt->close();

    $itemStmt = $conn->prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)');
    $stockStmt = $conn->prepare('UPDATE products SET stock = stock - ? WHERE product_id = ?');
    if (!$itemStmt || !$stockStmt) {
        throw new RuntimeException('Order item statement failed: ' . $conn->error);
    }

    foreach ($quantities as $productId => $qty) {
        $unitPrice = (float)$products[$productId]['price'];
        $itemStmt->bind_param('iiid', $orderId, $productId, $qty, $unitPrice);
        $itemStmt->execute();

        $stockStmt->bind_param('ii', $qty, $productId);
        $stockStmt->execute();
    }

    $itemStmt->close();
    $stockStmt->close();

    $conn->commit();

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Bestellung gespeichert',
        'order_id' => $orderId,
        'total_amount' => round($totalAmount, 2)
    ]);
} catch (Throwable $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Bestellung konnte nicht gespeichert werden']);
}

$conn->close();
?>
