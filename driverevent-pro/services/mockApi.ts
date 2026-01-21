
import { Driver, DriverStatus, EventLog, EventType, WebhookConfig } from '../types';

const STORAGE_KEY = 'driver_event_pro_data_v2';

interface StorageData {
  drivers: Driver[];
  events: EventLog[];
  webhookConfig: WebhookConfig;
}

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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Arka plan simülasyonu: Mesai aktifken ve KM sayacı (isTaskActive) açıkken mesafe ekler
setInterval(() => {
  const dataStr = localStorage.getItem(STORAGE_KEY);
  if (!dataStr) return;
  const parsedData: StorageData = JSON.parse(dataStr);
  let changed = false;

  parsedData.drivers.forEach(driver => {
    // Sadece ONLINE olan sürücüler hareket simülasyonuna dahil olur
    if (driver.status === DriverStatus.ONLINE && driver.lastLocation) {
      const oldLat = driver.lastLocation.latitude;
      const oldLng = driver.lastLocation.longitude;

      // Çok küçük bir drift simülasyonu
      const driftLat = (Math.random() - 0.5) * 0.0004; 
      const driftLng = (Math.random() - 0.5) * 0.0004;
      
      const newLat = oldLat + driftLat;
      const newLng = oldLng + driftLng;

      // Sadece 'Konumdayım' basılmışsa (isTaskActive true) KM sayacı işler
      if (driver.isTaskActive) {
        const distanceMoved = calculateDistance(oldLat, oldLng, newLat, newLng);
        driver.totalDistance = (driver.totalDistance || 0) + distanceMoved;
      }

      driver.lastLocation = {
        latitude: newLat,
        longitude: newLng,
        timestamp: new Date().toISOString()
      };
      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
  }
}, 3000);

export const mockApi = {
  getData: (): StorageData => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(data);
  },

  saveData: (data: StorageData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  addDriver: (name: string, phone: string) => {
    const data = mockApi.getData();
    const newDriver: Driver = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      phone,
      status: DriverStatus.OFFLINE,
      totalDistance: 0,
      isTaskActive: false
    };
    data.drivers.push(newDriver);
    mockApi.saveData(data);
    return newDriver;
  },

  logEvent: async (event: Omit<EventLog, 'id' | 'webhookStatus'>): Promise<EventLog> => {
    const data = mockApi.getData();
    const newEvent: EventLog = {
      ...event,
      id: Math.random().toString(36).substr(2, 9),
      webhookStatus: 'SUCCESS',
    };

    // Olayı en başa ekle
    data.events.unshift(newEvent);
    
    const driverIdx = data.drivers.findIndex(d => d.id === event.driverId);
    if (driverIdx !== -1) {
      const driver = data.drivers[driverIdx];

      // Olay tiplerine göre sürücü durumunu güncelle
      switch (event.type) {
        case EventType.DRIVER_ONLINE:
          driver.status = DriverStatus.ONLINE;
          break;
        case EventType.DRIVER_OFFLINE:
          driver.status = DriverStatus.OFFLINE;
          driver.isTaskActive = false; // Güvenlik: Mesai biterse transfer de biter
          break;
        case EventType.LOCATION_CONFIRMED:
          driver.isTaskActive = true;
          break;
        case EventType.PASSENGER_DROPPED_OFF:
          driver.isTaskActive = false;
          break;
      }

      // Son konumu her zaman güncelle
      driver.lastLocation = {
        latitude: event.latitude,
        longitude: event.longitude,
        timestamp: event.timestamp
      };
    }

    mockApi.saveData(data);
    return newEvent;
  }
};
