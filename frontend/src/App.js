import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:3001';

function App() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [deviceUsers, setDeviceUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [mapDeviceUserId, setMapDeviceUserId] = useState('');
  const [importData, setImportData] = useState('');
  const [exported, setExported] = useState(null);

  // Fetch users
  const fetchUsers = async (q = '') => {
    const res = await fetch(`${API_BASE}/users?q=${encodeURIComponent(q)}`);
    setUsers(await res.json());
  };

  // Fetch device users
  const fetchDeviceUsers = async () => {
    const res = await fetch(`${API_BASE}/device-users`);
    setDeviceUsers(await res.json());
  };

  useEffect(() => {
    fetchUsers();
    fetchDeviceUsers();
  }, []);

  // Handle user search
  const handleSearch = (e) => {
    setSearch(e.target.value);
    fetchUsers(e.target.value);
  };

  // Handle mapping
  const handleMap = async () => {
    if (!mapDeviceUserId || !selectedUser) return;
    await fetch(`${API_BASE}/device-users/map`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_user_id: mapDeviceUserId, user_id: selectedUser.id })
    });
    fetchDeviceUsers();
    setMapDeviceUserId('');
    setSelectedUser(null);
  };

  // Handle import
  const handleImport = async () => {
    try {
      const data = JSON.parse(importData);
      await fetch(`${API_BASE}/device-users/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      fetchDeviceUsers();
      setImportData('');
    } catch (e) {
      alert('Invalid JSON');
    }
  };

  // Handle export
  const handleExport = async () => {
    const res = await fetch(`${API_BASE}/device-users/export`);
    const data = await res.json();
    setExported(data);
  };

  return (
    <div style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
      <h2>Finger Sync App</h2>

      <section style={{ marginBottom: 30 }}>
        <h3>1. Search Users</h3>
        <input value={search} onChange={handleSearch} placeholder="Search by name or email" />
        <ul>
          {users.map(u => (
            <li key={u.id}>
              <button onClick={() => setSelectedUser(u)} style={{ marginRight: 8 }}>
                {selectedUser && selectedUser.id === u.id ? 'Selected' : 'Select'}
              </button>
              {u.name} ({u.email})
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 30 }}>
        <h3>2. Device Users</h3>
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>Device User ID</th>
              <th>Fingerprint Data</th>
              <th>Mapped User</th>
              <th>Map to Selected User</th>
            </tr>
          </thead>
          <tbody>
            {deviceUsers.map(d => (
              <tr key={d.device_user_id}>
                <td>{d.device_user_id}</td>
                <td style={{ maxWidth: 200, overflow: 'auto' }}>{d.fingerprint_data?.slice(0, 30)}...</td>
                <td>{d.user_name ? `${d.user_name} (${d.user_phone})` : <span style={{ color: 'red' }}>Not mapped</span>}</td>
                <td>
                  <button
                    disabled={!selectedUser}
                    onClick={() => {
                      setMapDeviceUserId(d.device_user_id);
                      handleMap();
                    }}
                  >
                    Map to Selected
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: 30 }}>
        <h3>3. Import Device Data (JSON)</h3>
        <textarea
          value={importData}
          onChange={e => setImportData(e.target.value)}
          rows={5}
          cols={60}
          placeholder='Paste JSON array: [{"device_user_id":1,"fingerprint_data":"..."}]'
        />
        <br />
        <button onClick={handleImport}>Import</button>
      </section>

      <section>
        <h3>4. Export Mapped Data</h3>
        <button onClick={handleExport}>Export</button>
        {exported && (
          <pre style={{ background: '#eee', padding: 10, marginTop: 10 }}>
            {JSON.stringify(exported, null, 2)}
          </pre>
        )}
      </section>
    </div>
  );
}

export default App;
