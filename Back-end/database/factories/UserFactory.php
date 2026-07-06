<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\LifeStage;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    public function definition(): array
    {
        $arabicNames  = ['سارة', 'نورا', 'فاطمة', 'مريم', 'هدى', 'أميرة', 'رانيا', 'دينا', 'هبة', 'ياسمين'];
        $arabicFamily = ['محمد', 'أحمد', 'علي', 'حسن', 'إبراهيم', 'عبدالله', 'خالد', 'عمر', 'مصطفى'];

        return [
            'name'              => $this->faker->randomElement($arabicNames) . ' ' . $this->faker->randomElement($arabicFamily),
            'email'             => $this->faker->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password'          => static::$password ??= Hash::make('password'),
            'phone'             => '01' . $this->faker->randomElement(['0', '1', '2', '5']) . $this->faker->numerify('########'),
            'is_active'         => true,
            'image'             => 'https://ui-avatars.com/api/?name=' . urlencode($this->faker->firstName()) . '&background=E91E8C&color=fff',
            'remember_token'    => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn(array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function pregnant(): static
    {
        return $this->state(fn(array $attr) => [
            'life_stage_id' => LifeStage::where('name', 'motherhood')->first()?->id,
        ]);
    }

    public function postpartum(): static
    {
        return $this->state(fn(array $attr) => [
            'life_stage_id' => LifeStage::where('name', 'motherhood')->first()?->id,
        ]);
    }

    public function premarriage(): static
    {
        return $this->state(fn(array $attr) => [
            'life_stage_id' => LifeStage::where('name', 'pre-marriage')->first()?->id,
        ]);
    }
}
