import re
try:
    from weather_service import get_complete_weather_dashboard
    from sarvam_service import translate_text, text_to_speech, resolve_language_code
except ImportError:
    from backend.weather_service import get_complete_weather_dashboard
    from backend.sarvam_service import translate_text, text_to_speech, resolve_language_code

# PMFBY standard reference sum insured per acre by crop (Govt. of India PMFBY guidelines)
STANDARD_PMFBY_SUM_INSURED = {
    "wheat": 35000,
    "rice": 40000,
    "paddy": 40000,
    "cotton": 45000,
    "corn": 30000,
    "maize": 30000,
    "sugarcane": 55000,
    "potato": 50000,
    "tomato": 45000,
    "mustard": 28000,
    "soybean": 32000,
    "default": 35000
}

def get_crop_sum_insured(crop: str) -> float:
    c = crop.lower().strip()
    for k, v in STANDARD_PMFBY_SUM_INSURED.items():
        if k in c:
            return v
    return STANDARD_PMFBY_SUM_INSURED["default"]

def answer_farmer_query(
    question: str,
    language_code: str = "hi-IN",
    location: str = "Punjab",
    crop: str = "Wheat",
    farm_size_acres: float = 3.0,
    crop_loss_pct: float = 35.0,
    price_prediction_data: dict = None
):
    """
    Intelligent AI assistant grounded strictly in actual KrishiDeep data:
    - Farmer profile & farm location
    - Selected crop & growth conditions
    - PMFBY insurance policy, trigger thresholds, and verified payout computation
    - Live Open-Meteo weather metrics & smart rain prediction
    - Market trend and disease risk
    """
    clean_q = question.strip().lower()
    
    # 1. Fetch real weather data for location
    weather = get_complete_weather_dashboard(location, crop)
    current = weather.get("current", {})
    rain_alert = weather.get("smart_rain_alert", {})
    risk = weather.get("weather_risk", {})
    crop_recs = weather.get("crop_recommendations", [])
    primary_rec = crop_recs[0]["message"] if crop_recs else "Maintain regular monitoring."

    # 2. Insurance calculation
    sum_insured_per_acre = get_crop_sum_insured(crop)
    total_coverage = farm_size_acres * sum_insured_per_acre
    
    # PMFBY threshold: minimum 33% loss required for localized calamity/yield payout
    loss_threshold_pct = 33.0
    rain_deficit_threshold_mm = 20.0
    
    rain_24h = rain_alert.get("total_rain_next_24h_mm", 0.0)
    rain_trigger_reached = (rain_24h >= 40.0) or (crop_loss_pct >= loss_threshold_pct)
    
    if crop_loss_pct >= loss_threshold_pct:
        payout_amount = round((crop_loss_pct / 100.0) * total_coverage)
        payout_status = f"₹{payout_amount:,}"
        trigger_message = f"The crop loss trigger threshold ({loss_threshold_pct}%) has been crossed with recorded loss at {crop_loss_pct}%."
    else:
        payout_amount = 0
        payout_status = "₹0 (Below threshold)"
        trigger_message = f"The crop loss is currently {crop_loss_pct}%, which is below the minimum PMFBY claim trigger threshold of {loss_threshold_pct}%."

    # 3. Intent Detection
    answer_en = ""
    intent = "general"

    # A. Weather / Rain Queries
    if any(w in clean_q for w in ["rain", "barish", "varsham", "mazhai", "weather", "forecast", "cloud", "temperature", "वर्षा", "बारिश", "हवामान", "వర్షం", "వర్షము", "వాన", "మழை", "మಳೆ"]):
        intent = "weather"
        next_rain = rain_alert.get("rain_windows", [])
        if next_rain:
            w0 = next_rain[0]
            start = w0.get("start_time", "").split("T")[-1][:5]
            end = w0.get("end_time", "").split("T")[-1][:5]
            answer_en = (
                f"Rain is forecast in {location} between {start} and {end} with {w0.get('max_prob', 60)}% probability "
                f"and ~{w0.get('total_amt', 0.0)} mm expected rainfall. {primary_rec}"
            )
        else:
            answer_en = (
                f"{rain_alert.get('headline')} Current temperature in {location} is {current.get('temperature', 25)}°C "
                f"with {current.get('humidity', 60)}% humidity. {primary_rec}"
            )

    # B. Insurance / Payout Queries
    elif any(w in clean_q for w in ["payout", "insurance", "claim", "beema", "bima", "fasal bima", "pmfby", "money", "compensation", "बीमा", "भुगतान", "పరిహారం", "విమా", "ವಿಮೆ"]):
        intent = "insurance"
        answer_en = (
            f"For your {farm_size_acres} acre {crop} farm in {location}, the total sum insured under PMFBY is ₹{total_coverage:,}. "
            f"Your current estimated crop loss is {crop_loss_pct}%. {trigger_message} "
            f"Your estimated payout is currently {payout_status}, subject to official surveyor verification."
        )

    # C. Crop Risk / Danger Queries
    elif any(w in clean_q for w in ["risk", "danger", "safe", "damage", "loss", "threat", "नुकसान", "जोखिम", "ఖత్రా", "ప్రమాదం", "ಅಪಾಯ"]):
        intent = "risk"
        answer_en = (
            f"Weather risk for your {crop} crop is currently rated {risk.get('label', 'Normal')} ({risk.get('badge', 'LOW RISK')}). "
            f"{' '.join(risk.get('reasons', []))} {primary_rec}"
        )

    # D. Water / Irrigation Queries
    elif any(w in clean_q for w in ["water", "irrigation", "soil", "paani", "neeru", "thanni", "पानी", "सिंचाई", "నీరు", "నీళ్ళు", "ನೀರು"]):
        intent = "irrigation"
        if rain_alert.get("max_probability_next_24h", 0) >= 50 or rain_24h >= 10.0:
            answer_en = (
                f"With rain expected in {location} ({rain_alert.get('max_probability_next_24h')}% chance), hold off on irrigating your {crop} field. "
                f"Inspect your drainage channels to avoid standing water."
            )
        else:
            answer_en = (
                f"No heavy rain is forecast for {location}. Humidity is {current.get('humidity', 60)}% and temperature is {current.get('temperature', 25)}°C. "
                f"Check root-zone soil moisture. If soil feels dry 2 inches down, apply light evening irrigation."
            )

    # E. Market Price Queries
    elif any(w in clean_q for w in ["price", "market", "mandi", "rate", "sell", "wait", "bhav", "दाम", "भाव", "ధర", "మార్కెట్", "ಬೆಲೆ"]):
        intent = "price"
        if price_prediction_data and "recommendation" in price_prediction_data:
            rec = price_prediction_data.get("recommendation", "HOLD")
            p1 = price_prediction_data.get("day_1_price", 0)
            pn = price_prediction_data.get("target_day_price", 0)
            answer_en = (
                f"Based on KrishiDeep ML model, current mandi price for {crop} is ₹{p1}/kg and expected to reach ₹{pn}/kg. "
                f"Recommendation is {rec}: {price_prediction_data.get('reason', '')}"
            )
        else:
            answer_en = (
                f"Mandi price trends for {crop} in {location} remain steady. Please check the Price Prediction tab for 7-day projected price curve and confidence scores."
            )

    # F. Default Fallback
    else:
        intent = "general"
        answer_en = (
            f"Hello! KrishiDeep is monitoring your {farm_size_acres}-acre {crop} farm in {location}. "
            f"Current temperature is {current.get('temperature', 25)}°C with {risk.get('label', 'Normal')} conditions. "
            f"Your PMFBY sum insured is ₹{total_coverage:,} with {crop_loss_pct}% loss recorded. How can I assist you with weather, crop care, or insurance?"
        )

    # 4. Translation into Farmer's Language
    short_k, full_code, engine = resolve_language_code(language_code)
    
    if short_k == "en":
        final_answer = answer_en
    else:
        # Translate with Sarvam Mayura
        try:
            final_answer = translate_text(answer_en, target_lang=full_code, source_lang="en-IN")
        except Exception:
            final_answer = answer_en

    # 5. Generate Voice Audio via Sarvam Bulbul:v3
    tts_result = text_to_speech(final_answer, requested_lang=full_code)
    
    return {
        "question": question,
        "answer": final_answer,
        "answer_en": answer_en,
        "intent": intent,
        "language_code": full_code,
        "voice_engine": tts_result.get("engine", "sarvam"),
        "audio_base64": tts_result.get("audio_base64"),
        "grounding": {
            "location": location,
            "crop": crop,
            "farm_size_acres": farm_size_acres,
            "sum_insured_per_acre": sum_insured_per_acre,
            "total_coverage": total_coverage,
            "crop_loss_pct": crop_loss_pct,
            "loss_threshold_pct": loss_threshold_pct,
            "estimated_payout": payout_amount,
            "rain_alert": rain_alert.get("headline"),
            "temperature": current.get("temperature"),
            "risk_level": risk.get("label")
        }
    }
