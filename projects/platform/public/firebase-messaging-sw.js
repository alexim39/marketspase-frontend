import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

const firebaseConfig = {
  apiKey: "AIzaSyD91TxVyx2IFPJBbAWpdeAewvtsrFnDRiA",
  authDomain: "marketspase-22a2c.firebaseapp.com",
  projectId: "marketspase-22a2c",
  storageBucket: "marketspase-22a2c.firebasestorage.app",
  messagingSenderId: "207036489332",
  appId: "1:207036489332:web:27d0174fcc53d992463b21"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'Marketspase', {
    body: body || '',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    data: payload.data,
  });
});
