(function(){
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var nav = document.getElementById("nav");
  function onScroll(){ nav.classList.toggle("solid", window.scrollY > 16); }
  onScroll();
  window.addEventListener("scroll", onScroll, {passive:true});

  var burger = document.getElementById("burger");
  var drawer = document.getElementById("drawer");
  var mobile = window.matchMedia("(max-width: 940px)");
  function setDrawerOpen(open){
    drawer.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("drawer-open", open);
  }
  burger.addEventListener("click", function(){
    setDrawerOpen(burger.getAttribute("aria-expanded") === "false");
  });
  drawer.addEventListener("click", function(e){
    if (e.target.closest("a")) setDrawerOpen(false);
  });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
      setDrawerOpen(false);
      burger.focus();
    }
  });
  mobile.addEventListener("change", function(e){
    if (!e.matches) setDrawerOpen(false);
  });

  document.querySelectorAll(".work:not([data-state=\"empty\"])").forEach(function(btn){
    var body = document.getElementById(btn.getAttribute("aria-controls"));
    if (!body) return;
    btn.addEventListener("click", function(){
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      body.classList.toggle("open", !open);
      btn.querySelector(".badge").textContent = open ? "阅读" : "收起";
    });
  });

  var courseTabs = document.querySelector("#courses [role='tablist']");
  var subjects = Array.from(courseTabs.querySelectorAll("[role='tab']"));
  var activeSubject = courseTabs.querySelector("[aria-selected='true']");
  function selectSubject(subject){
    if (subject === activeSubject) return;
    activeSubject.setAttribute("aria-selected", "false");
    activeSubject.tabIndex = -1;
    document.getElementById(activeSubject.getAttribute("aria-controls")).hidden = true;
    subject.setAttribute("aria-selected", "true");
    subject.tabIndex = 0;
    document.getElementById(subject.getAttribute("aria-controls")).hidden = false;
    activeSubject = subject;
  }
  subjects.forEach(function(subject, index){
    subject.addEventListener("click", function(){ selectSubject(subject); });
    subject.addEventListener("keydown", function(event){
      var next;
      switch (event.key) {
        case "ArrowLeft": next = (index + subjects.length - 1) % subjects.length; break;
        case "ArrowRight": next = (index + 1) % subjects.length; break;
        case "Home": next = 0; break;
        case "End": next = subjects.length - 1; break;
        default: return;
      }
      event.preventDefault();
      selectSubject(subjects[next]);
      subjects[next].focus();
    });
  });
  courseTabs.hidden = false;

  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function(list){
      list.forEach(function(en){
        if (en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, {threshold:0.12, rootMargin:"0px 0px -6% 0px"});
    document.documentElement.classList.add("reveal-ready");
    document.querySelectorAll(".rv").forEach(function(el){ io.observe(el); });
  }
})();
