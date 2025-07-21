<?php
// db_config.php - Database connection settings
$servername = "localhost";
$username = "root"; // Default XAMPP MySQL username
$password = "";     // Default XAMPP MySQL password (empty)
$dbname = "daily_expense_track_db"; // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    // Log the error (for development, display it)
    error_log("Connection failed: " . $conn->connect_error);
    die(json_encode(["status" => "error", "message" => "Database connection failed."]));
}

// Set content type for JSON responses
header('Content-Type: application/json');
// Allow CORS for local development (important for fetch requests from HTML)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight OPTIONS requests for CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}
?>