import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import {
  Compass,
  Users,
  Heart,
  Clock,
  Sparkles,
  User as UserIcon,
  Smartphone,
  Monitor,
  PlusCircle,
  Check
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenOnboarding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenOnboarding }) => {
  const { currentUser, users, switchUser } = useAuth();
  const { theme, isMobileView, setIsMobileView } = useTheme();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const isCoupleTheme = theme === 'couple';

  return (
    <>
      {/* Top Header */}
      <header
        className={`sticky top-0 z-30 px-4 py-3 border-b transition-colors ${
          isCoupleTheme
            ? 'bg-rose-50/90 border-rose-200 backdrop-blur-md text-rose-950'
            : 'bg-white/90 border-slate-200 backdrop-blur-md text-slate-900'
        }`}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md transition-transform group-hover:scale-105 ${
                isCoupleTheme
                  ? 'bg-gradient-to-tr from-rose-500 to-pink-500 shadow-rose-200'
                  : 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-200'
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight flex items-center gap-1.5">
                <span>Farketmez</span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                    isCoupleTheme
                      ? 'bg-rose-200/70 text-rose-700'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isCoupleTheme ? 'Çift Modu' : 'AI Karar'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle (Mobile / Desktop) */}
            <button
              onClick={() => setIsMobileView(!isMobileView)}
              title={isMobileView ? 'Tam Ekran Görünüme Geç' : 'Mobil Çerçeve Görünümüne Geç'}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors hidden sm:flex items-center gap-1 text-xs font-medium"
            >
              {isMobileView ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
              <span>{isMobileView ? 'Masaüstü' : 'Mobil'}</span>
            </button>

            {/* Active User Pill & Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-all text-xs font-semibold text-slate-700"
              >
                <img
                  src={currentUser?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                  alt={currentUser?.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-white"
                />
                <span className="max-w-[70px] truncate">{currentUser?.name || 'Giriş Yap'}</span>
              </button>

              {/* Dropdown */}
              {showUserDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Profil Değiştir (Demo)
                    </div>

                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors ${
                          currentUser?.id === u.id
                            ? 'bg-emerald-50 text-emerald-900 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <div className="leading-tight">{u.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {u.preferences.energyLevel === 'active' ? '⚡ Enerjik' : '🌿 Sakin'} • {u.location.district}
                            </div>
                          </div>
                        </div>
                        {currentUser?.id === u.id && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    ))}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenOnboarding();
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Yeni Profil / Anket Çöz</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-30 border-t transition-colors ${
          isCoupleTheme
            ? 'bg-white/95 border-rose-200 text-rose-900 shadow-rose-100/50'
            : 'bg-white/95 border-slate-200 text-slate-700 shadow-lg'
        } backdrop-blur-md`}
      >
        <div className="max-w-md mx-auto grid grid-cols-5 py-2 px-1">
          {/* Ana Sayfa */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-1 rounded-xl transition-all ${
              activeTab === 'home'
                ? isCoupleTheme
                  ? 'text-rose-600 font-bold scale-105'
                  : 'text-emerald-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px]">Karar Ver</span>
          </button>

          {/* Grup Oturumu */}
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex flex-col items-center gap-1 py-1 rounded-xl transition-all ${
              activeTab === 'groups'
                ? isCoupleTheme
                  ? 'text-rose-600 font-bold scale-105'
                  : 'text-emerald-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Grup Modu</span>
          </button>

          {/* Çift Modu */}
          <button
            onClick={() => setActiveTab('couple')}
            className={`flex flex-col items-center gap-1 py-1 rounded-xl transition-all ${
              activeTab === 'couple'
                ? 'text-rose-500 font-bold scale-105'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-[10px]">Çift Modu</span>
          </button>

          {/* Aktivite Geçmişi & Cooldown */}
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 py-1 rounded-xl transition-all ${
              activeTab === 'history'
                ? isCoupleTheme
                  ? 'text-rose-600 font-bold scale-105'
                  : 'text-emerald-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px]">Geçmiş</span>
          </button>

          {/* Profil & Ayarlar */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 py-1 rounded-xl transition-all ${
              activeTab === 'profile'
                ? isCoupleTheme
                  ? 'text-rose-600 font-bold scale-105'
                  : 'text-emerald-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px]">Profilim</span>
          </button>
        </div>
      </nav>
    </>
  );
};
