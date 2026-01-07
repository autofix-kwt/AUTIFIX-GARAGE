// AUTOFIX Garage Booking
// Rules: 08:30–20:00, 30-min slots, Friday closed, break 14:00–16:00

const WA_NUMBER = "96566601793";
const BOOKINGS_API_URL = "https://script.google.com/macros/s/AKfycbwU4U_IJmcvRyzx7Kyj0yxb4kV2tHyCf5wy7PdP5hXkOUG5_F05zGwlNxAen1p_RgM/exec";
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

const bookedCache = new Map();
const bookedFetches = new Map();

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
    allPast: "انتهت مواعيد اليوم. اختر تاريخًا آخر.",
    bio: [
      "🔧 Auto Fix Garage",
      "🚗 سيارتك بأيد أمينة",
      "📍 فحص كمبيوتر | تصفية عامة | ميكانيك | تكييف",
      "⚡️ جودة وسرعة بنفس المكان",
      "🇰🇼 ادارة كويتية"
    ]
  },
  en: {
    subTitle: "Online Booking",
    svcHeader: "Choose a Service",
    svcSub: "Tap to select a service",
    bookTitle: "Book an Appointment",
    hint: "Closed Friday • Break 2–4 PM • 8:30 AM–8:00 PM",
    lblFirst: "First name",
    lblLast: "Last name",
    firstPh: "e.g. Mohammed",
    lastPh: "e.g. Ahmed",
    lblPhone: "Phone",
    phoneHelp: "Choose country, then enter your number (without +code).",
    lblService: "Service",
    lblDate: "Date",
    lblNotes: "Notes (optional)",
    notesPh: "Describe the issue or request",
    bookBtn: "Book via WhatsApp",
    maps: "Directions",
    morning: "Morning",
    afternoon: "Afternoon",
    pickDate: "Pick a date to see available slots.",
    closedFriday: "Closed (Friday). Please choose another day.",
    noSlots: "No available slots for this day.",
    missing: "Please fill: First name, Last name, Phone, Date, and Time.",
    allPast: "All remaining times today are past. Please choose another date.",
    bio: [
      "🔧 Auto Fix Garage",
      "🚗 Your car is in safe hands",
      "📍 Diagnostics | General service | Mechanical | AC",
      "⚡ Quality + speed in one place",
      "🇰🇼 Kuwaiti management"
    ]
  }
};

function saveLang(v){ try{ localStorage.setItem("autofix_lang", v); }catch(_){ } }
function loadLang(){ try{ return localStorage.getItem("autofix_lang") || ""; }catch(_){ return ""; } }

function setLang(newLang){
  lang = newLang;
  const t = TEXT[lang];

  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === "ar") ? "rtl" : "ltr";

  $("subTitle").textContent = t.subTitle;
  $("svcHeader").textContent = t.svcHeader;
  $("svcSub").textContent = t.svcSub;
  $("bookTitle").textContent = t.bookTitle;
  $("hintText").textContent = t.hint;

  $("lblFirst").textContent = t.lblFirst;
  $("lblLast").textContent = t.lblLast;
  $("firstName").placeholder = t.firstPh;
  $("lastName").placeholder = t.lastPh;

  $("lblPhone").textContent = t.lblPhone;
  $("phoneHelp").textContent = t.phoneHelp;

  $("lblService").textContent = t.lblService;
  $("lblDate").textContent = t.lblDate;

  $("lblNotes").textContent = t.lblNotes;
  $("notes").placeholder = t.notesPh;

  $("bookBtnText").textContent = t.bookBtn;
  $("mapsText").textContent = t.maps;

  // Bio lines
  $("bioTitle").textContent = t.bio[0];
  $("bioLine1").textContent = t.bio[1];
  $("bioLine2").textContent = t.bio[2];
  $("bioLine3").textContent = t.bio[3];
  $("bioLine4").textContent = t.bio[4];

  // service cards
  document.querySelectorAll(".svc").forEach(btn=>{
    btn.textContent = (lang === "ar") ? btn.dataset.ar : btn.dataset.en;
  });

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

