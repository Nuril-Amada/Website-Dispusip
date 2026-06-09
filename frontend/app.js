const BASE_URL = "http://127.0.0.1:8000";
let currentYear = "2025";
let chartInstance = null;
let arsipJenisChart = null;
let forecastChartInstance = null;
let treemapTekstualChart = null;
let treemapMediaChart = null;
let arsipStackedChart = null;

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

  animateCountSmart(
  document.getElementById("avgPengunjung"),
  Math.round(data.avgPengunjung ?? 0)
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

          <div class="book-header">
            <div class="book-left">
              <img src="asset/book.svg" class="book-icon">
              <span class="book-title">${toTitleCase(book.judul_buku)}</span>
            </div>
            <span class="book-count">${book.total_pinjam}</span>
          </div>

          <div class="progress-bar">
            <div class="progress-fill" style="width:${percent}%"></div>
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

//* ================= VISITOR PER LOKASI ================= */
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

  const tbm = data.find(d =>
    d.lokasi.toUpperCase().includes("TBM")
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

      <div class="perpus-clean tbm">
        <div class="nama-line">Taman Baca</div>
        <div class="nama-line highlight">Masyarakat</div>
        <div class="angka-clean">
          ${tbm.toLocaleString("id-ID")}
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
  const totalVisitors =totals.reduce((a, b) => a + b, 0);
  const average = Math.round(totalVisitors / 12);
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
            pointHoverRadius: 6,
            hitRadius: 30,
            tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
            label: function(context) {
              const value =
                Math.round(context.raw)
                .toLocaleString("id-ID");

              if (
                context.dataset.label ===
                "Rata-rata"
              ) {
                return `Rata-rata: ${value}`;
              }

              return `Pengunjung: ${value}`;
            }
          }
        }
      },

        scales: {
          x: {
            grid: {
              display: true
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              display: true
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
    average.toLocaleString("id-ID");

}, 500);
}

/* ================= FORECAST CHART ================= */
async function loadForecastChart() {

  const section =
    document.getElementById("forecastSection");

  // forecast hanya tampil saat filter tahun 2025
  if (currentYear != "2025") {

    section.style.display = "none";

    if (forecastChartInstance) {
      forecastChartInstance.destroy();
    }

    return;
  }

  section.style.display = "block";

  try {

    const data = await fetchData(
      `${BASE_URL}/perpustakaan/forecast`
    );

    // ================= LABEL =================
    const labels =
      data.map(d => d.nama_bulan);

    // ================= VALUE =================
    const values =
      data.map(d => Number(d.prediksi));

    // ================= AVERAGE =================
    const average = Math.round(
      values.reduce((a, b) => a + b, 0) / values.length
    );

    const avgLine =
      values.map(() => average);

    // ================= DESTROY OLD CHART =================
    if (forecastChartInstance) {
      forecastChartInstance.destroy();
    }

    // ================= CREATE CHART =================
    forecastChartInstance = new Chart(
      document.getElementById("forecastChart"),
      {
        type: "line",

        data: {
          labels: labels,

          datasets: [

            // FORECAST
            {
              label: "Forecast 2026",

              data: values,

              borderColor: "#10b981",
              backgroundColor: "rgba(16,185,129,0.12)",

              fill: true,
              tension: 0.4,

              pointRadius: 3,
              pointHoverRadius: 5
            },

            // AVERAGE
            {
              label: "Rata-rata",
              data: avgLine,
              borderColor: "#ef4444",
              borderDash: [6,6],
              fill: false,
              tension: 0,
              pointRadius: 0,
              pointHoverRadius: 6,
              hitRadius: 30,
            }
          ]
        },

        options: {

          responsive: true,
          maintainAspectRatio: false,

          plugins: {

            legend: {
              display: false
            },

          tooltip: {

            backgroundColor: "#111827",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",

            padding: 12,

            cornerRadius: 10,

            displayColors: true,

            callbacks: {

              label: function(context) {

                const value =
                  Number(context.raw)
                  .toLocaleString("id-ID");

                // popup garis merah
                if (
                  context.dataset.label ===
                  "Rata-rata"
                ) {

                  return `Rata-rata Pengunjung: ${value}`;
                }

                // popup garis forecast
                return `Forecast Pengunjung: ${value}`;
              }
            }
          },
          },

          scales: {

            x: {
              grid: {
                display: true
              }
            },

            y: {

              beginAtZero: true,

              grid: {
                display: true
              },

              ticks: {
                callback: value =>
                  Number(value)
                  .toLocaleString("id-ID")
              }
            }
          }
        }
      }
    );

  } catch (error) {

    console.error(
      "Error loadForecastChart:",
      error
    );
  }
}

 // ================= CHART SEGMENTASI PEKERJAAN =================
