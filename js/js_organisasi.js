document.addEventListener("DOMContentLoaded", function () {

  // ================= FADE-IN GAMBAR =================
  const img = document.getElementById("imgStruktur");

  if (img) {
    img.style.opacity = "0";
    img.style.transform = "translateY(30px)";
    img.style.transition = "all 0.8s ease";

    setTimeout(() => {
      img.style.opacity = "1";
      img.style.transform = "translateY(0)";
    }, 200);

    // ================= ZOOM CLICK =================
    img.onclick = function () {
      window.open(this.src, "_blank");
    };
  }

});