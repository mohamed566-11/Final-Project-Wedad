<?php

namespace Tests\Traits;

use Illuminate\Support\Facades\Http;

trait FakeHuggingFace
{
    protected function fakeHuggingFaceSuccess(array $overrides = []): void
    {
        Http::fake([
            '*api/predict*'              => Http::response(array_merge([
                'label'       => 'High Risk',
                'confidences' => [
                    ['label' => 'High Risk', 'confidence' => 0.85],
                    ['label' => 'Low Risk',  'confidence' => 0.15],
                ],
            ], $overrides), 200),

            '*huggingface.co*'           => Http::response(array_merge([
                'label'       => 'High Risk',
                'confidences' => [
                    ['label' => 'High Risk', 'confidence' => 0.85],
                ],
            ], $overrides), 200),

            '*hf.space*'                 => Http::response(array_merge([
                'label'       => 'High Risk',
                'confidences' => [
                    ['label' => 'High Risk', 'confidence' => 0.85],
                ],
            ], $overrides), 200),
        ]);
    }

    protected function fakeHuggingFaceOcrSuccess(): void
    {
        Http::fake([
            '*upload*' => Http::response(['/tmp/mock_image.jpg'], 200),
            '*extract_from_image' => Http::response(['event_id' => 'ocr-event-123'], 200),
            '*ocr-event-123' => Http::response(
                "data: [{\"tests\": [{\"canonical_name\": \"Hemoglobin\", \"value\": 13.5, \"unit\": \"g/dL\"}]}]\n\n",
                200
            ),
        ]);
    }

    protected function fakeHuggingFaceTimeout(): void
    {
        Http::fake([
            '*' => Http::sequence()->pushStatus(504),
        ]);
    }

    protected function fakeHuggingFaceError(): void
    {
        Http::fake([
            '*' => Http::response(['error' => 'Internal Server Error'], 500),
        ]);
    }
}
