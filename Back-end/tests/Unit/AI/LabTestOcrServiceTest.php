<?php

use App\Services\LabTestOcrService;
use Tests\TestCase;

uses(TestCase::class);

it('parses valid SSE response and formats tests correctly', function () {
    $service = app(LabTestOcrService::class);

    $jsonPayload = json_encode([
        'patient_info' => ['name' => 'John Doe'],
        'tests' => [
            [
                'canonical_name' => 'Hemoglobin',
                'value' => '13.5',
                'unit' => 'g/dL',
                'reference_range_raw' => '12.0 - 15.5',
                'status' => 'normal'
            ],
            [
                'raw_test_name' => 'WBC',
                'raw_value' => '10.5',
                'status' => 'high'
            ]
        ]
    ]);

    $sseBody = "data: {\"progress\": 50}\n\ndata: [{$jsonPayload}]\n\ndata: [DONE]\n";

    $result = $service->parseSSEResponse($sseBody);

    expect($result)->toBeArray();
    expect($result['patient_info']['name'])->toBe('John Doe');
    expect($result['tests'])->toHaveCount(2);

    $test1 = $result['tests'][0];
    expect($test1['test_name'])->toBe('Hemoglobin');
    expect($test1['value'])->toBe('13.5');
    expect($test1['unit'])->toBe('g/dL');
    expect($test1['reference_range'])->toBe('12.0 - 15.5');
    expect($test1['status'])->toBe('normal');

    $test2 = $result['tests'][1];
    expect($test2['test_name'])->toBe('WBC');
    expect($test2['value'])->toBe('10.5');
    expect($test2['unit'])->toBe('');
    expect($test2['reference_range'])->toBe('');
    expect($test2['status'])->toBe('high');
});

it('throws exception when SSE has no data lines', function () {
    $service = app(LabTestOcrService::class);
    
    $sseBody = "event: message\n\nevent: error\n";
    
    expect(fn() => $service->parseSSEResponse($sseBody))
        ->toThrow(\RuntimeException::class, 'No data lines in SSE response');
});

it('throws exception when SSE has invalid JSON', function () {
    $service = app(LabTestOcrService::class);
    
    $sseBody = "data: {invalid json snippet}\n\ndata: [DONE]\n";
    
    expect(fn() => $service->parseSSEResponse($sseBody))
        ->toThrow(\RuntimeException::class, 'invalid JSON structure');
});
