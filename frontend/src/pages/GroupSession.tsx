import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { getSocket } from '../services/socket.js';
import {
  Users,
  Plus,
  LogIn,
  Copy,
  Check,
  Sparkles,
  Flame,
  ThumbsUp,
  ThumbsDown,
  Meh,
  CheckCircle2,
  Scale,
  ShieldCheck,
  Award
} from 'lucide-react';
import {
  createGroupSession,
  fetchGroupSession,
  joinGroupSession,
  calculateGroupMatch,
  voteGroupSession,
  finalizeGroupDecision,
  startGroupVoting,
  submitGroupVote,
  finalizeGroupVote
} from '../services/api.js';
import { GroupSession as IGroupSession, ItemType, VenueCandidate } from '../types/index.js';
import { VenueCard } from '../components/VenueCard.js';

export const GroupSession: React.FC = () => {
  const { currentUser } = useAuth();
  const socket = getSocket();

  const [activeView, setActiveView] = useState<'hub' | 'create' | 'join' | 'room'>('hub');
  const [currentSession, setCurrentSession] = useState<IGroupSession | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [groupName, setGroupName] = useState('Bu Akşam Ne Yapıyoruz?');
  const [itemType, setItemType] = useState<ItemType | 'all'>('all');
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    socket.on('room-updated', (session: IGroupSession) => {
      setCurrentSession(session);
    });

    socket.on('error-msg', (msg: string) => {
      setErrorMsg(msg);
    });

    return () => {
      socket.off('room-updated');
      socket.off('error-msg');
    };
  }, [socket]);

  const handleCreateGroup = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const session = await createGroupSession({
        creatorId: currentUser.id,
        name: groupName.trim() || 'Farketmez Grubu',
        itemType
      });

      setCurrentSession(session);
      socket.emit('join-room', { roomCode: session.code, userId: currentUser.id });
      setActiveView('room');
    } catch (e: any) {
      setErrorMsg(e.message || 'Grup oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!currentUser || !joinCode.trim()) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const session = await joinGroupSession(joinCode.trim(), currentUser.id);
      setCurrentSession(session);
      socket.emit('join-room', { roomCode: session.code, userId: currentUser.id });
      setActiveView('room');
    } catch (e: any) {
      setErrorMsg('Grup bulunamadı. Lütfen 6 haneli kodu kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCalculate = () => {
    if (!currentSession) return;
    socket.emit('start-calculate', { roomCode: currentSession.code });
  };

  const handleVote = (vote: 'yes' | 'no' | 'neutral') => {
    if (!currentSession || !currentUser) return;
    socket.emit('cast-vote', { roomCode: currentSession.code, userId: currentUser.id, vote });
  };

  const handleFinalize = async () => {
    if (!currentSession) return;
    try {
      const updated = await finalizeGroupDecision(currentSession.code);
      setCurrentSession(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const [myApprovals, setMyApprovals] = useState<string[]>([]);
  const [myVetoes, setMyVetoes] = useState<string[]>([]);

  const handleStartCandidateVoting = async () => {
    if (!currentSession) return;
    try {
      setLoading(true);
      const updated = await startGroupVoting(currentSession.code);
      setCurrentSession(updated);
    } catch (e: any) {
      setErrorMsg(e.message || 'Oylama başlatılamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCandidateVote = async (venueId: string, type: 'approve' | 'veto') => {
    if (!currentSession || !currentUser) return;
    let newApprovals = [...myApprovals];
    let newVetoes = [...myVetoes];

    if (type === 'approve') {
      if (newApprovals.includes(venueId)) {
        newApprovals = newApprovals.filter(id => id !== venueId);
      } else {
        newApprovals.push(venueId);
        newVetoes = newVetoes.filter(id => id !== venueId);
      }
    } else {
      if (newVetoes.includes(venueId)) {
        newVetoes = newVetoes.filter(id => id !== venueId);
      } else {
        newVetoes.push(venueId);
        newApprovals = newApprovals.filter(id => id !== venueId);
      }
    }

    setMyApprovals(newApprovals);
    setMyVetoes(newVetoes);

    try {
      const updated = await submitGroupVote(currentSession.code, {
        userId: currentUser.id,
        approvedVenueIds: newApprovals,
        vetoedVenueIds: newVetoes
      });
      setCurrentSession(updated);
    } catch (e) {
      console.error('Error submitting vote:', e);
    }
  };

  const handleFinalizeCandidateVoting = async () => {
    if (!currentSession) return;
    try {
      setLoading(true);
      const updated = await finalizeGroupVote(currentSession.code);
      setCurrentSession(updated);
    } catch (e: any) {
      setErrorMsg(e.message || 'Konsensüs hesaplanamadı');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (currentSession) {
      navigator.clipboard.writeText(currentSession.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-700 to-slate-900 p-5 text-white shadow-xl shadow-indigo-900/20">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold">
              <Scale className="w-3.5 h-3.5" />
              <span>Adil & Tek Karar Motoru (Fairness Algorithm)</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">Ortak Karar Odası</h2>
            <p className="text-xs text-indigo-100/80">
              Grupta kimsenin mağdur olmaması için geçmiş uyum skorlarını tartar ve tek net karar sunar.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* VIEW: HUB */}
      {activeView === 'hub' && (
        <div className="space-y-3">
          <button
            onClick={() => setActiveView('create')}
            className="w-full p-4 rounded-3xl bg-white border border-slate-200/80 shadow-md hover:shadow-lg flex items-center justify-between group transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Yeni Grup Oturumu Başlat</h3>
                <p className="text-xs text-slate-500 mt-0.5">Oda oluştur ve arkadaşlarını davet et</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveView('join')}
            className="w-full p-4 rounded-3xl bg-white border border-slate-200/80 shadow-md hover:shadow-lg flex items-center justify-between group transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <LogIn className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">PIN Kodu ile Odaya Katıl</h3>
                <p className="text-xs text-slate-500 mt-0.5">Arkadaşının paylaştığı 6 haneli kodu gir</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* VIEW: CREATE */}
      {activeView === 'create' && (
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-md space-y-4">
          <h3 className="text-base font-extrabold text-slate-800">Grup Detaylarını Belirle</h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Grup Başlığı</label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Örn: Cuma Akşamı Buluşması"
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Türü</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'Farketmez' },
                { id: 'food', label: '🍔 Yemek' },
                { id: 'activity', label: '🎳 Aktivite' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setItemType(opt.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    itemType === opt.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setActiveView('hub')}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs"
            >
              Vazgeç
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
            >
              {loading ? 'Kuruluyor...' : 'Odayı Başlat'}
            </button>
          </div>
        </div>
      )}

      {/* VIEW: JOIN */}
      {activeView === 'join' && (
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-md space-y-4">
          <h3 className="text-base font-extrabold text-slate-800">Oda Kodunu Gir</h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">6 Haneli Grup Kodu</label>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Örn: FK7892"
              maxLength={6}
              className="w-full p-3.5 text-center tracking-widest uppercase font-black text-lg rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setActiveView('hub')}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs"
            >
              Geri
            </button>
            <button
              onClick={handleJoinGroup}
              disabled={loading || joinCode.length < 4}
              className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
            >
              {loading ? 'Katılınıyor...' : 'Odaya Gir'}
            </button>
          </div>
        </div>
      )}

      {/* VIEW: ACTIVE ROOM */}
      {activeView === 'room' && currentSession && (
        <div className="space-y-4">
          {/* Room PIN Code Card */}
          <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">Oda PIN Kodu</div>
              <div className="text-2xl font-black text-indigo-700 tracking-wider font-mono">
                {currentSession.code}
              </div>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Kopyalandı!' : 'Kodu Paylaş'}</span>
            </button>
          </div>

          {/* Members List with Fairness Indicators */}
          <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Odadaki Katılımcılar ({currentSession.members.length})</span>
              </h4>
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Canlı Bağlantı
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {currentSession.members.map(m => (
                <div
                  key={m.userId}
                  className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-white" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{m.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {m.vote ? (
                        m.vote === 'yes' ? '👍 Kabul Etti' : m.vote === 'neutral' ? '🤷 Farketmez' : '👎 İtiraz'
                      ) : (
                        'Hazır'
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fairness Mechanism Explanation Badge */}
          {currentSession.fairnessExplanation && (
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl text-xs font-medium text-purple-900 flex items-start gap-2 animate-in fade-in">
              <Scale className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>{currentSession.fairnessExplanation}</span>
            </div>
          )}

          {/* Action Triggers in Lobby */}
          {currentSession.status === 'lobby' && (
            <div className="space-y-2">
              <button
                onClick={handleStartCalculate}
                className="w-full py-4 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-5 h-5" />
                <span>Ortak Tek Kararı Üret</span>
              </button>

              <button
                onClick={handleStartCandidateVoting}
                disabled={loading}
                className="w-full py-3.5 rounded-3xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
              >
                <span>🗳️ 3 Adaylı Konsensüs & Veto Oylaması Başlat</span>
              </button>
            </div>
          )}

          {currentSession.status === 'calculating' && (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <h4 className="text-sm font-extrabold text-slate-800">
                Adalet & Minimum Regret Algoritması Çalışıyor...
              </h4>
              <p className="text-xs text-slate-500">
                Gruptaki herkesin geçmişi, diyet kısıtları ve adalet geçmişi tartılıyor.
              </p>
            </div>
          )}

          {/* 3 Candidate Trio Voting State */}
          {currentSession.status === 'voting' && currentSession.candidateVenues && currentSession.candidateVenues.length > 0 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="text-center space-y-1">
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black">
                  🗳️ 3 Adaylı Grup Oylaması
                </span>
                <p className="text-xs text-slate-500">
                  Her aday için onay veya veto ver. En az vetolu ve en yüksek dengeli mekan seçilecektir.
                </p>
              </div>

              <div className="space-y-3">
                {currentSession.candidateVenues.map((venue, idx) => {
                  const isApproved = myApprovals.includes(venue.id);
                  const isVetoed = myVetoes.includes(venue.id);

                  return (
                    <div
                      key={venue.id}
                      className={`p-3.5 rounded-3xl bg-white border transition-all ${
                        isVetoed
                          ? 'border-rose-300 bg-rose-50/20'
                          : isApproved
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : 'border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex gap-3">
                        <img
                          src={venue.imageUrl}
                          alt={venue.title}
                          className="w-16 h-16 rounded-2xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-indigo-600 uppercase">
                              Seçenek {idx + 1}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {'₺'.repeat(venue.priceLevel)} • ★ {venue.rating}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 truncate mt-0.5">
                            {venue.title}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">
                            {venue.district} • {venue.categoryNameTr}
                          </p>
                        </div>
                      </div>

                      {/* Vote Buttons */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleToggleCandidateVote(venue.id, 'approve')}
                          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                            isApproved
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{isApproved ? 'Onaylandı 👍' : 'Onayla'}</span>
                        </button>

                        <button
                          onClick={() => handleToggleCandidateVote(venue.id, 'veto')}
                          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                            isVetoed
                              ? 'bg-rose-600 text-white shadow-md'
                              : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>{isVetoed ? 'Veto Edildi ⛔' : 'Veto Et'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleFinalizeCandidateVoting}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
              >
                Konsensüsü Hesapla & Kararı Kesinleştir
              </button>
            </div>
          )}

          {/* Decided Winner Display (Candidate Trio or Single) */}
          {currentSession.status === 'decided' && currentSession.finalDecision && !currentSession.recommendation && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-1">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold mb-1">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-emerald-900">Grup Konsensüsü Tamamlandı! 🎉</h4>
                <p className="text-xs text-emerald-700 font-medium">
                  {currentSession.fairnessExplanation || 'Ortak oylama sonucu belirlenen mekan.'}
                </p>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-emerald-300 shadow-xl space-y-3">
                <img
                  src={currentSession.finalDecision.imageUrl}
                  alt={currentSession.finalDecision.title}
                  className="w-full h-44 rounded-2xl object-cover"
                />
                <div>
                  <h3 className="text-lg font-black text-slate-900">{currentSession.finalDecision.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentSession.finalDecision.district}, {currentSession.finalDecision.city} • {currentSession.finalDecision.categoryNameTr}
                  </p>
                  <p className="text-xs text-slate-600 mt-2">{currentSession.finalDecision.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Single Decision Display */}
          {(currentSession.status === 'voting' || currentSession.status === 'decided') && currentSession.recommendation && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {currentSession.status === 'decided' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-1">
                  <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold mb-1">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-emerald-900">Grup Kararı Onaylandı! 🎉</h4>
                  <p className="text-xs text-emerald-700 font-medium">
                    Tüm üyelerin geçmiş aktivitelerine ve adalet puanlarına kaydedildi.
                  </p>
                </div>
              )}

              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Grubun Tek Ortak Kararı</span>
              </div>

              <VenueCard recommendation={currentSession.recommendation} isPrimary={true} />

              {/* Voting buttons */}
              {currentSession.status === 'voting' && (
                <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-md space-y-3">
                  <div className="text-xs font-extrabold text-slate-800 text-center">
                    Bu Kararı Onaylıyor musun?
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleVote('yes')}
                      className="py-3 px-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs flex flex-col items-center gap-1 transition-all"
                    >
                      <ThumbsUp className="w-5 h-5 text-emerald-600" />
                      <span>Kabul 👍</span>
                    </button>
                    <button
                      onClick={() => handleVote('neutral')}
                      className="py-3 px-2 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex flex-col items-center gap-1 transition-all"
                    >
                      <Meh className="w-5 h-5 text-amber-600" />
                      <span>Farketmez 🤷</span>
                    </button>
                    <button
                      onClick={() => handleVote('no')}
                      className="py-3 px-2 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 font-bold text-xs flex flex-col items-center gap-1 transition-all"
                    >
                      <ThumbsDown className="w-5 h-5 text-rose-600" />
                      <span>İtiraz 👎</span>
                    </button>
                  </div>

                  <button
                    onClick={handleFinalize}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Oylamayı Bitir & Kararı Kesinleştir
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
