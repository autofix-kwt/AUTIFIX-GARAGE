diff --git a/app.js b/app.js
index 7381b80239e01ccdc578d3291128cf1cf037c55e..61865d8d7499537e8ce1e4366f04cab4fb4efa05 100644
--- a/app.js
+++ b/app.js
@@ -1,48 +1,52 @@
 // AUTOFIX Garage Booking
 // Rules: 08:30–20:00, 30-min slots, Friday closed, break 14:00–16:00
 
 const WA_NUMBER = "96566601793";
+const BOOKINGS_API_URL = "https://script.google.com/macros/s/AKfycbwU4U_IJmcvRyzx7Kyj0yxb4kV2tHyCf5wy7PdP5hXkOUG5_F05zGwlNxAen1p_RgM/exec";
 const OPEN_MIN = 8 * 60 + 30;   // 08:30
 const CLOSE_MIN = 20 * 60;      // 20:00
 const SLOT_MIN = 30;
 const BREAKS = [{ start: 14 * 60, end: 16 * 60 }];
 
 const GCC = [
   { key:"KW", name_en:"Kuwait",  name_ar:"الكويت",   flag:"🇰🇼", dial:"+965", example:"66601793" },
   { key:"SA", name_en:"Saudi",   name_ar:"السعودية", flag:"🇸🇦", dial:"+966", example:"5XXXXXXXX" },
   { key:"AE", name_en:"UAE",     name_ar:"الإمارات", flag:"🇦🇪", dial:"+971", example:"5XXXXXXXX" },
   { key:"QA", name_en:"Qatar",   name_ar:"قطر",      flag:"🇶🇦", dial:"+974", example:"3XXXXXXX" },
   { key:"BH", name_en:"Bahrain", name_ar:"البحرين",  flag:"🇧🇭", dial:"+973", example:"3XXXXXXX" },
   { key:"OM", name_en:"Oman",    name_ar:"عُمان",    flag:"🇴🇲", dial:"+968", example:"9XXXXXXX" }
 ];
 
 let lang = "ar";
 let selectedCountry = GCC[0];
 
 const $ = (id) => document.getElementById(id);
 
