import requests
import time
from datetime import datetime
from functools import lru_cache

# In-memory cache for weather data: (location, crop) -> (timestamp, data)
_WEATHER_CACHE = {}
CACHE_TTL_SECONDS = 900  # 15 minutes

INDIAN_CITY_COORDINATES = {
    "delhi": (28.6139, 77.2090),
    "mumbai": (19.0760, 72.8777),
    "pune": (18.5204, 73.8567),
    "bengaluru": (12.9716, 77.5946),
    "bangalore": (12.9716, 77.5946),
    "hyderabad": (17.3850, 78.4867),
    "chennai": (13.0827, 80.2707),
    "kolkata": (22.5726, 88.3639),
    "ahmedabad": (23.0225, 72.5714),
    "chandigarh": (30.7333, 76.7794),
    "punjab": (30.9010, 75.8573), # Ludhiana
    "haryana": (29.0588, 76.0856), # Rohtak
    "maharashtra": (19.7515, 75.7139),
    "gujarat": (22.2587, 71.1924),
    "andhra pradesh": (16.5062, 80.6480), # Vijayawada
    "telangana": (17.8496, 79.1152), # Warangal
    "karnataka": (15.3173, 75.7139),
    "madhya pradesh": (23.2599, 77.4126), # Bhopal
    "uttar pradesh": (26.8467, 80.9462), # Lucknow
    "rajasthan": (26.9124, 75.7873), # Jaipur
    "bihar": (25.5941, 85.1376), # Patna
    "odisha": (20.2961, 85.8245), # Bhubaneswar
    "west bengal": (22.5726, 88.3639),
    "tamil nadu": (11.1271, 78.6569),
    "kerala": (10.8505, 76.2711),
    "assam": (26.2006, 92.9376)
}

WEATHER_CODE_MAP = {
    0: ("Clear Sky", "Sunny, optimal sunlight for photosynthesis."),
    1: ("Mainly Clear", "Mostly clear skies with gentle sunshine."),
    2: ("Partly Cloudy", "Scattered clouds with intermittent sunshine."),
    3: ("Overcast", "Full cloud blanket, low solar radiation."),
    45: ("Foggy", "Dense fog; keep an eye on fungal spore germination."),
    48: ("Depositing Rime Fog", "Cold foggy conditions."),
    51: ("Light Drizzle", "Slight surface moisture."),
    53: ("Moderate Drizzle", "Fine drizzle, wet leaves."),
    55: ("Dense Drizzle", "Continuous light rain."),
    61: ("Slight Rain", "Light rainfall beneficial for topsoil."),
    63: ("Moderate Rain", "Steady rainfall. Check drainage."),
    65: ("Heavy Rain", "Intense downpour. Waterlogging risk."),
    71: ("Light Snowfall", "Light snow/frost warning."),
    73: ("Moderate Snowfall", "Moderate snow cover."),
    75: ("Heavy Snowfall", "Heavy frost/snow alert."),
    80: ("Light Rain Showers", "Passing scattered rain showers."),
    81: ("Moderate Showers", "Brisk rain shower."),
    82: ("Violent Showers", "Sudden heavy squall shower."),
    95: ("Thunderstorm", "Active lightning and gusty winds."),
    96: ("Thunderstorm with Slight Hail", "Hail risk to standing crops."),
    99: ("Thunderstorm with Heavy Hail", "Severe hail warning for crops.")
}

def get_wind_direction_label(degrees: float) -> str:
    dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    ix = int((degrees + 11.25) / 22.5) % 16
    return dirs[ix]

def geocode_location(location: str):
    loc_clean = location.strip().lower()
    for key, coords in INDIAN_CITY_COORDINATES.items():
        if key in loc_clean:
            return coords[0], coords[1], location.title()

    # Try live Open-Meteo Geocoding
    try:
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={requests.utils.quote(location)}&count=1&language=en&format=json"
        res = requests.get(geo_url, timeout=3)
        if res.status_code == 200:
            data = res.json()
            if "results" in data and len(data["results"]) > 0:
                result = data["results"][0]
                name = f"{result.get('name')}, {result.get('admin1', result.get('country', ''))}".strip(", ")
                return float(result["latitude"]), float(result["longitude"]), name
    except Exception as e:
        print(f"Geocoding error for '{location}': {e}")

    # Default to Delhi coordinates if unknown
    return 28.6139, 77.2090, location.title() if location else "Delhi, India"

