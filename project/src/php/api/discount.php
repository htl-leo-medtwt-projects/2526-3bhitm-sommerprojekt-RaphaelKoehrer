<?php
/* ===================================================================
 * KöhrerGainz - Discount API
 * ===================================================================
 * POST /api/discount.php   → Code validieren
 * GET  /api/discount.php   → Alle Codes (Admin)
 * =================================================================== */

require_once __DIR__ . '/../config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ===== POST: Discount Code validieren =====
if ($method === 'POST') {
    $data = getRequestBody();
    $code = strtoupper(trim($data['code'] ?? ''));

    if (empty($code)) {
        jsonResponse(['valid' => false, 'message' => 'Kein Code angegeben.'], 400);
    }

    $stmt = $db->prepare("SELECT * FROM discounts WHERE code = :code AND active = 1");
    $stmt->execute([':code' => $code]);
    $discount = $stmt->fetch();

    if (!$discount) {
        jsonResponse(['valid' => false, 'message' => 'Ungültiger Code.']);
    }

    // Prüfen ob abgelaufen
    if ($discount['valid_until'] && strtotime($discount['valid_until']) < time()) {
        jsonResponse(['valid' => false, 'message' => 'Code abgelaufen.']);
    }

    // Prüfen ob maximale Nutzung erreicht
    if ($discount['max_uses'] > 0 && $discount['current_uses'] >= $discount['max_uses']) {
        jsonResponse(['valid' => false, 'message' => 'Code bereits ausgeschöpft.']);
    }

    // Nutzung erhöhen
    $db->prepare("UPDATE discounts SET current_uses = current_uses + 1 WHERE id = :id")
       ->execute([':id' => $discount['id']]);

    jsonResponse([
        'valid' => true,
        'code' => $discount['code'],
        'percent' => (int)$discount['percent'],
        'message' => $discount['percent'] . '% Rabatt aktiviert!'
    ]);
}

// ===== GET: Alle Codes (Admin) =====
if ($method === 'GET') {
    if (empty($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        jsonResponse(['error' => 'Zugriff verweigert.'], 403);
    }

    $stmt = $db->query("SELECT * FROM discounts ORDER BY id ASC");
    jsonResponse($stmt->fetchAll());
}

jsonResponse(['error' => 'Ungültige Anfrage.'], 400);
