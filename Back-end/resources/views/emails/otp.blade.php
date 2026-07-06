<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>رمز التحقق - منصة وداد</title>
    <style>
        /* Base Reset */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; }

        /* General Styles */
        body { margin: 0; padding: 0; width: 100% !important; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased; color: #334155; }
        .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
        .main-container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }

        @media only screen and (max-width: 600px) {
            .wrapper { padding: 20px 10px; }
            .main-container { width: 100% !important; max-width: 100% !important; border-radius: 8px; }
            .content-padding { padding: 30px 20px !important; }
            .header-padding { padding: 30px 20px !important; }
            h1 { font-size: 22px !important; }
            .message-box { padding: 15px !important; }
        }
    </style>
</head>

<body style="margin: 0; padding: 0; background-color: #f8fafc; text-align: right; direction: rtl;">
    <center class="wrapper" style="width: 100%; background-color: #f8fafc; padding: 40px 0;">
        <table class="main-container" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
            <!-- Header section -->
            <tr>
                <td class="header-padding" style="background-color: #1e293b; padding: 30px 40px; text-align: center; border-bottom: 4px solid #0ea5e9;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">رمز أمان الحساب</h1>
                    <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">منصة وداد الصحية</p>
                </td>
            </tr>

            <!-- Body section -->
            <tr>
                <td class="content-padding" style="padding: 40px 40px 30px 40px; background-color: #ffffff;">
                    <p style="margin: 0 0 24px 0; font-size: 16px; color: #0f172a; font-weight: 600;">
                        مرحباً {{ $recipientName ?? 'عزيزي' }}،
                    </p>

                    <!-- Message Callout -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
                        <tr>
                            <td class="message-box" style="background-color: #f1f5f9; border-right: 4px solid #0ea5e9; padding: 20px; border-radius: 4px 0 0 4px;">
                                <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #334155;">
                                    لقد تم طلب رمز تحقق للوصول إلى حسابك أو إعادة تعيين كلمة المرور في منصة وداد. يُرجى استخدام الرمز الموضح بالأسفل لإتمام العملية.
                                </p>
                            </td>
                        </tr>
                    </table>

                    <!-- OTP Code Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
                        <tr>
                            <td align="center">
                                <div style="background-color: #f8fafc; padding: 20px 40px; border-radius: 8px; border: 1px solid #e2e8f0; display: inline-block;">
                                    <span style="font-size: 36px; font-weight: 700; letter-spacing: 6px; color: #0f172a; font-family: monospace;">{{ $otpToken }}</span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding-top: 15px;">
                                <p style="margin: 0; font-size: 13px; color: #ef4444; font-weight: 600;">
                                    صالح لمدة 15 دقيقة فقط. يُرجى عدم مشاركته مع أي شخص.
                                </p>
                            </td>
                        </tr>
                    </table>

                    <hr style="border: 0; border-bottom: 1px solid #e2e8f0; margin: 30px 0;">

                    <!-- Closing -->
                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #64748b; text-align: center;">
                        إذا لم تقم بطلب هذا الرمز، يرجى تجاهل هذه الرسالة فوراً لمزيد من الأمان.<br>
                        هذا إشعار تلقائي، يرجى عدم الرد.
                    </p>
                </td>
            </tr>

            <!-- Footer section -->
            <tr>
                <td style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; font-weight: 500;">فريق منصة وداد الصحية</p>
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">جميع الحقوق محفوظة &copy; {{ date('Y') }}</p>
                </td>
            </tr>
        </table>
    </center>
</body>

</html>