declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Tải Google Identity Services (GIS) SDK
 */
export const initGoogleSdk = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    if (!document.getElementById('google-gsi-client')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      document.body.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    }
  });
};

/**
 * Mở popup đăng nhập Google và lấy accessToken
 */
export const triggerGoogleLogin = async (): Promise<string> => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Chưa cấu hình VITE_GOOGLE_CLIENT_ID trong file .env của Frontend!');
  }

  await initGoogleSdk();

  return new Promise((resolve, reject) => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('Không nhận được access token từ Google'));
          }
        },
      });

      client.requestAccessToken();
    } catch (err) {
      reject(err);
    }
  });
};
