## 📤 Data Sent to Hugging Face (Input Payload)
```json
{
    "age": 25,
    "pcos": 1,
    "height_cm": 180,
    "weight_kg": 65,
    "prediabetes": 1,
    "family_history": 1,
    "no_of_pregnancy": 3,
    "sedentary_lifestyle": 1,
    "unexplained_prenatal_loss": 1,
    "large_child_or_birth_default": 1,
    "gestation_in_previous_pregnancy": 1
}
```

## 📥 Data Received from Hugging Face (Output Payload)
```json
{
    "final_risk": "Moderate Risk",
    "top_factors": [
        {
            "impact": 3.2645,
            "feature": "BMI",
            "direction": "decreases risk"
        },
        {
            "impact": 1.7557,
            "feature": "Prediabetes",
            "direction": "increases risk"
        },
        {
            "impact": 1.4031,
            "feature": "PCOS",
            "direction": "increases risk"
        }
    ],
    "bmi_computed": 20.1,
    "risk_category": "Moderate Risk",
    "risk_probability": 0.3442,
    "guardrail_applied": false,
    "recommendation_ar": "يُظهر ملفك الصحي بعض عوامل خطر الإصابة بسكري الحمل. يرجى مناقشة هذه النتيجة مع طبيبك في أقرب فرصة. قد يوصي بإجراء اختبار تحمل الجلوكوز الفموي (OGTT) للتأكد من حالتك.",
    "recommendation_en": "Your profile shows some risk factors for gestational diabetes. Please discuss this result with your doctor at your earliest opportunity. They may recommend an OGTT (oral glucose tolerance test) to confirm your status."
}
```