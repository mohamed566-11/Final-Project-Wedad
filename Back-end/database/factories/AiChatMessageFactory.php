<?php

namespace Database\Factories;

use App\Models\AiChatMessage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class AiChatMessageFactory extends Factory
{
    protected $model = AiChatMessage::class;

    public function definition(): array
    {
        $botTypes = ['public', 'pre_marriage', 'pregnancy', 'motherhood'];

        return [
            'user_id'    => User::factory(),
            'session_id' => fake()->randomElement($botTypes) . '_' . Str::uuid(),
            'bot_type'   => fake()->randomElement($botTypes),
            'role'       => fake()->randomElement(['user', 'assistant']),
            'message'    => fake()->sentence(),
            'metadata'   => ['status' => 'ready'],
        ];
    }

    /** رسالة مستخدم */
    public function userMessage(): static
    {
        return $this->state(['role' => 'user']);
    }

    /** رد بوت */
    public function botMessage(): static
    {
        return $this->state(['role' => 'assistant']);
    }

    /** بوت عام */
    public function publicBot(): static
    {
        return $this->state(['bot_type' => 'public']);
    }
}
