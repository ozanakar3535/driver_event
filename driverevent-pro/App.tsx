
import React, { useState } from 'react';
import DriverPanel from './components/DriverPanel';
import AdminPanel from './components/AdminPanel';
import { Driver } from './types';
import { mockApi } from './services/mockApi';

const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'driver' | 'admin'>('login');
  const [currentUser, setCurrentUser] = useState<Driver | null>(null);
  const [loginInput, setLoginInput] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) {
      setError('Lütfen bir giriş anahtarı yazın.');
      return;
    }

    const data = mockApi.getData();
    
    // Admin girişi kontrolü
    if (loginInput === 'admin123') {
      setView('admin');
      setError('');
      return;
    }

    // Sürücü ismiyle giriş kontrolü (Admin panelinden oluşturulan isim)
    const foundDriver = data.drivers.find(d => d.name.toLowerCase() === loginInput.toLowerCase());
    
    if (foundDriver) {
      setCurrentUser(foundDriver);
      setView('driver');
      setError('');
    } else {
      setError('Geçersiz Kullanıcı Adı veya Admin Kodu. (Not: Sürücüler Admin panelinden oluşturulmalıdır)');
    }
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 selection:bg-blue-500 selection:text-white">
        <div className="max-w-md w-full space-y-8">
          {/* Logo & Intro */}
          <div className="text-center space-y-4">
             <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2rem] shadow-2xl shadow-blue-500/20 rotate-3 transition-transform hover:rotate-0">
                <i className="fa-solid fa-bolt-lightning text-white text-4xl"></i>
             </div>
             <div className="space-y-1">
                <h1 className="text-4xl font-black text-white tracking-tighter italic">
                  DRIVE<span className="text-blue-500">EVENT</span>
                </h1>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.3em]">Operasyon Kontrol Merkezi</p>
             </div>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-200/50 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            
            <div className="mb-10">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Hoş Geldiniz</h2>
              <p className="text-slate-400 text-sm font-bold mt-1">Sürücü Adı veya Yönetici Kodu ile devam edin.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <i className="fa-solid fa-key text-blue-500"></i>
                  Giriş Kimliği
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Sürücü Adı (Örn: Caner)"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-5 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-lg font-black text-slate-700 placeholder:text-slate-300"
                    value={loginInput}
                    onChange={(e) => {
                      setLoginInput(e.target.value);
                      if (error) setError('');
                    }}
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-start gap-3 animate-headShake">
                  <i className="fa-solid fa-circle-exclamation mt-1"></i>
                  <span className="text-xs font-bold leading-relaxed">{error}</span>
                </div>
              )}

              <button 
                type="submit"
                className="group w-full bg-slate-900 hover:bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl hover:shadow-blue-500/20 active:scale-[0.97] transition-all text-sm tracking-[0.2em] uppercase flex items-center justify-center gap-3"
              >
                SİSTEME GİRİŞ
                <i className="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-1"></i>
              </button>
            </form>

            <div className="mt-12 text-center">
               <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">DriverEvent Pro v2.0 - 2024</p>
            </div>
          </div>
          
          <div className="text-center">
             <p className="text-slate-600 text-[11px] font-bold">Yeni sürücü kayıtları yönetici panelinden gerçekleştirilir.</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'driver' && currentUser) {
    return <DriverPanel driver={currentUser} onLogout={() => { setView('login'); setLoginInput(''); }} />;
  }

  if (view === 'admin') {
    return <AdminPanel />;
  }

  return null;
};

export default App;