+const bookedCache = new Map();
+const bookedFetches = new Map();
+
 const TEXT = {
   ar: {
     subTitle: "حجز مواعيد أونلاين",
     svcHeader: "اختر الخدمة",
     svcSub: "اضغط لاختيار الخدمة",
     bookTitle: "حجز موعد",
     hint: "مغلق الجمعة • استراحة ٢–٤ م • ٨:٣٠ص–٨:٠٠م",
     lblFirst: "الاسم الأول",
     lblLast: "الاسم الأخير",
     firstPh: "مثال: محمد",
     lastPh: "مثال: أحمد",
     lblPhone: "رقم الهاتف",
     phoneHelp: "اختر الدولة ثم اكتب الرقم بدون رمز الدولة.",
     lblService: "الخدمة",
     lblDate: "التاريخ",
     lblNotes: "ملاحظات (اختياري)",
     notesPh: "اكتب المشكلة أو المطلوب",
     bookBtn: "احجز عبر واتساب",
     maps: "الموقع",
     morning: "صباح",
     afternoon: "بعد الظهر",
     pickDate: "اختر تاريخًا لعرض الأوقات المتاحة.",
     closedFriday: "مغلق يوم الجمعة. اختر يومًا آخر.",
     noSlots: "لا توجد أوقات متاحة لهذا اليوم.",
     missing: "يرجى تعبئة: الاسم الأول، الاسم الأخير، الهاتف، التاريخ، والوقت.",
@@ -138,50 +142,130 @@ function setLang(newLang){
   $("langBtn").textContent = (lang === "ar") ? "EN" : "AR";
 
   renderCountryList();
   renderSlots();
   saveLang(lang);
 }
 
 /* time: 12-hour AM/PM */
 function minutesTo12h(mins){
   let h = Math.floor(mins / 60);
   const m = mins % 60;
   const ampm = h >= 12 ? "PM" : "AM";
   h = h % 12;
   if(h === 0) h = 12;
   return `${h}:${String(m).padStart(2,"0")} ${ampm}`;
 }
 
 function sanitizeDigits(s){ return (s || "").replace(/[^\d]/g, ""); }
 function isOverlap(aStart, aEnd, bStart, bEnd){ return aStart < bEnd && bStart < aEnd; }
 function isFriday(dateStr){
   if(!dateStr) return false;
   const d = new Date(dateStr + "T00:00:00");
   return d.getDay() === 5;
 }
 
+function parseTimeToMinutes(timeStr){
+  if(!timeStr) return null;
+  const match = String(timeStr).trim().match(/(\d{1,2}):(\d{2})(?:\s*([AP]M))?/i);
+  if(!match) return null;
+  let hours = Number(match[1]);
+  const minutes = Number(match[2]);
+  const ampm = match[3] ? match[3].toUpperCase() : "";
+  if(ampm){
+    if(hours === 12) hours = 0;
+    if(ampm === "PM") hours += 12;
+  }
+  return hours * 60 + minutes;
+}
+
+function extractBookingDate(entry){
+  if(!entry) return "";
+  if(typeof entry === "object"){
+    const dateField = entry.date || entry.Date || entry.bookingDate || entry.day;
+    if(dateField) return String(dateField).slice(0, 10);
+  }
+  const text = String(entry);
+  const match = text.match(/(\d{4}-\d{2}-\d{2})/);
+  return match ? match[1] : "";
+}
+
+function extractBookingTime(entry){
+  if(!entry) return "";
+  if(typeof entry === "object"){
+    return entry.time || entry.Time || entry.slot || entry.hour || "";
+  }
+  const text = String(entry);
+  const match = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
+  return match ? match[1] : text;
+}
+
+async function loadBookedSlots(dateStr){
+  if(bookedCache.has(dateStr)) return bookedCache.get(dateStr);
+  if(bookedFetches.has(dateStr)) return bookedFetches.get(dateStr);
+
+  const promise = (async ()=>{
+    const url = new URL(BOOKINGS_API_URL);
+    url.searchParams.set("date", dateStr);
+    const res = await fetch(url.toString(), { cache: "no-store" });
+    const data = await res.json();
+    const entries = Array.isArray(data)
+      ? data
+      : (data && (data.bookings || data.data || data.rows)) || [];
+
+    const booked = new Set();
+    for(const entry of entries){
+      const entryDate = extractBookingDate(entry) || dateStr;
+      if(entryDate !== dateStr) continue;
+      const timeStr = extractBookingTime(entry);
+      const mins = parseTimeToMinutes(timeStr);
+      if(mins !== null) booked.add(mins);
+    }
+    return booked;
+  })();
+
+  bookedFetches.set(dateStr, promise);
+  try{
+    const booked = await promise;
+    bookedCache.set(dateStr, booked);
+    return booked;
+  }finally{
+    bookedFetches.delete(dateStr);
+  }
+}
+
+function ensureBookedSlots(dateStr){
+  if(!dateStr) return;
+  loadBookedSlots(dateStr)
+    .then(()=>{
+      if($("date").value === dateStr) renderSlots();
+    })
+    .catch(()=>{
+      if(!bookedCache.has(dateStr)) bookedCache.set(dateStr, new Set());
+    });
+}
+
 /* Country selector */
 function toggleCountryList(){
   const list = $("countryList");
   const open = list.hidden;
   list.hidden = !open;
   $("countryBtn").setAttribute("aria-expanded", open ? "true" : "false");
 }
 
 function renderCountryList(){
   $("countryFlag").textContent = selectedCountry.flag;
   $("countryCode").textContent = selectedCountry.dial;
   $("phone").placeholder = selectedCountry.example;
 
   const list = $("countryList");
   list.innerHTML = "";
 
   for(const c of GCC){
     const item = document.createElement("button");
     item.type = "button";
     item.className = "countryItem";
 
     const left = document.createElement("div");
     left.className = "countryLeft";
 
     const flag = document.createElement("div");
@@ -228,69 +312,74 @@ function wireServices(){
       btn.classList.add("selected");
       $("service").value = btn.dataset.svc;
     });
   });
 
   $("service").addEventListener("change", ()=>{
     const v = $("service").value;
     grid.querySelectorAll(".svc").forEach(b=>{
       b.classList.toggle("selected", b.dataset.svc === v);
     });
   });
 }
 
 /* Slots: morning/afternoon labels + next slot highlight */
 function renderSlots(){
   const t = TEXT[lang];
   const dateStr = $("date").value;
   const slotsEl = $("slots");
   const msgEl = $("slotMsg");
   slotsEl.innerHTML = "";
   msgEl.textContent = "";
 
   if(!dateStr){ msgEl.textContent = t.pickDate; return; }
   if(isFriday(dateStr)){ msgEl.textContent = t.closedFriday; return; }
 
+  ensureBookedSlots(dateStr);
+  const bookedSet = bookedCache.get(dateStr) || new Set();
+
   const selectedDate = new Date(dateStr + "T00:00:00");
   const now = new Date();
   const isToday =
     selectedDate.getFullYear() === now.getFullYear() &&
     selectedDate.getMonth() === now.getMonth() &&
     selectedDate.getDate() === now.getDate();
 
   const nowMinutes = now.getHours()*60 + now.getMinutes();
 
   const candidates = [];
   for(let m = OPEN_MIN; m < CLOSE_MIN; m += SLOT_MIN){
     const end = m + SLOT_MIN;
 
     let blocked = false;
     for(const br of BREAKS){
       if(isOverlap(m, end, br.start, br.end)){ blocked = true; break; }
     }
     if(blocked) continue;
 
+    if(bookedSet.has(m)) continue;
+
     const past = isToday && (m < nowMinutes);
     candidates.push({ m, past });
   }
 
   if(!candidates.length){ msgEl.textContent = t.noSlots; return; }
 
   let nextIndex = 0;
   if(isToday){
     nextIndex = candidates.findIndex(s => !s.past);
     if(nextIndex < 0) nextIndex = -1;
   }
 
   let insertedMorning = false;
   let insertedAfternoon = false;
 
   candidates.forEach((s, idx)=>{
     if(!insertedMorning){
       const lab = document.createElement("div");
       lab.className = "slotLabel";
       lab.textContent = t.morning;
       slotsEl.appendChild(lab);
       insertedMorning = true;
     }
 
     if(!insertedAfternoon && s.m >= 12*60){
@@ -400,26 +489,26 @@ function init(){
 
   // slots + book
   $("date").addEventListener("change", renderSlots);
   $("bookBtn").addEventListener("click", openWhatsApp);
 
   // language
   $("langBtn").addEventListener("click", ()=>{
     setLang(lang === "ar" ? "en" : "ar");
   });
 
   // services
   wireServices();
 
   // load lang
   const saved = loadLang();
   if(saved === "en" || saved === "ar") setLang(saved);
   else setLang("ar");
 
   // default country Kuwait
   selectedCountry = GCC[0];
   renderCountryList();
 
   renderSlots();
 }
 
-init();
\ No newline at end of file
+init();