def analyze_smart_rain_prediction(hourly: dict, current_time_iso: str):
    """
    Analyzes hourly precipitation & probability to detect upcoming rain windows,
    expected amount, and precise timing.
    """
    times = hourly.get("time", [])
    precip_prob = hourly.get("precipitation_probability", [])
    precip_amount = hourly.get("precipitation", [])
    weather_codes = hourly.get("weather_code", [])

    if not times:
        return {
            "alert_level": "none",
            "headline": "No rainfall data available.",
            "details": "Forecast data could not be parsed.",
            "rain_windows": [],
            "next_rain_time": None,
            "max_probability_next_24h": 0,
            "total_rain_next_24h_mm": 0.0
        }

    # Focus on next 48 hours
    upcoming_hours = min(48, len(times))
    rain_windows = []
    current_window = None
    
    total_rain_24h = 0.0
    max_prob_24h = 0
    immediate_rain = False # within next 3 hours

    for i in range(upcoming_hours):
        t_str = times[i]
        prob = precip_prob[i] if i < len(precip_prob) and precip_prob[i] is not None else 0
        amt = precip_amount[i] if i < len(precip_amount) and precip_amount[i] is not None else 0.0
        code = weather_codes[i] if i < len(weather_codes) and weather_codes[i] is not None else 0

        if i < 24:
            total_rain_24h += amt
            if prob > max_prob_24h:
                max_prob_24h = prob
            if i <= 3 and (prob >= 50 or amt >= 1.0 or code in [61, 63, 65, 80, 81, 82, 95, 96, 99]):
                immediate_rain = True

        # Window logic: probability >= 40% or amount >= 0.5mm
        is_raining = (prob >= 40 or amt >= 0.5 or code in [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99])

        if is_raining:
            if current_window is None:
                current_window = {
                    "start_time": t_str,
                    "end_time": t_str,
                    "max_prob": prob,
                    "total_amt": amt,
                    "codes": [code]
                }
            else:
                current_window["end_time"] = t_str
                current_window["max_prob"] = max(current_window["max_prob"], prob)
                current_window["total_amt"] = round(current_window["total_amt"] + amt, 1)
                current_window["codes"].append(code)
        else:
            if current_window is not None:
                rain_windows.append(current_window)
                current_window = None

    if current_window is not None:
        rain_windows.append(current_window)

    # Humanized alert message & severity
    total_rain_24h = round(total_rain_24h, 1)
    
    if immediate_rain:
        first_win = rain_windows[0] if rain_windows else {}
        start_fmt = format_hour(first_win.get("start_time", ""))
        end_fmt = format_hour(first_win.get("end_time", ""))
        amt_str = f"{first_win.get('total_amt', 0.0)} mm"
        headline = "Rain is expected in your area within the next 3 hours."
        details = f"Precipitation expected around {start_fmt} (window until {end_fmt}) with {max_prob_24h}% probability and estimated ~{amt_str} rainfall."
        alert_level = "warning" if total_rain_24h > 15 else "caution"
    elif total_rain_24h >= 25.0:
        headline = "Heavy rainfall is forecast over the next 24 hours."
        details = f"Accumulation of ~{total_rain_24h} mm expected with high probability ({max_prob_24h}%). Waterlogging and runoff precautions advised."
        alert_level = "warning"
    elif max_prob_24h >= 65:
        first_win = rain_windows[0] if rain_windows else {}
        start_fmt = format_hour(first_win.get("start_time", ""))
        headline = "There is a high probability of rain today."
        details = f"Peak rainfall probability is {max_prob_24h}% around {start_fmt} with estimated ~{total_rain_24h} mm total accumulation."
        alert_level = "caution"
    elif total_rain_24h > 2.0 or max_prob_24h >= 40:
        headline = "Light showers or scattered rain expected."
        details = f"Moderate chance of rain ({max_prob_24h}%) with ~{total_rain_24h} mm expected precipitation."
        alert_level = "info"
    else:
        headline = "No significant rainfall is expected over the next 48 hours."
        details = f"Dry conditions forecast with {max_prob_24h}% maximum precipitation probability and under 1 mm rainfall."
        alert_level = "normal"

    return {
        "alert_level": alert_level,
        "headline": headline,
        "details": details,
        "rain_windows": rain_windows[:3],
        "next_rain_time": rain_windows[0]["start_time"] if rain_windows else None,
        "max_probability_next_24h": max_prob_24h,
        "total_rain_next_24h_mm": total_rain_24h
    }

