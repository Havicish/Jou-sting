let CookiesJSON = {};

document.addEventListener("DOMContentLoaded", () => {
  const CookiesString = document.cookie;
  if (!CookiesString) return;

  const CookiesArray = CookiesString.split("; ");
  for (const Cookie of CookiesArray) {
    const SplitIndex = Cookie.indexOf("=");
    if (SplitIndex === -1) continue;

    const Key = Cookie.substring(0, SplitIndex);
    const Value = Cookie.substring(SplitIndex + 1);

    try {
      CookiesJSON[Key] = JSON.parse(decodeURIComponent(Value));
    } catch {
      CookiesJSON[Key] = decodeURIComponent(Value);
    }
  }
});

export function SetCookie(Key, Value, DaysValid = 3650) {
  CookiesJSON[Key] = Value;

  const DateObj = new Date();
  DateObj.setTime(DateObj.getTime() + (DaysValid * 24 * 60 * 60 * 1000));
  const Expires = "; expires=" + DateObj.toUTCString();

  document.cookie = `${Key}=${encodeURIComponent(JSON.stringify(Value))}${Expires}; path=/; SameSite=Lax`;
}

export function GetCookie(Key) {
  return CookiesJSON.hasOwnProperty(Key) ? CookiesJSON[Key] : null;
}
