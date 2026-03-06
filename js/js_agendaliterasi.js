const data = [
  {
    title:"Kompetisi Warga Menulis",
    date:"1–28 Februari 2026",
    place:"Perpustakaan Umum Balai Pemuda",
    img:"assets/images/agenda-1.png"
  },
  {
    title:"Wisata Buku TK Anak Mandiri",
    date:"31 Januari 2026",
    place:"Perpustakaan Umum Rungkut",
    img:"assets/images/agenda-2.png"
  },
  {
    title:"Layanan Membaca Taman Cahaya",
    date:"Setiap Hari",
    place:"Jl. Raya Pakal Surabaya",
    img:"assets/images/agenda-3.png"
  },
  {
    title:"Kompetisi Warga Menulis",
    date:"1–28 Februari 2026",
    place:"Perpustakaan Umum Balai Pemuda",
    img:"assets/images/agenda-1.png"
  },
  {
    title:"Wisata Buku TK Dharmawanita",
    date:"12 Februari 2026",
    place:"Perpustakaan Umum Rungkut",
    img:"assets/images/agenda-2.png"
  },
  {
    title:"Layanan Membaca Taman Cahaya",
    date:"Setiap Hari",
    place:"Jl. Raya Pakal Surabaya",
    img:"assets/images/agenda-3.png"
  },
  {
    title:"Agenda Literasi Tambahan",
    date:"Februari 2026",
    place:"Surabaya",
    img:"assets/images/agenda-3.png"
  }
];

let page = 1;
const perPage = 6;

function render(){
  const start = (page-1)*perPage;
  const items = data.slice(start, start + perPage);

  const container = document.getElementById("cardContainer");
  container.innerHTML = "";

  items.forEach((item,index)=>{
    container.innerHTML += `
      <div class="card" onclick="openDetail(${start + index})">
        <img src="${item.img}" class="card-img">

        <div class="card-content">
          <h3>${item.title}</h3>

          <div class="info">
            <span>
              <img src="assets/icons/calendar.svg" class="icon">
              ${item.date}
            </span>

            <span>
              <img src="assets/icons/pin.svg" class="icon">
              ${item.place}
            </span>
          </div>
        </div>
      </div>
    `;
  });

  renderPagination();
}

function renderPagination(){
  const total = Math.ceil(data.length/perPage);
  const pag = document.getElementById("pagination");
  pag.innerHTML = "";

  for(let i=1;i<=total;i++){
    pag.innerHTML += `
      <button class="${i===page?'active':''}" onclick="changePage(${i})">
        ${i}
      </button>
    `;
  }
}

function changePage(p){
  page = p;
  render();
}

/* DETAIL */
function openDetail(index){
  const item = data[index];

  document.getElementById("detailImg").src = item.img;
  document.getElementById("detailTitle").innerText = item.title;
  document.getElementById("detailDate").innerText = item.date;
  document.getElementById("detailPlace").innerText = item.place;
  document.getElementById("detail").classList.remove("hidden");
}

function closeDetail(){
  document.getElementById("detail").classList.add("hidden");
}

render();
