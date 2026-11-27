(() => {
  const frame = document.querySelector(".campus-carousel-frame");
  if (!frame) return;

  const slides = [...frame.querySelectorAll(".campus-slide")];
  const controls = frame.querySelector(".campus-carousel-controls");
  const toggle = controls.querySelector(".campus-pause");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let current = 0;
  let paused = reducedMotion.matches;
  let timer;

  function show(next) {
    slides[current].hidden = true;
    current = (next + slides.length) % slides.length;
    slides[current].hidden = false;
  }

  function schedule() {
    window.clearTimeout(timer);
    if (!paused && !document.hidden && !frame.matches(":hover, :focus-within")) {
      timer = window.setTimeout(() => {
        show(current + 1);
        schedule();
      }, 6000);
    }
  }

  function setPaused(value) {
    paused = value;
    toggle.textContent = paused ? "播放轮播" : "暂停轮播";
    schedule();
  }

  controls.querySelector(".campus-prev").addEventListener("click", () => show(current - 1));
  controls.querySelector(".campus-next").addEventListener("click", () => show(current + 1));
  toggle.addEventListener("click", () => setPaused(!paused));
  frame.addEventListener("mouseenter", schedule);
  frame.addEventListener("mouseleave", schedule);
  frame.addEventListener("focusin", schedule);
  frame.addEventListener("focusout", () => queueMicrotask(schedule));
  document.addEventListener("visibilitychange", schedule);
  reducedMotion.addEventListener("change", (event) => setPaused(event.matches));

  controls.hidden = false;
  setPaused(paused);
})();
