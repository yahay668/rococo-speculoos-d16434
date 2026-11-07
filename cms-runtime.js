/* CMS data bridge. It leaves the existing build unchanged until CMS data differs. */
(function () {
  "use strict";

  var state = { home: null, contact: null, gallery: [] };

  function normalize(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function updateHome() {
    var home = state.home || {};
    var hero = document.querySelector(".hero");
    var heading = document.querySelector(".hero-content h1");
    var intro = document.querySelector(".hero-content p");

    if (heading && home.title && normalize(heading.textContent) !== normalize(home.title)) {
      var parts = home.title.split(" للعقار");
      heading.textContent = parts.length > 1 ? parts[0] : home.title;
      if (parts.length > 1) {
        var strong = document.createElement("strong");
        strong.textContent = " للعقار" + parts.slice(1).join(" للعقار");
        heading.appendChild(document.createElement("br"));
        heading.appendChild(strong);
      }
    }
    if (intro && home.intro && normalize(intro.textContent) !== normalize(home.intro)) {
      intro.textContent = home.intro;
    }
    if (hero && home.background_image) {
      var current = hero.style.backgroundImage || "";
      if (current.indexOf(home.background_image) === -1) {
        hero.style.backgroundImage = 'url("' + home.background_image + '")';
      }
    }
  }

  function updateContact() {
    var contact = state.contact || {};
    if (contact.phone) {
      document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
        link.href = "tel:" + contact.phone;
      });
    }
    if (contact.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) {
        link.href = "mailto:" + contact.email;
        var small = link.querySelector("small");
        if (small) small.textContent = contact.email;
      });
    }
    if (contact.whatsapp) {
      document.querySelectorAll('a[href*="wa.me"]').forEach(function (link) {
        link.href = contact.whatsapp;
      });
    }
  }

  function updateGallery() {
    var items = state.gallery || [];
    var featuredOnly = !!document.querySelector(".property-grid.featured-grid");
    var cards = Array.prototype.slice.call(document.querySelectorAll(".property-grid:not(.featured-grid) .property-card, .property-grid.featured-grid .property-card"));
    if (!items.length || !cards.length) return;

    items.forEach(function (item, index) {
      var card = cards[index];
      if (!card && !featuredOnly && cards[0]) {
        card = cards[0].cloneNode(true);
        var grid = cards[0].parentElement;
        if (grid) grid.appendChild(card);
        cards.push(card);
      }
      if (!card) return;
      card.style.display = "";
      var image = card.querySelector("img");
      var title = card.querySelector("h3");
      var location = card.querySelector(".location");
      if (image && item.image) {
        image.src = item.image;
        image.alt = item.title || "";
      }
      if (title && item.title) title.textContent = item.title;
      if (location && item.description) location.setAttribute("data-cms-description", item.description);
      var button = card.querySelector("button");
      if (button && item.title) {
        button.onclick = function () {
          var phone = (state.contact && state.contact.whatsapp) || "https://wa.me/966555577499";
          window.open(phone + "?text=" + encodeURIComponent("أرغب بالاستفسار عن: " + item.title), "_blank", "noopener,noreferrer");
        };
      }
    });
    if (!featuredOnly) cards.slice(items.length).forEach(function (card) { card.style.display = "none"; });
  }

  function apply() {
    updateHome();
    updateContact();
    updateGallery();
    window.__EmaarCmsContent = state;
  }

  function load(url) {
    return fetch(url, { cache: "no-store" }).then(function (response) {
      return response.ok ? response.json() : null;
    }).catch(function () { return null; });
  }

  Promise.all([load("/content/home.json"), load("/content/contact.json"), load("/content/gallery.json")]).then(function (data) {
    state.home = data[0] || {};
    state.contact = data[1] || {};
    state.gallery = data[2] && Array.isArray(data[2].items) ? data[2].items : [];
    apply();
    setTimeout(apply, 300);
    setTimeout(apply, 1200);
  });
})();
