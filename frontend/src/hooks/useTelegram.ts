import { useEffect, useState, useCallback } from 'react';
import WebApp from '@twa-dev/sdk';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export const useTelegram = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [webApp, setWebApp] = useState<typeof WebApp | null>(null);

  useEffect(() => {
    // Инициализация Telegram WebApp
    WebApp.ready();
    setWebApp(WebApp);

    // Получение данных пользователя
    if (WebApp.initDataUnsafe.user) {
      setUser(WebApp.initDataUnsafe.user as TelegramUser);
    }

    // Настройка темы
    WebApp.expand();
    
    // Настройка кнопки "Назад"
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(() => {
      window.history.back();
    });

    return () => {
      WebApp.BackButton.offClick(() => {
        window.history.back();
      });
    };
  }, []);

  const showMainButton = useCallback((text: string, onClick: () => void) => {
    if (webApp) {
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
    }
  }, [webApp]);

  const hideMainButton = useCallback(() => {
    if (webApp) {
      webApp.MainButton.hide();
    }
  }, [webApp]);

  const showAlert = useCallback((message: string) => {
    if (webApp) {
      webApp.showAlert(message);
    }
  }, [webApp]);

  const showConfirm = useCallback((message: string, callback: (confirmed: boolean) => void) => {
    if (webApp) {
      webApp.showConfirm(message, callback);
    }
  }, [webApp]);

  const closeApp = useCallback(() => {
    if (webApp) {
      webApp.close();
    }
  }, [webApp]);

  return {
    user,
    webApp,
    showMainButton,
    hideMainButton,
    showAlert,
    showConfirm,
    closeApp,
  };
};
