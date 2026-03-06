/* =========================
DATA LAYANAN ARSIP
========================= */

const schedules = [
  { lokasi:"Dinas Pendidikan", tanggal:"2026-02-09", waktu:"09.00 - 13.00" },
  { lokasi:"Dinas Perhubungan", tanggal:"2026-02-15", waktu:"09.00 - 13.00" },
  { lokasi:"Dinas Kesehatan", tanggal:"2026-01-28", waktu:"08.00 - 11.00" },
  { lokasi:"Dinas PU Bina Marga", tanggal:"2026-03-05", waktu:"08.00 - 11.00" },
  { lokasi:"Kecamatan Tegalsari", tanggal:"2026-02-09", waktu:"08.30 - 11.30" },
  { lokasi:"Kelurahan Genteng", tanggal:"2026-01-20", waktu:"09.00 - 13.00" },
];

/* =========================
UTIL
========================= */

const today = new Date().toISOString().split("T")[0];

function getStatus(date){
  if(date === today) return "hari_ini";
  if(date > today) return "mendatang";
  return "selesai";
}

function formatTanggal(dateStr){
  return new Date(dateStr).toLocaleDateString("id-ID",{
    day:"numeric",
    month:"long",
    year:"numeric"
  });
}

function labelStatus(status){
  return status.replace("_"," ");
}

/* =========================
SORT
========================= */

const order = { hari_ini:1, mendatang:2, selesai:3 };

const sortedData = schedules.sort((a,b)=>
  order[getStatus(a.tanggal)] - order[getStatus(b.tanggal)]
);

/* =========================
PAGINATION
========================= */

let page = 1;
const perPage = 6;

function renderData(){
  const container = document.getElementById("cardContainer");
  container.innerHTML = "";

  const start = (page-1)*perPage;
  const data = sortedData.slice(start, start+perPage);

  data.forEach(item=>{
    const status = getStatus(item.tanggal);
    const highlight = status==="hari_ini" ? "highlight" : "";

    container.innerHTML += `
      <div class="card ${highlight}">
        <div class="card-header">
          <h3>${item.lokasi}</h3>
          <span class="badge ${status}">
            ${labelStatus(status)}
          </span>
        </div>

        <div class="info-row">
          <img src="assets/icons/calendar.svg" class="icon">
          <span>${formatTanggal(item.tanggal)}</span>
        </div>

        <div class="info-row">
          <img src="assets/icons/pin.svg" class="icon">
          <span>${item.waktu}</span>
        </div>
      </div>
    `;
  });

  renderPagination();
}

function renderPagination(){
  const totalPage = Math.ceil(sortedData.length/perPage);
  const el = document.getElementById("pagination");
  el.innerHTML = "";

  el.innerHTML += `
    <button ${page===1?"disabled":""} onclick="changePage(${page-1})">Sebelumnya</button>
  `;

  for(let i=1;i<=totalPage;i++){
    el.innerHTML += `
      <button class="${i===page?"active":""}" onclick="changePage(${i})">${i}</button>
    `;
  }

  el.innerHTML += `
    <button ${page===totalPage?"disabled":""} onclick="changePage(${page+1})">Selanjutnya</button>
  `;
}

function changePage(p){
  page=p;
  renderData();
}

renderData();
