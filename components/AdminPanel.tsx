
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Driver, DriverStatus, EventType, EventLog } from '../types';
import { mockApi } from '../services/mockApi';

declare const L: any;

interface Trip {
  id: string;
  startTime: string;
  endTime?: string;
  events: EventLog[];
  distance: number;
}

interface TripCardProps {
  trip: Trip;
  isActive?: boolean;
  expandedTripId: string | null;
  setExpandedTripId: (id: string | null) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, isActive = false, expandedTripId, setExpandedTripId }) => (
  <div className={`bg-white rounded-[2rem] shadow-lg border ${isActive ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200/50'} overflow-hidden transition-all group animate-in fade-in slide-in-from-bottom-2`}>
    <div className="p-8 flex flex-col md:flex-row items-center gap-8">
      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner ${isActive ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
        <i className={`fa-solid ${isActive ? 'fa-spinner fa-spin' : 'fa-check-circle'} text-2xl`}></i>
      </div>
      <div className="flex-grow space-y-2">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {isActive ? 'Mevcut Aktif Mesai' : 'Tamamlanan Oturum'}
          </span>
          <span className="text-xs font-black text-slate-400 italic">
            {new Date(trip.startTime).toLocaleDateString('tr-TR')}
          </span>
        </div>
        <div className="text-xl font-black text-slate-900 flex items-center gap-4">
          {new Date(trip.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          <i className="fa-solid fa-arrow-right-long text-slate-200 text-sm"></i>
          {trip.endTime ? new Date(trip.endTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Mesai Devam Ediyor'}
        </div>
      </div>
      <div className="text-right border-l border-slate-100 pl-8">
        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Oturum KM</div>
        <div className="text-3xl font-black text-slate-900">
          {trip.distance.toFixed(2)} <span className="text-sm text-slate-400">KM</span>
        </div>
      </div>
      <button 
        onClick={() => setExpandedTripId(expandedTripId === trip.id ? null : trip.id)}
        className="bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl transition-all"
      >
        <i className={`fa-solid fa-chevron-${expandedTripId === trip.id ? 'up' : 'down'} text-slate-400`}></i>
      </button>
    </div>

    {expandedTripId === trip.id && (
      <div className="bg-slate-50/80 px-8 py-6 border-t border-slate-100">
        <div className="mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Oturum Akış Detayları</div>
        <div className="space-y-3">
          {[...trip.events].reverse().map((ev) => (
            <div key={ev.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  ev.type === EventType.DRIVER_ONLINE ? 'bg-blue-400' :
                  ev.type === EventType.DRIVER_OFFLINE ? 'bg-slate-400' :
                  ev.type === EventType.LOCATION_CONFIRMED ? 'bg-blue-600' :
                  ev.type === EventType.PASSENGER_PICKED_UP ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}></div>
                <div>
                  <div className="text-xs font-black text-slate-800 uppercase tracking-tighter">
                    {ev.type.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold italic">
                    {new Date(ev.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              </div>
              <a 
                href={`https://maps.google.com/?q=${ev.latitude},${ev.longitude}`} 
                target="_blank" 
                rel="noreferrer"
                className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              >
                Haritada Gör
              </a>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const AdminPanel: React.FC = () => {
  const [data, setData] = useState<any>({ drivers: [], events: [] });
  const [activeTab, setActiveTab] = useState<'map' | 'logs' | 'drivers' | 'settings'>('map');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('ALL');
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // KRİTİK: Firebase Gerçek Zamanlı Dinleyici
  useEffect(() => {
    setIsSyncing(true);
    const unsubscribe = mockApi.subscribe((cloudData) => {
      setData(cloudData);
      setIsSyncing(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let mapTimeout: any;
    if (activeTab === 'map' && mapContainerRef.current && !mapRef.current) {
      mapTimeout = setTimeout(() => {
        if (!mapContainerRef.current) return;
        mapRef.current = L.map(mapContainerRef.current, { zoomControl: false }).setView([36.8969, 30.7133], 13);
        L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
        mapRef.current.invalidateSize();
      }, 100);
    }
    return () => {
      if (mapTimeout) clearTimeout(mapTimeout);
      if (activeTab !== 'map' && mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = {};
      }
    };
  }, [activeTab]);

  useEffect(() => {
    if (mapRef.current && activeTab === 'map' && data.drivers) {
      data.drivers.forEach((driver: any) => {
        if (driver.lastLocation) {
          const { latitude, longitude } = driver.lastLocation;
          const isOnline = driver.status === DriverStatus.ONLINE;
          const icon = L.divIcon({
            className: 'custom-gps-icon',
            html: `<div class="relative flex items-center justify-center">${isOnline ? '<div class="absolute w-10 h-10 bg-blue-500/20 rounded-full animate-ping"></div>' : ''}<div class="relative z-10 w-6 h-6 rounded-full border-2 border-white shadow-lg ${isOnline ? 'bg-blue-600' : 'bg-slate-400'} flex items-center justify-center"><i class="fa-solid fa-car text-[10px] text-white"></i></div></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });
          if (markersRef.current[driver.id]) {
            markersRef.current[driver.id].setLatLng([latitude, longitude]);
          } else {
            markersRef.current[driver.id] = L.marker([latitude, longitude], { icon }).addTo(mapRef.current)
              .bindPopup(`<b class="font-sans">${driver.name}</b><br/><span class="text-[10px] font-bold text-blue-600">${(driver.totalDistance || 0).toFixed(2)} KM Toplam</span>`);
          }
        }
      });
    }
  }, [data.drivers, activeTab]);

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName && newPhone) {
      await mockApi.addDriver(newName, newPhone);
      setNewName(''); setNewPhone('');
    }
  };

  const handleResetData = async () => {
    if (window.confirm("Firebase üzerindeki tüm veriler sıfırlanacaktır. Emin misiniz?")) {
      await mockApi.resetData();
    }
  };

  const tripData = useMemo(() => {
    if (selectedDriverId === 'ALL' || !data.events) return { completed: [], active: null };
    
    // Firebase events listesini tarihine göre sırala (Eskiden yeniye)
    const driverEvents = [...data.events]
      .filter(e => e.driverId === selectedDriverId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const completed: Trip[] = [];
    let currentTrip: Trip | null = null;

    driverEvents.forEach(event => {
      if (event.type === EventType.DRIVER_ONLINE) {
        if (currentTrip) {
          if (!currentTrip.endTime) currentTrip.endTime = event.timestamp;
          completed.unshift(currentTrip);
        }
        currentTrip = {
          id: event.id,
          startTime: event.timestamp,
          events: [event],
          distance: 0
        };
      } 
      else if (!currentTrip && event.type === EventType.LOCATION_CONFIRMED) {
        currentTrip = {
          id: event.id,
          startTime: event.timestamp,
          events: [event],
          distance: 0
        };
      }
      else if (currentTrip) {
        currentTrip.events.push(event);
        if (event.type !== EventType.DRIVER_OFFLINE) {
          currentTrip.distance += 0.35;
        }
        if (event.type === EventType.DRIVER_OFFLINE) {
          currentTrip.endTime = event.timestamp;
          completed.unshift(currentTrip);
          currentTrip = null;
        }
      }
    });

    return { completed, active: currentTrip };
  }, [data.events, selectedDriverId]);

  const selectedDriver = data.drivers?.find((d: any) => d.id === selectedDriverId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-72 bg-[#0f172a] text-white flex flex-col z-30 shrink-0">
        <div className="p-8 border-b border-slate-800">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
               <i className="fa-solid fa-bolt text-white"></i>
            </div>
            <span className="font-black text-2xl tracking-tighter italic">DRIVE<span className="text-blue-500">FIRE</span></span>
          </div>
          <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isSyncing ? 'Firebase Senkron...' : 'Firebase Realtime Aktif'}</p>
          </div>
        </div>
        
        <nav className="p-4 space-y-2 flex-grow">
          <button onClick={() => setActiveTab('map')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all font-bold text-sm ${activeTab === 'map' ? 'bg-blue-600 shadow-xl' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <i className="fa-solid fa-map-location-dot"></i> Harita Takip
          </button>
          <button onClick={() => setActiveTab('drivers')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all font-bold text-sm ${activeTab === 'drivers' ? 'bg-blue-600 shadow-xl' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <i className="fa-solid fa-id-card"></i> Sürücü Oluştur
          </button>
          <button onClick={() => setActiveTab('logs')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all font-bold text-sm ${activeTab === 'logs' ? 'bg-blue-600 shadow-xl' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <i className="fa-solid fa-book-open"></i> Kayıt Defteri
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all font-bold text-sm ${activeTab === 'settings' ? 'bg-blue-600 shadow-xl' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <i className="fa-solid fa-gear"></i> Ayarlar & Test
          </button>
        </nav>
      </aside>

      <main className="flex-grow flex flex-col relative overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-10 py-6 flex justify-between items-center z-20">
          <div>
            <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Operasyon Yönetimi (Firebase)</h2>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {activeTab === 'map' ? 'Filo Canlı Takip' : activeTab === 'logs' ? 'Transfer Kayıt Defteri' : activeTab === 'drivers' ? 'Sürücü Veritabanı' : 'Sistem Ayarları'}
            </div>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto bg-slate-50">
          {activeTab === 'map' && <div className="absolute inset-0 z-0"><div ref={mapContainerRef} className="w-full h-full" /></div>}

          {activeTab === 'drivers' && (
            <div className="p-10 space-y-10 max-w-5xl">
              <div className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-200/50">
                <h3 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tighter flex items-center gap-3"><i className="fa-solid fa-user-plus text-blue-500"></i> Yeni Sürücü Tanımla</h3>
                <form onSubmit={handleAddDriver} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kullanıcı Adı</label>
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Örn: Mehmet" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-blue-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefon</label>
                    <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+90..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-blue-500 transition-all" />
                  </div>
                  <div className="flex items-end"><button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all uppercase text-xs tracking-widest">Sürücüyü Ekle</button></div>
                </form>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200/50 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black border-b border-slate-100">
                      <th className="px-8 py-5">Sürücü İsmi</th>
                      <th className="px-8 py-5">Telefon</th>
                      <th className="px-8 py-5 text-right">Toplam KM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                    {data.drivers?.map((d: any) => (
                      <tr key={d.id} className="hover:bg-blue-50/30 transition-all">
                        <td className="px-8 py-6">{d.name}</td>
                        <td className="px-8 py-6 text-slate-400">{d.phone}</td>
                        <td className="px-8 py-6 text-right font-black text-slate-900">{(d.totalDistance || 0).toFixed(2)} KM</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="p-10 space-y-12 max-w-6xl">
              <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-2 w-full md:w-auto">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kayıt Defteri Sürücü Seçimi</label>
                   <select className="w-full md:w-80 bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-black outline-none focus:border-blue-500 transition-all shadow-sm" value={selectedDriverId} onChange={(e) => { setSelectedDriverId(e.target.value); setExpandedTripId(null); }}>
                     <option value="ALL">Genel Sistem Akışı</option>
                     {data.drivers?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                   </select>
                </div>
              </div>

              {selectedDriverId !== 'ALL' && (
                <div className="space-y-12">
                  <section className="space-y-6">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest ml-2 flex items-center gap-3"><i className="fa-solid fa-clock-rotate-left text-blue-500"></i> Mevcut Aktif Mesai</h4>
                    {tripData.active ? <TripCard trip={tripData.active} isActive={true} expandedTripId={expandedTripId} setExpandedTripId={setExpandedTripId} /> : <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm italic">Sürücü şu anda mesaiye başlamamış.</div>}
                  </section>
                  <section className="space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-3"><i className="fa-solid fa-folder-closed"></i> Tamamlanan Oturumlar</h4>
                    {tripData.completed.length > 0 ? <div className="space-y-6">{tripData.completed.map((trip) => <TripCard key={trip.id} trip={trip} expandedTripId={expandedTripId} setExpandedTripId={setExpandedTripId} />)}</div> : <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm italic">Henüz tamamlanmış bir mesai kaydı bulunmamaktadır.</div>}
                  </section>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-10 max-w-2xl">
              <div className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-200/50">
                <h3 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tighter">Sistem Ayarları & Test Araçları</h3>
                <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100 space-y-4">
                  <div className="flex items-center gap-4 text-red-600">
                    <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
                    <p className="text-xs font-black uppercase tracking-wider">Tehlikeli Bölge</p>
                  </div>
                  <p className="text-xs text-red-500 font-bold">Firebase veritabanını temizlemek ve testlere sıfırdan başlamak için aşağıdaki butonu kullanabilirsiniz.</p>
                  <button onClick={handleResetData} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-red-500/20 uppercase text-xs tracking-widest">Firebase Verilerini Sıfırla</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
