<?php
/* ===================================================================
 * KöhrerGainz - Admin Products API
 * ===================================================================
 * POST   /api/admin/products.php  → Produkt anlegen
 * PUT    /api/admin/products.php  → Produkt bearbeiten
 * DELETE /api/admin/products.php  → Produkt löschen
 * =================================================================== */

require_once __DIR__ . '/../../config.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Admin-Check
if (empty($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
    jsonResponse(['error' => 'Zugriff verweigert.'], 403);
}

// ===== POST: Neues Produkt =====
if ($method === 'POST') {
    $data = getRequestBody();

    $required = ['name', 'price', 'category_id'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            jsonResponse(['success' => false, 'message' => "Feld '$field' ist erforderlich."], 400);
        }
    }

    $stmt = $db->prepare("INSERT INTO products (name, description, price, category_id, image, stock, featured) VALUES (:name, :desc, :price, :cid, :img, :stock, :featured)");
    $stmt->execute([
        ':name'     => $data['name'],
        ':desc'     => $data['description'] ?? '',
        ':price'    => floatval($data['price']),
        ':cid'      => (int)$data['category_id'],
        ':img'      => $data['image'] ?? '',
        ':stock'    => (int)($data['stock'] ?? 100),
        ':featured' => (int)($data['featured'] ?? 0)
    ]);

    $id = (int)$db->lastInsertId();

    jsonResponse(['success' => true, 'product' => ['id' => $id]], 201);
}

// ===== PUT: Produkt bearbeiten =====
if ($method === 'PUT') {
    $data = getRequestBody();
    $id = (int)($data['id'] ?? 0);

    if ($id === 0) {
        jsonResponse(['success' => false, 'message' => 'Keine Produkt-ID.'], 400);
    }

    $fields = [];
    $params = [':id' => $id];

    $allowed = ['name', 'description', 'price', 'category_id', 'image', 'stock', 'featured'];
    foreach ($allowed as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = :$field";
            $params[":$field"] = $data[$field];
        }
    }

    if (empty($fields)) {
        jsonResponse(['success' => false, 'message' => 'Keine Felder zum Aktualisieren.'], 400);
    }

    $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    jsonResponse(['success' => true]);
}

// ===== DELETE: Produkt löschen =====
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);

    if ($id === 0) {
        jsonResponse(['success' => false, 'message' => 'Keine Produkt-ID.'], 400);
    }

    $stmt = $db->prepare("DELETE FROM products WHERE id = :id");
    $stmt->execute([':id' => $id]);

    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Ungültige Anfrage.'], 400);
