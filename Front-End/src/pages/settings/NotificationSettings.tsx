import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    ArrowRight, Bell, Mail, MessageSquare, Calendar,
    Megaphone, Smartphone, Check, Loader2, Shield
} from 'lucide-react';
import { notificationService, NotificationSettings } from '@/services/notificationService';

export const NotificationSettingsPage = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState<NotificationSettings>({
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        consultation_reminders: true,
        marketing_emails: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [enablingPush, setEnablingPush] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const result = await notificationService.getSettings();
                if (result) {
                    setSettings(result);
                }

                // Check push notification status
                const enabled = await notificationService.isEnabled();
                setPushEnabled(enabled);
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        setSaving(true);
        try {
            await notificationService.updateSettings({ [key]: value });
            toast.success('تم حفظ الإعدادات');
        } catch (error) {
            // Revert on error
            setSettings(settings);
            toast.error('حدث خطأ أثناء الحفظ');
        } finally {
            setSaving(false);
        }
    };

    const handleEnablePush = async () => {
        setEnablingPush(true);
        try {
            const success = await notificationService.subscribe();
            if (success) {
                setPushEnabled(true);
                toast.success('تم تفعيل الإشعارات الفورية');
            } else {
                toast.error('لم نتمكن من تفعيل الإشعارات');
            }
        } catch (error) {
            toast.error('حدث خطأ');
        } finally {
            setEnablingPush(false);
        }
    };

    const handleDisablePush = async () => {
        setEnablingPush(true);
        try {
            await notificationService.unsubscribe();
            setPushEnabled(false);
            toast.success('تم إلغاء الإشعارات الفورية');
        } catch (error) {
            toast.error('حدث خطأ');
        } finally {
            setEnablingPush(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const settingsConfig = [
        {
            key: 'push_notifications' as const,
            icon: Bell,
            title: 'الإشعارات الفورية',
            description: 'احصل على إشعارات فورية في المتصفح',
            color: 'text-purple-500',
            bgColor: 'bg-purple-100',
        },
        {
            key: 'email_notifications' as const,
            icon: Mail,
            title: 'إشعارات البريد الإلكتروني',
            description: 'استقبل إشعارات عبر البريد',
            color: 'text-blue-500',
            bgColor: 'bg-blue-100',
        },
        {
            key: 'sms_notifications' as const,
            icon: MessageSquare,
            title: 'إشعارات SMS',
            description: 'رسائل نصية للتذكيرات المهمة',
            color: 'text-green-500',
            bgColor: 'bg-green-100',
        },
        {
            key: 'consultation_reminders' as const,
            icon: Calendar,
            title: 'تذكيرات الاستشارات',
            description: 'تذكير قبل موعد الاستشارة',
            color: 'text-pink-500',
            bgColor: 'bg-pink-100',
        },
        {
            key: 'marketing_emails' as const,
            icon: Megaphone,
            title: 'رسائل تسويقية',
            description: 'عروض وأخبار المنصة',
            color: 'text-orange-500',
            bgColor: 'bg-orange-100',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white">
                <div className="max-w-2xl mx-auto px-4 py-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4"
                    >
                        <ArrowRight className="w-5 h-5" />
                        رجوع
                    </button>

                    <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
                        <Bell className="w-8 h-8" />
                        إعدادات الإشعارات
                    </h1>
                    <p className="text-white/80">
                        تحكم في طريقة استلام الإشعارات
                    </p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Push Notification Permission */}
                {!pushEnabled && 'Notification' in window && (
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 mb-6 text-white">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold mb-1">فعّل الإشعارات الفورية</h3>
                                <p className="text-white/80 text-sm mb-4">
                                    احصل على تنبيهات فورية لمواعيد استشاراتك ورسائلك
                                </p>
                                <button
                                    onClick={handleEnablePush}
                                    disabled={enablingPush}
                                    className="px-6 py-2 bg-white text-purple-600 font-medium rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {enablingPush ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Bell className="w-4 h-4" />
                                    )}
                                    تفعيل الآن
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings List */}
                <div className="space-y-4">
                    {settingsConfig.map(item => (
                        <div
                            key={item.key}
                            className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4"
                        >
                            <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                                <item.icon className={`w-6 h-6 ${item.color}`} />
                            </div>

                            <div className="flex-1">
                                <h3 className="font-medium text-gray-900">{item.title}</h3>
                                <p className="text-sm text-gray-500">{item.description}</p>
                            </div>

                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings[item.key]}
                                    onChange={(e) => handleToggle(item.key, e.target.checked)}
                                    disabled={saving}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                            </label>
                        </div>
                    ))}
                </div>

                {/* Disable Push */}
                {pushEnabled && (
                    <div className="mt-6 p-4 bg-gray-100 rounded-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-green-500" />
                                <span className="text-gray-700">الإشعارات الفورية مفعّلة</span>
                            </div>
                            <button
                                onClick={handleDisablePush}
                                disabled={enablingPush}
                                className="text-sm text-red-500 hover:text-red-600"
                            >
                                إلغاء التفعيل
                            </button>
                        </div>
                    </div>
                )}

                {/* Info */}
                <div className="mt-8 p-4 bg-blue-50 rounded-2xl flex gap-3">
                    <Bell className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">ملاحظة</p>
                        <p>
                            بعض الإشعارات الهامة مثل تأكيد الحجز وتذكيرات المواعيد قد يتم إرسالها
                            بغض النظر عن هذه الإعدادات لضمان عدم تفويت أي موعد.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettingsPage;
