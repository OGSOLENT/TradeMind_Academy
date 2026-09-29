export const STORAGE_KEY = "tm.prefs";

export const PREFS_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"{}");var r=document.documentElement;if(p.colorBlindCandles)r.dataset.candles="colorblind";if(p.reducedMotion)r.dataset.motion="reduced";if(p.highContrast)r.dataset.contrast="high";if(p.readableFont)r.dataset.font="readable";if(p.comfortableReading)r.dataset.reading="comfortable";if(p.calmMode)r.dataset.calm="on";if(p.fontScale&&p.fontScale!==1)r.style.fontSize=(p.fontScale*100)+"%";}catch(e){}})();`;
