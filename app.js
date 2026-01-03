// AUTOFIX Garage Booking (WhatsApp-only, FREE)
// Rules: 30 min slots, Friday closed, break 14:00-16:00
// Working hours: 08:30-20:00

const GARAGE_WA_NUMBER = "96566601793";

// Your socials
const INSTAGRAM_URL = "https://instagram.com/autofix.kwt";
const TIKTOK_URL = "https://tiktok.com/@autofix.kwt";

// Directions: set this once (use your exact Google Maps place link OR an address text)
// Examples:
// const MAPS_QUERY = "AUTOFIX Garage Shuwaikh Kuwait";
// OR paste a full maps URL:
// const MAPS_URL = "https://maps.app.goo.gl/XXXXX";
const MAPS_QUERY = "AUTOFIX Garage Kuwait";   // <-- change to your real location text
const MAPS_URL = "https://maps.app.goo.gl/JzKtjV9yoJ1YqbbQ9";                          // optional: paste full URL, leave "" to use query

const OPEN = "08:30";
const CLOSE = "20:00";
const BREAKS = [{ start: "14:00", end: "16:00" }];
const SLOT_MIN = 30;

const GCC = [
  { key:"KW", name_en:"Kuwait",   name_ar:"الكويت",   flag:"🇰🇼", dial:"+965", example:"66601793" },
  { key:"SA", name_en:"Saudi",    name_ar:"السعودية", flag:"🇸🇦", dial:"+966", example:"5XXXXXXXX" },
  { key:"AE", name_en:"UAE",      name_ar:"الإمارات", flag:"🇦🇪", dial:"+971", example:"5XXXXXXXX" },
  { key:"QA", name_en:"Qatar",    name_ar:"قطر",      flag:"🇶🇦", dial:"+974", example:"3XXXXXXX" },
  { key:"BH", name_en:"Bahrain",  name_ar:"البحرين",  flag:"🇧🇭", dial:"+973", example:"3XXXXXXX" },
  { key:"OM", name_en:"Oman",     name_ar:"عُمان",    flag:"🇴🇲", dial:"+968", example:"9XXXXXXX" }
];

let lang = "en";
let selectedTime = null;
let selectedCountry = GCC[0];

const $ = (id) => document.getElementById(id);

const T = {
  en: {
    brandSub: "Online Booking",
    h1: "Book an Appointment",
    hint: "Fridays are closed. Daily break: 2:00 PM – 4:00 PM. Slots every 30 minutes. Working hours: 8:30 AM – 8:00 PM.",
    name: "Name",
    phone: "Phone",
    phoneHelp: "Choose country, then enter your number (without +code).",
    service: "Service",
    date: "Date",
    time: "Time Slot",
    car: "Car (optional)",
    plate: "Plate (optional)",
    notes: "Notes (optional)",
    preview: "Preview",
    bookWA: "Book via WhatsApp",
    sumTitle: "Booking Summary",
    closedFriday: "Closed (Friday). Please choose another day.",
    pickDate: "Pick a date to see available slots.",
    missing: "Please fill: Name, Phone, Date, and Time Slot.",
    waLabel: "WhatsApp: +965 66601793",
    footNote: "Add to Home Screen for app-like use.",
    dir: "Directions",
    services: {
      Diagnostics: "Diagnostics",
      Maintenance: "Maintenance",
      AC: "AC",
      Electrical: "Electrical",
      Brakes: "Brakes",
      Tires: "Tires",
      Other: "Other"
    }
  },
  ar: {
    brandSub: "حجز المواعيد",
    h1: "حجز موعد",
    hint: "مغلق يوم الجمعة. استراحة يومية: ٢:٠٠م – ٤:٠٠م. المواعيد كل ٣٠ دقيقة. ساعات العمل: ٨:٣٠ص – ٨:٠٠م.",
    name: "الاسم",
    phone: "رقم الهاتف",
    phoneHelp: "اختر الدولة ثم اكتب الرقم بدون رمز الدولة.",
    service: "الخدمة",
    date: "التاريخ",
    time: "الوقت",
    car: "السيارة (اختياري)",
    plate: "رقم اللوحة (اختياري)",
    notes: "ملاحظات (اختياري)",
    preview: "معاينة",
    bookWA: "احجز عبر واتساب",
    sumTitle: "ملخص الحجز",
    closedFriday: "مغلق (الجمعة). اختر يومًا آخر.",
    pickDate: "اختر تاريخًا لعرض الأوقات المتاحة.",
    missing: "رجاءً أدخل: الاسم، رقم الهاتف، التاريخ، ووقت الموعد.",
    waLabel: "واتساب: ‎+965 66601793",
    footNote: "أضف إلى الشاشة الرئيسية لاستخدامه كأنه تطبيق.",
    dir: "الموقع",
    services: {
      Diagnostics: "فحص وتشخيص",
      Maintenance: "صيانة",
      AC: "تكييف",
      Electrical: "كهرباء",
      Brakes: "فرامل",
      Tires: "إطارات",
      Other: "أخرى"
    }
  }
};

