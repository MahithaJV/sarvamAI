import os
import requests
from dotenv import load_dotenv

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "sk_4hqf4dgi_stZ1H5bOqpMUdpUcN5gEebDk")

# All 22 Scheduled Indian Languages + English
# With verified Sarvam AI capabilities
LANGUAGE_REGISTRY = {
    "en": {"code": "en-IN", "name": "English", "native": "English", "voice_engine": "sarvam", "speaker": "aditya", "region": "All India"},
    "hi": {"code": "hi-IN", "name": "Hindi", "native": "हिन्दी", "voice_engine": "sarvam", "speaker": "aditya", "region": "North/Central"},
    "te": {"code": "te-IN", "name": "Telugu", "native": "తెలుగు", "voice_engine": "sarvam", "speaker": "kavitha", "region": "Andhra / Telangana"},
    "ta": {"code": "ta-IN", "name": "Tamil", "native": "தமிழ்", "voice_engine": "sarvam", "speaker": "gokul", "region": "Tamil Nadu"},
    "kn": {"code": "kn-IN", "name": "Kannada", "native": "ಕನ್ನಡ", "voice_engine": "sarvam", "speaker": "chaitra", "region": "Karnataka"},
    "ml": {"code": "ml-IN", "name": "Malayalam", "native": "മലയാളം", "voice_engine": "sarvam", "speaker": "aditya", "region": "Kerala"},
    "mr": {"code": "mr-IN", "name": "Marathi", "native": "मराठी", "voice_engine": "sarvam", "speaker": "ishita", "region": "Maharashtra"},
    "bn": {"code": "bn-IN", "name": "Bengali", "native": "বাংলা", "voice_engine": "sarvam", "speaker": "roopa", "region": "West Bengal"},
    "gu": {"code": "gu-IN", "name": "Gujarati", "native": "ગુજરાતી", "voice_engine": "sarvam", "speaker": "pooja", "region": "Gujarat"},
    "pa": {"code": "pa-IN", "name": "Punjabi", "native": "ਪੰਜਾਬੀ", "voice_engine": "sarvam", "speaker": "anand", "region": "Punjab"},
    "od": {"code": "od-IN", "name": "Odia", "native": "ଓଡ଼ିଆ", "voice_engine": "sarvam", "speaker": "aditya", "region": "Odisha"},
    "as": {"code": "as-IN", "name": "Assamese", "native": "অসমীয়া", "voice_engine": "sarvam", "speaker": "aditya", "region": "Assam"},
    # Fallback scheduled languages (UI translated, Web Speech synthesis)
    "ur": {"code": "ur-IN", "name": "Urdu", "native": "اردو", "voice_engine": "fallback", "speaker": "standard", "region": "Pan-India"},
    "ne": {"code": "ne-IN", "name": "Nepali", "native": "नेपाली", "voice_engine": "fallback", "speaker": "standard", "region": "Sikkim/WB"},
    "sa": {"code": "sa-IN", "name": "Sanskrit", "native": "संस्कृतम्", "voice_engine": "fallback", "speaker": "standard", "region": "Pan-India"},
    "kok": {"code": "kok-IN", "name": "Konkani", "native": "कोंकणी", "voice_engine": "fallback", "speaker": "standard", "region": "Goa/Konkan"},
    "mai": {"code": "mai-IN", "name": "Maithili", "native": "मैथिली", "voice_engine": "fallback", "speaker": "standard", "region": "Bihar"},
    "ks": {"code": "ks-IN", "name": "Kashmiri", "native": "کٲشُر", "voice_engine": "fallback", "speaker": "standard", "region": "J&K"},
    "mni": {"code": "mni-IN", "name": "Manipuri (Meitei)", "native": "মৈতৈলোন্", "voice_engine": "fallback", "speaker": "standard", "region": "Manipur"},
    "brx": {"code": "brx-IN", "name": "Bodo", "native": "बर'", "voice_engine": "fallback", "speaker": "standard", "region": "Assam"},
    "doi": {"code": "doi-IN", "name": "Dogri", "native": "डोगरी", "voice_engine": "fallback", "speaker": "standard", "region": "Jammu"},
    "sat": {"code": "sat-IN", "name": "Santali", "native": "ᱥᱟᱱᱛᱟᱲᱤ", "voice_engine": "fallback", "speaker": "standard", "region": "Jharkhand/Odisha"},
    "sd": {"code": "sd-IN", "name": "Sindhi", "native": "سنڌي", "voice_engine": "fallback", "speaker": "standard", "region": "Pan-India"}
}

SARVAM_SUPPORTED_CODES = {
    "en-IN", "hi-IN", "bn-IN", "gu-IN", "kn-IN", "ml-IN", "mr-IN", "od-IN", "pa-IN", "ta-IN", "te-IN"
}

