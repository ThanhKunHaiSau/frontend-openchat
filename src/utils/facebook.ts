declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: any;
  }
}

/**
 * Tải và khởi tạo Facebook JavaScript SDK
 */
export const initFacebookSdk = (): Promise<void> => {
  return new Promise((resolve) => {
    // Nếu SDK đã nạp rồi thì resolve luôn
    if (window.FB) {
      resolve();
      return;
    }

    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: appId || '',
        cookie: true,
        xfbml: true,
        version: 'v20.0',
      });
      resolve();
    };

    // Chèn script SDK của Facebook vào thẻ <head>
    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/vi_VN/sdk.js';
      js.async = true;
      js.defer = true;
      document.body.appendChild(js);
    }
  });
};

/**
 * Mở popup đăng nhập Facebook và lấy accessToken
 */
export const triggerFacebookLogin = async (): Promise<string> => {
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
  if (!appId) {
    throw new Error('Chưa cấu hình VITE_FACEBOOK_APP_ID trong file .env của Frontend!');
  }

  await initFacebookSdk();

  return new Promise((resolve, reject) => {
    window.FB.login(
      (response: any) => {
        if (response.authResponse && response.authResponse.accessToken) {
          resolve(response.authResponse.accessToken);
        } else {
          reject(new Error(response.status === 'not_authorized' ? 'Bạn chưa ủy quyền cho ứng dụng' : 'Đã hủy đăng nhập Facebook'));
        }
      },
      { scope: 'public_profile,email' }
    );
  });
};
