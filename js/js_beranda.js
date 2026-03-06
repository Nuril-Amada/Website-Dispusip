document.addEventListener("DOMContentLoaded", () => {

  /* ================= HERO SLIDER ================= */
  const slider = document.getElementById("slider");

  if (slider) {
    const slides = slider.children;
    let index = 0;

    setInterval(() => {
      index = (index + 1) % slides.length;
      slider.style.transform = `translateX(-${index * 100}vw)`;
    }, 4000);
  }

  /* ================= POPUP SCROLL (SEMUA SECTION) ================= */
  const popupElements = document.querySelectorAll(
    ".popup, .stat-card, .kepuasan-left, .kepuasan-right"
  );

  const popupObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        } else {
          entry.target.classList.remove("show"); // bisa muncul ulang
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -120px 0px"
    }
  );

  popupElements.forEach((el, index) => {
    el.style.transitionDelay = `${index * 0.15}s`;
    popupObserver.observe(el);
  });

  /* ================= AUTO SCROLL ARTIKEL & BERITA ================= */

function startAutoSlide(trackSelector) {
  const track = document.querySelector(trackSelector);
  if (!track) return;

  const cards = track.children;
  const gap = 28; // harus sama dengan gap di CSS
  const visible = 2; // jumlah card tampil
  let index = 0;

  function slide() {
    const cardWidth = cards[0].offsetWidth + gap;
    index++;

    if (index > cards.length - visible) {
      index = 0;
    }

    track.style.transform = `translateX(-${index * cardWidth}px)`;
  }

  setInterval(slide, 3000); // geser tiap 3 detik
}

// Jalankan untuk dua slider
startAutoSlide(".artikel-track");
startAutoSlide(".berita-track");
 });


document.addEventListener("DOMContentLoaded", function () {

  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");
  const dropdownMenus = document.querySelectorAll(".has-dropdown");

  /* =========================
     TOGGLE HAMBURGER
  ========================== */
  hamburger.addEventListener("click", function (e) {
    e.stopPropagation();
    navMenu.classList.toggle("active");

    // Jika hamburger ditutup → tutup semua dropdown
    if (!navMenu.classList.contains("active")) {
      dropdownMenus.forEach(menu => {
        menu.classList.remove("active");
      });
    }
  });

  /* =========================
     DROPDOWN ACCORDION MOBILE
     (Klik di seluruh area li)
  ========================== */
  dropdownMenus.forEach(menu => {
    menu.addEventListener("click", function (e) {

      if (window.innerWidth <= 768) {
        e.stopPropagation();

        // Tutup dropdown lain
        dropdownMenus.forEach(otherMenu => {
          if (otherMenu !== menu) {
            otherMenu.classList.remove("active");
          }
        });

        // Toggle yang diklik
        menu.classList.toggle("active");
      }

    });
  });

  /* =========================
     TUTUP JIKA KLIK LUAR MENU
  ========================== */
  document.addEventListener("click", function (e) {
    if (
      window.innerWidth <= 768 &&
      navMenu.classList.contains("active") &&
      !navMenu.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      navMenu.classList.remove("active");

      // Tutup semua dropdown juga
      dropdownMenus.forEach(menu => {
        menu.classList.remove("active");
      });
    }
  });

});