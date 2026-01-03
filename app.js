// AUTOFIX Garage Booking (WhatsApp-only)
// Rules: 30 min slots, Friday closed, break 14:00-16:00
// Default working hours: 09:00-22:00 (change OPEN/CLOSE if needed)

const WA_NUMBER = "96566601793";
const OPEN = "08:30";
const CLOSE = "20:00";
const BREAKS = [{ start: "14:00", end: "16:00" }];
const SLOT_MIN = 30;

// i18n
let lang = "en";

const T = {
  en: {
    brandSub: "Online Booking",
    h1: "Book an Appointment",
    hint: "Fridays are closed. Daily break: 2:00 PM – 4:00 PM. Slots are every 30 minutes.",
    name: "Name",
    phone: "Phone",
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
    pickTime: "Please select a time slot.",
    missing: "Please fill: Name, Phone, Date, and Time Slot.",
    waLabel: "WhatsApp: +965 66601793",
    footNote: "Add to Home Screen for app-like use.",
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
    hint: "مغلق يوم الجمعة. استراحة يومية: ٢:٠٠م – ٤:٠٠م. المواعيد كل ٣٠ دقيقة.",
    name: "الاسم",
    phone: "رقم الهاتف",
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
    pickTime: "اختر وقت الموعد.",
    missing: "رجاءً أدخل: الاسم، رقم الهاتف، التاريخ، ووقت الموعد.",
    waLabel: "واتساب: ‎+965 66601793",
    footNote: "أضف إلى الشاشة الرئيسية لاستخدامه كأنه تطبيق.",
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

const $ = (id) => document.getElementById(id);

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

  // Update service dropdown labels
  const sel = $("service");
  [...sel.options].forEach(o => {
    o.textContent = T[lang].services[o.value] || o.value;
  });

  renderSlots();
}

function toMinutes(hhmm){
  const [h,m] = hhmm.split(":").map(Number);
  return h*60 + m;
}
function fromMinutes(min){
  const h = Math.floor(min/60);
  const m = min%60;
  const hh = String(h).padStart(2,"0");
  const mm = String(m).padStart(2,"0");
  return `${hh}:${mm}`;
}
function isOverlap(aStart, aEnd, bStart, bEnd){
  return aStart < bEnd && bStart < aEnd;
}

function isFriday(dateStr){
  if(!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  // JS: 0=Sun ... 5=Fri ... 6=Sat
  return d.getDay() === 5;
}

let selectedTime = null;

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

    // Skip if overlaps with any break
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
      // unselect all
      [...slotsEl.querySelectorAll(".slot")].forEach(s => s.setAttribute("aria-pressed","false"));
      btn.setAttribute("aria-pressed","true");
      selectedTime = fromMinutes(t);
      msgEl.textContent = "";
      $("summary").hidden = true;
    });

    slotsEl.appendChild(btn);
  }

  if(!slotsEl.children.length){
    msgEl.textContent = (lang === "ar")
      ? "لا توجد أوقات متاحة لهذا اليوم."
      : "No available slots for this day.";
  }
}

function formatTime(hhmm){
  // Simple 12h for EN, 24h for AR
  if(lang === "ar") return hhmm;
  const [hStr,mStr] = hhmm.split(":");
  let h = Number(hStr);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12; if(h === 0) h = 12;
  return `${h}:${mStr} ${ampm}`;
}

function buildSummary(){
  const name = $("name").value.trim();
  const phone = $("phone").value.trim();
  const service = $("service").value;
  const date = $("date").value;
  const car = $("car").value.trim();
  const plate = $("plate").value.trim();
  const notes = $("notes").value.trim();

  if(!name || !phone || !date || !selectedTime){
    return { ok:false, text:T[lang].missing };
  }

  const svcLabel = T[lang].services[service] || service;

  const textEn =
`AUTOFIX Garage booking request
Name: ${name}
Phone: ${phone}
Service: ${svcLabel}
Date/Time: ${date} ${selectedTime}
Car: ${car || "-"}
Plate: ${plate || "-"}
Notes: ${notes || "-"}`;

  const textAr =
`طلب حجز - كراج AUTOFIX
الاسم: ${name}
رقم الهاتف: ${phone}
الخدمة: ${svcLabel}
التاريخ/الوقت: ${date} ${selectedTime}
السيارة: ${car || "-"}
رقم اللوحة: ${plate || "-"}
ملاحظات: ${notes || "-"}`;

  return { ok:true, text: (lang === "ar") ? textAr : textEn };
}

function openWhatsApp(){
  const sum = buildSummary();
  if(!sum.ok){
    $("slotMsg").textContent = sum.text;
    return;
  }
  const msg = encodeURIComponent(sum.text);
  const url = `https://wa.me/${WA_NUMBER}?text=${msg}`;
  window.open(url, "_blank");
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

function init(){
  // set date min = today
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth()+1).padStart(2,"0");
  const dd = String(today.getDate()).padStart(2,"0");
  $("date").min = `${yyyy}-${mm}-${dd}`;

  $("directWa").href = `https://wa.me/${WA_NUMBER}`;

  $("langBtn").addEventListener("click", () => setLang(lang === "en" ? "ar" : "en"));
  $("date").addEventListener("change", renderSlots);
  $("previewBtn").addEventListener("click", preview);
  $("waBtn").addEventListener("click", openWhatsApp);

  setLang("en");
}
init();
