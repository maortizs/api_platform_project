<?php

echo "Extensiones cargadas:\n";
print_r(get_loaded_extensions());

echo "\n\nVersión de PHP: " . phpversion();

echo "\n\nIntentando conexión PDO...\n";

try {
    new \PDO("pgsql:host=localhost;dbname=test", "fake_user", "fake_pass");
} catch (\PDOException $e) {
    echo "→ Error PDO: " . $e->getMessage();
}
