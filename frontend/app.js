const BASE_URL = "http://127.0.0.1:8000";
let currentYear = "2025";
let chartInstance = null;
let arsipJenisChart = null;

/* ================= SECTION SWITCH ================= */

const btnPerpus = document.getElementById("btn-perpus");
const btnArsip = document.getElementById("btn-arsip");

btnPerpus.onclick = () => switchSection("perpus");
btnArsip.onclick = () => switchSection("arsip");

function switchSection(section) {
  document.getElementById("perpus-section").style.display =
    section === "perpus" ? "block" : "none";

  document.getElementById("arsip-section").style.display =
    section === "arsip" ? "block" : "none";

  btnPerpus.classList.toggle("active", section === "perpus");
  btnArsip.classList.toggle("active", section === "arsip");
}

/* ================= YEAR CHANGE ================= */

document.getElementById("yearSelect").onchange = function () {
  currentYear = this.value;
  loadAll();
};

/* ================= FETCH ================= */
async function fetchData(url) {
  const res = await fetch(url);
  return res.json();
}

/* ================= COUNT UP ANIMATION ================= */
function animateCountSmart(element, newValue, duration = 500) {

  const currentValue = parseInt(
    element.innerText.replace(/\./g, "")
  ) || 0;

  if (currentValue === newValue) return;

  // tentukan batas animasi (3 digit terakhir)
  const base = Math.floor(currentValue / 1000) * 1000;

  const start = currentValue - base;
  const end = newValue - base;

  let startTime = null;

  function update(timestamp) {

    if (!startTime) startTime = timestamp;

    const progress = timestamp - startTime;
    const percent = Math.min(progress / duration, 1);

    const animatedPart = Math.floor(start + (end - start) * percent);

    const value = base + animatedPart;

    element.innerText = value.toLocaleString("id-ID");

    if (percent < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}
/* ================= LOAD SUMMARY (CARD ATAS) ================= */
async function loadSummary() {
  try {
    const response = await fetch(`${BASE_URL}/perpustakaan/summary/${currentYear}`);
    const data = await response.json();

    console.log("SUMMARY DATA:", data);

    animateCountSmart(
    document.getElementById("pengunjung"),
    data.pengunjung ?? 0
  );

    animateCountSmart(
    document.getElementById("peminjaman"),
    data.peminjaman ?? 0
  );

    animateCountSmart(
    document.getElementById("anggota"),
    data.anggota ?? 0
  );

  //   animateCountSmart(
  //   document.getElementById("koleksi"),
  //   data.koleksi ?? 0
  // );

    } catch (error) {
      console.error("Error loadSummary:", error);
    }

  // CARD BAWAH: JUMLAH PENGUNJUNG PERPUS
  const totalBottom = document.getElementById("pengunjungPerpus");
  if (totalBottom) {
    totalBottom.innerText = data.pengunjung.toLocaleString();
  }
}

function toTitleCase(text) {
  if (!text) return "-";
  return text
    .toLowerCase()
    .split(" ")
    .map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}
/* ================= TOP BOOKS (SERING DIPINJAM) ================= */

async function loadTopBooks() {
  try {
    const data = await fetchData(`${BASE_URL}/perpustakaan/top-books/${currentYear}`);
    const container = document.getElementById("topBooks");

    if (!container) return;

    container.innerHTML = "";

    if (!data || data.length === 0) {
      container.innerHTML = "<div class='empty'>Tidak ada data</div>";
      return;
    }

    const top5 = data.slice(0, 5);

    // cari nilai maksimum
    const maxPinjam = Math.max(...top5.map(b => b.total_pinjam || 0));

    top5.forEach((book) => {

      const percent = maxPinjam > 0
        ? (book.total_pinjam / maxPinjam) * 100
        : 0;

      container.innerHTML += `
        <div class="book-progress-row">

          <div class="book-left">
            <img src="asset/book.svg" class="book-icon">
            <span class="book-title">${toTitleCase(book.judul_buku)}</span>
          </div>

          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percent}%"></div>
          </div>

        </div>
      `;
    });

  } catch (error) {
    console.error("Error loadTopBooks:", error);
  }
}

/* ================= LATEST BOOKS ================= */
async function loadLatestBooks() {
  try {
    const data = await fetchData(`${BASE_URL}/perpustakaan/latest-books/${currentYear}`);
    const container = document.getElementById("latestBookList");

    if (!container) return;

    container.innerHTML = "";

    if (!data || data.length === 0) {
      container.innerHTML = "<li class='empty'>Tidak ada data</li>";
      return;
    }

    data.forEach((book) => {
      container.innerHTML += `
        <li class="book-row">
          <div class="book-left">
            <img src="asset/book.svg" class="book-icon">
            <span class="book-title">${toTitleCase(book.judul)}</span>
          </div>
        </li>
      `;
    });

  } catch (error) {
    console.error("Error loadLatestBooks:", error);
  }
}

/* ================= VISITOR PER LOKASI ================= */
async function loadVisitorsLibrary() {

  const data = await fetchData(
    `${BASE_URL}/perpustakaan/lokasi/${currentYear}`
  );

  const container = document.getElementById("pengunjungPerpus");
  if (!container) return;

  const balai = data.find(d =>
    d.lokasi.toUpperCase().includes("BALAI")
  )?.total || 0;

  const rungkut = data.find(d =>
    d.lokasi.toUpperCase().includes("RUNGKUT")
  )?.total || 0;

  container.innerHTML = `
    <div class="pengunjung-clean-grid">

      <div class="perpus-clean">
        <div class="nama-line">Perpustakaan</div>
        <div class="nama-line highlight">Balai Pemuda</div>
        <div class="angka-clean">
          ${balai.toLocaleString("id-ID")}
        </div>
      </div>

      <div class="perpus-clean">
        <div class="nama-line">Perpustakaan</div>
        <div class="nama-line highlight">Rungkut</div>
        <div class="angka-clean">
          ${rungkut.toLocaleString("id-ID")}
        </div>
      </div>

    </div>
  `;
}

/* ================= LINE CHART ================= */

async function loadVisitorsChart() {
  const data = await fetchData(`${BASE_URL}/perpustakaan/pengunjung/${currentYear}`);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];

  const labels = data.map(d => monthNames[d.bulan - 1]);
  const totals = data.map(d => d.total);

  // ================= HITUNG AVERAGE =================
  const average = totals.reduce((a, b) => a + b, 0) / totals.length;
  const avgLine = totals.map(() => average);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(
    document.getElementById("visitorsChart"),
    {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Pengunjung",
            data: totals,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,0.12)",
            fill: true,
            tension: 0.4,
            pointRadius: 3
          },
          {
            label: "Rata-rata",
            data: avgLine,
            borderColor: "#ef4444",
            borderDash: [6, 6],
            fill: false,
            pointRadius: 0,
            tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,

        animation: {
          duration: 1000,
          easing: "easeInOutCubic",
          x: {
            type: 'number',
            duration: 1000,
            from: NaN
          },
          y: {
            type: 'number',
            duration: 1000,
            from: 0
          }
        },

        plugins: {
          legend: {
            display: false
          }
        },

        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              display: false
            }
          }
        }
      }
    }
  );

