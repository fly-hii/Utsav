'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  FileCheck,
  Building2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  FileText,
  MapPin,
  Phone,
  Mail,
  X,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function CommitteeRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommittee, setSelectedCommittee] = useState<any>(null);

  // Action Modals
  const [rejectReason, setRejectReason] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [modalType, setModalType] = useState<'review' | 'reject' | 'info' | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/admin/committees?status=PENDING');
      const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setRequests(data);
    } catch (err) {
      console.error('Failed to load committee requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to APPROVE this committee?')) return;
    try {
      await api.put(`/admin/committees/${id}/approve`);
      alert('Committee Approved Successfully!');
      setModalType(null);
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.put(`/admin/committees/${id}/reject`, { reason: rejectReason });
      alert('Committee Registration Rejected.');
      setModalType(null);
      setRejectReason('');
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const handleRequestInfo = async (id: string) => {
    try {
      await api.put(`/admin/committees/${id}/request-info`, { message: infoMessage });
      alert('Requested more information from committee admin.');
      setModalType(null);
      setInfoMessage('');
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Request failed');
    }
  };

  return (
    <div className="min-h-screen bg-festival-dark text-white flex">
      <Sidebar />

      <div className="flex-1 ml-64 pt-16">
        <Header />

        <main className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <FileCheck className="w-7 h-7 text-festival-saffron" />
                <span>Pending Committee Requests</span>
              </h1>
              <p className="text-xs text-white/50 mt-1">
                Review submitted documents, temple images, and identity proofs before activating committee accounts.
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              {requests.length} Requests Pending
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.length === 0 ? (
              <div className="col-span-2 glass-card p-12 text-center text-white/50 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
                <p className="text-lg font-semibold text-white">All Caught Up!</p>
                <p className="text-xs">There are no pending committee approval requests at this time.</p>
              </div>
            ) : (
              requests.map((committee) => (
                <div key={committee.id} className="glass-card p-6 space-y-5 relative">
                  {/* Title & Badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{committee.name}</h3>
                      <p className="text-xs text-festival-cream font-medium">🛕 {committee.templeName}</p>
                      <p className="text-xs text-white/60 mt-0.5">🎉 Festival: {committee.festivalName}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                      PENDING
                    </span>
                  </div>

                  {/* Village & Contacts */}
                  <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <p className="text-white/40 text-[10px]">VILLAGE / DISTRICT</p>
                      <p className="font-medium text-white/90">{committee.village}, {committee.mandal}</p>
                      <p className="text-[11px] text-white/50">{committee.district}, {committee.state}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px]">PRESIDENT & SECRETARY</p>
                      <p className="font-medium text-white/90">Pres: {committee.presidentName}</p>
                      <p className="text-[11px] text-white/50">Sec: {committee.secretaryName}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedCommittee(committee);
                        setModalType('review');
                      }}
                      className="flex-1 glass-btn-secondary py-2 text-xs flex items-center justify-center gap-1.5 font-semibold"
                    >
                      <Eye className="w-4 h-4 text-festival-saffron" />
                      <span>Inspect Docs</span>
                    </button>
                    <button
                      onClick={() => handleApprove(committee.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCommittee(committee);
                        setModalType('reject');
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Review Modal */}
      {modalType === 'review' && selectedCommittee && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 relative border border-white/20">
            <button
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-lg bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white">{selectedCommittee.name}</h2>
              <p className="text-xs text-festival-cream">Full Verification & Document Inspection</p>
            </div>

            {/* Document list */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-white/70 uppercase">Uploaded Verification Documents</h3>
              {selectedCommittee.documents?.length === 0 ? (
                <p className="text-xs text-white/40 italic">No documents attached.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedCommittee.documents?.map((doc: any) => (
                    <a
                      key={doc.id}
                      href={doc.s3Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between group text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-festival-orange" />
                        <div>
                          <p className="font-semibold text-white group-hover:text-festival-cream">
                            {doc.type.replace('_', ' ')}
                          </p>
                          <p className="text-[10px] text-white/40">{doc.fileName}</p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Location & GPS */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <p className="font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-festival-crimson" />
                <span>GPS Location & Physical Address</span>
              </p>
              <p className="text-white/70">{selectedCommittee.address}</p>
              <p className="text-white/40 text-[11px]">
                GPS Coordinates: {selectedCommittee.latitude}, {selectedCommittee.longitude}
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setModalType('info')}
                className="glass-btn-secondary px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Request Info</span>
              </button>
              <button
                onClick={() => handleApprove(selectedCommittee.id)}
                className="glass-btn px-5 py-2 text-xs font-semibold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Activate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {modalType === 'reject' && selectedCommittee && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 relative border border-rose-500/30">
            <h3 className="text-lg font-bold text-rose-300">Reject Committee Registration</h3>
            <p className="text-xs text-white/60">
              Please specify the reason for rejecting <strong>{selectedCommittee.name}</strong>.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid registration certificate, incomplete temple details..."
              className="w-full glass-input text-xs p-3 text-white focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setModalType(null)} className="glass-btn-secondary px-4 py-2 text-xs">
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedCommittee.id)}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Request Modal */}
      {modalType === 'info' && selectedCommittee && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 relative border border-amber-500/30">
            <h3 className="text-lg font-bold text-amber-300">Request Additional Information</h3>
            <p className="text-xs text-white/60">
              Send a message to <strong>{selectedCommittee.presidentName}</strong> specifying what additional details or documents are required.
            </p>
            <textarea
              rows={3}
              value={infoMessage}
              onChange={(e) => setInfoMessage(e.target.value)}
              placeholder="e.g. Please re-upload a clearer image of the registration certificate..."
              className="w-full glass-input text-xs p-3 text-white focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setModalType(null)} className="glass-btn-secondary px-4 py-2 text-xs">
                Cancel
              </button>
              <button
                onClick={() => handleRequestInfo(selectedCommittee.id)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
