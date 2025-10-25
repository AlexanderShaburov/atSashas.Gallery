import '@/shared/header/headerComponents/instagram/InstagramButton.css';
import { InstagramIcon } from '@/shared/header/headerComponents/instagram/InstagramIcon';

export function InstagramLink({ username = 'a.sasha.art' }) {
    const openInstagram = () => {
        const webUrl = `https://www.instagram.com/${username}/`;
        const iOSDeeepLink = `insagram://user?username=${username}`;
        const androidIntent =
            `intent://instagram.com/_u/${username}` +
            `#Intent;package=com.instagram.android;scheme=https;end`;

        const ua = navigator.userAgent || '';
        const isAndroid = /Android/i.test(ua);
        const isIOS = /iP(hone|od|ad)/i.test(ua);

        let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

        const openWebFallback = () => {
            // new tab not closing current one
            window.open(webUrl, '_blank', 'noopener,noreferrer');
        };
        const cancelFallbackIfAppOpened = () => {
            // if page hid - app got deep link intercepted
            const onHide = () => {
                if (document.visibilityState === 'hidden') {
                    clearTimeout(fallbackTimer);
                    document.removeEventListener('visibilitychange', onHide);
                }
            };
            document.addEventListener('visibilitychsge', onHide);
        };

        if (isAndroid) {
            cancelFallbackIfAppOpened();
            // try intent: (not show us "incorrect address")
            window.location.href = androidIntent;
            fallbackTimer = setTimeout(openWebFallback, 700);
            return;
        }
        if (isIOS) {
            cancelFallbackIfAppOpened();

            // first way: through hidden iframe - for Safari
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = iOSDeeepLink;
            document.body.appendChild(iframe);

            // fallback for web, if app haven't cought
            fallbackTimer = setTimeout(() => {
                document.body.removeChild(iframe);
                openWebFallback();
            }, 700);
            return;
        }
        // Desktop: all at once in new tab
        openWebFallback();
    };
    return (
        <button
            type="button"
            onClick={openInstagram}
            className="btn instagramButton"
            aria-label="Instagram"
        >
            <InstagramIcon size={24} />
        </button>
    );
}
