<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class MonthlyAnalyticsReport extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $analytics,
        public Carbon $month,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "التقرير الشهري ({$this->month->format('Y-m')}) - وداد",
        );
    }

    public function build(): self
    {
        $a = $this->analytics;
        $monthName = $this->month->translatedFormat('F Y');

        $revenue = number_format($a['revenue']['total']) . ' ج.م';
        $revenueChange = $a['revenue']['change'];
        $revenueArrow = $revenueChange >= 0 ? '📈' : '📉';
        $revenueColor = $revenueChange >= 0 ? '#388e3c' : '#d32f2f';

        $consTotal = $a['consultations']['total'];
        $consCompleted = $a['consultations']['completed'];
        $consCancelled = $a['consultations']['cancelled'];
        $consNoShow = $a['consultations']['no_show'];
        $completionRate = $a['consultations']['completion_rate'];
        $consChange = $a['consultations']['change'];

        $videoCount = $a['consultations']['by_type']['video'] ?? 0;
        $offlineCount = $a['consultations']['by_type']['offline'] ?? 0;

        $newPatients = $a['users']['new_patients'];
        $newDoctors = $a['users']['new_doctors'];
        $patientsChange = $a['users']['patients_change'];
        $activePatients = $a['users']['total_active_patients'];

        $avgPerConsultation = number_format($a['revenue']['average_per_consultation']) . ' ج.م';

        // Top doctors
        $topDoctorsHtml = '';
        if (!empty($a['top_doctors'])) {
            foreach (array_slice($a['top_doctors'], 0, 5) as $i => $doc) {
                $rank = $i + 1;
                $docName = $doc['doctor']['name'] ?? 'غير معروف';
                $docRevenue = number_format($doc['revenue']) . ' ج.م';
                $docConsultations = $doc['consultations'];
                $topDoctorsHtml .= "<tr>
                    <td style='padding: 8px; border-bottom: 1px solid #f0f0f0;'>{$rank}</td>
                    <td style='padding: 8px; border-bottom: 1px solid #f0f0f0;'>{$docName}</td>
                    <td style='padding: 8px; border-bottom: 1px solid #f0f0f0;'>{$docConsultations}</td>
                    <td style='padding: 8px; border-bottom: 1px solid #f0f0f0;'>{$docRevenue}</td>
                </tr>";
            }
        }

        $html = <<<HTML
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1976d2, #0d47a1); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">📋 التقرير الشهري</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">{$monthName}</p>
            </div>

            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                <!-- Revenue -->
                <h2 style="color: #333; font-size: 18px; border-bottom: 2px solid #1976d2; padding-bottom: 8px;">💰 الإيرادات</h2>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr>
                        <td style="padding: 12px; background: #f0f7ff; border-radius: 8px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold; color: #1976d2;">{$revenue}</div>
                            <div style="color: #666; font-size: 13px;">إجمالي الإيرادات</div>
                            <div style="color: {$revenueColor}; font-size: 12px; margin-top: 4px;">{$revenueArrow} {$revenueChange}% عن الشهر السابق</div>
                        </td>
                        <td style="width: 10px;"></td>
                        <td style="padding: 12px; background: #f0f7ff; border-radius: 8px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold; color: #1976d2;">{$avgPerConsultation}</div>
                            <div style="color: #666; font-size: 13px;">متوسط لكل استشارة</div>
                        </td>
                    </tr>
                </table>

                <!-- Consultations -->
                <h2 style="color: #333; font-size: 18px; border-bottom: 2px solid #388e3c; padding-bottom: 8px;">🩺 الاستشارات</h2>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr>
                        <td style="padding: 10px; background: #f0fff0; border-radius: 8px; text-align: center; width: 25%;">
                            <div style="font-size: 24px; font-weight: bold; color: #1976d2;">{$consTotal}</div>
                            <div style="color: #666; font-size: 12px;">إجمالي</div>
                        </td>
                        <td style="width: 5px;"></td>
                        <td style="padding: 10px; background: #f0fff0; border-radius: 8px; text-align: center; width: 25%;">
                            <div style="font-size: 24px; font-weight: bold; color: #388e3c;">{$consCompleted}</div>
                            <div style="color: #666; font-size: 12px;">مكتملة</div>
                        </td>
                        <td style="width: 5px;"></td>
                        <td style="padding: 10px; background: #fff5f5; border-radius: 8px; text-align: center; width: 25%;">
                            <div style="font-size: 24px; font-weight: bold; color: #d32f2f;">{$consCancelled}</div>
                            <div style="color: #666; font-size: 12px;">ملغاة</div>
                        </td>
                        <td style="width: 5px;"></td>
                        <td style="padding: 10px; background: #fff8e1; border-radius: 8px; text-align: center; width: 25%;">
                            <div style="font-size: 24px; font-weight: bold; color: #f57c00;">{$consNoShow}</div>
                            <div style="color: #666; font-size: 12px;">غياب</div>
                        </td>
                    </tr>
                </table>
                <p style="color: #666; font-size: 13px;">
                    نسبة الإكمال: <strong>{$completionRate}%</strong> |
                    تغيير: <span style="color: {$revenueColor};">{$consChange}%</span> |
                    فيديو: {$videoCount} | حضوري: {$offlineCount}
                </p>

                <!-- Users -->
                <h2 style="color: #333; font-size: 18px; border-bottom: 2px solid #e91e8c; padding-bottom: 8px;">👥 المستخدمون</h2>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr>
                        <td style="padding: 8px 0; color: #666;">مريضات جدد:</td>
                        <td style="padding: 8px 0; font-weight: bold;">{$newPatients} <span style="color: #999; font-size: 12px;">({$patientsChange}%)</span></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">أطباء جدد:</td>
                        <td style="padding: 8px 0; font-weight: bold;">{$newDoctors}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">مريضات نشطات:</td>
                        <td style="padding: 8px 0; font-weight: bold;">{$activePatients}</td>
                    </tr>
                </table>

                <!-- Top Doctors -->
                {$this->renderTopDoctorsSection($topDoctorsHtml)}

                <div style="text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px;">تم إنشاء هذا التقرير تلقائياً بواسطة نظام وداد</p>
                </div>
            </div>

            <p style="text-align: center; color: #999; font-size: 11px; margin-top: 15px;">
                فريق منصة وداد الصحية
            </p>
        </div>
        HTML;

        return $this->html($html);
    }

    private function renderTopDoctorsSection(string $topDoctorsHtml): string
    {
        if (empty($topDoctorsHtml)) {
            return '';
        }

        return <<<HTML
        <h2 style="color: #333; font-size: 18px; border-bottom: 2px solid #ff9800; padding-bottom: 8px;">🏆 أفضل الأطباء</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
            <thead>
                <tr style="background: #f5f5f5;">
                    <th style="padding: 10px; text-align: right;">#</th>
                    <th style="padding: 10px; text-align: right;">الطبيب</th>
                    <th style="padding: 10px; text-align: right;">استشارات</th>
                    <th style="padding: 10px; text-align: right;">إيرادات</th>
                </tr>
            </thead>
            <tbody>{$topDoctorsHtml}</tbody>
        </table>
        HTML;
    }
}
