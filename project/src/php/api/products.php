<?php
require_once __DIR__ . '/../config.php';
$db = getDB();

$id = $_GET['id'] ?? null;

if ($id) {
    $stmt = $db->prepare("SELECT * FROM products WHERE id = :id");
    $stmt->execute([':id' => (int)$id]);
    $product = $stmt->fetch();
    jsonResponse(['success' => true, 'product' => $product]);
} else {
    $where = [];
    $params = [];

    if (!empty($_GET['category'])) {
        $where[] = "category = :cat";
        $params[':cat'] = (int)$_GET['category'];
    }
    if (!empty($_GET['search'])) {
        $where[] = "name LIKE :search";
        $params[':search'] = '%' . $_GET['search'] . '%';
    }

    $sql = "SELECT * FROM products" . ($where ? " WHERE " . implode(" AND ", $where) : "");
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    jsonResponse(['success' => true, 'products' => $stmt->fetchAll()]);
}