function parseTimeToMinutes(timeStr){
  if(!timeStr) return null;
  const raw = String(timeStr).trim();
  const match = raw.match(/(\d{1,2}):(\d{2})/);
  if(!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const ampmMatch = raw.match(/\b([AP]M)\b/i);
  const arMatch = raw.match(/[صم]/);
  const ampm = ampmMatch ? ampmMatch[1].toUpperCase() : "";
  if(ampm){
    if(hours === 12) hours = 0;
    if(ampm === "PM") hours += 12;
  }else if(arMatch){
    const marker = arMatch[0];
    if(hours === 12) hours = 0;
    if(marker === "م") hours += 12;
  }
  return hours * 60 + minutes;
}

function normalizeDateString(value){
  if(!value) return "";
  const text = String(value).trim();
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if(isoMatch) return isoMatch[1];
  const dmyMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if(dmyMatch){
    const day = String(dmyMatch[1]).padStart(2, "0");
    const month = String(dmyMatch[2]).padStart(2, "0");
    let year = dmyMatch[3];
    if(year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  return "";
}

function extractBookingDate(entry){
  if(!entry) return "";
  if(typeof entry === "object"){
    const dateField = entry.date || entry.Date || entry.bookingDate || entry.day;
    const normalized = normalizeDateString(dateField);
    if(normalized) return normalized;
  }
  const text = String(entry);
  return normalizeDateString(text);
}

function extractBookingTime(entry){
  if(!entry) return "";
  if(typeof entry === "object"){
    return entry.time || entry.Time || entry.slot || entry.hour || entry.bookingTime || "";
  }
  const text = String(entry);
  const match = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?|\d{1,2}:\d{2}\s*[صم])/i);
  return match ? match[1] : "";
}

async function loadBookedSlots(dateStr){
  if(bookedCache.has(dateStr)) return bookedCache.get(dateStr);
  if(bookedFetches.has(dateStr)) return bookedFetches.get(dateStr);

  const promise = (async ()=>{
    const url = new URL(BOOKINGS_API_URL);
    url.searchParams.set("date", dateStr);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if(!res.ok) throw new Error(`Bookings fetch failed: ${res.status}`);
    let data;
    try{
      data = await res.json();
    }catch(_){
      const text = await res.text();
      try{
        data = JSON.parse(text);
      }catch(err){
        throw err;
      }
    }
    const entries = Array.isArray(data)
      ? data
      : (data && (data.bookings || data.data || data.rows || data.result)) || [];

    const booked = new Set();
    for(const entry of entries){
      const entryDate = extractBookingDate(entry) || dateStr;
      if(entryDate !== dateStr) continue;
      const timeStr = extractBookingTime(entry);
      const mins = parseTimeToMinutes(timeStr);
      if(mins !== null) booked.add(mins);
    }
    return booked;
  })();

  bookedFetches.set(dateStr, promise);
  try{
    const booked = await promise;
    bookedCache.set(dateStr, booked);
    return booked;
  }finally{
    bookedFetches.delete(dateStr);
  }
}

function ensureBookedSlots(dateStr){
  if(!dateStr) return;
  loadBookedSlots(dateStr)
    .then(()=>{
      if($("date").value === dateStr) renderSlots();
    })
    .catch(()=>{
      if(!bookedCache.has(dateStr)) bookedCache.set(dateStr, new Set());
    });
}

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
    flag.textContent = c.flag;
    flag.style.fontSize = "18px";

    const nameWrap = document.createElement("div");
    const nm = document.createElement("div");
    nm.textContent = (lang === "ar") ? c.name_ar : c.name_en;

    const sub = document.createElement("div");
    sub.className = "countrySub";
    sub.textContent = c.dial;

    nameWrap.appendChild(nm);
    nameWrap.appendChild(sub);

    left.appendChild(flag);
    left.appendChild(nameWrap);

    const right = document.createElement("div");
    right.textContent = c.dial;

    item.appendChild(left);
    item.appendChild(right);

    item.addEventListener("click", ()=>{
      selectedCountry = c;
      $("countryList").hidden = true;
      $("countryBtn").setAttribute("aria-expanded","false");
      renderCountryList();
    });

    list.appendChild(item);
  }
}

/* Services grid */
function wireServices(){
  const grid = $("servicesGrid");
  grid.querySelectorAll(".svc").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      grid.querySelectorAll(".svc").forEach(b=>b.classList.remove("selected"));
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

  ensureBookedSlots(dateStr);
  const bookedSet = bookedCache.get(dateStr) || new Set();

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

    if(bookedSet.has(m)) continue;

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
      const lab = document.createElement("div");
      lab.className = "slotLabel";
      lab.textContent = t.afternoon;
      slotsEl.appendChild(lab);
      insertedAfternoon = true;
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot";
    btn.textContent = minutesTo12h(s.m);
    btn.dataset.minutes = String(s.m);

    if(s.past) btn.disabled = true;
    if(nextIndex === idx && !s.past) btn.classList.add("next");

    btn.addEventListener("click", ()=>{
      slotsEl.querySelectorAll(".slot").forEach(b=>b.classList.remove("on"));
      btn.classList.add("on");
    });

    slotsEl.appendChild(btn);
  });

  if(isToday && nextIndex === -1){
    msgEl.textContent = t.allPast;
  }
}

/* WhatsApp booking */
function buildWhatsAppMessage(){
  const t = TEXT[lang];
  const first = $("firstName").value.trim();
  const last  = $("lastName").value.trim();
  const phoneDigits = sanitizeDigits($("phone").value.trim());
  const service = $("service").value;
  const date = $("date").value;
  const slotBtn = document.querySelector(".slot.on");

  if(!first || !last || !phoneDigits || !date || !slotBtn){
    return { ok:false, text:t.missing };
  }

  const fullName = `${first} ${last}`;
  const customerPhone = `${selectedCountry.dial}${phoneDigits}`;
  const timeText = slotBtn.textContent;
  const notes = $("notes").value.trim() || "-";

  if(lang === "ar"){
    return {
      ok:true,
      text:
`طلب حجز - AUTOFIX
الاسم: ${fullName}
الهاتف: ${customerPhone}
الخدمة: ${service}
التاريخ: ${date}
الوقت: ${timeText}
ملاحظات: ${notes}`
    };
  }

  return {
    ok:true,
    text:
`AUTOFIX booking request
Name: ${fullName}
Phone: ${customerPhone}
Service: ${service}
Date: ${date}
Time: ${timeText}
Notes: ${notes}`
  };
}

function openWhatsApp(){
  const res = buildWhatsAppMessage();
  if(!res.ok){
    $("slotMsg").textContent = res.text;
    return;
  }
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(res.text)}`;
  window.open(url, "_blank");
}

/* Init */
function init(){
  // date min = today
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth()+1).padStart(2,"0");
  const dd = String(now.getDate()).padStart(2,"0");
  $("date").min = `${yyyy}-${mm}-${dd}`;

  // country dropdown
  $("countryBtn").addEventListener("click", toggleCountryList);
  document.addEventListener("click", (e)=>{
    const list = $("countryList");
    if(list.hidden) return;
    if($("countryBtn").contains(e.target) || list.contains(e.target)) return;
    list.hidden = true;
    $("countryBtn").setAttribute("aria-expanded","false");
  });

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

init();
