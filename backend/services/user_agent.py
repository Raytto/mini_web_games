from dataclasses import dataclass
import re
from typing import Optional, Tuple


@dataclass
class UserAgentInfo:
    browser_name: Optional[str] = None
    browser_version: Optional[str] = None
    device_os: Optional[str] = None
    device_os_version: Optional[str] = None


def _clean_version(version: Optional[str]) -> Optional[str]:
    if not version:
        return None
    return version.replace("_", ".")


def _extract(pattern: str, ua: str) -> Optional[str]:
    match = re.search(pattern, ua, re.IGNORECASE)
    if not match:
        return None
    return _clean_version(match.group(1))


def _detect_os(ua: str, ua_lower: str) -> Tuple[Optional[str], Optional[str]]:
    if "android" in ua_lower:
        return "Android", _extract(r"Android ([0-9A-Za-z\._-]+)", ua)
    if "iphone" in ua_lower or "ipad" in ua_lower or "ipod" in ua_lower:
        return "iOS", _extract(r"OS ([0-9_\.]+)", ua)
    if "mac os x" in ua_lower:
        return "macOS", _extract(r"Mac OS X ([0-9_\.]+)", ua)
    if "windows nt" in ua_lower:
        return "Windows", _extract(r"Windows NT ([0-9\.]+)", ua)
    if "linux" in ua_lower:
        return "Linux", None
    return None, None


def _detect_browser(ua: str, ua_lower: str) -> Tuple[Optional[str], Optional[str]]:
    if "edg/" in ua_lower:
        return "Edge", _extract(r"Edg/([0-9\.]+)", ua)
    if "crios/" in ua_lower:
        return "Chrome", _extract(r"CriOS/([0-9\.]+)", ua)
    if "chrome/" in ua_lower:
        return "Chrome", _extract(r"Chrome/([0-9\.]+)", ua)
    if "fxios/" in ua_lower:
        return "Firefox", _extract(r"FxiOS/([0-9\.]+)", ua)
    if "firefox/" in ua_lower:
        return "Firefox", _extract(r"Firefox/([0-9\.]+)", ua)
    if "safari" in ua_lower and "version/" in ua_lower:
        return "Safari", _extract(r"Version/([0-9\.]+)", ua) or _extract(r"Safari/([0-9\.]+)", ua)
    return None, None


def parse_user_agent(user_agent: Optional[str]) -> UserAgentInfo:
    """
    Extract coarse OS and browser info (family + version) from a user agent string.
    Returns empty fields when the UA is missing or cannot be parsed.
    """
    if not user_agent:
        return UserAgentInfo()

    ua = user_agent.strip()
    ua_lower = ua.lower()

    os_name, os_version = _detect_os(ua, ua_lower)
    browser_name, browser_version = _detect_browser(ua, ua_lower)

    return UserAgentInfo(
        browser_name=browser_name,
        browser_version=browser_version,
        device_os=os_name,
        device_os_version=os_version,
    )
