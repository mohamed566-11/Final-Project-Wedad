<?php
$p = \App\Models\PatientGoogleFit::latest()->first();
if (!$p) { echo "No patient connected\n"; exit; }

$svc = app(App\Services\GoogleFitService::class);
try {
    $tokens = $svc->refreshAccessToken($p->refresh_token);
    $accessToken = $tokens['access_token'];
} catch (\Exception $e) {
    $accessToken = $p->access_token;
}

// Fetch user profile from Google to compare email
$ch = curl_init("https://www.googleapis.com/oauth2/v2/userinfo");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $accessToken
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

echo "Google OAuth User Profile:\n";
print_r(json_decode($response, true));
