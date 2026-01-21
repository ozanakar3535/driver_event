
export enum EventType {
  DRIVER_ONLINE = 'DRIVER_ONLINE',
  DRIVER_OFFLINE = 'DRIVER_OFFLINE',
  LOCATION_CONFIRMED = 'LOCATION_CONFIRMED',
  PASSENGER_PICKED_UP = 'PASSENGER_PICKED_UP',
  PASSENGER_DROPPED_OFF = 'PASSENGER_DROPPED_OFF'
}

export enum DriverStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE'
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  isTaskActive?: boolean; // Konumdayım basınca true, İndirildi basınca false
  totalDistance?: number; // Toplam katedilen KM
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

export interface EventLog {
  id: string;
  driverId: string;
  driverName: string;
  type: EventType;
  latitude: number;
  longitude: number;
  timestamp: string;
  webhookStatus?: 'SUCCESS' | 'FAILED' | 'RETRYING';
}

export interface WebhookConfig {
  url: string;
  apiKey: string;
  enabled: boolean;
  events: EventType[];
}

export interface AppState {
  currentUser: Driver | null;
  drivers: Driver[];
  events: EventLog[];
  webhookConfig: WebhookConfig;
}
