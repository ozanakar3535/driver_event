import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, push, onValue } from "firebase/database";
import { Driver, DriverStatus, EventLog, EventType, WebhookConfig } from '../types';

// 1. Firebase Yapılandırman
const firebaseConfig = {
  apiKey: "AIzaSyAQK1FQKLlzRlqGGHsAhBohissUkCW3OBI",
  authDomain: "driver-f5210.firebaseapp.com",
  projectId: "driver-f5210",
  storageBucket: "driver-f5210.firebasestorage.app",
  messagingSenderId: "939708747046",
  appId: "1:939708747046:web:a7247e3850baaf678905e7",
  measurementId: "G-08E22LJS8P",
  databaseURL: "https://driver-f5210-default-rtdb.firebaseio.com" // Proje ID'ne göre oluşturuldu
};

// Firebase Başlatma
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

interface StorageData {
  drivers: Driver[];
  events: EventLog[];
  webhookConfig: WebhookConfig;
}

// Başlangıç Verileri
const initialData: StorageData = {
  drivers: [
    { id: '1', name: 'Caner', phone: '+905551234567', status: DriverStatus.OFFLINE, totalDistance: 0, isTaskActive: false },
    { id: '2', name: 'Ayşe', phone: '+905559876543', status: DriverStatus.OFFLINE, totalDistance: 0, isTaskActive: false },
  ],
  events: [],
  webhookConfig: {
    url: 'https://api.external-system.com/webhooks',
    apiKey: 'sk_test_51MzS2J9x8yL0q',
    enabled: true,
    events: Object.values(EventType),
  },
};

export const mockApi = {
  // Verileri Firebase'den anlık dinlemek için (Admin paneli için gerekli)
  subscribeToData: (callback: (data: StorageData) => void) => {
    const dataRef = ref(db, 'appData');
    return onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Firebase listeleri nesne olarak tutabilir, diziye çeviriyoruz
        callback({
          ...data,
          drivers: data.drivers ? Object.values(data.drivers) : [],
          events: data.events ? Object.values(data.events) : []
        });
      } else {
        // Veri yoksa başlangıç verilerini yükle
        set(dataRef, initialData);
      }
    });
  },

  getData: async (): Promise<StorageData> => {
    const snapshot = await get(ref(db, 'appData'));
    if (!snapshot.exists()) {
      await set(ref(db, 'appData'), initialData);
      return initialData;
    }
    const data = snapshot.val();
    return {
      ...data,
      drivers: data.drivers ? Object.values(data.drivers) : [],
      events: data.events ? Object.values(data.events) : []
    };
  },

  addDriver: async (name: string, phone: string) => {
    const driversRef = ref(db, 'appData/drivers');
    const newDriverId = Math.random().toString(36).substr(2, 9);
    const newDriver: Driver = {
      id: newDriverId,
      name,
      phone,
      status: DriverStatus.OFFLINE,
      totalDistance: 0,
      isTaskActive: false
    };
    await update(ref(db, `appData/drivers/${newDriverId}`), newDriver);
    return newDriver;
  },

  logEvent: async (event: Omit<EventLog, 'id' | 'webhookStatus'>): Promise<EventLog> => {
    const eventId = Math.random().toString(36).substr(2, 9);
    const newEvent: EventLog = {
      ...event,
      id: eventId,
      webhookStatus: 'SUCCESS',
    };

    // 1. Olayı Kaydet
    await set(ref(db, `appData/events/${eventId}`), newEvent);

    // 2. Sürücü Durumunu Güncelle
    const driverRef = ref(db, `appData/drivers/${event.driverId}`);
    const driverSnap = await get(driverRef);
    
    if (driverSnap.exists()) {
      const driver = driverSnap.val();
      let updates: any = {
        lastLocation: {
          latitude: event.latitude,
          longitude: event.longitude,
          timestamp: event.timestamp
        }
      };

      switch (event.type) {
        case EventType.DRIVER_ONLINE:
          updates.status = DriverStatus.ONLINE;
          break;
        case EventType.DRIVER_OFFLINE:
          updates.status = DriverStatus.OFFLINE;
          updates.isTaskActive = false;
          break;
        case EventType.LOCATION_CONFIRMED:
          updates.isTaskActive = true;
          break;
        case EventType.PASSENGER_DROPPED_OFF:
          updates.isTaskActive = false;
          break;
      }

      await update(driverRef, updates);
    }

    return newEvent;
  }
};