def format_hour(iso_time_str: str) -> str:
    if not iso_time_str:
        return ""
    try:
        dt = datetime.fromisoformat(iso_time_str)
        return dt.strftime("%I:%M %p").lstrip("0")
    except Exception:
        return iso_time_str

def generate_crop_recommendations(crop: str, current_temp: float, rainfall_24h: float, wind_speed: float, condition: str, weather_code: int):
    """
    Generates actionable, crop-specific precautions based on actual weather metrics.
    """
    crop_name = crop.strip() if crop and crop.lower() not in ["your crop", "crop", ""] else "General Crops"
    crop_lower = crop_name.lower()
    recs = []

    # 1. Rain and Waterlogging Advisory
    if rainfall_24h >= 25.0 or weather_code in [65, 82, 95, 96, 99]:
        if "rice" in crop_lower or "paddy" in crop_lower:
            recs.append({
                "type": "Drainage",
                "severity": "high",
                "title": f"Drainage Alert for {crop_name}",
                "message": f"Excess rainfall ({rainfall_24h} mm) forecast. While paddy tolerates water, maintain bund height under 12 cm to prevent submergence of young tillers."
            })
        elif "cotton" in crop_lower:
            recs.append({
                "type": "Waterlogging",
                "severity": "high",
                "title": f"Protect {crop_name} from Standing Water",
                "message": f"Cotton roots suffocate quickly in stagnant water. Ensure cross-drainage trenches are open. Do not apply nitrogen fertilizers during heavy rain."
            })
        elif "wheat" in crop_lower or "corn" in crop_lower or "maize" in crop_lower:
            recs.append({
                "type": "Waterlogging",
                "severity": "high",
                "title": f"Check Field Drainage for {crop_name}",
                "message": f"Ensure immediate drainage to avoid yellowing of leaves from anaerobic stress. Postpone all pesticide and weedicide applications."
            })
        elif "tomato" in crop_lower or "potato" in crop_lower:
            recs.append({
                "type": "Disease Prevention",
                "severity": "high",
                "title": f"Fungal Blight Warning for {crop_name}",
                "message": f"High moisture combined with rainfall triggers early and late blight. Avoid furrow flooding and spray contact fungicides as soon as leaves dry."
            })
        else:
            recs.append({
                "type": "Drainage",
                "severity": "high",
                "title": f"Drainage Advisory for {crop_name}",
                "message": f"Clear field drainage channels to prevent waterlogging. Move any harvested crops to elevated, covered storage sheds."
            })
    elif rainfall_24h < 1.0 and current_temp > 33.0:
        # Dry & Hot conditions
        if "wheat" in crop_lower:
            recs.append({
                "type": "Heat Stress",
                "severity": "medium",
                "title": f"Terminal Heat Care for {crop_name}",
                "message": f"Temperature ({current_temp}°C) is above average. Provide light evening irrigation to cool down the microclimate and avoid shriveled grains."
            })
        elif "rice" in crop_lower:
            recs.append({
                "type": "Irrigation",
                "severity": "medium",
                "title": f"Irrigation Reminder for {crop_name}",
                "message": f"Dry conditions with active evaporation. Ensure 3-5 cm standing water level is maintained during panicle development."
            })
        else:
            recs.append({
                "type": "Moisture Care",
                "severity": "medium",
                "title": f"Soil Moisture Management for {crop_name}",
                "message": f"Soil evaporation is high at {current_temp}°C. Check root zone moisture. Irrigate during cooler early morning or evening hours."
            })

    # 2. Wind Advisory
    if wind_speed >= 25.0:
        recs.append({
            "type": "Wind Hazard",
            "severity": "medium" if wind_speed < 35 else "high",
            "title": f"Strong Wind Caution ({wind_speed} km/h)",
            "message": f"Strong winds may cause lodging (stem bending) in tall {crop_name}. Stake delicate plants and suspend all aerial/knapsack foliar spraying until wind subsides."
        })

    # 3. Disease & Routine Management
    if weather_code in [45, 48, 51, 53]:
        recs.append({
            "type": "Disease Watch",
            "severity": "info",
            "title": f"High Humidity Alert for {crop_name}",
            "message": "Persistent fog/drizzle encourages powdery mildew and rust. Scout the underside of leaves for discolored spores."
        })
    elif len(recs) == 0:
        recs.append({
            "type": "General Care",
            "severity": "normal",
            "title": f"Optimal Growing Conditions for {crop_name}",
            "message": f"Weather is mild and favorable for {crop_name}. Ideal window for scheduled weeding, nutrient dosing, and field inspection."
        })

    return recs

