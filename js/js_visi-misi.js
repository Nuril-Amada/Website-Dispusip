document.addEventListener("DOMContentLoaded", function () {

  const misiBox = document.querySelector(".misi-box");
  const tentangSection = document.querySelector(".tentang-dinas");

  function revealOnScroll() {
    const triggerBottom = window.innerHeight * 0.85;

    [misiBox, tentangSection].forEach(section => {
      const boxTop = section.getBoundingClientRect().top;

      if (boxTop < triggerBottom) {
        section.style.opacity = "1";
        section.style.transform = "translateY(0)";
      }
    });
  }

  // Initial style
  misiBox.style.opacity = "0";
  misiBox.style.transform = "translateY(40px)";
  misiBox.style.transition = "all 0.6s ease";

  tentangSection.style.opacity = "0";
  tentangSection.style.transform = "translateY(40px)";
  tentangSection.style.transition = "all 0.6s ease";

  window.addEventListener("scroll", revealOnScroll);

  revealOnScroll();
});
