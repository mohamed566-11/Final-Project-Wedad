import { Phone, Calendar, HeadphonesIcon, AlertTriangle, X } from "lucide-react";
import { motion } from "framer-motion";
import { CHATBOT_UI } from "@/constants/chatbot-strings";

interface EmergencyCardProps {
    onDismiss: () => void;
}

export function EmergencyCard({ onDismiss }: EmergencyCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            role="alert"
            aria-live="assertive"
            className="mx-4 mb-3 p-4 bg-gradient-to-br from-red-50 to-red-100/80 dark:from-red-950/40 dark:to-red-900/30 
                       border border-red-200/80 dark:border-red-800/60 rounded-2xl shadow-lg shadow-red-500/10 
                       backdrop-blur-sm relative overflow-hidden"
        >
            {/* Decorative glow */}
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-red-400/20 rounded-full blur-2xl" />

            {/* Dismiss button */}
            <button
                onClick={onDismiss}
                className="absolute top-3 left-3 p-1 rounded-lg hover:bg-red-200/50 dark:hover:bg-red-800/30 
                           transition-colors text-red-400 dark:text-red-500"
                aria-label="إغلاق التنبيه"
            >
                <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2 mb-2.5 relative">
                <div className="p-1.5 bg-red-500/15 dark:bg-red-500/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
                <p className="text-red-700 dark:text-red-300 text-xs font-bold">
                    {CHATBOT_UI.emergency.title}
                </p>
            </div>

            <p className="text-red-600/80 dark:text-red-400/80 text-[11px] mb-3 leading-relaxed relative">
                {CHATBOT_UI.emergency.description}
            </p>

            <div className="flex flex-wrap gap-2 relative">
                <a
                    href="tel:123"
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 text-white text-[11px] font-medium 
                               rounded-xl hover:bg-red-700 transition-all duration-200 shadow-md shadow-red-600/30
                               hover:shadow-lg hover:shadow-red-600/40 hover:-translate-y-0.5"
                    aria-label={CHATBOT_UI.emergency.callAmbulance}
                >
                    <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                    {CHATBOT_UI.emergency.callAmbulance}
                </a>
                <button
                    onClick={onDismiss}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 text-white text-[11px] font-medium 
                               rounded-xl hover:bg-orange-600 transition-all duration-200 shadow-md shadow-orange-500/30
                               hover:shadow-lg hover:shadow-orange-500/40 hover:-translate-y-0.5"
                    aria-label={CHATBOT_UI.emergency.bookConsultation}
                >
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    {CHATBOT_UI.emergency.bookConsultation}
                </button>
                <button
                    onClick={onDismiss}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-600 text-white text-[11px] font-medium 
                               rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-md shadow-gray-600/30
                               hover:shadow-lg hover:shadow-gray-600/40 hover:-translate-y-0.5"
                    aria-label={CHATBOT_UI.emergency.contactSupport}
                >
                    <HeadphonesIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    {CHATBOT_UI.emergency.contactSupport}
                </button>
            </div>
        </motion.div>
    );
}