def calculate_weather_risk(current: dict, rain_analysis: dict):
    """
    Calculates overall Weather Risk Indicator (Green, Yellow, Orange, Red)
    with clear transparent reasoning.
    """
    temp = current.get("temperature_2m", 25.0)
    wind = current.get("wind_speed_10m", 10.0)
    weather_code = current.get("weather_code", 0)
    rain_24h = rain_analysis.get("total_rain_next_24h_mm", 0.0)
    max_prob = rain_analysis.get("max_probability_next_24h", 0)

    factors = []
    score = 0 # 0: Green, 1: Yellow, 2: Orange, 3: Red

    # Severe conditions: Hail or Violent Thunderstorm
    if weather_code in [96, 99]:
        score = 3
        factors.append("Hailstorm or severe convective storm detected.")
    elif weather_code == 95:
        score = max(score, 2)
        factors.append("Active thunderstorm and lightning forecast.")

    # Rain factor
    if rain_24h >= 45.0:
        score = max(score, 3)
        factors.append(f"Excessive rainfall ({rain_24h} mm) triggers flood/waterlogging risk.")
    elif rain_24h >= 20.0 or (max_prob >= 75 and rain_24h >= 10.0):
        score = max(score, 2)
        factors.append(f"Significant rain ({rain_24h} mm, {max_prob}% probability) requiring field drainage.")
    elif rain_24h >= 5.0 or max_prob >= 50:
        score = max(score, 1)
        factors.append(f"Moderate rain expected ({rain_24h} mm, {max_prob}% probability).")

    # Wind factor
    if wind >= 45.0:
        score = max(score, 3)
        factors.append(f"Gale-force wind speeds ({wind} km/h) can uproot standing crops.")
    elif wind >= 30.0:
        score = max(score, 2)
        factors.append(f"Strong winds ({wind} km/h) risk lodging and soil erosion.")
    elif wind >= 20.0:
        score = max(score, 1)
        factors.append(f"Brisk winds ({wind} km/h); postpone spray operations.")

    # Temperature factor
    if temp >= 42.0:
        score = max(score, 3)
        factors.append(f"Extreme heatwave ({temp}°C) causes severe crop moisture dehydration.")
    elif temp >= 38.0:
        score = max(score, 2)
        factors.append(f"High temperature stress ({temp}°C).")
    elif temp <= 3.0:
        score = max(score, 3)
        factors.append(f"Near-freezing temperatures ({temp}°C) with frost damage hazard.")
    elif temp <= 8.0:
        score = max(score, 2)
        factors.append(f"Cold wave conditions ({temp}°C) slowing crop metabolism.")

    risk_levels = [
        {"level": "green", "label": "Normal Conditions", "badge": "LOW RISK", "color": "#16A34A"},
        {"level": "yellow", "label": "Moderate Weather Concern", "badge": "MODERATE", "color": "#CA8A04"},
        {"level": "orange", "label": "High Weather Concern", "badge": "HIGH RISK", "color": "#EA580C"},
        {"level": "red", "label": "Severe Weather Alert", "badge": "CRITICAL", "color": "#DC2626"}
    ]

    chosen = risk_levels[min(score, 3)]
    if not factors:
        factors.append("Temperatures, moisture, and winds are within comfortable agricultural bounds.")

    return {
        "level": chosen["level"],
        "label": chosen["label"],
        "badge": chosen["badge"],
        "color": chosen["color"],
        "score": score,
        "reasons": factors
    }