function saveLangPreference(){
  try{ localStorage.setItem("autofix_lang", lang); }catch(_){}
}
function loadLangPreference(){
  try{ return localStorage.getItem("autofix_lang") || ""; }catch(_){ return ""; }
}

function setLang(newLang){
  lang = newLang;
  document.documentElement.lang = lang;
  document.body.classList.toggle("rtl", lang === "ar");
  $("langBtn").textContent = (lang === "en") ? "AR" : "EN";

  $("brandSub").textContent = T[lang].brandSub;
  $("h1").textContent = T[lang].h1;
  $("hint").textContent = T[lang].hint;

  $("lblName").textContent = T[lang].name;
  $("lblPhone").textContent = T[lang].phone;
  $("phoneHelp").textContent = T[lang].phoneHelp;
  $("lblService").textContent = T[lang].service;
  $("lblDate").textContent = T[lang].date;
  $("lblTime").textContent = T[lang].time;
  $("lblCar").textContent = T[lang].car;
  $("lblPlate").textContent = T[lang].plate;
  $("lblNotes").textContent = T[lang].notes;

  $("previewBtn").textContent = T[lang].preview;
  $("waBtn").textContent = T[lang].bookWA;
  $("sumTitle").textContent = T[lang].sumTitle;

  $("directWa").textContent = T[lang].waLabel;
  $("footNote").textContent = T[lang].footNote;
  $("dirText").textContent = T[lang].dir;

  const sel = $("service");
  [...sel.options].forEach(o => { o.textContent = T[lang].services[o.value] || o.value; });

  renderCountryUI();
  renderSlots();
  saveLangPreference();
}

function toMinutes(hhmm){
  const [h,m] = hhmm.split(":").map(Number);
  return h*60 + m;
}
function fromMinutes(min){
  const h = Math.floor(min/60);
  const m = min%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}
