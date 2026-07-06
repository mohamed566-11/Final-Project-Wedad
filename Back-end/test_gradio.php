<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $baseUrl = rtrim(config('chatbot.bots.public.url'), '/');
    
    // Ask a specific question that can ONLY be answered from the knowledge base
    $question = "مين بس اللي يقدر يشوف الملف الطبي للمريضة في منصة وداد؟";
    echo "QUESTION: $question\n\n";
    
    // Call chatbot_fn (Gradio 4 async SSE)
    $postResponse = \Illuminate\Support\Facades\Http::timeout(60)
        ->withOptions(['verify' => false])
        ->post($baseUrl . '/gradio_api/call/chatbot_fn', [
            'data' => [[], $question, null]
        ]);
    
    $eventId = $postResponse->json('event_id');
    echo "EVENT ID: $eventId\n";
    
    if (!$eventId) {
        echo "POST Status: " . $postResponse->status() . "\n";
        echo "POST Body: " . $postResponse->body() . "\n";
        exit;
    }
    
    sleep(5); // Wait for processing
    
    $getRes = \Illuminate\Support\Facades\Http::timeout(90)
        ->withOptions(['verify' => false])
        ->get($baseUrl . '/gradio_api/call/chatbot_fn/' . $eventId);
    
    echo "RESPONSE:\n" . $getRes->body() . "\n";
    
} catch (\Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
}


try {
    $file = new \SplFileInfo('d:\\Final_Project_Implementation\\Final_Project_Chat_Bots\\widad-public-health-chatbot\\widad_platform_knowledge_base.txt');
    $baseUrl = rtrim(config('chatbot.bots.public.url'), '/');
    $adminKey = config('chatbot.admin_api_key');
    
    echo "ADMIN KEY: [$adminKey]\n";
    
    $uploadResponse = \Illuminate\Support\Facades\Http::timeout(120)->withOptions(['verify' => false])->attach('files', fopen($file->getRealPath(), 'r'), $file->getFilename())->post($baseUrl . '/gradio_api/upload');
    $hfUploadedFilePath = $uploadResponse->json()[0];
    echo "UPLOAD PATH: $hfUploadedFilePath\n\n";
    
    $postResponse = \Illuminate\Support\Facades\Http::timeout(30)->withOptions(['verify' => false])->post($baseUrl . '/gradio_api/call/upload_document', [
        'data' => [['path' => $hfUploadedFilePath, 'meta' => ['_type' => 'gradio.FileData']], $adminKey]
    ]);
    $eventId = $postResponse->json('event_id');
    echo "EVENT ID: $eventId\n";
    sleep(3);
    $getRes = \Illuminate\Support\Facades\Http::timeout(60)->withOptions(['verify' => false])->get($baseUrl . '/gradio_api/call/upload_document/' . $eventId);
    echo "RESULT:\n" . trim($getRes->body()) . "\n";
} catch (\Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
}
