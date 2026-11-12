/* ============================================================
   Apex Auto — main.js
   Shop status, mobile nav, booking wizard, carousel,
   FAQ single-open behavior, coupon auto-apply.
   ============================================================ */
(function () {
  "use strict";

  var SHOP = {
    phone: "+48 89 555 12 34",
    hours: {
      0: null,               // Sunday
      1: [7.5 * 60, 18 * 60], // Monday (minutes from midnight)
      2: [7.5 * 60, 18 * 60],
      3: [7.5 * 60, 18 * 60],
      4: [7.5 * 60, 18 * 60],
      5: [7.5 * 60, 18 * 60],
      6: [9 * 60, 14 * 60]    // Saturday
    }
  };

  /* ---------- Real-time open/closed status ---------- */
  function fmt(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return h + ":" + (m < 10 ? "0" + m : m);
  }

  function updateStatus() {
    var now = new Date();
    var day = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();
    var today = SHOP.hours[day];
    var open = !!today && mins >= today[0] && mins < today[1];
    var text;
    if (open) {
      text = "Open Now · Until " + fmt(today[1]);
    } else {
      var next = today;
      var nextDay = "";
      if (!next || mins >= next[1]) {
        for (var i = 1; i <= 7; i++) {
          var d = (day + i) % 7;
          if (SHOP.hours[d]) { next = SHOP.hours[d]; nextDay = i === 1 ? "Tomorrow " : ""; break; }
        }
      }
      text = next
        ? "Closed " + (nextDay ? "· Opens " + nextDay.replace(" ", "") + fmt(next[0]) : "· Opens " + fmt(next[0]))
        : "Closed Today";
    }

    var pairs = [
      ["status-dot", "status-text"],
      ["status-dot-2", "status-text-2"],
      ["status-dot-3", "status-text-3"]
    ];
    pairs.forEach(function (p) {
      var dot = document.getElementById(p[0]);
      var label = document.getElementById(p[1]);
      if (dot) dot.className = "status-dot " + (open ? "status-dot--on" : "status-dot--off");
      if (label) label.textContent = text;
    });

    var heroText = document.getElementById("status-text");
    if (heroText && open) {
      heroText.textContent = "Open Now · Today " + fmt(today[0]) + " – " + fmt(today[1]);
    } else if (heroText && today) {
      heroText.textContent = "Open Today: " + fmt(today[0]) + " – " + fmt(today[1]);
    }

    var rows = document.querySelectorAll(".hours-table tr");
    rows.forEach(function (row) {
      var days = row.getAttribute("data-days");
      if (days && days.split(",").indexOf(String(day)) !== -1) row.classList.add("is-today");
    });
  }

  /* ---------- Mobile nav ---------- */
  function initNav() {
    var burger = document.getElementById("hamburger");
    var nav = document.getElementById("main-nav");
    if (!burger || !nav) return;

    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    nav.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (link) {
        nav.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
      var toggle = e.target.closest(".nav-link--btn");
      if (toggle) {
        var li = toggle.closest(".has-dropdown");
        var isOpen = li.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      }
    });

    document.addEventListener("click", function (e) {
      var li = document.querySelector(".has-dropdown.is-open");
      if (li && !li.contains(e.target) && window.innerWidth > 860) {
        li.classList.remove("is-open");
        li.querySelector(".nav-link--btn").setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Year dropdown ---------- */
  function initYearSelect() {
    var year = document.getElementById("veh-year");
    if (!year) return;
    var current = new Date().getFullYear();
    for (var y = current + 1; y >= 1985; y--) {
      var opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      year.appendChild(opt);
    }
  }

  /* ---------- Booking wizard ---------- */
  function initBookingForm() {
    var form = document.getElementById("booking-form");
    if (!form) return;

    var steps = form.querySelectorAll(".form-step");
    var dots = form.querySelectorAll(".progress-steps li");
    var fill = document.getElementById("progress-fill");
    var current = 1;

    function show(n) {
      current = n;
      steps.forEach(function (s) {
        s.classList.toggle("is-active", Number(s.getAttribute("data-step")) === n);
      });
      dots.forEach(function (d) {
        var stepNum = Number(d.getAttribute("data-step"));
        d.classList.toggle("is-active", stepNum === n);
        d.classList.toggle("is-done", stepNum < n);
      });
      if (fill) fill.style.width = (n / steps.length) * 100 + "%";
    }

    function validateStep(n) {
      var step = form.querySelector('.form-step[data-step="' + n + '"]');
      var ok = true;
      var firstBad = null;
      step.querySelectorAll("input[required], select[required], textarea[required]").forEach(function (input) {
        var field = input.closest(".field");
        var err = field ? field.querySelector(".field-error") : null;
        var valid = input.checkValidity();
        if (input.type === "tel" && input.value.trim() && !/^[+\d][\d\s().-]{6,}$/.test(input.value.trim())) {
          valid = false;
        }
        if (field) field.classList.toggle("has-error", !valid);
        if (err) err.hidden = valid;
        if (!valid) { ok = false; if (!firstBad) firstBad = input; }
      });
      if (firstBad) firstBad.focus();
      return ok;
    }

    form.querySelectorAll("[data-next]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (validateStep(current)) show(current + 1);
      });
    });

    form.querySelectorAll("[data-back]").forEach(function (btn) {
      btn.addEventListener("click", function () { show(current - 1); });
    });

    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field && field.classList.contains("has-error") && input.checkValidity()) {
          field.classList.remove("has-error");
          var err = field.querySelector(".field-error");
          if (err) err.hidden = true;
        }
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateStep(3)) return;

      var data = new FormData(form);
      var ref = "APX-" + Date.now().toString(36).toUpperCase().slice(-6);
      var services = form.querySelectorAll('input[name="services"]:checked');
      var picked = [];
      services.forEach(function (c) { picked.push(c.value); });

      var msg = document.getElementById("form-success-msg");
      var when = data.get("date") + " · " + data.get("time");
      msg.textContent = "Thanks, " + data.get("name").split(" ")[0] +
        "! We've reserved " + when + " for your " +
        (picked.length ? picked.join(", ") : "inspection") +
        ". We'll confirm by text within one business hour.";

      var refEl = document.getElementById("form-success-ref");
      var promo = sessionStorage.getItem("apex-promo");
      refEl.textContent = "Reference " + ref + (promo ? " · Promo " + promo + " applied" : "");

      steps.forEach(function (s) { s.classList.remove("is-active"); });
      form.querySelector(".booking-form__progress").style.display = "none";
      var success = document.getElementById("form-success");
      success.hidden = false;
      success.focus();
    });
  }

  /* ---------- Reviews carousel ---------- */
  function initCarousel() {
    var track = document.getElementById("reviews-track");
    var prev = document.getElementById("rev-prev");
    var next = document.getElementById("rev-next");
    if (!track || !prev || !next) return;

    function cardWidth() {
      var card = track.querySelector(".review-card");
      return card ? card.getBoundingClientRect().width + 22 : 380;
    }
    prev.addEventListener("click", function () {
      track.scrollBy({ left: -cardWidth(), behavior: "smooth" });
    });
    next.addEventListener("click", function () {
      track.scrollBy({ left: cardWidth(), behavior: "smooth" });
    });
  }

  /* ---------- FAQ: one open at a time ---------- */
  function initFaq() {
    var items = document.querySelectorAll(".accordion__item");
    items.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (item.open) {
          items.forEach(function (other) {
            if (other !== item) other.open = false;
          });
        }
      });
    });
  }

  /* ---------- Coupon auto-apply ---------- */
  function applyPromo(code) {
    sessionStorage.setItem("apex-promo", code);
    document.querySelectorAll(".coupon").forEach(function (c) {
      var active = c.getAttribute("data-code") === code;
      c.classList.toggle("is-claimed", active);
      var btn = c.querySelector("[data-claim]");
      if (btn) btn.textContent = active ? "✓ Applied to Booking" : "Claim Offer";
    });
    var status = document.getElementById("promo-status");
    if (status) {
      status.hidden = false;
      status.innerHTML = "Promo <span class='mono'>" + code + "</span> applied — it will be included with your booking request.";
    }
    var booking = document.getElementById("booking");
    if (booking) booking.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function initCoupons() {
    document.querySelectorAll("[data-claim]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyPromo(btn.getAttribute("data-claim"));
      });
    });
    var saved = sessionStorage.getItem("apex-promo");
    if (saved) {
      document.querySelectorAll(".coupon").forEach(function (c) {
        if (c.getAttribute("data-code") === saved) {
          c.classList.add("is-claimed");
          var b = c.querySelector("[data-claim]");
          if (b) b.textContent = "✓ Applied to Booking";
        }
      });
      var status = document.getElementById("promo-status");
      if (status) {
        status.hidden = false;
        status.innerHTML = "Promo <span class='mono'>" + saved + "</span> applied — it will be included with your booking request.";
      }
    }
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    updateStatus();
    setInterval(updateStatus, 60000);
    initNav();
    initYearSelect();
    initBookingForm();
    initCarousel();
    initFaq();
    initCoupons();
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  });
})();