function isOverlap(aStart, aEnd, bStart, bEnd){
  return aStart < bEnd && bStart < aEnd;
}
function isFriday(dateStr){
  if(!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() === 5;
}
function formatTime(hhmm){
  if(lang === "ar") return hhmm;
  const [hStr,mStr] = hhmm.split(":");
  let h = Number(hStr);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12; if(h === 0) h = 12;
  return `${h}:${mStr} ${ampm}`;
}

/* Country selector */
function renderCountryUI(){
  $("countryFlag").textContent = selectedCountry.flag;
  $("countryCode").textContent = selectedCountry.dial;
  $("phone").placeholder = selectedCountry.example;

  const list = $("countryList");
  list.innerHTML = "";

  for(const c of GCC){
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "countryItem";
    btn.setAttribute("role","option");

    const left = document.createElement("div");
    left.className = "countryLeft";

    const flag = document.createElement("div");
    flag.textContent = c.flag;
    flag.style.fontSize = "18px";

    const nameWrap = document.createElement("div");
    const name = document.createElement("div");
    name.textContent = (lang === "ar") ? c.name_ar : c.name_en;
    name.style.fontWeight = "900";

    const sub = document.createElement("div");
    sub.className = "countrySub";
    sub.textContent = c.dial;

    nameWrap.appendChild(name);
    nameWrap.appendChild(sub);

    left.appendChild(flag);
    left.appendChild(nameWrap);

    const right = document.createElement("div");
    right.textContent = c.dial;

    btn.appendChild(left);
    btn.appendChild(right);

    btn.addEventListener("click", () => {
      selectedCountry = c;
      $("countryList").hidden = true;
      $("countryBtn").setAttribute("aria-expanded","false");
      renderCountryUI();

      // If user hasn't chosen language explicitly, auto-pick based on country
      const saved = loadLangPreference();
      if(!saved){
        if(selectedCountry.key === "KW") setLang("ar");
        else setLang("en");
      }
    });

    list.appendChild(btn);
  }
}
function toggleCountryList(){
  const list = $("countryList");
  const open = list.hidden;
  list.hidden = !open;
  $("countryBtn").setAttribute("aria-expanded", open ? "true" : "false");
}

/* Slots */
function renderSlots(){
  const dateStr = $("date").value;
  const slotsEl = $("slots");
  const msgEl = $("slotMsg");
  slotsEl.innerHTML = "";
  selectedTime = null;

  if(!dateStr){
    msgEl.textContent = T[lang].pickDate;
    return;
  }
  if(isFriday(dateStr)){
    msgEl.textContent = T[lang].closedFriday;
    return;
  }

  msgEl.textContent = "";

  const openM = toMinutes(OPEN);
  const closeM = toMinutes(CLOSE);
  const breaks = BREAKS.map(b => ({ s: toMinutes(b.start), e: toMinutes(b.end) }));

  for(let t=openM; t + SLOT_MIN <= closeM; t += SLOT_MIN){
    const end = t + SLOT_MIN;

    let blocked = false;
    for(const br of breaks){
      if(isOverlap(t, end, br.s, br.e)){ blocked = true; break; }
    }
    if(blocked) continue;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot";
    btn.textContent = formatTime(fromMinutes(t));
    btn.setAttribute("aria-pressed","false");

    btn.addEventListener("click", () => {
      [...slotsEl.querySelectorAll(".slot")].forEach(s => s.setAttribute("aria-pressed","false"));
      btn.setAttribute("aria-pressed","true");
      selectedTime = fromMinutes(t);
      msgEl.textContent = "";
      $("summary").hidden = true;
    });

    slotsEl.appendChild(btn);
  }

  if(!slotsEl.children.length){
    msgEl.textContent = (lang === "ar") ? "لا توجد أوقات متاحة لهذا اليوم." : "No available slots for this day.";
  }
}

/* WhatsApp */
function sanitizeDigits(s){
  return (s || "").replace(/[^\d]/g, "");
}

function buildSummary(){
  const name = $("name").value.trim();
  const phoneDigits = sanitizeDigits($("phone").value.trim());
  const service = $("service").value;
  const date = $("date").value;
  const car = $("car").value.trim();
  const plate = $("plate").value.trim();
  const notes = $("notes").value.trim();

  if(!name || !phoneDigits || !date || !selectedTime){
    return { ok:false, text:T[lang].missing };
  }

  const svcLabel = T[lang].services[service] || service;
  const customerPhone = `${selectedCountry.dial}${phoneDigits}`;

  const textEn =
`AUTOFIX Garage booking request
Name: ${name}
Phone: ${customerPhone}
Service: ${svcLabel}
Date/Time: ${date} ${selectedTime}
Car: ${car || "-"}
Plate: ${plate || "-"}
Notes: ${notes || "-"}`;

  const textAr =
`طلب حجز - كراج AUTOFIX
الاسم: ${name}
رقم الهاتف: ${customerPhone}
الخدمة: ${svcLabel}
التاريخ/الوقت: ${date} ${selectedTime}
السيارة: ${car || "-"}
رقم اللوحة: ${plate || "-"}
ملاحظات: ${notes || "-"}`;

  return { ok:true, text: (lang === "ar") ? textAr : textEn };
}

function openWhatsAppWithMessage(messageText){
  const msg = encodeURIComponent(messageText);
  const url = `https://wa.me/${GARAGE_WA_NUMBER}?text=${msg}`;
  window.open(url, "_blank");
}

function openWhatsApp(){
  const sum = buildSummary();
  if(!sum.ok){
    $("slotMsg").textContent = sum.text;
    return;
  }
  openWhatsAppWithMessage(sum.text);
}

function preview(){
  const sum = buildSummary();
  if(!sum.ok){
    $("slotMsg").textContent = sum.text;
    $("summary").hidden = true;
    return;
  }
  $("sumText").textContent = sum.text;
  $("summary").hidden = false;
}

/* Directions */
function buildMapsLink(){
  if(MAPS_URL && MAPS_URL.trim()) return MAPS_URL.trim();
  const q = encodeURIComponent(MAPS_QUERY || "AUTOFIX Garage");
  return `https://www.google.com/maps?q=${q}`;
}

/* Init */
function init(){
  // Date min = today
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth()+1).padStart(2,"0");
  const dd = String(today.getDate()).padStart(2,"0");
  $("date").min = `${yyyy}-${mm}-${dd}`;

  // Direct links
  $("directWa").href = `https://wa.me/${GARAGE_WA_NUMBER}`;
  $("waFloat").href = `https://wa.me/${GARAGE_WA_NUMBER}`;
  $("igLink").href = INSTAGRAM_URL;
  $("ttLink").href = TIKTOK_URL;
  $("mapsLink").href = buildMapsLink();

  // Country dropdown
  $("countryBtn").addEventListener("click", toggleCountryList);
  document.addEventListener("click", (e) => {
    const btn = $("countryBtn");
    const list = $("countryList");
    if(list.hidden) return;
    if(btn.contains(e.target) || list.contains(e.target)) return;
    list.hidden = true;
    btn.setAttribute("aria-expanded","false");
  });

  // Buttons
  $("langBtn").addEventListener("click", () => setLang(lang === "en" ? "ar" : "en"));
  $("date").addEventListener("change", renderSlots);
  $("previewBtn").addEventListener("click", preview);
  $("waBtn").addEventListener("click", openWhatsApp);

  // Floating WA: if booking summary valid, send that; else open blank WA
  $("waFloat").addEventListener("click", (e) => {
    const sum = buildSummary();
    if(sum.ok){
      e.preventDefault();
      openWhatsAppWithMessage(sum.text);
    }
  });

  // Choose initial language:
  // 1) saved preference
  // 2) browser language
  // 3) Kuwait default
  selectedCountry = GCC[0]; // Kuwait default
  renderCountryUI();

  const saved = loadLangPreference();
  if(saved === "ar" || saved === "en"){
    setLang(saved);
  } else {
    const browserLang = (navigator.language || "").toLowerCase();
    if(browserLang.includes("ar")) setLang("ar");
    else setLang(selectedCountry.key === "KW" ? "ar" : "en");
  }

  renderSlots();
}

init();
