/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Send, 
  User, 
  LogOut, 
  Plus, 
  X, 
  Shield, 
  Eye, 
  EyeOff, 
  Trash2, 
  Search,
  Award,
  Sparkles,
  MessageSquare,
  UserPlus
} from 'lucide-react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  Timestamp,
  OperationType,
  handleFirestoreError,
  type FirebaseUser
} from './firebase';
import { cn } from './lib/utils';
import { formatDistanceToNow } from 'date-fns';
import confetti from 'canvas-confetti';

// --- Types ---

interface UserProfile {
  uid: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  photoURL?: string;
  college?: string;
}

interface Kudos {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  receiverCollege?: string;
  message: string;
  createdAt: Timestamp;
  isVisible: boolean;
}

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', size?: 'sm' | 'md' | 'lg' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm',
      secondary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
      outline: 'border border-stone-200 bg-transparent hover:bg-stone-50 text-stone-700',
      ghost: 'bg-transparent hover:bg-stone-100 text-stone-600',
      danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn('bg-white border border-stone-100 rounded-3xl shadow-sm overflow-hidden', className)}>
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-stone-50 flex-shrink-0">
            <h3 className="text-xl font-semibold text-stone-800">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
              <X size={20} className="text-stone-400" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [kudos, setKudos] = useState<Kudos[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddColleagueModalOpen, setIsAddColleagueModalOpen] = useState(false);
  const [tempCollege, setTempCollege] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('All');

  // Add Colleague Form
  const [newColleagueName, setNewColleagueName] = useState('');
  const [newColleagueEmail, setNewColleagueEmail] = useState('');
  const [newColleagueCollege, setNewColleagueCollege] = useState('');

  // Form state
  const [receiverId, setReceiverId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'feed' | 'colleagues'>('feed');

  // --- Auth & Profile ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Sync profile
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const existingProfile = userSnap.data() as UserProfile;
            const isAdmin = firebaseUser.email === 'sangameswarpk@gmail.com' || firebaseUser.email === 'sanguchachu@gmail.com';
            if (isAdmin && existingProfile.role !== 'admin') {
              await updateDoc(userRef, { role: 'admin' });
              existingProfile.role = 'admin';
            }
            setProfile(existingProfile);
          } else {
            // Create new profile
            const isAdmin = firebaseUser.email === 'sangameswarpk@gmail.com' || firebaseUser.email === 'sanguchachu@gmail.com';
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              username: firebaseUser.displayName || 'Anonymous',
              email: firebaseUser.email || '',
              role: isAdmin ? 'admin' : 'user',
              photoURL: firebaseUser.photoURL || undefined,
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          }

          // Check if college is set
          const finalProfile = (userSnap.exists() ? userSnap.data() : null) as UserProfile | null;
          if (finalProfile && !finalProfile.college) {
            setIsProfileModalOpen(true);
          }
        } catch (error) {
          console.error("Error syncing profile:", error);
        }
      } else {
        setProfile(null);
      }
      setIsAuthReady(true);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // --- Data Fetching ---

  useEffect(() => {
    if (!isAuthReady || !user) return;

    // Fetch Kudos
    const kudosQuery = query(collection(db, 'kudos'), orderBy('createdAt', 'desc'));
    const unsubscribeKudos = onSnapshot(kudosQuery, (snapshot) => {
      const kudosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Kudos));
      setKudos(kudosData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'kudos'));

    // Fetch Users (for the dropdown)
    const usersQuery = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
      setAllUsers(usersData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    return () => {
      unsubscribeKudos();
      unsubscribeUsers();
    };
  }, [isAuthReady, user]);

  // --- Actions ---

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSendKudos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !receiverId || !message.trim()) return;

    setSending(true);
    const receiver = allUsers.find(u => u.uid === receiverId);
    
    try {
      await addDoc(collection(db, 'kudos'), {
        senderId: user.uid,
        senderName: profile.username,
        receiverId: receiverId,
        receiverName: receiver?.username || 'Colleague',
        receiverCollege: receiver?.college || 'General',
        message: message.trim(),
        createdAt: serverTimestamp(),
        isVisible: true,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d97706', '#059669', '#3b82f6']
      });

      setMessage('');
      setReceiverId('');
      setIsModalOpen(false);
      setActiveTab('feed'); // Switch to feed to see the new kudos
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'kudos');
    } finally {
      setSending(false);
    }
  };

  const openKudosModal = (targetUserId?: string) => {
    if (targetUserId) {
      setReceiverId(targetUserId);
    }
    setIsModalOpen(true);
  };

  const toggleVisibility = async (kudosId: string, currentVisible: boolean) => {
    if (profile?.role !== 'admin') return;
    try {
      await updateDoc(doc(db, 'kudos', kudosId), {
        isVisible: !currentVisible
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `kudos/${kudosId}`);
    }
  };

  const handleDeleteKudos = async (kudosId: string) => {
    if (profile?.role !== 'admin') return;
    try {
      await deleteDoc(doc(db, 'kudos', kudosId));
      setDeleteConfirmId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `kudos/${kudosId}`);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !tempCollege.trim()) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        college: tempCollege.trim()
      });
      setProfile(prev => prev ? { ...prev, college: tempCollege.trim() } : null);
      setIsProfileModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleAddColleague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || profile?.role !== 'admin') return;

    try {
      const dummyUid = `manual_${Date.now()}`;
      await setDoc(doc(db, 'users', dummyUid), {
        uid: dummyUid,
        username: newColleagueName.trim(),
        email: newColleagueEmail.trim(),
        college: newColleagueCollege.trim(),
        role: 'user',
        isManual: true
      });
      
      setNewColleagueName('');
      setNewColleagueEmail('');
      setNewColleagueCollege('');
      setIsAddColleagueModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    }
  };

  const filteredKudos = useMemo(() => {
    return kudos.filter(k => {
      const matchesSearch = k.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            k.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            k.message.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isVisible = k.isVisible || profile?.role === 'admin' || k.senderId === user?.uid || k.receiverId === user?.uid;
      
      const matchesCollege = selectedCollege === 'All' || k.receiverCollege === selectedCollege;

      return matchesSearch && isVisible && matchesCollege;
    });
  }, [kudos, searchTerm, profile, user, selectedCollege]);

  const colleges = useMemo(() => {
    const set = new Set(allUsers.map(u => u.college).filter(Boolean));
    return ['All', ...Array.from(set)] as string[];
  }, [allUsers]);

  const filteredColleagues = useMemo(() => {
    return allUsers.filter(u => {
      const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.college?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCollege = selectedCollege === 'All' || u.college === selectedCollege;
      return matchesSearch && matchesCollege && u.uid !== user?.uid;
    });
  }, [allUsers, searchTerm, selectedCollege, user]);

  // --- Render ---

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-4"
        >
          <Heart className="text-amber-600 fill-amber-600" size={48} />
          <p className="text-stone-400 font-medium">Connecting to Kudos...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-8 inline-flex p-4 bg-amber-100 rounded-3xl">
            <Award className="text-amber-600" size={48} />
          </div>
          <h1 className="text-4xl font-bold text-stone-900 mb-4 tracking-tight">Kudos Connect</h1>
          <p className="text-stone-500 mb-8 text-lg">Celebrate your team's wins and spread appreciation across the organization.</p>
          <Button onClick={handleLogin} size="lg" className="w-full gap-2 py-4">
            <User size={20} />
            Sign in with Google
          </Button>
          <p className="mt-6 text-sm text-stone-400">Join your colleagues in building a culture of gratitude.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-stone-800 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
              <Heart className="text-white fill-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">Kudos Connect</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 bg-stone-50 rounded-full border border-stone-100">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-stone-200 flex-shrink-0">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-1.5 text-stone-400" />
                )}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-semibold leading-none">{profile?.username}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">
                    {profile?.college || 'No College Set'}
                  </span>
                  {profile?.role === 'admin' && (
                    <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-widest border border-amber-200">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              {profile?.role === 'admin' && (
                <div className="sm:hidden">
                  <Shield size={14} className="text-amber-600" />
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-stone-400 hover:text-red-500 p-2">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-2xl w-fit mb-8">
          <button 
            onClick={() => setActiveTab('feed')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'feed' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            )}
          >
            Feed
          </button>
          <button 
            onClick={() => setActiveTab('colleagues')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'colleagues' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            )}
          >
            Colleagues
          </button>
        </div>

        {/* Hero / Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              {activeTab === 'feed' ? 'Appreciation Feed' : 'Colleagues Directory'}
            </h2>
            <p className="text-stone-500">
              {activeTab === 'feed' ? 'See what your amazing team is up to.' : 'Find and celebrate your team members.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {profile?.role === 'admin' && (
              <Button 
                variant="outline" 
                onClick={() => setIsAddColleagueModalOpen(true)}
                className="gap-2 border-stone-200"
              >
                <UserPlus size={18} />
                Add Colleague
              </Button>
            )}
            <div className="relative">
              <select 
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="pl-4 pr-10 py-2.5 bg-white border border-stone-200 rounded-full w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none text-sm font-medium"
              >
                {colleges.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="text" 
                placeholder={activeTab === 'feed' ? "Search kudos..." : "Search colleagues..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-full w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
            <Button onClick={() => openKudosModal()} className="gap-2 shadow-lg shadow-amber-600/20">
              <Plus size={20} />
              Give Kudos
            </Button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'feed' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredKudos.map((k, index) => (
                <motion.div
                  key={k.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={cn(
                    'h-full flex flex-col group transition-all hover:shadow-xl hover:-translate-y-1',
                    !k.isVisible && 'opacity-60 grayscale border-red-100 bg-red-50/10'
                  )}>
                    <div className="p-6 flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                            <Award size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-stone-900 leading-tight">To: {k.receiverName}</h3>
                            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-0.5">{k.receiverCollege}</p>
                            <p className="text-xs text-stone-400 font-medium uppercase tracking-wider mt-1">From: {k.senderName}</p>
                          </div>
                        </div>
                        <div className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
                          {k.createdAt ? formatDistanceToNow(k.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                        </div>
                      </div>
                      
                      <div className="relative">
                        <MessageSquare className="absolute -left-1 -top-1 text-amber-100 -z-10" size={32} />
                        <p className="text-stone-700 leading-relaxed italic">"{k.message}"</p>
                      </div>
                    </div>

                    {profile?.role === 'admin' && (
                      <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleVisibility(k.id, k.isVisible)}
                            className={cn('h-8 w-8 p-0 rounded-lg', k.isVisible ? 'text-stone-400' : 'text-amber-600 bg-amber-50')}
                          >
                            {k.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setDeleteConfirmId(k.id)}
                            className="h-8 w-8 p-0 rounded-lg text-stone-400 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                        {!k.isVisible && (
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1">
                            <Shield size={10} /> Hidden
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredKudos.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="inline-flex p-6 bg-stone-50 rounded-full mb-4">
                  <Sparkles className="text-stone-300" size={48} />
                </div>
                <h3 className="text-xl font-semibold text-stone-800">No kudos found</h3>
                <p className="text-stone-400 mt-2">Be the first to share some appreciation!</p>
                <Button onClick={() => openKudosModal()} variant="outline" className="mt-6">
                  Send first Kudos
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredColleagues.map((colleague, index) => (
                <motion.div
                  key={colleague.uid}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="p-6 flex flex-col items-center text-center group hover:border-amber-200 transition-all">
                    <div className="w-20 h-20 rounded-3xl bg-stone-100 mb-4 overflow-hidden group-hover:scale-110 transition-transform duration-500">
                      {colleague.photoURL ? (
                        <img src={colleague.photoURL} alt={colleague.username} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-full h-full p-5 text-stone-300" />
                      )}
                    </div>
                    <h3 className="font-bold text-stone-900 mb-1">{colleague.username}</h3>
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-4">{colleague.college || 'General'}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openKudosModal(colleague.uid)}
                      className="w-full gap-2 hover:bg-amber-600 hover:text-white hover:border-amber-600"
                    >
                      <Heart size={14} />
                      Give Kudos
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredColleagues.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="inline-flex p-6 bg-stone-50 rounded-full mb-4">
                  <User className="text-stone-300" size={48} />
                </div>
                <h3 className="text-xl font-semibold text-stone-800">No colleagues found</h3>
                <p className="text-stone-400 mt-2">Try adjusting your search or college filter.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Give Kudos Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Share Appreciation"
      >
        <form onSubmit={handleSendKudos} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-stone-500 uppercase tracking-wider">Select Colleague</label>
              {profile?.role === 'admin' && (
                <button 
                  type="button"
                  onClick={() => setIsAddColleagueModalOpen(true)}
                  className="text-[10px] font-bold text-amber-600 uppercase tracking-widest hover:underline"
                >
                  + Add New
                </button>
              )}
            </div>
            <div className="relative">
              <select 
                required
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none"
              >
                <option value="">Who are you appreciating?</option>
                {allUsers.length <= 1 ? (
                  <option value={user.uid}>Myself (Test Mode)</option>
                ) : (
                  allUsers.filter(u => u.uid !== user.uid).map(u => (
                    <option key={u.uid} value={u.uid}>{u.username}</option>
                  ))
                )}
              </select>
              {allUsers.length <= 1 && (
                <p className="mt-2 text-[11px] text-amber-600 font-medium leading-tight">
                  You're the first one here! Invite colleagues to join. For now, you can send a test kudos to yourself.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-500 uppercase tracking-wider">Your Message</label>
            <textarea 
              required
              rows={4}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What did they do that was awesome?"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
            />
            <div className="flex justify-end">
              <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">{message.length}/500</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={sending} className="flex-1 gap-2">
              {sending ? 'Sending...' : (
                <>
                  <Send size={18} />
                  Send Kudos
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Kudos"
      >
        <div className="space-y-6">
          <p className="text-stone-600">Are you sure you want to permanently remove this kudos? This action cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" className="bg-red-600 hover:bg-red-700 flex-1" onClick={() => deleteConfirmId && handleDeleteKudos(deleteConfirmId)}>
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      {/* Profile Setup Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => {}} // Force completion
        title="Complete Your Profile"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <p className="text-stone-500 text-sm">To join the community, please tell us which college or department you belong to.</p>
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-500 uppercase tracking-wider">Your College / Dept</label>
            <input 
              required
              type="text"
              placeholder="e.g. Engineering, Arts, Marketing"
              value={tempCollege}
              onChange={(e) => setTempCollege(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>
          <Button type="submit" className="w-full">
            Join Kudos Connect
          </Button>
        </form>
      </Modal>

      {/* Add Colleague Modal */}
      <Modal
        isOpen={isAddColleagueModalOpen}
        onClose={() => setIsAddColleagueModalOpen(false)}
        title="Add New Colleague"
      >
        <form onSubmit={handleAddColleague} className="space-y-6">
          <p className="text-stone-500 text-sm">Manually add a colleague to the directory. They will appear in the list immediately.</p>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-500 uppercase tracking-wider">Full Name</label>
            <input 
              required
              type="text"
              placeholder="e.g. Jane Smith"
              value={newColleagueName}
              onChange={(e) => setNewColleagueName(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-500 uppercase tracking-wider">Email Address</label>
            <input 
              required
              type="email"
              placeholder="jane@example.com"
              value={newColleagueEmail}
              onChange={(e) => setNewColleagueEmail(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-500 uppercase tracking-wider">College / Dept</label>
            <input 
              required
              type="text"
              placeholder="e.g. Engineering"
              value={newColleagueCollege}
              onChange={(e) => setNewColleagueCollege(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <Button type="submit" className="w-full">
            Add to Directory
          </Button>
        </form>
      </Modal>

      {/* Add Colleague Modal */}
      <Modal
        isOpen={isAddColleagueModalOpen}
        onClose={() => setIsAddColleagueModalOpen(false)}
        title="Add New Colleague"
      >
        <form onSubmit={handleAddColleague} className="space-y-6">
          <p className="text-stone-500 text-sm">Manually add a colleague to the directory. They will appear in the list immediately.</p>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-500 uppercase tracking-wider">Full Name</label>
            <input 
              required
              type="text"
              placeholder="e.g. Jane Smith"
              value={newColleagueName}
              onChange={(e) => setNewColleagueName(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-500 uppercase tracking-wider">Email Address</label>
            <input 
              required
              type="email"
              placeholder="jane@example.com"
              value={newColleagueEmail}
              onChange={(e) => setNewColleagueEmail(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-500 uppercase tracking-wider">College / Dept</label>
            <input 
              required
              type="text"
              placeholder="e.g. Engineering"
              value={newColleagueCollege}
              onChange={(e) => setNewColleagueCollege(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <Button type="submit" className="w-full">
            Add to Directory
          </Button>
        </form>
      </Modal>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-stone-100 mt-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-stone-400">
            <Heart size={16} className="fill-stone-400" />
            <span className="text-sm font-medium">Built for teams that care.</span>
          </div>
          <div className="text-stone-300 text-xs font-bold uppercase tracking-[0.2em]">
            &copy; 2026 Kudos Connect
          </div>
        </div>
      </footer>
    </div>
  );
}
