<?php

namespace App\Notifications;

use App\Models\PayoutRequest;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PayoutStatusNotification extends Notification
{

    protected PayoutRequest $payout;

    public function __construct(PayoutRequest $payout)
    {
        $this->payout = $payout;
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database']; // Send email and save in DB
    }

    public function toMail(object $notifiable): MailMessage
    {
        $subject = 'تحديث حالة طلب السحب #' . $this->payout->id;

        if ($this->payout->status === 'processed') {
            $message = "يسعدنا إخبارك بأنه تمت معالجة طلب السحب الخاص بك بنجاح.\n\n" .
                       "المبلغ: {$this->payout->amount} جنيه مصري\n" .
                       "طريقة السحب: " . ($this->payout->payout_method == 'bank' ? 'تحويل بنكي' : 'محفظة إلكترونية');

            if ($this->payout->reference_no) {
                $message .= "\nرقم المرجع: {$this->payout->reference_no}";
            }
        } else {
            $message = "نأسف لإخبارك بأنه تم رفض طلب السحب الخاص بك.\n\n" .
                       "المبلغ: {$this->payout->amount} جنيه مصري";

            if ($this->payout->admin_note) {
                $message .= "\nسبب الرفض:\n{$this->payout->admin_note}";
            }

            $message .= "\n\nتم إعادة المبلغ إلى رصيدك المتاح للسحب.";
        }

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.notification', [
                'notificationTitle' => 'حالة طلب السحب',
                'recipientName' => "د. {$notifiable->name}",
                'notificationMessage' => $message,
                'actionLabel' => 'عرض التفاصيل',
                'actionUrl' => env('FRONTEND_URL', 'http://localhost:8080') . '/doctor/financials',
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'تحديث حالة طلب السحب',
            'body' => 'تم تغيير حالة طلب السحب #' . $this->payout->id . ' إلى ' . ($this->payout->status == 'processed' ? 'مكتمل' : 'مرفوض'),
            'type' => 'financial',
            'payout_id' => $this->payout->id,
            'amount' => $this->payout->amount,
            'status' => $this->payout->status,
        ];
    }
}
