/**
 * The bit of the accessibility layer that has to run before React does.
 * No "use client" here on purpose: the root layout (a server component)
 * inlines PREFS_BOOT_SCRIPT into <head>, and the client store in
 * lib/a11y-prefs.ts shares the storage key so the two never disagree.
 */

export const STORAGE_KEY = "tm.prefs";

/**
 * Stamps the saved preferences onto <html> before first paint. Keep it in
 * step with applyPrefsToDocument in lib/a11y-prefs.ts. It runs before
 * anything else loads, so it's plain, self-contained and tolerant of a
 * missing or broken localStorage.
 */
export const PREFS_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"{}");var r=document.documentElement;if(p.colorBlindCandles)r.dataset.candles="colorblind";if(p.reducedMotion)r.dataset.motion="reduced";if(p.highContrast)r.dataset.contrast="high";if(p.readableFont)r.dataset.font="readable";if(p.comfortableReading)r.dataset.reading="comfortable";if(p.calmMode)r.dataset.calm="on";if(p.fontScale&&p.fontScale!==1)r.style.fontSize=(p.fontScale*100)+"%";}catch(e){}})();`;