async function loadSegmentasiChart() {
  try {
    const data = await fetchData(`${BASE_URL}/perpustakaan/pekerjaan/${currentYear}`);

    console.log("SEGMENTASI:", data);

    const labels = data.map(d => d.pekerjaan);
    const values = data.map(d => Number(d.total));

    const ctx = document.getElementById("segmentasiChart");

    if (!ctx) return;

    if (window.segmentasiChartInstance) {
      window.segmentasiChartInstance.destroy();
    }

    window.segmentasiChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Jumlah",
          data: values,
          backgroundColor: "#2563eb",
          barThickness: 16,
          categoryPercentage: 0.9,
          barPercentage: 0.9
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              display: true 
            }
          },
          y: {
            grid: {
              display: true 
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });

  } catch (error) {
    console.error("Error segmentasi:", error);
  }
}

/* ================= ARSIP SUMMARY ================= */
async function loadArsipSummary() {
  try {
    const data = await fetchData(`${BASE_URL}/arsip/summary/${currentYear}`);

    /* ================= TOTAL SIKN & JIKN ================= */

    document.getElementById("totalSikn").innerText =
      (data.total_item_sikn ?? 0).toLocaleString("id-ID");

    document.getElementById("totalJikn").innerText =
      (data.total_kunjungan_jikn ?? 0).toLocaleString("id-ID");

    /* ================= TOTAL ARSIP SATUAN ================= */

    document.getElementById("totalItem").innerText =
      (data.total_arsip_item ?? 0).toLocaleString("id-ID");

    document.getElementById("totalCD").innerText =
      (data.total_arsip_cd ?? 0).toLocaleString("id-ID");

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
          borderColor:"#4ADEDE",
          backgroundColor:"rgba(74,222,222,0.15)",
          fill:true,
          tension:0.4,
          pointRadius:3,
          pointHoverRadius:5
        },
        {
          label:"SIKN",
          data:sikn,
          borderColor:"#2563eb",
          backgroundColor:"rgba(37,99,235,0.15)",
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
          grid:{display:true}
        },
        y:{
          beginAtZero:true,
          grid:{display:true},
          ticks:{
            callback:value=>value.toLocaleString("id-ID")
          }
        }
      }
    }
  });
}


/* ================= KOMPOSISI JENIS ARSIP ================= */
async function loadArsipStackedChart() {

  const response = await fetch(
    `${BASE_URL}/arsip/komposisi-bulanan?year=${currentYear}`
  );

  const data = await response.json();

  console.log("ARSIP STACKED:", data);

  const bulanUrut = [
    "jan","feb","mar","apr","mei","jun",
    "jul","agu","sep","okt","nov","des"
  ];

  const labels = [
    "Jan","Feb","Mar","Apr","Mei","Jun",
    "Jul","Agu","Sep","Okt","Nov","Des"
  ];

  const statis = new Array(12).fill(0);
  const inaktif = new Array(12).fill(0);
  const peta = new Array(12).fill(0);
  const foto = new Array(12).fill(0);
  const video = new Array(12).fill(0);

  data.forEach(item => {

    const idx = bulanUrut.indexOf(
      item.bulan.substring(0,3).toLowerCase()
    );

    if(idx === -1) return;

    switch(item.jenis){

      case "Tekstual Statis":
        statis[idx] = item.total;
        break;

      case "Tekstual Inaktif":
        inaktif[idx] = item.total;
        break;

      case "Peta":
        peta[idx] = item.total;
        break;

      case "Foto":
        foto[idx] = item.total;
        break;

      case "Video":
        video[idx] = item.total;
        break;
    }

  });

  const ctx =
    document.getElementById("arsipStackedChart");

  if(arsipStackedChart){
    arsipStackedChart.destroy();
  }

  arsipStackedChart = new Chart(ctx, {

    type: "bar",

    data: {

      labels,

      datasets: [

        {
          label: "Tekstual Inaktif",
          data: inaktif,
          backgroundColor: "#2563eb"
        },

        {
          label: "Tekstual Statis",
          data: statis,
          backgroundColor: "#60a5fa"
        },

        {
          label: "Peta",
          data: peta,
          backgroundColor: "#10b981"
        },

        {
          label: "Foto",
          data: foto,
          backgroundColor: "#f59e0b"
        },

        {
          label: "Video",
          data: video,
          backgroundColor: "#8b5cf6"
        }

      ]
    },

    options: {

      responsive: true,
      maintainAspectRatio: false,

      plugins: {

        legend: {
          position: "top"
        },

        tooltip: {
          mode: "index",
          intersect: false
        }
      },

      scales: {

        x: {
          stacked: true,
          grid: {
            display: false
          }
        },

        y: {
          stacked: true,
          beginAtZero: true,

          ticks: {
            callback(value){
              return value.toLocaleString("id-ID");
            }
          }
        }

      }
    }
  });

}

/* ================= LOAD ================= */

function loadAll() {
  loadSummary();
  loadTopBooks();
  loadLatestBooks();   
  loadVisitorsLibrary();
  loadVisitorsChart();
  loadForecastChart();
  loadSegmentasiChart();
  // ARSIP
  loadArsipSummary();
  loadJiknSiknChart();
  loadArsipStackedChart();
}

loadAll();