const WA = "96566601793";
const OPEN = 510; // 08:30
const CLOSE = 1200; // 20:00

const slotsEl = document.getElementById("slots");
const dateEl = document.getElementById("date");
const serviceEl = document.getElementById("service");

function toTime(m){
  const h=Math.floor(m/60),min=m%60;
  return `${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}`;
}

function renderSlots(){
  slotsEl.innerHTML="";
  const d=new Date(dateEl.value);
  if(!dateEl.value||d.getDay()===5)return;

  for(let t=OPEN;t<CLOSE;t+=30){
    if(t>=840&&t<960)continue;
    const b=document.createElement("button");
    b.className="slot";
    b.textContent=toTime(t);
    b.onclick=()=>{
      document.querySelectorAll(".slot").forEach(s=>s.classList.remove("on"));
      b.classList.add("on");
    };
    slotsEl.appendChild(b);
  }
}
dateEl.onchange=renderSlots;

document.querySelectorAll(".servicesGrid button").forEach(b=>{
  b.onclick=()=>serviceEl.value=b.dataset.svc;
});

document.getElementById("bookBtn").onclick=()=>{
  const name=document.getElementById("name").value;
  const phone=document.getElementById("phone").value;
  const svc=serviceEl.value;
  const date=dateEl.value;
  const slot=document.querySelector(".slot.on")?.textContent;
  if(!name||!phone||!date||!slot){
    alert("يرجى تعبئة جميع الحقول");
    return;
  }

  const msg=encodeURIComponent(
`طلب حجز - AUTOFIX
الاسم: ${name}
الهاتف: +965${phone}
الخدمة: ${svc}
التاريخ: ${date}
الوقت: ${slot}`
  );
  window.open(`https://wa.me/${WA}?text=${msg}`);
};
