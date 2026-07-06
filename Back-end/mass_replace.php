<?php

$dir = __DIR__ . '/app/Http';
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));

$replacements = [
    "'doctors/images/default-doctor.png'" => "'profiles/default-doctor.png'",
    "'images/default-doctor.png'" => "'profiles/default-doctor.png'",
    "'patients/images/default-user.png'" => "'profiles/default-avatar.png'",
    "'images/default-avatar.png'" => "'profiles/default-avatar.png'",
    "'storage/admins'" => "'profiles'",
    "'doctors/images'" => "'profiles'",
    "'patients/images'" => "'profiles'",
    "'doctors/images/'" => "'profiles/'",
    "'patients/images/'" => "'profiles/'"
];

$changedFiles = 0;
foreach ($iterator as $file) {
    if ($file->isFile() && $file->getExtension() === 'php') {
        $content = file_get_contents($file->getPathname());
        $original = $content;
        
        foreach ($replacements as $search => $replace) {
            $content = str_replace($search, $replace, $content);
        }
        
        if ($content !== $original) {
            file_put_contents($file->getPathname(), $content);
            echo "Updated: " . $file->getPathname() . "\n";
            $changedFiles++;
        }
    }
}

echo "Done. Changed $changedFiles files.\n";
