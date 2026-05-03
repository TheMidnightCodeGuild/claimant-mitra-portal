import { useEffect, useState, useCallback } from 'react';

function isStandalonePwa() {
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIosTouchDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * @param {{ variant?: 'outline' | 'compact' }} props
 */
export default function PwaInstallButton({ variant = 'outline' }) {
  const [ui, setUi] = useState('checking');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [iosModalOpen, setIosModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isStandalonePwa()) {
      setUi('hidden');
      return;
    }

    const iOS = isIosTouchDevice();
    if (iOS) {
      setUi('ios');
    }

    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setUi('chromium');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (ui === 'chromium' && deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
      } catch {
        /* user dismissed or prompt failed */
      }
      setDeferredPrompt(null);
      setUi('hidden');
      return;
    }
    if (ui === 'ios') {
      setIosModalOpen(true);
    }
  }, [ui, deferredPrompt]);

  if (ui === 'hidden' || ui === 'checking') {
    return null;
  }

  const compact = variant === 'compact';
  const buttonClass = compact
    ? 'flex-1 sm:flex-initial min-h-[44px] px-3 py-2 border border-gray-300 bg-white text-gray-800 text-sm font-medium rounded-lg transition duration-200 inline-flex items-center justify-center gap-2 hover:bg-gray-50 touch-manipulation'
    : 'w-full min-h-[44px] px-4 py-2.5 border-2 border-gray-300 bg-white text-gray-800 text-sm sm:text-base font-medium rounded-lg transition duration-200 inline-flex items-center justify-center gap-2 hover:bg-gray-50 touch-manipulation';

  const label = ui === 'ios' ? 'Add to Home Screen' : 'Install app';

  return (
    <>
      <button type="button" onClick={handleInstallClick} className={buttonClass}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={compact ? 'h-5 w-5 shrink-0' : 'h-5 w-5 shrink-0'}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span>{compact ? (ui === 'ios' ? 'Add to Home' : 'Install') : label}</span>
      </button>

      {iosModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-ios-install-title"
          onClick={() => setIosModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="pwa-ios-install-title" className="text-lg font-semibold text-gray-900 mb-3">
              Add to Home Screen
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 mb-6">
              <li>Tap the Share button <span className="font-medium">(square with arrow)</span> in Safari&apos;s toolbar.</li>
              <li>Scroll and tap <span className="font-medium">Add to Home Screen</span>.</li>
              <li>Tap <span className="font-medium">Add</span> to confirm.</li>
            </ol>
            <button
              type="button"
              onClick={() => setIosModalOpen(false)}
              className="min-h-[44px] w-full py-2 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium touch-manipulation"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
