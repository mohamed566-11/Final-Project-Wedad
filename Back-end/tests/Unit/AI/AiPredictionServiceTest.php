<?php

use App\Services\AiPredictionService;
use Tests\TestCase;

uses(TestCase::class);

it('normalizes risk levels correctly', function ($input, $expected) {
    $service = app(AiPredictionService::class);
    
    $reflection = new \ReflectionClass(AiPredictionService::class);
    $method = $reflection->getMethod('normalizeRiskLevel');
    $method->setAccessible(true);
    
    $result = $method->invoke($service, $input);
    
    expect($result)->toBe($expected);
})->with([
    ['High Risk', 'high'],
    ['HIGH', 'high'],
    ['mildly high', 'high'],
    ['Moderate', 'moderate'],
    ['MEDIUM RISK', 'moderate'],
    ['Low', 'low'],
    ['very low risk', 'low'],
    ['unknown_tag', 'unknown_tag'],
]);

it('identifies high risk strings correctly', function ($input, $expected) {
    $service = app(AiPredictionService::class);
    
    $reflection = new \ReflectionClass(AiPredictionService::class);
    $method = $reflection->getMethod('isHighRisk');
    $method->setAccessible(true);
    
    $result = $method->invoke($service, $input);
    
    expect($result)->toBe($expected);
})->with([
    ['High Risk', true],
    ['high', true],
    ['Moderate', false],
    ['Low', false],
    ['Unknown', false],
]);
