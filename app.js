const WA = "96566601793";
const OPEN = 510;   // 08:30
const CLOSE = 1200; // 20:00

const slotsEl = document.getElementById("slots");
const dateEl = document.getElementById("date");
const serviceEl = document.getElementById("service");

/* Convert minutes to 12-hour time */
function toTime12(m){
  let h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(min).padStart(2,"0")} ${ampm}`;
}

function renderSlots(){
  slotsEl.innerHTML = "";
  const d = new Date(dateEl.value);

  // Friday closed
  if (!dateEl.value || d.getDay() === 5) return;

  for (let t = OPEN; t < CLOSE; t += 30) {

    // Break 14:00–16:00
    if (t >= 840 && t < 960) continue;

    const b = document.createElement("button");
    b.className = "slot";
    b.textContent = toTime12(t);
    b.dataset.time = t;

    b.onclick = () => {
      document.querySelectorAll(".slot").forEach(s => s.classList.remove("on"));
      b.classList.add("on");
    };

    slotsEl.appendChild(b);
  }
}

dateEl.onchange = renderSlots;

// Service grid → dropdown
document.querySelectorAll(".servicesGrid button").forEach(b => {
  b.onclick = () => serviceEl.value = b.dataset.svc;
});

// WhatsApp booking
document.getElementById("bookBtn").onclick = () => {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const svc = serviceEl.value;
  const date = dateEl.value;
  const slotBtn = document.querySelector(".slot.on");

  if (!name || !phone || !date || !slotBtn) {
    alert("يرجى تعبئة جميع الحقول");
    return;
  }

  const timeText = slotBtn.textContent;

  const msg = encodeURIComponent(
`طلب حجز - AUTOFIX
الاسم: ${name}
الهاتف: +965${phone}
الخدمة: ${svc}
التاريخ: ${date}
الوقت: ${timeText}`
  );

  window.open(`https://wa.me/${WA}?text=${msg}`);
};
