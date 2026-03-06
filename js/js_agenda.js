const infoData = [
  {
    icon: "assets/icons/user-round.svg",
    title: "Penyelenggara",
    value: "Dinas Perpustakaan Umum Balai Pemuda"
  },
  {
    icon: "assets/icons/calendar-1.svg",
    title: "Tanggal Pelaksanaan",
    value: "1 - 28 Februari 2026"
  },
  {
    icon: "assets/icons/pin-1.svg",
    title: "Lokasi Pelaksanaan",
    value: "Online"
  },
  {
    icon: "assets/icons/link.svg",
    title: "Akses Link Pendaftaran",
    value: "https://daftar/wargamenulis2026"
  },
  {
    icon: "assets/icons/phone-1.svg",
    title: "Narahubung",
    value: "082142875102 - Zetty"
  }
];

const container = document.getElementById("infoCard");

infoData.forEach(item => {
  container.innerHTML += `
    <div class="info-item">
      <div class="info-icon">
        <img src="${item.icon}">
      </div>
      <div class="info-text">
        <p>${item.title}</p>
        <p>${item.value}</p>
      </div>
    </div>
  `;
});
