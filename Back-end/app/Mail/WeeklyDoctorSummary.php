<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class WeeklyDoctorSummary extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public $doctor,
        public array $stats,
        public Carbon $startOfWeek,
        public Carbon $endOfWeek,
    ) {}

    public function envelope(): Envelope
    {
        $period = $this->startOfWeek->format('d/m') . ' - ' . $this->endOfWeek->format('d/m');

        return new Envelope(
            subject: "ملخص الأسبوع ({$period}) - وداد",
        );
    }

    public function build(): self
    {
        $period = $this->startOfWeek->format('d/m/Y') . ' إلى ' . $this->endOfWeek->format('d/m/Y');
        $name = $this->doctor->name;
        $stats = $this->stats;

        $rating = $stats['average_rating'] > 0
            ? number_format($stats['average_rating'], 1) . '/5'
            : 'لا توجد تقييمات';

        $earnings = number_format($stats['total_earnings']) . ' ج.م';

        $html = <<<HTML
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
            <div style="background: linear-gradient(135deg, #e91e8c, #c2185b); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">📊 الملخص الأسبوعي</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">الفترة: {$period}</p>
            </div>

            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <p style="font-size: 16px; color: #333;">مرحباً د. <strong>{$name}</strong>،</p>
                <p style="color: #666;">إليك ملخص نشاطك خلال الأسبوع الماضي:</p>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 12px; background: #f0f7ff; border-radius: 8px; text-align: center; width: 50%;">
                            <div style="font-size: 28px; font-weight: bold; color: #1976d2;">{$stats['total_consultations']}</div>
                            <div style="color: #666; font-size: 13px;">إجمالي الاستشارات</div>
                        </td>
                        <td style="width: 10px;"></td>
                        <td style="padding: 12px; background: #f0fff0; border-radius: 8px; text-align: center; width: 50%;">
                            <div style="font-size: 28px; font-weight: bold; color: #388e3c;">{$stats['completed']}</div>
                            <div style="color: #666; font-size: 13px;">مكتملة</div>
                        </td>
                    </tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                    <tr>
                        <td style="padding: 12px; background: #fff5f5; border-radius: 8px; text-align: center; width: 50%;">
                            <div style="font-size: 28px; font-weight: bold; color: #d32f2f;">{$stats['cancelled']}</div>
                            <div style="color: #666; font-size: 13px;">ملغاة</div>
                        </td>
                        <td style="width: 10px;"></td>
                        <td style="padding: 12px; background: #fff8e1; border-radius: 8px; text-align: center; width: 50%;">
                            <div style="font-size: 28px; font-weight: bold; color: #f57c00;">{$stats['no_show']}</div>
                            <div style="color: #666; font-size: 13px;">عدم حضور</div>
                        </td>
                    </tr>
                </table>

                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">

                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #666;">💰 الأرباح:</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #333; text-align: left;">{$earnings}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">⭐ التقييم:</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #333; text-align: left;">{$rating}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">📝 تقييمات جديدة:</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #333; text-align: left;">{$stats['new_reviews']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">📅 مواعيد الأسبوع القادم:</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #333; text-align: left;">{$stats['upcoming_this_week']}</td>
                    </tr>
                </table>

                <div style="text-align: center; margin-top: 25px;">
                    <p style="color: #999; font-size: 12px;">شكراً لك على تقديم أفضل رعاية صحية 💕</p>
                </div>
            </div>

            <p style="text-align: center; color: #999; font-size: 11px; margin-top: 15px;">
                فريق منصة وداد الصحية
            </p>
        </div>
        HTML;

        return $this->html($html);
    }
}
