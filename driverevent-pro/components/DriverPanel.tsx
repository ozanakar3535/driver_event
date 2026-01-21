
import React, { useState, useEffect } from 'react';
import { Driver, DriverStatus, EventType } from '../types';
import { mockApi } from '../services/mockApi';

interface DriverPanelProps {
  driver: Driver;
  onLogout: () => void;
}

const DriverPanel: React.FC<DriverPanelProps> = ({ driver, onLogout }) => {
  const [localDriver, setLocalDriver] = useState<Driver>(driver);
  const [loading, setLoading] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const DEFAULT_COORDS = { latitude: 36.8969, longitude: 30.7133 };

  // Local state sync with storage for real-time KM display
  useEffect(() => {
    const interval = setInterval(() => {
      const data = mockApi.getData();
      const current = data.drivers.find(d => d.id === driver.id);
      if (current) setLocalDriver(current);
    }, 1000);
    return () => clearInterval(interval);
  }, [driver.id]);

  const getCurrentPosition = (): Promise<{ latitude: number, longitude: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(DEFAULT_COORDS);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => {
          setError(`GPS Erişimi Kısıtlı. Simüle konum kullanılıyor.`);
          resolve(DEFAULT_COORDS);
        },
        { timeout: 5000 }
      );
    });
  };

  const handleEvent = async (type: EventType) => {
    if (localDriver.status === DriverStatus.OFFLINE && type !== EventType.DRIVER_ONLINE) {
      setError("İşlem yapabilmek için mesaiye başlamalısınız.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const coords = await getCurrentPosition();
      await mockApi.logEvent({
        driverId: localDriver.id,
        driverName: localDriver.name,
        type,
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: new Date().toISOString(),
      });

      setLastEvent(`${type.replace(/_/g, ' ')} Başarılı`);
    } catch (err: any) {
      setError(err.message || "İşlem başarısız.");
    } finally {
      setLoading(false);
      setTimeout(() => setLastEvent(null), 3000);
    }
  };

  const toggleStatus = () => {
    if (localDriver.status === DriverStatus.ONLINE) {
      handleEvent(EventType.DRIVER_OFFLINE);
    } else {
      handleEvent(EventType.DRIVER_ONLINE);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 p-6 flex flex-col font-sans selection:bg-blue-500">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Kaptan {localDriver.name}</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button onClick={onLogout} className="w-12 h-12 bg-white shadow-xl rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all active:scale-90 border border-slate-100">
          <i className="fa-solid fa-power-off text-lg"></i>
        </button>
      </header>

      {/* Main Status & KM Card */}
      <div className={`rounded-[2.5rem] p-8 mb-6 shadow-2xl transition-all duration-500 relative overflow-hidden ${localDriver.status === DriverStatus.ONLINE ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-200 shadow-slate-200'}`}>
        {localDriver.isTaskActive && localDriver.status === DriverStatus.ONLINE && (
          <div className="absolute top-0 right-0 p-8 opacity-20">
             <i className="fa-solid fa-tachometer-alt text-8xl animate-pulse"></i>
          </div>
        )}

        <div className="flex justify-between items-center mb-6 relative z-10">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Sürücü Portalı</span>
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black ${localDriver.status === DriverStatus.ONLINE ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
             <div className={`w-1.5 h-1.5 rounded-full ${localDriver.status === DriverStatus.ONLINE ? 'bg-white animate-pulse' : 'bg-slate-300'}`}></div>
             {localDriver.status}
          </div>
        </div>
        
        <div className="space-y-1 mb-8 relative z-10">
          <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Toplam Mesafe</div>
          <div className="text-5xl font-black tracking-tighter tabular-nums flex items-baseline gap-2">
            {(localDriver.totalDistance || 0).toFixed(2)}
            <span className="text-lg font-bold opacity-40 italic">KM</span>
          </div>
        </div>

        {localDriver.isTaskActive && localDriver.status === DriverStatus.ONLINE && (
          <div className="mb-6 flex items-center gap-3 bg-blue-600/20 p-4 rounded-2xl border border-blue-500/30 animate-pulse">
            <i className="fa-solid fa-circle-play text-blue-400"></i>
            <span className="text-xs font-black uppercase tracking-wider text-blue-400">KM Sayacı Çalışıyor...</span>
          </div>
        )}
        
        <button 
          onClick={toggleStatus}
          disabled={loading}
          className={`w-full py-5 rounded-3xl font-black text-sm tracking-widest shadow-xl active:scale-[0.97] transition-all relative z-10 ${localDriver.status === DriverStatus.ONLINE ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : null}
          {localDriver.status === DriverStatus.ONLINE ? 'MESAİ BİTİR' : 'MESAİYE BAŞLA'}
        </button>
      </div>

      {/* Trip Actions */}
      <div className="space-y-4 flex-grow">
        <button
          onClick={() => handleEvent(EventType.LOCATION_CONFIRMED)}
          disabled={localDriver.status === DriverStatus.OFFLINE || localDriver.isTaskActive || loading}
          className={`w-full p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group transition-all ${localDriver.isTaskActive ? 'bg-slate-50 opacity-60' : 'bg-white hover:border-blue-200 active:scale-95'}`}
        >
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${localDriver.isTaskActive ? 'bg-slate-200 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
              <i className="fa-solid fa-map-marker-alt text-xl"></i>
            </div>
            <div className="text-left">
              <div className="font-black text-slate-800 tracking-tight">Konumdayım</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Sayacı Başlat</div>
            </div>
          </div>
          <i className="fa-solid fa-chevron-right text-slate-200 mr-2"></i>
        </button>

        <button
          onClick={() => handleEvent(EventType.PASSENGER_PICKED_UP)}
          disabled={localDriver.status === DriverStatus.OFFLINE || !localDriver.isTaskActive || loading}
          className="w-full bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all disabled:opacity-40"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
              <i className="fa-solid fa-user-plus text-xl"></i>
            </div>
            <div className="text-left">
              <div className="font-black text-slate-800 tracking-tight">Yolcu Alındı</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Transfer Devam Ediyor</div>
            </div>
          </div>
          <i className="fa-solid fa-chevron-right text-slate-200 mr-2"></i>
        </button>

        <button
          onClick={() => handleEvent(EventType.PASSENGER_DROPPED_OFF)}
          disabled={localDriver.status === DriverStatus.OFFLINE || !localDriver.isTaskActive || loading}
          className="w-full bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all disabled:opacity-40"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
              <i className="fa-solid fa-flag-checkered text-xl"></i>
            </div>
            <div className="text-left">
              <div className="font-black text-slate-800 tracking-tight">Yolcu İndirildi</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Sayacı Durdur & Kaydet</div>
            </div>
          </div>
          <i className="fa-solid fa-stop text-emerald-500 mr-2"></i>
        </button>
      </div>

      {/* Notifications */}
      {lastEvent && (
        <div className="fixed bottom-10 left-8 right-8 bg-slate-900 text-white py-4 px-6 rounded-3xl shadow-2xl flex items-center gap-4 animate-bounce z-50 border border-slate-700">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-check text-sm"></i>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{lastEvent}</span>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-[10px] font-black flex items-start gap-3">
          <i className="fa-solid fa-circle-exclamation mt-0.5 text-lg"></i>
          <span>{error}</span>
        </div>
      )}
      
      <footer className="mt-12 text-center text-slate-300 text-[9px] font-black tracking-[0.4em] uppercase py-6">
        DriverEvent Pro Trip-Tracker
      </footer>
    </div>
  );
};

export default DriverPanel;
