// AUTOFIX Garage Booking
// Rules: 08:30–20:00, 30-min slots, Friday closed, break 14:00–16:00

const WA_NUMBER = "96566601793";
const MAPS_URL = "https://maps.app.goo.gl/WVvV9BRBxZCMdZdY7";

const OPEN_MIN = 8 * 60 + 30;   // 08:30
const CLOSE_MIN = 20 * 60;      // 20:00
const SLOT_MIN = 30;

// Break 14:00–16:00
const BREAKS = [{ start: 14 * 60, end: 16 * 60 }];

// GCC list with flags + codes
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

const TEXT = {
  ar: {
    subTitle: "حجز مواعيد أونلاين",
    svcHeader: "اختر الخدمة",
    svcSub: "اضغط لاختيار الخدمة",
    bookTitle: "حجز موعد",
    hint: "مغلق الجمعة • استراحة ٢–٤ م • كل ٣٠ دقيقة • ٨:٣٠ص–٨:٠٠م",
    lblName: "الاسم",
    namePh: "اكتب اسمك",
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
    missing: "يرجى تعبئة: الاسم، الهاتف، التاريخ، والوقت."
  },
  en: {
    subTitle: "Online Booking",
    svcHeader: "Choose a Service",
    svcSub: "Tap to select a service",
    bookTitle: "Book an Appointment",
    hint: "Closed Friday • Break 2–4 PM • Every 30 minutes • 8:30 AM–8:00 PM",
    lblName: "Name",
    namePh: "Your name",
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
    missing: "Please fill: Name, Phone, Date, and Time."
  }
};

function saveLang(v){
  try{ localStorage.setItem("autofix_lang", v); }catch(_){}
}
function loadLang(){
  try{ return localStorage.getItem("autofix_lang") || ""; }catch(_){ return ""; }
}

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

  $("lblName").textContent = t.lblName;
  $("name").placeholder = t.namePh;

  $("lblPhone").textContent = t.lblPhone;
  $("phoneHelp").textContent = t.phoneHelp;

  $("lblService").textContent = t.lblService;
  $("lblDate").textContent = t.lblDate;

  $("lblNotes").textContent = t.lblNotes;
  $("notes").placeholder = t.notesPh;

  $("bookBtnText").textContent = t.bookBtn;
  $("mapsText").textContent = t.maps;

  // Update service card text based on lang
  document.querySelectorAll(".svc").forEach(btn=>{
    btn.textContent = (lang === "ar") ? btn.dataset.ar : btn.dataset.en;
  });

  // Button label toggles
  $("langBtn").textContent = (lang === "ar") ? "EN" : "AR";

  renderCountryList();
  renderSlots();
  saveLang(lang);
}

/* 12-hour time format */
function minutesTo12h(mins){
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if(h === 0) h = 12;
  return `${h}:${String(m).padStart(2,"0")} ${ampm}`;
}

function sanitizeDigits(s){
  return (s || "").replace(/[^\d]/g, "");
}

function isOverlap(aStart, aEnd, bStart, bEnd){
  return aStart < bEnd && bStart < aEnd;
}

