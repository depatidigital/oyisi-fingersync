'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [addedUsers, setAddedUsers] = useState<any[]>([]); // [{user, fingerprint_data}]
  const [loading, setLoading] = useState(false);
  const [importData, setImportData] = useState('');
  const [exported, setExported] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const datFileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            .filter((item: any) => item.user_id && item.user_name)
            .sort((a: any, b: any) => a.device_user_id - b.device_user_id)
            .map((item: any) => ({
              user: {
                id: item.user_id,
                name: item.user_name,
                user_phone: item.user_phone || '-',
              },
              fingerprint_data: item.fingerprint_data || '',
            }))
        );
      } catch (e) {
        setError('Failed to load data from backend');
        setTimeout(() => setError(null), 2000);
      }
    };
    fetchDeviceUsers();
  }, []);

  // Search users by name
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (value.length < 2) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/users?q=${encodeURIComponent(value)}`);
    const users = await res.json();
    setSearchResults(users);
    setLoading(false);
  };

  // Add user to table and sync to backend
  const handleAddUser = async (user: any) => {
    if (!addedUsers.find(u => u.user.id === user.id)) {
      const newDeviceId = addedUsers.length + 1;
      try {
        const res = await fetch('/api/device-users/map', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_user_id: newDeviceId, user_id: user.id })
        });
        if (!res.ok) throw new Error('Failed to sync with backend');
        setAddedUsers([...addedUsers, { user, fingerprint_data: '' }]);
        setFeedback(true);
        setTimeout(() => setFeedback(false), 1000);
      } catch (e) {
        setError('Failed to sync with backend');
        setTimeout(() => setError(null), 2000);
      }
    }
    setSearch('');
    setSearchResults([]);
  };

  // Remove user from table and sync to backend
  const handleRemoveUser = async (idx: number) => {
    const deviceId = idx + 1;
    const userName = addedUsers[idx]?.user?.name || 'this user';
    if (!window.confirm(`Are you sure you want to remove ${userName}?`)) {
      setCancelFeedback(true);
      setTimeout(() => setCancelFeedback(false), 1000);
      return;
    }
    try {
      const res = await fetch('/api/device-users/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_user_id: deviceId, user_id: null })
      });
      if (!res.ok) throw new Error('Failed to sync with backend');
      setAddedUsers(addedUsers.filter((_, i) => i !== idx));
      setDeleteFeedback(true);
      setTimeout(() => setDeleteFeedback(false), 1000);
    } catch (e) {
      setError('Failed to sync with backend');
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
          user_phone: item.user_phone || '-',
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
            user_phone: item.user_phone || '-',
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
            phone: item.user_phone || '-',
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
      name: item.user.name,
      phone: item.user.user_phone || '-',
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
        <h1 className="text-lg font-bold text-blue-900">User Mapping Dashboard</h1>
      </header>
      {/* Main card */}
      <main className="flex-1 p-2 sm:p-6 bg-gray-100">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-4 sm:p-8 mt-4">
          {/* Feedback overlays */}
          {feedback && (
            <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 flex items-center animate-bounce">
              <div className="flex items-center gap-2 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded shadow-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span className="font-medium text-sm">User added!</span>
              </div>
            </div>
          )}
          {deleteFeedback && (
            <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 flex items-center animate-bounce">
              <div className="flex items-center gap-2 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded shadow-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                <span className="font-medium text-sm">User removed!</span>
              </div>
            </div>
          )}
          {cancelFeedback && (
            <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 flex items-center animate-bounce">
              <div className="flex items-center gap-2 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded shadow-lg">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
                <span className="font-medium text-sm">Remove canceled</span>
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
            <h2 className="text-xl sm:text-2xl font-bold text-blue-900">User Mapping Table</h2>
            <div className="flex flex-row sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-start sm:justify-end">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded text-xs sm:text-sm hover:bg-blue-600 shadow"
                onClick={() => datFileInputRef.current && datFileInputRef.current.click()}
              >Import</button>
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
              >Export</button>
            </div>
          </div>
          <div className="mb-4 sm:mb-6 relative">
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
              placeholder="Type at least 2 characters..."
              value={search}
              onChange={handleSearch}
            />
            {(loading || searchResults.length > 0) && (
              <ul className="absolute left-0 w-full z-40 border border-gray-200 rounded mt-1 bg-white max-h-48 overflow-y-auto shadow-lg">
                {loading && <li className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 select-none">Searching...</li>}
                {searchResults.filter((user: any) => !addedUsers.find(u => u.user.id === user.id)).map((user: any) => (
                  <li
                    key={user.id}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                    onClick={() => handleAddUser(user)}
                  >
                    <span>{user.name} <span className="text-gray-400 text-xs">({user.user_phone || '-'})</span></span>
                    <span className="text-blue-500 text-xs ml-2">Add</span>
                  </li>
                ))}
                {searchResults.filter((user: any) => !addedUsers.find(u => u.user.id === user.id)).length === 0 && (
                  <li className="px-4 py-2 text-xs text-gray-400 select-none">All users in result already added</li>
                )}
                {(!loading && searchResults.length === 0) && (
                  <li className="px-4 py-2 text-xs text-gray-400 select-none">No users found</li>
                )}
              </ul>
            )}
          </div>
          {/* User cards instead of table */}
          <div className="grid gap-4 sm:gap-6 mb-4 sm:mb-6 grid-cols-1">
            {addedUsers.length === 0 && (
              <div className="text-center text-gray-400 py-6 bg-gray-50 rounded-lg">No users added yet.</div>
            )}
            {addedUsers.map((item, idx) => (
              <div
                key={idx}
                className="relative bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 shadow-sm flex items-center gap-2 overflow-x-auto whitespace-nowrap"
                style={{ minHeight: '56px' }}
              >
                {/* Trash icon top right, larger on mobile */}
                <button
                  className="absolute top-2 right-2 text-red-500 hover:bg-red-100 rounded-full p-2 transition"
                  title="Remove"
                  onClick={() => handleRemoveUser(idx)}
                  style={{ zIndex: 1 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3m5 0H6" />
                  </svg>
                </button>
                <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 w-full text-xs sm:text-sm">
                  <div className="flex flex-col min-w-[70px]">
                    <span className="text-gray-400">ID</span>
                    <span className="font-mono text-blue-900">{idx + 1}</span>
                  </div>
                  <div className="flex flex-col min-w-[90px]">
                    <span className="text-gray-400">Name</span>
                    <span className="truncate text-gray-900">{item.user.name}</span>
                  </div>
                  <div className="flex flex-col min-w-[90px]">
                    <span className="text-gray-400">Phone</span>
                    <span className="truncate text-gray-900">{item.user.user_phone || '-'}</span>
                  </div>
                  <div className="flex flex-col min-w-[120px] max-w-[160px]">
                    <span className="text-gray-400">Fingerprint</span>
                    <span className="truncate text-gray-700">{item.fingerprint_data ? item.fingerprint_data.slice(0, 40) + '...' : '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {exported && (
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mt-2 max-h-40">{JSON.stringify(exported, null, 2)}</pre>
          )}
        </div>
      </main>
    </div>
  );
}
