document.addEventListener('DOMContentLoaded', function () {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var intro = document.querySelector('[data-city-intro]');
  if (intro) {
    document.documentElement.classList.add('has-city-intro');
    var gallery = intro.querySelector('[data-photo-gallery]');
    var photoSlides = Array.prototype.slice.call(intro.querySelectorAll('[data-photo-slide]'));
    var photoCount = intro.querySelector('[data-photo-count]');
    var photoProgress = intro.querySelector('[data-photo-progress]');
    var photoIndex = 0;
    var photoTimer = null;
    function showPhoto(index) {
      if (!photoSlides.length) return;
      photoIndex = (index + photoSlides.length) % photoSlides.length;
      photoSlides.forEach(function (slide, position) {
        var active = position === photoIndex;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      if (photoCount) photoCount.innerHTML = (photoIndex + 1) + ' <i>/</i> ' + photoSlides.length;
      if (photoProgress) {
        photoProgress.parentElement.classList.remove('is-running');
        void photoProgress.offsetWidth;
        photoProgress.parentElement.classList.add('is-running');
      }
    }
    function restartTimer() {
      if (photoTimer) window.clearInterval(photoTimer);
      if (photoSlides.length > 1) {
        photoTimer = window.setInterval(function () { showPhoto(photoIndex + 1); }, 3000);
      }
    }
    var prevBtn = intro.querySelector('[data-photo-prev]');
    var nextBtn = intro.querySelector('[data-photo-next]');
    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        showPhoto(photoIndex - 1);
        restartTimer();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        showPhoto(photoIndex + 1);
        restartTimer();
      });
    }
    restartTimer();

    var dock = intro.querySelector('[data-glass-dock]');
    if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
      intro.addEventListener('pointermove', function (event) {
        var bounds = intro.getBoundingClientRect();
        var x = (event.clientX - bounds.left) / bounds.width - 0.5;
        var y = (event.clientY - bounds.top) / bounds.height - 0.5;
        intro.style.setProperty('--parallax-x', (x * -14).toFixed(1) + 'px');
        intro.style.setProperty('--parallax-y', (y * -10).toFixed(1) + 'px');

        if (dock) {
          dock.style.setProperty('--dock-rx', (y * -7).toFixed(2) + 'deg');
          dock.style.setProperty('--dock-ry', (x * 10).toFixed(2) + 'deg');
        }
      });

      if (dock) {
        dock.addEventListener('pointermove', function (event) {
          event.stopPropagation();
          var dbounds = dock.getBoundingClientRect();
          var dx = (event.clientX - dbounds.left) / dbounds.width - 0.5;
          var dy = (event.clientY - dbounds.top) / dbounds.height - 0.5;
          dock.style.setProperty('--dock-rx', (dy * -14).toFixed(2) + 'deg');
          dock.style.setProperty('--dock-ry', (dx * 18).toFixed(2) + 'deg');

          var ibounds = intro.getBoundingClientRect();
          var ix = (event.clientX - ibounds.left) / ibounds.width - 0.5;
          var iy = (event.clientY - ibounds.top) / ibounds.height - 0.5;
          intro.style.setProperty('--parallax-x', (ix * -14).toFixed(1) + 'px');
          intro.style.setProperty('--parallax-y', (iy * -10).toFixed(1) + 'px');
        });

        dock.addEventListener('pointerleave', function () {
          dock.style.setProperty('--dock-rx', '0deg');
          dock.style.setProperty('--dock-ry', '0deg');
        });
      }

      intro.addEventListener('pointerleave', function () {
        intro.style.setProperty('--parallax-x', '0px');
        intro.style.setProperty('--parallax-y', '0px');
        if (dock) {
          dock.style.setProperty('--dock-rx', '0deg');
          dock.style.setProperty('--dock-ry', '0deg');
        }
      });
    }
    var introEntered = false;
    var enterButton = intro.querySelector('[data-enter-platform]');
    if (enterButton) enterButton.addEventListener('click', function () {
      if (introEntered) return;
      introEntered = true;
      if (photoTimer) window.clearInterval(photoTimer);
      intro.classList.add('is-leaving');
      window.setTimeout(function () {
        document.documentElement.classList.remove('has-city-intro');
        intro.remove();
      }, 1050);
    });
  }

  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.forEach(function (el) {
    if (window.bootstrap) new bootstrap.Tooltip(el);
  });

  var revealItems = document.querySelectorAll('[data-reveal]');
  if (!reducedMotion && 'IntersectionObserver' in window && revealItems.length) {
    document.documentElement.classList.add('js-motion');
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  }

  var tiltScene = document.querySelector('[data-tilt]');
  if (tiltScene && !reducedMotion && window.matchMedia('(pointer: fine)').matches) {
    tiltScene.addEventListener('pointermove', function (event) {
      var bounds = tiltScene.getBoundingClientRect();
      var x = (event.clientX - bounds.left) / bounds.width - 0.5;
      var y = (event.clientY - bounds.top) / bounds.height - 0.5;
      tiltScene.style.transform = 'rotateX(' + (-y * 3).toFixed(2) + 'deg) rotateY(' + (x * 4).toFixed(2) + 'deg)';
    });
    tiltScene.addEventListener('pointerleave', function () { tiltScene.style.transform = ''; });
  }

  // Lumora Request Modal Global Handler
  var modal = document.getElementById('request-modal');
  var modalPanel = document.getElementById('modal-panel');
  var modalClose = document.getElementById('modal-close-btn');
  var modalSuccessClose = document.getElementById('modal-success-close-btn');
  var modalFormWrap = document.getElementById('modal-form-wrap');
  var modalSuccessWrap = document.getElementById('modal-success-wrap');
  var reqForm = document.getElementById('request-form');
  var modalSubmitBtn = document.getElementById('modal-submit-btn');
  var modalBtnLabel = document.getElementById('modal-btn-label');

  function openModal() {
    if (!modal) return;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.removeProperty('overflow');
    setTimeout(function () {
      if (modalFormWrap) modalFormWrap.style.display = 'block';
      if (modalSuccessWrap) modalSuccessWrap.style.display = 'none';
      if (reqForm) reqForm.reset();
      if (modalBtnLabel) modalBtnLabel.textContent = (document.documentElement.lang === 'ar' ? 'إرسال الطلب' : 'Send request');
      if (modalSubmitBtn) modalSubmitBtn.disabled = false;
    }, 350);
  }

  document.querySelectorAll('[data-open-modal]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openModal();
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalSuccessClose) modalSuccessClose.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
  }
  if (modalPanel) {
    modalPanel.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  }
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  if (reqForm) {
    reqForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (modalSubmitBtn) modalSubmitBtn.disabled = true;
      if (modalBtnLabel) modalBtnLabel.textContent = (document.documentElement.lang === 'ar' ? 'جاري الإرسال...' : 'Sending…');
      setTimeout(function () {
        if (modalFormWrap) modalFormWrap.style.display = 'none';
        if (modalSuccessWrap) modalSuccessWrap.style.display = 'flex';
      }, 550);
    });
  }
});
