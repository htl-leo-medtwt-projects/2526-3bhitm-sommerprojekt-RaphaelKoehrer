<?php
/* ===================================================================
 * KöhrerGainz - Orders API
 * =================================================================== */

require_once __DIR__ . '/../config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ===== GET: Bestellungen abrufen =====
if ($method === 'GET') {
    if (!empty($_GET['id'])) {
        $stmt = $db->prepare("SELECT * FROM orders WHERE id = :id");
        $stmt->execute([':id' => (int)$_GET['id']]);
        $order = $stmt->fetch();
        if (!$order) { jsonResponse(['error' => 'Bestellung nicht gefunden.'], 404); }
        $stmt = $db->prepare("SELECT * FROM order_items WHERE order_id = :id");
        $stmt->execute([':id' => $order['id']]);
        $order['items'] = $stmt->fetchAll();
        jsonResponse($order);
    }

    if (!empty($_SESSION['user_id'])) {
        if ($_SESSION['user_role'] === 'admin') {
            $stmt = $db->query("SELECT * FROM orders ORDER BY created_at DESC");
        } else {
            $stmt = $db->prepare("SELECT * FROM orders WHERE user_id = :uid ORDER BY created_at DESC");
            $stmt->execute([':uid' => $_SESSION['user_id']]);
        }
    } elseif (!empty($_GET['user_id'])) {
        $stmt = $db->prepare("SELECT * FROM orders WHERE user_id = :uid ORDER BY created_at DESC");
        $stmt->execute([':uid' => (int)$_GET['user_id']]);
    } else {
        jsonResponse([]);
        exit;
    }

    $orders = $stmt->fetchAll();
    foreach ($orders as &$order) {
        $stmt2 = $db->prepare("SELECT * FROM order_items WHERE order_id = :id");
        $stmt2->execute([':id' => $order['id']]);
        $order['items'] = $stmt2->fetchAll();
    }
    jsonResponse($orders);
}

// ===== POST: Neue Bestellung =====
if ($method === 'POST') {
    $data = getRequestBody();

    $items    = $data['items']    ?? [];
    $shipping = $data['shipping'] ?? [];

    if (empty($items)) {
        jsonResponse(['success' => false, 'message' => 'Keine Artikel.'], 400);
    }

    $subtotal = 0;
    foreach ($items as $item) {
        $subtotal += $item['price'] * $item['quantity'];
    }

    $discount     = floatval($data['discount'] ?? 0);
    $total_amount = $subtotal - $discount;

    $db->beginTransaction();

    try {
        // Spaltennamen laut DB-Schema: customer_name, customer_email, total_amount
        $stmt = $db->prepare("
            INSERT INTO orders
                (user_id, customer_name, customer_email, shipping_address,
                 shipping_city, shipping_zip, shipping_country, payment_method, total_amount)
            VALUES
                (:uid, :name, :email, :address,
                 :city, :zip, :country, :payment, :total)
        ");
        $stmt->execute([
            ':uid'     => $_SESSION['user_id'] ?? null,
            ':name'    => $shipping['name']    ?? '',
            ':email'   => $shipping['email']   ?? '',
            ':address' => $shipping['address'] ?? '',
            ':city'    => $shipping['city']    ?? '',
            ':zip'     => $shipping['zip']     ?? '',
            ':country' => $shipping['country'] ?? 'Österreich',
            ':payment' => $data['payment_method'] ?? 'bank',
            ':total'   => $total_amount
        ]);

        $orderId = (int)$db->lastInsertId();

        // Spalte heißt unit_price (nicht price)
        $stmtItem = $db->prepare("
            INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
            VALUES (:oid, :pid, :pname, :price, :qty)
        ");
        foreach ($items as $item) {
            $stmtItem->execute([
                ':oid'   => $orderId,
                ':pid'   => $item['productId'],
                ':pname' => $item['productName'],
                ':price' => $item['price'],
                ':qty'   => $item['quantity']
            ]);

            $db->prepare("UPDATE products SET stock = stock - :qty WHERE id = :pid")
               ->execute([':qty' => $item['quantity'], ':pid' => $item['productId']]);
        }

        $db->commit();

        jsonResponse(['success' => true, 'order_id' => $orderId, 'total_amount' => $total_amount], 201);

    } catch (Exception $e) {
        $db->rollBack();
        jsonResponse(['success' => false, 'message' => 'Fehler bei der Bestellung: ' . $e->getMessage()], 500);
    }
}

// ===== PUT: Status ändern (Admin) =====
if ($method === 'PUT') {
    if (empty($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        jsonResponse(['error' => 'Zugriff verweigert.'], 403);
    }

    $data   = getRequestBody();
    $orderId = $data['id']     ?? 0;
    $status  = $data['status'] ?? '';

    $validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!in_array($status, $validStatuses)) {
        jsonResponse(['success' => false, 'message' => 'Ungültiger Status.'], 400);
    }

    $stmt = $db->prepare("UPDATE orders SET status = :status WHERE id = :id");
    $stmt->execute([':status' => $status, ':id' => (int)$orderId]);

    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Ungültige Anfrage.'], 400);