// ================= LABEL AVERAGE =================
setTimeout(() => {
  const yScale = chartInstance.scales.y;

  if (!yScale) return;

  const yPos = yScale.getPixelForValue(average);

  const label = document.getElementById("avgLabel");
  if (!label) return;

  label.style.top = yPos + "px";
  label.innerText =
    Math.round(average).toLocaleString("id-ID");

}, 500);
}

/* ================= ARSIP SUMMARY ================= */
async function loadArsipSummary() {
  try {

    const data = await fetchData(`${BASE_URL}/arsip/summary/${currentYear}`);

    // TOTAL
    document.getElementById("totalSikn").innerText =
      (data.total_item_sikn ?? 0).toLocaleString("id-ID");

    document.getElementById("totalJikn").innerText =
      (data.total_kunjungan_jikn ?? 0).toLocaleString("id-ID");


    /* ================= SIKN ================= */

    const siknPercent = data.growth_sikn_percent;

    if (siknPercent === null || siknPercent === undefined) {

      document.getElementById("growthSikn").innerText = "-";

    } else {

      const up = siknPercent > 0;

      document.getElementById("growthSikn").innerText =
        `${up ? "↑" : "↓"} ${Math.abs(siknPercent).toFixed(2)}% dari tahun lalu`;

      document.getElementById("growthSikn").className =
        up ? "growth-up" : "growth-down";
    }


    /* ================= JIKN ================= */

    const jiknPercent = data.growth_jikn_percent;

    if (jiknPercent === null || jiknPercent === undefined) {

      document.getElementById("growthJikn").innerText = "-";

    } else {

      const up = jiknPercent > 0;

      document.getElementById("growthJikn").innerText =
        `${up ? "↑" : "↓"} ${Math.abs(jiknPercent).toFixed(2)}% dari tahun lalu`;

      document.getElementById("growthJikn").className =
        up ? "growth-up" : "growth-down";
    }

  } catch (error) {
    console.error("Error loadArsipSummary:", error);
  }
}

/* ================= JIKN vs SIKN CHART ================= */
let arsipChart=null;