function isFriday(dateStr){
  if(!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() === 5;
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

/* Services grid -> dropdown + selected style */
function wireServices(){
  const grid = $("servicesGrid");
  grid.querySelectorAll(".svc").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      // select
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

/* Render slots + morning/afternoon labels + next slot highlight */
function renderSlots(){
  const t = TEXT[lang];
  const dateStr = $("date").value;
  const slotsEl = $("slots");
  const msgEl = $("slotMsg");
  slotsEl.innerHTML = "";
  msgEl.textContent = "";

  if(!dateStr){
    msgEl.textContent = t.pickDate;
    return;
  }

  if(isFriday(dateStr)){
    msgEl.textContent = t.closedFriday;
    return;
  }

  const selectedDate = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const isToday =
    selectedDate.getFullYear() === now.getFullYear() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getDate() === now.getDate();

  const nowMinutes = now.getHours()*60 + now.getMinutes();

  // Build available slot list (skip breaks)
  const candidates = [];
  for(let m = OPEN_MIN; m < CLOSE_MIN; m += SLOT_MIN){
    const end = m + SLOT_MIN;

    let blocked = false;
    for(const br of BREAKS){
      if(isOverlap(m, end, br.start, br.end)){ blocked = true; break; }
    }
    if(blocked) continue;

    // If today, mark past slots as disabled
    const past = isToday && (m < nowMinutes);
    candidates.push({ m, past });
  }

  if(!candidates.length){
    msgEl.textContent = t.noSlots;
    return;
  }

  // Find next available slot index
  let nextIndex = 0;
  if(isToday){
    nextIndex = candidates.findIndex(s => !s.past);
    if(nextIndex < 0) nextIndex = -1;
  }

  // Insert Morning label, then Afternoon label when time crosses 12:00
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

    if(s.past){
      btn.disabled = true;
    }

    // highlight next slot
    if(nextIndex === idx && !s.past){
      btn.classList.add("next");
    }

    btn.addEventListener("click", ()=>{
      slotsEl.querySelectorAll(".slot").forEach(b=>b.classList.remove("on"));
      btn.classList.add("on");
    });

    slotsEl.appendChild(btn);
  });

  // If all slots are past today
  if(isToday && nextIndex === -1){
    msgEl.textContent = (lang === "ar")
      ? "انتهت مواعيد اليوم. اختر تاريخًا آخر."
      : "Today is fully booked/past. Please choose another date.";
  }
}

/* WhatsApp booking */
function buildWhatsAppMessage(){
  const t = TEXT[lang];
  const name = $("name").value.trim();
  const phoneDigits = sanitizeDigits($("phone").value.trim());
  const service = $("service").value;
  const date = $("date").value;
  const slotBtn = document.querySelector(".slot.on");

  if(!name || !phoneDigits || !date || !slotBtn){
    return { ok:false, text:t.missing };
  }

  const customerPhone = `${selectedCountry.dial}${phoneDigits}`;
  const timeText = slotBtn.textContent;
  const notes = $("notes").value.trim();

  if(lang === "ar"){
    const msg =
`طلب حجز - AUTOFIX
الاسم: ${name}
الهاتف: ${customerPhone}
الخدمة: ${service}
التاريخ: ${date}
الوقت: ${timeText}
ملاحظات: ${notes || "-"}`;
    return { ok:true, text: msg };
  } else {
    const msg =
`AUTOFIX booking request
Name: ${name}
Phone: ${customerPhone}
Service: ${service}
Date: ${date}
Time: ${timeText}
Notes: ${notes || "-"}`;
    return { ok:true, text: msg };
  }
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

  // Maps link
  $("mapsLink")?.setAttribute("href", MAPS_URL);

  // Country dropdown wiring
  $("countryBtn").addEventListener("click", toggleCountryList);
  document.addEventListener("click", (e)=>{
    const list = $("countryList");
    if(list.hidden) return;
    if($("countryBtn").contains(e.target) || list.contains(e.target)) return;
    list.hidden = true;
    $("countryBtn").setAttribute("aria-expanded","false");
  });

  // Buttons
  $("date").addEventListener("change", renderSlots);
  $("bookBtn").addEventListener("click", openWhatsApp);

  // Language button
  $("langBtn").addEventListener("click", ()=>{
    setLang(lang === "ar" ? "en" : "ar");
  });

  // Services
  wireServices();

  // Load saved language or default to Arabic
  const saved = loadLang();
  if(saved === "en" || saved === "ar"){
    setLang(saved);
  } else {
    setLang("ar");
  }

  // default country: Kuwait
  selectedCountry = GCC[0];
  renderCountryList();

  // initial slots message
  renderSlots();
}

init();