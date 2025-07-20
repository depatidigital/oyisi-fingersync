'use client';

import React, { useState, useRef, useEffect } from 'react';
import UserSearch from '@/components/UserSearch';
import FingerprintModal from '@/components/FingerprintModal';
import Watermark from '@/components/Watermark';

export default function Home() {
  const [addedUsers, setAddedUsers] = useState<any[]>([]); // [{user, fingerprint_data}]
  const [importData, setImportData] = useState('');
  const [exported, setExported] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const datFileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const userSearchRef = useRef<{ focus: () => void }>(null);
  const [newlyAddedUserId, setNewlyAddedUserId] = useState<number | null>(null);

  // Load mapped device users from backend on mount
  useEffect(() => {
    const fetchDeviceUsers = async () => {
      try {
        const res = await fetch('/api/device-users');
        if (!res.ok) throw new Error('Failed to fetch device users');
        const data = await res.json();
        // Map backend data to addedUsers format
        setAddedUsers(
          data
            .sort((a: any, b: any) => b.device_user_id - a.device_user_id)

        );
      } catch (e) {
        setError('Gagal memuat data dari backend');
        setTimeout(() => setError(null), 2000);
      }
    };
    fetchDeviceUsers();
  }, []);

  // Add user to table and sync to backend
  const handleAddUser = async (user: any) => {
    if (!addedUsers.find(u => u.id === user.id)) {
      // Show fingerprint modal first
      setPendingUser(user);
      setShowFingerprintModal(true);
    }
  };

  // Handle fingerprint scan confirmation
  const handleFingerprintConfirm = async () => {
    if (!pendingUser) return;

    const newDeviceId = addedUsers.length + 1;
    try {
      const res = await fetch('/api/device-users/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_user_id: newDeviceId, user_id: pendingUser.id })
      });
      if (!res.ok) throw new Error('Failed to sync with backend');
      const jsonResponse = await res.json();
      const sortedUsers = [...addedUsers, { ...jsonResponse.data, fingerprint_data: '' }].sort((a: any, b: any) => b.device_user_id - a.device_user_id);
      setAddedUsers(sortedUsers);

      // Set the newly added user ID for animation
      setNewlyAddedUserId(jsonResponse.data.id);

      setFeedback(true);
      setTimeout(() => setFeedback(false), 1000);

      // Clear the animation after 2 seconds
      setTimeout(() => setNewlyAddedUserId(null), 2000);
    } catch (e: any) {
      console.log(e.message);
      setError('Gagal sinkronisasi dengan backend');
      setTimeout(() => setError(null), 2000);
    } finally {
      setShowFingerprintModal(false);
      setPendingUser(null);
      // Focus back to search input
      setTimeout(() => userSearchRef.current?.focus(), 100);
    }
  };

  // Handle fingerprint modal cancel
  const handleFingerprintCancel = () => {
    setShowFingerprintModal(false);
    setPendingUser(null);
    // Focus back to search input
    setTimeout(() => userSearchRef.current?.focus(), 100);
  };

  // Remove user from table and sync to backend
  const handleRemoveUser = async (id: number) => {
    console.log('Removing user with ID:', id);
    const user = addedUsers.find((item: any) => item.id === id);
    const userName = user?.name || 'pengguna ini';
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${userName}?`)) {
      setCancelFeedback(true);
      setTimeout(() => setCancelFeedback(false), 1000);
      return;
    }
    try {
      const res = await fetch(`/api/device-users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal menghapus pengguna');
      }
      // remove user from addedUsers
      setAddedUsers(addedUsers.filter((item: any) => item.id !== id));
      setDeleteFeedback(true);
      setTimeout(() => setDeleteFeedback(false), 1000);
    } catch (e: any) {
      console.error('Delete error:', e);
      setError(e.message || 'Gagal sinkronisasi dengan backend');
      setTimeout(() => setError(null), 2000);
    }
  };

  // Import fingerprint data from textarea (JSON array: [{name, phone, fingerprint_data}])
  const handleImport = () => {
    try {
      const data = JSON.parse(importData);
      if (!Array.isArray(data)) throw new Error('Not an array');
      const newUsers = data.map((item: any, i: number) => ({
        user: {
          id: null,
          name: item.name || `User ${i}`,
          phone: item.phone || '-',
        },
        fingerprint_data: item.fingerprint_data || '',
      }));
      setAddedUsers([...addedUsers, ...newUsers]);
      setImportData('');
    } catch (e) {
      alert('Invalid JSON');
    }
  };

  // Import fingerprint data from file
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (!Array.isArray(data)) throw new Error('Not an array');
        const newUsers = data.map((item: any, i: number) => ({
          user: {
            id: null,
            name: item.name || `User ${i}`,
            phone: item.phone || '-',
          },
          fingerprint_data: item.fingerprint_data || '',
        }));
        setAddedUsers(prev => [...prev, ...newUsers]);
      } catch (e) {
        alert('Invalid JSON in file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Import userdat.dat file (assume JSON for now)
  const handleDatImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        // Try to parse as JSON array
        const data = JSON.parse(evt.target?.result as string);
        if (!Array.isArray(data)) throw new Error('Not an array');
        const newUsers = data.map((item: any, i: number) => ({
          user: {
            id: null,
            name: item.name || `User ${i}`,
            phone: item.phone || '-',
          },
          fingerprint_data: item.fingerprint_data || '',
        }));
        setAddedUsers(prev => [...prev, ...newUsers]);
      } catch (e) {
        alert('Invalid or unsupported .dat file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Export current table as JSON and trigger download
  const handleExport = () => {
    const data = addedUsers.map((item, idx) => ({
      device_user_id: idx + 1, // start from 1
      name: item.name,
      phone: item.phone || '-',
      fingerprint_data: item.fingerprint_data || '',
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fingerprint_export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExported(data);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Topbar */}
      <header className="h-16 bg-white shadow flex items-center px-4 md:px-8 sticky top-0 z-20">
        <h1 className="text-lg font-bold text-blue-900">Dashboard Pemetaan Pengguna</h1>
      </header>
      {/* Main card */}
      <main className="flex-1 p-2 sm:p-6 bg-gray-100">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-4 sm:p-8 mt-4">
          {/* Feedback overlays */}
          {feedback && (
            <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 flex items-center animate-bounce">
              <div className="flex items-center gap-2 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded shadow-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span className="font-medium text-sm">Pengguna berhasil ditambahkan!</span>
              </div>
            </div>
          )}
          {deleteFeedback && (
            <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 flex items-center animate-bounce">
              <div className="flex items-center gap-2 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded shadow-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                <span className="font-medium text-sm">Pengguna berhasil dihapus!</span>
              </div>
            </div>
          )}
          {cancelFeedback && (
            <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 flex items-center animate-bounce">
              <div className="flex items-center gap-2 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded shadow-lg">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
                <span className="font-medium text-sm">Penghapusan dibatalkan</span>
              </div>
            </div>
          )}
          {error && (
            <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 flex items-center animate-shake">
              <div className="flex items-center gap-2 bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded shadow-lg">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                <span className="font-medium text-sm">{error}</span>
              </div>
            </div>
          )}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <h2 className="text-xl sm:text-2xl font-bold text-blue-900">Tabel Pemetaan Pengguna</h2>
            <div className="flex flex-row sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-start sm:justify-end">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded text-xs sm:text-sm hover:bg-blue-600 shadow"
                onClick={() => datFileInputRef.current && datFileInputRef.current.click()}
              >Impor</button>
              <input
                type="file"
                accept=".dat"
                ref={datFileInputRef}
                className="hidden"
                onChange={handleDatImport}
              />
              <button
                className="bg-green-500 text-white px-4 py-2 rounded text-xs sm:text-sm hover:bg-green-600 shadow"
                onClick={handleExport}
              >Ekspor</button>
            </div>
          </div>
          <div className='w-[400px] mx-auto'>
            <UserSearch ref={userSearchRef} onUserSelect={handleAddUser} addedUsers={addedUsers} />
          </div>
          {/* User table */}
          <div className="mb-4 sm:mb-6">
            {addedUsers.length === 0 ? (
              <div className="text-center text-gray-400 py-6 bg-gray-50 rounded-lg">Belum ada pengguna yang ditambahkan.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th style={{ width: '100px' }} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Nama
                      </th>
                      <th style={{ width: '100px' }} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Telepon
                      </th>
                      <th style={{ width: '100px' }} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Alamat
                      </th>

                      <th style={{ width: '100px' }} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {addedUsers.map((item, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-gray-50 ${newlyAddedUserId === item.id ? 'animate-table-row-shake' : ''
                          }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-blue-900">
                          {item.device_user_id}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.phone || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.address || '-'}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <button
                            className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-1 transition-colors"
                            title="Remove"
                            onClick={() => handleRemoveUser(item.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3m5 0H6" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {exported && (
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mt-2 max-h-40">{JSON.stringify(exported, null, 2)}</pre>
          )}
        </div>
      </main>

      {/* Fingerprint Modal */}
      <FingerprintModal
        isOpen={showFingerprintModal}
        onConfirm={handleFingerprintConfirm}
        onCancel={handleFingerprintCancel}
        userName={pendingUser?.name || ''}
      />

      {/* Watermark */}
      <Watermark />
    </div>
  );
}