def get_complete_weather_dashboard(location: str = "Delhi", crop: str = "Wheat"):
    """
    Main function providing the complete live weather dashboard payload,
    incorporating live Open-Meteo data, smart rain prediction, hourly and 7-day
    forecasts, crop-specific advisory, and risk indicators.
    """
    cache_key = f"{location.strip().lower()}_{crop.strip().lower()}"
    now = time.time()
    if cache_key in _WEATHER_CACHE:
        ts, cached_data = _WEATHER_CACHE[cache_key]
        if now - ts < CACHE_TTL_SECONDS:
            return cached_data

    lat, lon, resolved_name = geocode_location(location)

    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover"
        f"&hourly=temperature_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,uv_index_max,weather_code"
        f"&timezone=auto&forecast_days=7"
    )

    try:
        res = requests.get(url, timeout=5)
        res.raise_for_status()
        raw = res.json()
    except Exception as e:
        print(f"Weather API error: {e}")
        # Return fallback structured data if offline
        return get_fallback_weather(location, crop, resolved_name)

    current_raw = raw.get("current", {})
    hourly_raw = raw.get("hourly", {})
    daily_raw = raw.get("daily", {})

    weather_code = current_raw.get("weather_code", 0)
    cond_title, cond_desc = WEATHER_CODE_MAP.get(weather_code, ("Fair", "Pleasant atmospheric condition."))

    # 1. Smart Rain Prediction
    rain_analysis = analyze_smart_rain_prediction(hourly_raw, current_raw.get("time", ""))

    # 2. Hourly forecast (next 24 hours formatted)
    hourly_items = []
    h_times = hourly_raw.get("time", [])[:24]
    h_temps = hourly_raw.get("temperature_2m", [])[:24]
    h_probs = hourly_raw.get("precipitation_probability", [])[:24]
    h_precs = hourly_raw.get("precipitation", [])[:24]
    h_codes = hourly_raw.get("weather_code", [])[:24]

    for i in range(len(h_times)):
        w_title, _ = WEATHER_CODE_MAP.get(h_codes[i] if i < len(h_codes) else 0, ("Clear", ""))
        hourly_items.append({
            "time": format_hour(h_times[i]),
            "raw_time": h_times[i],
            "temp": round(h_temps[i], 1) if i < len(h_temps) else 25.0,
            "rain_prob": h_probs[i] if i < len(h_probs) else 0,
            "rain_mm": round(h_precs[i], 1) if i < len(h_precs) else 0.0,
            "condition": w_title,
            "code": h_codes[i] if i < len(h_codes) else 0
        })

    # 3. Seven Day Forecast
    daily_items = []
    d_times = daily_raw.get("time", [])
    d_max = daily_raw.get("temperature_2m_max", [])
    d_min = daily_raw.get("temperature_2m_min", [])
    d_rain = daily_raw.get("precipitation_sum", [])
    d_prob = daily_raw.get("precipitation_probability_max", [])
    d_codes = daily_raw.get("weather_code", [])
    d_sunrise = daily_raw.get("sunrise", [])
    d_sunset = daily_raw.get("sunset", [])

    for i in range(min(7, len(d_times))):
        dt_obj = datetime.fromisoformat(d_times[i])
        day_label = "Today" if i == 0 else ("Tomorrow" if i == 1 else dt_obj.strftime("%A"))
        c_title, _ = WEATHER_CODE_MAP.get(d_codes[i] if i < len(d_codes) else 0, ("Clear", ""))
        daily_items.append({
            "day": day_label,
            "date": dt_obj.strftime("%d %b"),
            "temp_max": round(d_max[i], 1) if i < len(d_max) else 30.0,
            "temp_min": round(d_min[i], 1) if i < len(d_min) else 18.0,
            "rain_sum_mm": round(d_rain[i], 1) if i < len(d_rain) else 0.0,
            "rain_prob_max": d_prob[i] if i < len(d_prob) else 0,
            "condition": c_title,
            "code": d_codes[i] if i < len(d_codes) else 0,
            "sunrise": format_hour(d_sunrise[i]) if i < len(d_sunrise) else "6:00 AM",
            "sunset": format_hour(d_sunset[i]) if i < len(d_sunset) else "6:30 PM"
        })

    # 4. Crop-specific recommendations
    current_temp = float(current_raw.get("temperature_2m", 25.0))
    wind_speed = float(current_raw.get("wind_speed_10m", 10.0))
    crop_recs = generate_crop_recommendations(
        crop=crop,
        current_temp=current_temp,
        rainfall_24h=rain_analysis["total_rain_next_24h_mm"],
        wind_speed=wind_speed,
        condition=cond_title,
        weather_code=weather_code
    )

    # 5. Risk Indicator
    risk = calculate_weather_risk(current_raw, rain_analysis)

    # 6. Notifications
    notifications = []
    if rain_analysis["alert_level"] in ["warning", "caution"]:
        notifications.append({
            "id": f"rain_{int(now)}",
            "type": "rain",
            "urgency": "high" if rain_analysis["alert_level"] == "warning" else "medium",
            "title": rain_analysis["headline"],
            "message": rain_analysis["details"],
            "timestamp": "Just now"
        })
    if wind_speed >= 25.0:
        notifications.append({
            "id": f"wind_{int(now)}",
            "type": "wind",
            "urgency": "medium",
            "title": f"High Wind Warning: {wind_speed} km/h",
            "message": f"Strong gusts detected. Secure loose farming nets and avoid spraying.",
            "timestamp": "10m ago"
        })
    if current_temp >= 38.0 or current_temp <= 5.0:
        notifications.append({
            "id": f"temp_{int(now)}",
            "type": "temperature",
            "urgency": "high",
            "title": "Temperature Extremes Alert",
            "message": f"Recorded temperature {current_temp}°C requires protective thermal crop cover.",
            "timestamp": "15m ago"
        })

    result = {
        "location": resolved_name,
        "crop": crop,
        "coordinates": {"lat": lat, "lon": lon},
        "last_updated": datetime.now().strftime("%I:%M %p, %d %b %Y"),
        "current": {
            "temperature": round(current_temp, 1),
            "feels_like": round(float(current_raw.get("apparent_temperature", current_temp)), 1),
            "humidity": round(float(current_raw.get("relative_humidity_2m", 60.0))),
            "precipitation_mm": round(float(current_raw.get("precipitation", 0.0)), 1),
            "wind_speed_kmh": round(wind_speed, 1),
            "wind_direction": get_wind_direction_label(float(current_raw.get("wind_direction_10m", 0.0))),
            "cloud_cover_pct": round(float(current_raw.get("cloud_cover", 0.0))),
            "condition": cond_title,
            "condition_desc": cond_desc,
            "weather_code": weather_code,
            "sunrise": daily_items[0]["sunrise"] if daily_items else "6:00 AM",
            "sunset": daily_items[0]["sunset"] if daily_items else "6:30 PM",
            "temp_max_today": daily_items[0]["temp_max"] if daily_items else round(current_temp + 3),
            "temp_min_today": daily_items[0]["temp_min"] if daily_items else round(current_temp - 5),
            "rain_prob_today": daily_items[0]["rain_prob_max"] if daily_items else 10
        },
        "smart_rain_alert": rain_analysis,
        "hourly_forecast": hourly_items,
        "seven_day_forecast": daily_items,
        "crop_recommendations": crop_recs,
        "weather_risk": risk,
        "notifications": notifications
    }

    _WEATHER_CACHE[cache_key] = (now, result)
    return result

