<?php
namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ChatImageService
{
    public function store(UploadedFile $file, int $consultationId): string
    {
        $mimeExtMap = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
        ];

        $realMime = $file->getMimeType(); // Uses finfo
        abort_unless(isset($mimeExtMap[$realMime]), 422, 'نوع الصورة غير مدعوم');

        $dir  = config('chat.storage.path', 'chat-images') . '/' . $consultationId;
        $name = Str::uuid() . '.' . $mimeExtMap[$realMime];

        return $file->storeAs($dir, $name, config('chat.storage.disk', 'public'));
    }

    public function delete(?string $path): void
    {
        if ($path) Storage::disk(config('chat.storage.disk', 'public'))->delete($path);
    }
}
