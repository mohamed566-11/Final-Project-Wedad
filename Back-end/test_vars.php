<?php
echo 'User count (>=5): ' . \App\Models\User::count() . PHP_EOL;
echo 'Doctor count (>=5): ' . \App\Models\Doctor::count() . PHP_EOL;
echo 'Admin count (==3): ' . \App\Models\Admin::count() . PHP_EOL;
echo 'Consultation count (>=10): ' . \App\Models\Consultation::count() . PHP_EOL;
echo 'GDM Prediction count (>=1): ' . \App\Models\GestationalDiabetesPrediction::count() . PHP_EOL;

$sara = \App\Models\User::where('email', 'sara@example.com')->first();
if ($sara) {
    echo 'Sara GDM high count (==1): ' . $sara->gestationalDiabetesPredictions()->where('risk_level', 'high')->count() . PHP_EOL;
    echo 'Sara Chatbot Preference: ' . ($sara->chatbotPreference ? 'OK' : 'MISSING') . PHP_EOL;
} else {
    echo 'SARA NOT FOUND!' . PHP_EOL;
}