def get_fallback_weather(location: str, crop: str, resolved_name: str):
    return {
        "location": resolved_name,
        "crop": crop,
        "coordinates": {"lat": 28.61, "lon": 77.20},
        "last_updated": datetime.now().strftime("%I:%M %p, %d %b %Y"),
        "current": {
            "temperature": 27.0,
            "feels_like": 28.5,
            "humidity": 55,
            "precipitation_mm": 0.0,
            "wind_speed_kmh": 12.0,
            "wind_direction": "NW",
            "cloud_cover_pct": 20,
            "condition": "Partly Cloudy",
            "condition_desc": "Scattered clouds with pleasant sunshine.",
            "weather_code": 2,
            "sunrise": "6:15 AM",
            "sunset": "6:20 PM",
            "temp_max_today": 31.0,
            "temp_min_today": 19.0,
            "rain_prob_today": 15
        },
        "smart_rain_alert": {
            "alert_level": "normal",
            "headline": "No significant rainfall expected over the next 48 hours.",
            "details": "Clear skies with light sunshine and dry conditions.",
            "rain_windows": [],
            "next_rain_time": None,
            "max_probability_next_24h": 15,
            "total_rain_next_24h_mm": 0.0
        },
        "hourly_forecast": [],
        "seven_day_forecast": [],
        "crop_recommendations": [
            {
                "type": "General Care",
                "severity": "normal",
                "title": f"Favorable Conditions for {crop}",
                "message": "Routine watering and pest inspection recommended."
            }
        ],
        "weather_risk": {
            "level": "green",
            "label": "Normal Conditions",
            "badge": "LOW RISK",
            "color": "#16A34A",
            "score": 0,
            "reasons": ["Weather parameters are within normal seasonal range."]
        },
        "notifications": []
    }

