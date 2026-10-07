// PWA Service Worker Registration & Custom Mobile Install Prompt
(function() {
  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('PWA Service Worker registered:', reg.scope))
        .catch(err => console.warn('PWA SW registration failed:', err));
    });
  }

  // 2. Detect standalone mode (already installed)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone ||
                       document.referrer.includes('android-app://');

  if (isStandalone) {
    // Already running as an installed app!
    return;
  }

  // Detect iOS Safari
  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const isSafari = /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);

  let deferredPrompt = null;

  // Listen for beforeinstallprompt (Android Chrome / Edge)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt(false);
  });

  // If iOS Safari and not dismissed before, show gentle prompt
  if (isIos && isSafari && !sessionStorage.getItem('pwa_prompt_dismissed')) {
    setTimeout(() => {
      showInstallPrompt(true);
    }, 3000);
  }

  function showInstallPrompt(isIosDevice) {
    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="pwa-banner-card">
        <button class="pwa-close-btn" aria-label="إغلاق">&times;</button>
        <div class="pwa-icon-area">
          <img src="/icons/icon-192.png" alt="أيقونة رأس غارب" class="pwa-app-icon">
        </div>
        <div class="pwa-text-area">
          <div class="pwa-title">تطبيق منصة رأس غارب</div>
          <div class="pwa-desc">${isIosDevice ? 'أضف التطبيق لشاشتك لتجربة أسرع بدون متصفح' : 'ثبّت التطبيق على هاتفك لتجربة تصفح فورية وسلسة'}</div>
        </div>
        <button class="pwa-action-btn" id="pwa-action-trigger">
          ${isIosDevice ? 'كيفية التثبيت' : 'تثبيت الآن'}
        </button>
      </div>

      ${isIosDevice ? `
        <div class="pwa-ios-modal" id="pwa-ios-guide" style="display:none;">
          <div class="pwa-ios-modal-inner">
            <div class="pwa-ios-step">
              <span class="pwa-step-num">1</span>
              <span>اضغط على زر المشاركة <strong>(Share <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>)</strong> أسفل شاشة Safari.</span>
            </div>
            <div class="pwa-ios-step">
              <span class="pwa-step-num">2</span>
              <span>مرر للأسفل واختر <strong>"إضافة إلى الصفحة الرئيسية" (Add to Home Screen)</strong>.</span>
            </div>
            <div class="pwa-ios-step">
              <span class="pwa-step-num">3</span>
              <span>اضغط <strong>"إضافة" (Add)</strong> بالأعلى لتجد أيقونة التطبيق على شاشتك.</span>
            </div>
            <button class="pwa-ios-ok-btn" id="pwa-ios-close-guide">فهمت، حسناً</button>
          </div>
        </div>
      ` : ''}
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #pwa-install-banner {
        position: fixed;
        bottom: 1.25rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        width: calc(100% - 2rem);
        max-width: 480px;
        animation: pwaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Cairo', 'IBM Plex Sans Arabic', -apple-system, sans-serif;
        direction: rtl;
      }
      @keyframes pwaSlideUp {
        from { transform: translate(-50%, 100px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
      .pwa-banner-card {
        background: rgba(15, 23, 42, 0.94);
        border: 1px solid rgba(56, 189, 248, 0.3);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-radius: 20px;
        padding: 0.9rem 1.1rem;
        display: flex;
        align-items: center;
        gap: 0.85rem;
        box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.65), 0 0 25px rgba(56, 189, 248, 0.15);
        color: #ffffff;
        position: relative;
      }
      .pwa-close-btn {
        position: absolute;
        top: -8px;
        left: -8px;
        width: 24px;
        height: 24px;
        background: #334155;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e2e8f8;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: pointer;
      }
      .pwa-app-icon {
        width: 46px;
        height: 46px;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: block;
      }
      .pwa-text-area {
        flex: 1;
        min-width: 0;
      }
      .pwa-title {
        font-weight: 700;
        font-size: 0.92rem;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .pwa-desc {
        font-size: 0.76rem;
        color: #94a3b8;
        line-height: 1.3;
        margin-top: 2px;
      }
      .pwa-action-btn {
        background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
        color: #ffffff;
        border: none;
        border-radius: 12px;
        padding: 0.6rem 0.95rem;
        font-size: 0.84rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
        transition: transform 0.15s ease;
      }
      .pwa-action-btn:active {
        transform: scale(0.95);
      }
      .pwa-ios-modal {
        margin-top: 0.75rem;
        background: rgba(15, 23, 42, 0.96);
        border: 1px solid rgba(56, 189, 248, 0.3);
        border-radius: 16px;
        padding: 1rem;
        color: #ffffff;
      }
      .pwa-ios-step {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.6rem;
        font-size: 0.82rem;
        color: #cbd5e1;
      }
      .pwa-step-num {
        width: 22px;
        height: 22px;
        background: #0284c7;
        color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 0.75rem;
        flex-shrink: 0;
      }
      .pwa-ios-ok-btn {
        width: 100%;
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: #334155;
        color: #fff;
        border: none;
        border-radius: 10px;
        font-weight: bold;
        font-size: 0.8rem;
        cursor: pointer;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(banner);

    // Event handlers
    const closeBtn = banner.querySelector('.pwa-close-btn');
    closeBtn.addEventListener('click', () => {
      banner.remove();
      sessionStorage.setItem('pwa_prompt_dismissed', 'true');
    });

    const actionTrigger = banner.querySelector('#pwa-action-trigger');
    actionTrigger.addEventListener('click', async () => {
      if (isIosDevice) {
        const guide = banner.querySelector('#pwa-ios-guide');
        if (guide) guide.style.display = guide.style.display === 'none' ? 'block' : 'none';
      } else if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        deferredPrompt = null;
        banner.remove();
      }
    });

    const iosCloseGuide = banner.querySelector('#pwa-ios-close-guide');
    if (iosCloseGuide) {
      iosCloseGuide.addEventListener('click', () => {
        banner.remove();
        sessionStorage.setItem('pwa_prompt_dismissed', 'true');
      });
    }
  }
})();