def resolve_language_code(lang_input: str) -> tuple[str, str, str]:
    """
    Returns (short_key, full_code, voice_engine)
    e.g. ('hi', 'hi-IN', 'sarvam')
    """
    if not lang_input:
        return "en", "en-IN", "sarvam"
    
    clean = lang_input.strip().lower()
    
    # Check short key (e.g. 'hi')
    if clean in LANGUAGE_REGISTRY:
        info = LANGUAGE_REGISTRY[clean]
        return clean, info["code"], info["voice_engine"]

    # Check full code (e.g. 'hi-in')
    for k, v in LANGUAGE_REGISTRY.items():
        if v["code"].lower() == clean or v["name"].lower() == clean:
            return k, v["code"], v["voice_engine"]

    # Default to English
    return "en", "en-IN", "sarvam"

def speech_to_text(audio_bytes: bytes, filename: str = "audio.wav", requested_lang: str = "hi-IN"):
    """
    Transcribes audio bytes using Sarvam AI Saaras model.
    """
    if not SARVAM_API_KEY:
        return {"error": "Sarvam API Key is not configured."}

    url = "https://api.sarvam.ai/speech-to-text"
    headers = {"api-subscription-key": SARVAM_API_KEY}
    
    # Resolve language
    _, full_code, engine = resolve_language_code(requested_lang)

    data = {"model": "saaras:v3"}
    # Pass language_code if it's in the Sarvam supported list
    if full_code in SARVAM_SUPPORTED_CODES:
        data["language_code"] = full_code

    files = {"file": (filename, audio_bytes, "audio/wav")}

    try:
        res = requests.post(url, headers=headers, files=files, data=data, timeout=12)
        if res.status_code == 200:
            result = res.json()
            return {
                "success": True,
                "transcript": result.get("transcript", "").strip(),
                "language_code": result.get("language_code", full_code),
                "request_id": result.get("request_id")
            }
        else:
            return {
                "success": False,
                "error": f"Sarvam STT failed: {res.text}",
                "status_code": res.status_code
            }
    except Exception as e:
        return {"success": False, "error": f"Network error during STT: {str(e)}"}

def text_to_speech(text: str, requested_lang: str = "hi-IN", speaker: str = None):
    """
    Synthesizes speech using Sarvam Bulbul:v3 or flags fallback.
    """
    if not text:
        return {"error": "Text is empty."}

    short_k, full_code, engine = resolve_language_code(requested_lang)
    info = LANGUAGE_REGISTRY.get(short_k, {})

    # If language is supported by Sarvam
    if full_code in SARVAM_SUPPORTED_CODES and engine == "sarvam":
        chosen_speaker = speaker or info.get("speaker", "aditya")
        url = "https://api.sarvam.ai/text-to-speech"
        headers = {
            "api-subscription-key": SARVAM_API_KEY,
            "Content-Type": "application/json"
        }
        # Limit text length to 450 characters for responsive realtime audio
        payload = {
            "inputs": [text[:450]],
            "target_language_code": full_code,
            "speaker": chosen_speaker,
            "model": "bulbul:v3"
        }
        try:
            res = requests.post(url, headers=headers, json=payload, timeout=12)
            if res.status_code == 200:
                data = res.json()
                audios = data.get("audios", [])
                if audios:
                    return {
                        "success": True,
                        "audio_base64": audios[0],
                        "mime_type": "audio/wav",
                        "engine": "sarvam",
                        "language_code": full_code,
                        "speaker": chosen_speaker,
                        "verified": True
                    }
            return {
                "success": False,
                "engine": "browser_fallback",
                "message": f"Sarvam TTS response: {res.text}",
                "text": text,
                "language_code": full_code
            }
        except Exception as e:
            return {
                "success": False,
                "engine": "browser_fallback",
                "message": f"Network error connecting to Sarvam: {str(e)}",
                "text": text,
                "language_code": full_code
            }

    # Graceful fallback for scheduled languages not directly hosted on Sarvam voice endpoint
    return {
        "success": True,
        "audio_base64": None,
        "engine": "browser_fallback",
        "message": f"Using browser Web Speech engine for {info.get('name', 'regional language')}.",
        "text": text,
        "language_code": full_code,
        "verified": False
    }

def translate_text(text: str, target_lang: str = "hi-IN", source_lang: str = "en-IN"):
    """
    Translates text to Indian language using Sarvam Mayura:v1.
    """
    _, target_code, _ = resolve_language_code(target_lang)
    _, source_code, _ = resolve_language_code(source_lang)

    if target_code == source_code or not text:
        return text

    if target_code in SARVAM_SUPPORTED_CODES and source_code in SARVAM_SUPPORTED_CODES:
        url = "https://api.sarvam.ai/translate"
        headers = {
            "api-subscription-key": SARVAM_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "input": text[:1000],
            "source_language_code": source_code,
            "target_language_code": target_code,
            "model": "mayura:v1",
            "mode": "formal"
        }
        try:
            res = requests.post(url, headers=headers, json=payload, timeout=8)
            if res.status_code == 200:
                return res.json().get("translated_text", text)
        except Exception as e:
            print(f"Translation exception: {e}")

    return text

