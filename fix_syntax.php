<?php
$file = __DIR__ . '/Back-end/app/Http/Controllers/Api/PublicController.php';
$lines = file($file);
unset($lines[428]); // Index 428 is line 429
file_put_contents($file, implode('', $lines));
echo "OK: Removed extra ]);\n";
