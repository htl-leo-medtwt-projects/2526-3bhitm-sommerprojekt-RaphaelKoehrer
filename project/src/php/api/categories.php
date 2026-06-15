<?php
/* ===================================================================
 * KöhrerGainz - Categories API
 * ===================================================================
 * GET /api/categories.php → Alle Kategorien
 * =================================================================== */

require_once __DIR__ . '/../config.php';
$db = getDB();

$stmt = $db->query("SELECT * FROM categories ORDER BY id ASC");
$categories = $stmt->fetchAll();

jsonResponse($categories);
