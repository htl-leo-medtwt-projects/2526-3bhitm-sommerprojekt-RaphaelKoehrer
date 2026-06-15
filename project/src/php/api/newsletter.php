<?php
/* ===================================================================
 * KöhrerGainz - Newsletter API
 * ===================================================================
 * POST   /api/newsletter.php          → Anmelden
 * DELETE /api/newsletter.php?email=x  → Abmelden
 * GET    /api/newsletter.php          → Alle Abonnenten (Admin)
 * =================================================================== */

require_once __DIR__ . '/../config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ===== POST: Newsletter anmelden =====
if ($method === 'POST') {
    $data = getRequestBody();
    $email = trim($data['email'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'message' => 'Ungültige E-Mail.'], 400);
    }

    // Prüfen ob bereits angemeldet
    $stmt = $db->prepare("SELECT id FROM newsletter WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => 'Bereits angemeldet.'], 409);
    }

    $stmt = $db->prepare("INSERT INTO newsletter (email) VALUES (:email)");
    $stmt->execute([':email' => $email]);

    jsonResponse(['success' => true, 'message' => 'Erfolgreich angemeldet!'], 201);
}

// ===== DELETE: Newsletter abmelden =====
if ($method === 'DELETE') {
    $email = trim($_GET['email'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'message' => 'Ungültige E-Mail.'], 400);
    }

    $stmt = $db->prepare("DELETE FROM newsletter WHERE email = :email");
    $stmt->execute([':email' => $email]);

    jsonResponse(['success' => true, 'message' => 'Abgemeldet.']);
}

// ===== GET: Alle Abonnenten (Admin) =====
if ($method === 'GET') {
    if (empty($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        jsonResponse(['error' => 'Zugriff verweigert.'], 403);
    }

    $stmt = $db->query("SELECT * FROM newsletter ORDER BY subscribed_at DESC");
    jsonResponse($stmt->fetchAll());
}

jsonResponse(['error' => 'Ungültige Anfrage.'], 400);