async function loadJiknSiknChart(){

  const data=await fetchData(`${BASE_URL}/arsip/jikn-sikn/${currentYear}`);

  const labels=data.map(d=>d.nama_bulan);
  const jikn=data.map(d=>d.jumlah_jikn);
  const sikn=data.map(d=>d.jumlah_sikn);

  if(arsipChart) arsipChart.destroy();

  const ctx=document.getElementById("arsipChart").getContext("2d");

  arsipChart=new Chart(ctx,{
    type:"line",
    data:{
      labels:labels,
      datasets:[
        {
          label:"JIKN",
          data:jikn,
          borderColor:"#10b981",
          backgroundColor:"rgba(16,185,129,0.15)",
          fill:true,
          tension:0.4,
          pointRadius:3,
          pointHoverRadius:5
        },
        {
          label:"SIKN",
          data:sikn,
          borderColor:"#f59e0b",
          backgroundColor:"rgba(245,158,11,0.15)",
          fill:true,
          tension:0.4,
          pointRadius:3,
          pointHoverRadius:5
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,

      plugins:{
        legend:{display:false},
        tooltip:{
          callbacks:{
            label:function(context){
              return context.dataset.label+": "+
              context.raw.toLocaleString("id-ID");
            }
          }
        }
      },

      scales:{
        x:{
          grid:{display:false}
        },
        y:{
          beginAtZero:true,
          grid:{display:false},
          ticks:{
            callback:value=>value.toLocaleString("id-ID")
          }
        }
      }
    }
  });
}

/* ================= LINE CHART ARSIP  ================= */
async function loadArsipJenisChart() {
  try {
    const raw = await fetchData(
      `${BASE_URL}/arsip/jenis-tren?year=${currentYear}`
    );

    console.log("ARSIP JENIS RAW:", raw);

    // 🔥 mapping bulan urut
    const bulanOrder = [
      "januari","februari","maret","april","mei","juni",
      "juli","agustus","september","oktober","november","desember"
    ];

    const bulanShort = [
      "Jan","Feb","Mar","Apr","Mei","Jun",
      "Jul","Agu","Sep","Okt","Nov","Des"
    ];

    // 🔥 init object kosong
    const statisMap = {};
    const inaktifMap = {};

    raw.forEach(item => {
      const bulan = item.bulan.toLowerCase();

      if (item.jenis === "Tekstual Statis") {
        statisMap[bulan] = item.total;
      }

      if (item.jenis === "Tekstual Inaktif") {
        inaktifMap[bulan] = item.total;
      }
    });

    // 🔥 susun data sesuai urutan bulan
    const labels = bulanShort;

    const statis = bulanOrder.map(b => statisMap[b] || 0);
    const inaktif = bulanOrder.map(b => inaktifMap[b] || 0);

    if (arsipJenisChart) arsipJenisChart.destroy();

    const ctx = document.getElementById("arsipJenisChart");

    arsipJenisChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Tekstual Statis",
            data: statis,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59,130,246,0.15)",
            fill: true,
            tension: 0.4
          },
          {
            label: "Tekstual Inaktif",
            data: inaktif,
            borderColor: "#ef4444",
            backgroundColor: "rgba(239,68,68,0.15)",
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { display: false },
            beginAtZero: true,
            ticks: {
              callback: v => v.toLocaleString("id-ID")
            }
          }
        }
      }
    });

  } catch (err) {
    console.error("ERROR loadArsipJenisChart:", err);
  }
}

/* ================= SUMMARY JENIS ARSIP ================= */
async function loadArsipJenisSummary() {
  try {
    const raw = await fetchData(
      `${BASE_URL}/arsip/jenis-summary?year=${currentYear}`
    );

    console.log("SUMMARY TAHUNAN:", raw);

    const map = {};
    raw.forEach(item => {
      map[item.jenis] = item.total;
    });

    document.getElementById("totalPeta").innerText =
      (map["Peta"] || 0).toLocaleString("id-ID");

    document.getElementById("totalFoto").innerText =
      (map["Foto"] || 0).toLocaleString("id-ID");

    document.getElementById("totalVideo").innerText =
      (map["Video"] || 0).toLocaleString("id-ID");

  } catch (err) {
    console.error("ERROR summary:", err);
  }
}

/* ================= LOAD ================= */

function loadAll() {
  loadSummary();
  loadTopBooks();
  loadLatestBooks();   
  loadVisitorsLibrary();
  loadVisitorsChart();
  // ARSIP
  loadArsipSummary();
  loadJiknSiknChart();
  loadArsipJenisChart();
  loadArsipJenisSummary();
}

loadAll();