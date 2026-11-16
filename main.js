/* Сайт стилиста: заставка, меню, видео, лепестки, появление при прокрутке,
   счётчики, слайдер образов и форма заявки. */
window.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var body = document.body;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DESKTOP = window.matchMedia('(min-width: 1024px)');

  // Заявки приходят на эту почту (сервис FormSubmit).
  // При первой отправке на адрес придёт письмо со ссылкой активации.
  var RECIPIENT_EMAIL = 'milokhin_danya@internet.ru';
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/' + RECIPIENT_EMAIL;
  var DRAFT_KEY = 'stylistFormDraft';

  // ---------------------------------------------------------
  // Заставка
  // ---------------------------------------------------------
  var intro = document.getElementById('intro');
  var introSeen = false;

  try {
    introSeen = window.sessionStorage.getItem('introSeen') === '1' || window.location.search.indexOf('nointro') !== -1;
  } catch (error) {
    introSeen = false;
  }

  function closeIntro() {
    intro.classList.add('is-hidden');
    body.classList.remove('is-locked');
    try {
      window.sessionStorage.setItem('introSeen', '1');
    } catch (error) {
      introSeen = true;
    }
    window.setTimeout(function () {
      intro.hidden = true;
    }, 1100);
  }

  if (introSeen) {
    intro.hidden = true;
    body.classList.remove('is-locked');
  } else {
    document.getElementById('intro-enter').addEventListener('click', closeIntro);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !intro.hidden && !intro.classList.contains('is-hidden')) {
        closeIntro();
      }
    });
  }

  // ---------------------------------------------------------
  // Меню: мобильный «занавес» + выпадающие подменю (CSS)
  // ---------------------------------------------------------
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  function setNav(open) {
    body.classList.toggle('nav-open', open);
    body.classList.toggle('is-locked', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }

  burger.addEventListener('click', function () {
    setNav(!body.classList.contains('nav-open'));
  });

  Array.prototype.forEach.call(nav.querySelectorAll('a'), function (link) {
    link.addEventListener('click', function () {
      if (body.classList.contains('nav-open')) {
        setNav(false);
      }
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && body.classList.contains('nav-open')) {
      setNav(false);
      burger.focus();
    }
  });

  DESKTOP.addEventListener('change', function () {
    if (DESKTOP.matches) {
      setNav(false);
    }
  });

  // ---------------------------------------------------------
  // Видео в шапке: если не запустилось — остаётся постер
  // ---------------------------------------------------------
  var video = document.getElementById('hero-video');
  if (video) {
    var playing = video.play();
    if (playing && typeof playing.catch === 'function') {
      playing.catch(function () {
        video.removeAttribute('autoplay');
      });
    }
    if (REDUCED) {
      video.pause();
    }
  }

  // ---------------------------------------------------------
  // Появление блоков при прокрутке
  // ---------------------------------------------------------
  var revealItems = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !REDUCED) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold: 0.12, rootMargin: '0px 0px -40px 0px'});
    Array.prototype.forEach.call(revealItems, function (item, index) {
      item.style.transitionDelay = ((index % 4) * 0.08) + 's';
      revealObserver.observe(item);
    });
  } else {
    Array.prototype.forEach.call(revealItems, function (item) {
      item.classList.add('is-visible');
    });
  }

  // ---------------------------------------------------------
  // Счётчики «Опыт»
  // ---------------------------------------------------------
  var counters = document.querySelectorAll('[data-count]');

  function runCounter(element) {
    var target = parseInt(element.getAttribute('data-count'), 10);
    var suffix = element.getAttribute('data-suffix') || '';
    var start = null;
    var duration = 1600;

    function step(timestamp) {
      var progress;
      var eased;
      if (start === null) {
        start = timestamp;
      }
      progress = Math.min((timestamp - start) / duration, 1);
      eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(target * eased) + (progress === 1 ? suffix : '');
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    }

    if (REDUCED) {
      element.textContent = target + suffix;
    } else {
      window.requestAnimationFrame(step);
    }
  }

  if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, {threshold: 0.6});
    Array.prototype.forEach.call(counters, function (item) {
      counterObserver.observe(item);
    });
  } else {
    Array.prototype.forEach.call(counters, runCounter);
  }

  // ---------------------------------------------------------
  // Лепестки в шапке (canvas)
  // ---------------------------------------------------------
  var canvas = document.getElementById('petals');
  var hero = document.getElementById('hero');

  if (canvas && canvas.getContext && !REDUCED) {
    (function () {
      var ctx = canvas.getContext('2d');
      var petals = [];
      var width = 0;
      var height = 0;
      var visible = true;
      var frameId = 0;
      var COUNT = 22;
      var i;

      function resize() {
        var ratio = Math.min(window.devicePixelRatio || 1, 2);
        width = hero.clientWidth;
        height = hero.clientHeight;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }

      function makePetal(initial) {
        return {
          x: Math.random() * width,
          y: initial ? Math.random() * height : -20,
          size: 6 + Math.random() * 9,
          speed: 0.35 + Math.random() * 0.7,
          sway: 0.4 + Math.random() * 0.9,
          phase: Math.random() * Math.PI * 2,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.03,
          alpha: 0.35 + Math.random() * 0.45
        };
      }

      function draw(timestamp) {
        var petal;
        var j;
        ctx.clearRect(0, 0, width, height);
        for (j = 0; j < petals.length; j += 1) {
          petal = petals[j];
          petal.y += petal.speed;
          petal.x += Math.sin(timestamp / 900 + petal.phase) * petal.sway * 0.5;
          petal.angle += petal.spin;
          if (petal.y > height + 20) {
            petals[j] = makePetal(false);
            petal = petals[j];
          }
          ctx.save();
          ctx.translate(petal.x, petal.y);
          ctx.rotate(petal.angle);
          ctx.globalAlpha = petal.alpha;
          ctx.fillStyle = '#f2a1b8';
          ctx.beginPath();
          ctx.moveTo(0, -petal.size);
          ctx.bezierCurveTo(petal.size, -petal.size * 0.6, petal.size * 0.8, petal.size * 0.8, 0, petal.size);
          ctx.bezierCurveTo(-petal.size * 0.8, petal.size * 0.8, -petal.size, -petal.size * 0.6, 0, -petal.size);
          ctx.fill();
          ctx.restore();
        }
        if (visible) {
          frameId = window.requestAnimationFrame(draw);
        }
      }

      resize();
      for (i = 0; i < COUNT; i += 1) {
        petals.push(makePetal(true));
      }
      window.addEventListener('resize', resize);

      // Анимация идёт только пока шапка видна на экране.
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          window.cancelAnimationFrame(frameId);
          if (visible) {
            frameId = window.requestAnimationFrame(draw);
          }
        }).observe(hero);
      } else {
        frameId = window.requestAnimationFrame(draw);
      }
    }());
  }

  // ---------------------------------------------------------
  // Слайдер образов: стрелки, точки, свайп и перетаскивание
  // ---------------------------------------------------------
  var viewport = document.getElementById('slider-viewport');
  var track = document.getElementById('slider-track');
  var prevButton = document.getElementById('slider-prev');
  var nextButton = document.getElementById('slider-next');
  var dotsList = document.getElementById('slider-dots');
  var slides = track.children;
  var sliderIndex = 0;

  function perView() {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      return 3;
    }
    return window.matchMedia('(min-width: 600px)').matches ? 2 : 1;
  }

  function maxIndex() {
    return Math.max(0, slides.length - perView());
  }

  function buildDots() {
    var count = maxIndex() + 1;
    var k;
    var item;
    var button;
    dotsList.innerHTML = '';
    for (k = 0; k < count; k += 1) {
      item = document.createElement('li');
      button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', 'Слайд ' + (k + 1) + ' из ' + count);
      button.setAttribute('data-index', String(k));
      item.appendChild(button);
      dotsList.appendChild(item);
    }
  }

  function renderSlider(offsetPx) {
    var step = 100 / perView();
    var dots = dotsList.querySelectorAll('button');
    var k;
    sliderIndex = Math.max(0, Math.min(sliderIndex, maxIndex()));
    track.style.transform = 'translateX(calc(' + (-sliderIndex * step) + '% + ' + (offsetPx || 0) + 'px))';
    prevButton.disabled = sliderIndex === 0;
    nextButton.disabled = sliderIndex === maxIndex();
    for (k = 0; k < dots.length; k += 1) {
      if (k === sliderIndex) {
        dots[k].setAttribute('aria-current', 'true');
      } else {
        dots[k].removeAttribute('aria-current');
      }
    }
  }

  function goTo(index) {
    sliderIndex = index;
    renderSlider(0);
  }

  prevButton.addEventListener('click', function () {
    goTo(sliderIndex - 1);
  });
  nextButton.addEventListener('click', function () {
    goTo(sliderIndex + 1);
  });
  dotsList.addEventListener('click', function (event) {
    var index = event.target.getAttribute('data-index');
    if (index !== null) {
      goTo(parseInt(index, 10));
    }
  });
  document.getElementById('slider').addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') {
      goTo(sliderIndex - 1);
    } else if (event.key === 'ArrowRight') {
      goTo(sliderIndex + 1);
    }
  });

  // Свайп пальцем и перетаскивание мышью.
  (function () {
    var startX = 0;
    var delta = 0;
    var dragging = false;

    function onDown(event) {
      dragging = true;
      startX = event.clientX;
      delta = 0;
      track.classList.add('is-dragging');
      viewport.classList.add('is-dragging');
      if (viewport.setPointerCapture) {
        viewport.setPointerCapture(event.pointerId);
      }
    }

    function onMove(event) {
      if (!dragging) {
        return;
      }
      delta = event.clientX - startX;
      renderSlider(delta);
    }

    function onUp() {
      var threshold;
      if (!dragging) {
        return;
      }
      dragging = false;
      track.classList.remove('is-dragging');
      viewport.classList.remove('is-dragging');
      threshold = viewport.clientWidth / perView() / 4;
      if (delta < -threshold) {
        sliderIndex += 1;
      } else if (delta > threshold) {
        sliderIndex -= 1;
      }
      renderSlider(0);
    }

    viewport.addEventListener('pointerdown', onDown);
    viewport.addEventListener('pointermove', onMove);
    viewport.addEventListener('pointerup', onUp);
    viewport.addEventListener('pointercancel', onUp);
    viewport.addEventListener('pointerleave', onUp);
  }());

  var lastPerView = perView();
  buildDots();
  renderSlider(0);
  window.addEventListener('resize', function () {
    if (perView() !== lastPerView) {
      lastPerView = perView();
      buildDots();
    }
    renderSlider(0);
  });

  // ---------------------------------------------------------
  // Кнопки «Заказать»: выбираем услугу в форме и переходим к ней
  // ---------------------------------------------------------
  var form = document.getElementById('contact-form');
  var nameField = document.getElementById('f-name');

  Array.prototype.forEach.call(document.querySelectorAll('[data-service]'), function (button) {
    button.addEventListener('click', function () {
      var wanted = button.getAttribute('data-service');
      Array.prototype.forEach.call(form.elements.service, function (radio) {
        radio.checked = radio.value === wanted;
      });
      saveDraft();
      document.getElementById('contact').scrollIntoView({behavior: REDUCED ? 'auto' : 'smooth'});
      window.setTimeout(function () {
        nameField.focus({preventScroll: true});
      }, REDUCED ? 0 : 700);
    });
  });

  // ---------------------------------------------------------
  // Форма: черновик в localStorage, проверка, отправка fetch
  // ---------------------------------------------------------
  var messageBox = document.getElementById('form-message');
  var submitButton = document.getElementById('form-submit');
  var agreeLabel = form.querySelector('.agree');
  var DRAFT_FIELDS = ['name', 'contact', 'email', 'message'];

  function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = 'form__message' + (type ? ' ' + type : '');
  }

  function saveDraft() {
    var draft = {};
    var radios = form.elements.service;
    var k;
    DRAFT_FIELDS.forEach(function (fieldName) {
      draft[fieldName] = form.elements[fieldName].value;
    });
    for (k = 0; k < radios.length; k += 1) {
      if (radios[k].checked) {
        draft.service = radios[k].value;
      }
    }
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      draft = null;
    }
  }

  function restoreDraft() {
    var draft = null;
    try {
      draft = JSON.parse(window.localStorage.getItem(DRAFT_KEY));
    } catch (error) {
      draft = null;
    }
    if (draft === null || typeof draft !== 'object') {
      return;
    }
    DRAFT_FIELDS.forEach(function (fieldName) {
      if (typeof draft[fieldName] === 'string') {
        form.elements[fieldName].value = draft[fieldName];
      }
    });
    if (typeof draft.service === 'string') {
      Array.prototype.forEach.call(form.elements.service, function (radio) {
        radio.checked = radio.value === draft.service;
      });
    }
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      showMessage('', '');
    }
  }

  function validate() {
    var ok = true;
    var email = form.elements.email.value.trim();
    var checks = [
      [form.elements.name, form.elements.name.value.trim().length > 1],
      [form.elements.contact, form.elements.contact.value.trim().length > 4],
      [form.elements.email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)]
    ];
    checks.forEach(function (check) {
      check[0].classList.toggle('is-invalid', !check[1]);
      if (!check[1]) {
        ok = false;
      }
    });
    agreeLabel.classList.toggle('is-invalid', !form.elements.agree.checked);
    if (!form.elements.agree.checked) {
      ok = false;
    }
    return ok;
  }

  restoreDraft();
  form.addEventListener('input', function (event) {
    if (event.target.classList) {
      event.target.classList.remove('is-invalid');
    }
    saveDraft();
  });
  form.addEventListener('change', function () {
    agreeLabel.classList.remove('is-invalid');
    saveDraft();
  });

  form.addEventListener('submit', function (event) {
    var radios = form.elements.service;
    var service = '';
    var payload;
    var k;

    event.preventDefault();

    if (!validate()) {
      showMessage('Пожалуйста, заполните имя, контакт, e-mail и подтвердите согласие.', 'error');
      return;
    }

    for (k = 0; k < radios.length; k += 1) {
      if (radios[k].checked) {
        service = radios[k].value;
      }
    }

    payload = {
      'Имя': form.elements.name.value.trim(),
      'Телефон или Telegram': form.elements.contact.value.trim(),
      'email': form.elements.email.value.trim(),
      'Услуга': service,
      'Сообщение': form.elements.message.value.trim(),
      '_subject': 'Новая заявка со страницы стилиста',
      '_template': 'table',
      '_captcha': 'false'
    };

    submitButton.disabled = true;
    submitButton.classList.add('is-loading');
    showMessage('Отправляем...', '');

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json();
    }).then(function (result) {
      if (result.success === 'true' || result.success === true) {
        form.reset();
        clearDraft();
        showMessage('Спасибо! Заявка отправлена, я скоро с вами свяжусь.', 'success');
      } else {
        showMessage('Не удалось отправить форму. Пожалуйста, отправьте её ещё раз.', 'error');
      }
    }).catch(function () {
      showMessage('Ошибка сети. Пожалуйста, отправьте форму ещё раз.', 'error');
    }).then(function () {
      submitButton.disabled = false;
      submitButton.classList.remove('is-loading');
    });
  });

});
