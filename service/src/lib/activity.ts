export const ONLINE_WINDOW_MS = 5 * 60 * 1000;
export const ACTIVITY_RETENTION_DAYS = 30;

export type RequestDeviceInfo = {
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string;
  operatingSystem: string;
  browser: string;
};

function firstHeaderAddress(value: string | null) {
  const address = value?.split(",")[0]?.trim();
  return address && address.length <= 64 ? address : null;
}

function detectDeviceType(userAgent: string) {
  if (/ipad|tablet|kindle|silk|playbook/i.test(userAgent)) {
    return "Планшет";
  }

  if (/mobi|iphone|ipod|android/i.test(userAgent)) {
    return "Телефон";
  }

  return "Компьютер";
}

function detectOperatingSystem(userAgent: string) {
  if (/windows nt 10\.0/i.test(userAgent)) return "Windows";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS/iPadOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/mac os x|macintosh/i.test(userAgent)) return "macOS";
  if (/cros/i.test(userAgent)) return "ChromeOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Не определена";
}

function detectBrowser(userAgent: string) {
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/opr\/|opera/i.test(userAgent)) return "Opera";
  if (/samsungbrowser/i.test(userAgent)) return "Samsung Internet";
  if (/firefox\/|fxios\//i.test(userAgent)) return "Firefox";
  if (/chrome\/|crios\//i.test(userAgent)) return "Chrome";
  if (/safari\//i.test(userAgent)) return "Safari";
  return "Не определён";
}

export function getRequestDeviceInfo(headers: Headers): RequestDeviceInfo {
  const userAgent = headers.get("user-agent")?.slice(0, 1000) || null;
  const source = userAgent ?? "";

  return {
    ipAddress:
      firstHeaderAddress(headers.get("cf-connecting-ip")) ??
      firstHeaderAddress(headers.get("x-real-ip")) ??
      firstHeaderAddress(headers.get("x-forwarded-for")),
    userAgent,
    deviceType: detectDeviceType(source),
    operatingSystem: detectOperatingSystem(source),
    browser: detectBrowser(source),
  };
}

export function moscowDayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function activityDayCutoff(days = ACTIVITY_RETENTION_DAYS) {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - (days - 1));
  return moscowDayKey(cutoff);
}

export function isOnline(lastActiveAt: Date | string | null | undefined) {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() <= ONLINE_WINDOW_MS;
}
