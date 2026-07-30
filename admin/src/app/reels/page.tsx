'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  Film,
  Eye,
  ThumbsUp,
  MessageSquare,
  Trash2,
  ShieldAlert,
  Search,
  Play,
  X,
  AlertTriangle,
  CheckCircle,
  Filter,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function ReelsModerationPage() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'views' | 'likes'>('newest');

  // Modal States
  const [activeVideoModal, setActiveVideoModal] = useState<any | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchReels = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/reels');
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setReels(data);
    } catch (err) {
      console.error('Failed to load reels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmModal) return;
    const targetId = deleteConfirmModal.id;
    setDeletingId(targetId);
    try {
      await api.delete(`/reels/${targetId}`);
      setReels((prev) => prev.filter((r) => r.id !== targetId));
      showToast('Reel permanently deleted from platform');
      setDeleteConfirmModal(null);
      if (activeVideoModal?.id === targetId) {
        setActiveVideoModal(null);
      }
    } catch (err: any) {
      alert(err?.message || err || 'Failed to delete reel');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter & Sorting
  const filteredReels = reels
    .filter((reel) => {
      const query = searchQuery.toLowerCase();
      const captionMatch = (reel.caption || '').toLowerCase().includes(query);
      const committeeMatch = (reel.committeeName || reel.committee?.name || '').toLowerCase().includes(query);
      const villageMatch = (reel.village || reel.committee?.village || '').toLowerCase().includes(query);
      return captionMatch || committeeMatch || villageMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'views') return (b.viewCount || 0) - (a.viewCount || 0);
      if (sortBy === 'likes') return (b.likeCount || 0) - (a.likeCount || 0);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  // Calculate Metrics
  const totalReels = reels.length;
  const totalViews = reels.reduce((acc, r) => acc + (r.viewCount || 0), 0);
  const totalLikes = reels.reduce((acc, r) => acc + (r.likeCount || 0), 0);

  return (
    <div className="min-h-screen bg-festival-dark text-white flex">
      <Sidebar />

      <div className="flex-1 ml-64 pt-16">
        <Header />

        <main className="p-8 space-y-6">
          {/* Toast Banner */}
          {toastMessage && (
            <div className="fixed top-20 right-8 z-50 glass-card bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl animate-fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-semibold">{toastMessage}</span>
            </div>
          )}

          {/* Header & Stats Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Film className="w-7 h-7 text-festival-saffron" />
                <span>Festival Reels Moderation Hub</span>
              </h1>
              <p className="text-xs text-white/50 mt-1">
                Review festival vertical video stream uploads, preview content, and moderate/delete inappropriate posts.
              </p>
            </div>

            <button
              onClick={fetchReels}
              disabled={loading}
              className="glass-btn-secondary px-4 py-2 text-xs flex items-center gap-2 font-medium self-start md:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Feed</span>
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-festival-orange/20 border border-festival-orange/30 text-festival-orange">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-white/60 font-medium">TOTAL PUBLISHED REELS</p>
                <p className="text-2xl font-bold text-white">{totalReels}</p>
              </div>
            </div>

            <div className="glass-card p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-white/60 font-medium">TOTAL PLATFORM VIEWS</p>
                <p className="text-2xl font-bold text-white">{totalViews.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="glass-card p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
                <ThumbsUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-white/60 font-medium">TOTAL REEL LIKES</p>
                <p className="text-2xl font-bold text-white">{totalLikes.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Search & Sort Controls */}
          <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search caption or committee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-festival-orange/60"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <span className="text-xs text-white/50 flex items-center gap-1.5 font-medium">
                <Filter className="w-3.5 h-3.5" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-festival-orange/60"
              >
                <option value="newest">Most Recent</option>
                <option value="views">Most Viewed</option>
                <option value="likes">Most Liked</option>
              </select>
            </div>
          </div>

          {/* Grid of Reels */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="glass-card aspect-[9/16] rounded-2xl animate-pulse bg-white/5" />
              ))}
            </div>
          ) : filteredReels.length === 0 ? (
            <div className="glass-card p-16 text-center text-white/50 space-y-3">
              <ShieldAlert className="w-12 h-12 text-festival-orange mx-auto opacity-40" />
              <p className="text-sm font-semibold text-white/70">No reels found matching your criteria</p>
              <p className="text-xs text-white/40">Try adjusting your search query or refresh the page.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredReels.map((reel) => (
                <div
                  key={reel.id}
                  className="glass-card overflow-hidden flex flex-col justify-between group border border-white/10 hover:border-festival-orange/40 transition-all shadow-lg hover:shadow-2xl rounded-2xl"
                >
                  {/* Thumbnail / Preview Canvas */}
                  <div className="relative aspect-[9/16] bg-black/80 overflow-hidden flex items-center justify-center">
                    {reel.thumbnailS3Url ? (
                      <img
                        src={reel.thumbnailS3Url}
                        alt="Reel thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Film className="w-12 h-12 text-festival-orange mx-auto opacity-50 mb-2" />
                        <p className="text-xs text-white/60 font-medium">Vertical Festival Video</p>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 p-4 flex flex-col justify-between">
                      {/* Top Action Bar */}
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] text-festival-saffron font-bold">
                          ⏱️ {reel.duration ? `${reel.duration}s` : '0:30'}
                        </span>

                        <button
                          onClick={() => setDeleteConfirmModal(reel)}
                          className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white shadow-lg backdrop-blur-md transition-all hover:scale-110"
                          title="Delete / Moderate Reel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Center Play Preview Button */}
                      <button
                        onClick={() => setActiveVideoModal(reel)}
                        className="w-14 h-14 rounded-full bg-festival-orange/80 hover:bg-festival-orange text-white flex items-center justify-center mx-auto shadow-2xl backdrop-blur-sm group-hover:scale-115 transition-all"
                        title="Watch Video Preview"
                      >
                        <Play className="w-6 h-6 fill-white ml-1" />
                      </button>

                      {/* Bottom Info Overlay */}
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white line-clamp-2 drop-shadow-md">
                          {reel.caption || 'Festival Reel Video'}
                        </p>
                        <p className="text-[11px] text-festival-cream font-medium truncate">
                          🏛️ {reel.committeeName || reel.committee?.name || 'Sri Rama Youth Committee'}
                        </p>
                        <p className="text-[10px] text-white/50">
                          📍 {reel.village || reel.committee?.village || 'Kovvur'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Footer */}
                  <div className="p-3 bg-white/5 flex items-center justify-around text-[11px] text-white/70 border-t border-white/10 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>{reel.viewCount || 0}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5 text-rose-400" />
                      <span>{reel.likeCount || 0}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                      <span>{reel.commentCount || 0}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIDEO PREVIEW MODAL */}
          {activeVideoModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="glass-card max-w-lg w-full overflow-hidden border border-white/20 relative flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                  <div className="flex items-center gap-2">
                    <Film className="w-5 h-5 text-festival-orange" />
                    <h3 className="text-sm font-bold text-white">Reel Preview & Moderation</h3>
                  </div>
                  <button
                    onClick={() => setActiveVideoModal(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative aspect-[9/16] bg-black max-h-[60vh] flex items-center justify-center">
                  <video
                    src={activeVideoModal.videoS3Url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    poster={activeVideoModal.thumbnailS3Url}
                  />
                </div>

                <div className="p-4 space-y-3 bg-black/50 overflow-y-auto">
                  <h4 className="text-sm font-bold text-white">{activeVideoModal.caption || 'Festival Reel Video'}</h4>
                  <div className="flex flex-wrap items-center justify-between text-xs text-white/70 gap-2">
                    <span>🏛️ {activeVideoModal.committeeName || activeVideoModal.committee?.name || 'Village Committee'}</span>
                    <span className="text-festival-cream">🏷️ {activeVideoModal.hashtags || '#Utsav2026'}</span>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-white/50">Uploaded by: {activeVideoModal.uploaderName || 'Admin / Member'}</span>

                    <button
                      onClick={() => setDeleteConfirmModal(activeVideoModal)}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete This Reel</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DELETE CONFIRMATION MODAL */}
          {deleteConfirmModal && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="glass-card max-w-md w-full p-6 border border-red-500/40 relative space-y-4 animate-scale-up">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-white">Moderate & Delete Reel?</h3>
                  <p className="text-xs text-white/60">
                    Are you sure you want to delete this reel? It will be permanently removed from the Utsav app reel feed and deleted from RDS database & AWS S3.
                  </p>
                </div>

                {/* Selected Reel Snippet */}
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                  {deleteConfirmModal.thumbnailS3Url ? (
                    <img
                      src={deleteConfirmModal.thumbnailS3Url}
                      alt="Thumbnail"
                      className="w-12 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-black/60 rounded-lg flex items-center justify-center text-festival-orange">
                      <Film className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden text-left">
                    <p className="text-xs font-semibold text-white truncate">
                      {deleteConfirmModal.caption || 'Festival Reel Video'}
                    </p>
                    <p className="text-[11px] text-festival-saffron truncate">
                      {deleteConfirmModal.committeeName || deleteConfirmModal.committee?.name || 'Village Committee'}
                    </p>
                    <p className="text-[10px] text-white/40">ID: {deleteConfirmModal.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setDeleteConfirmModal(null)}
                    disabled={deletingId === deleteConfirmModal.id}
                    className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 text-xs font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleConfirmDelete}
                    disabled={deletingId === deleteConfirmModal.id}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {deletingId === deleteConfirmModal.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>{deletingId === deleteConfirmModal.id ? 'Deleting...' : 'Confirm Delete'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

