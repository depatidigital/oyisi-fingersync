'use client';

import React, { useState, useRef, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  address?: string;
  batch_name?: string;
}

interface UserSearchProps {
  onUserSelect: (user: User) => void;
  addedUsers: User[];
  ref?: React.RefObject<{ focus: () => void }>;
}

const UserSearch = React.forwardRef<{ focus: () => void }, UserSearchProps>(
  ({ onUserSelect, addedUsers }, ref) => {
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    // Expose focus method to parent component
    React.useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      }
    }));

    // Search users by name
    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearch(value);
      setSelectedIndex(-1); // Reset selection when typing
      setLoading(true);
      try {
        const res = await fetch(`/api/users?q=${encodeURIComponent(value)}`);
        const users = await res.json();
        console.log(users);
        setSearchResults(users);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const handleUserSelect = (user: User) => {
      onUserSelect(user);
      setSearch('');
      setSearchResults([]);
      setSelectedIndex(-1);
    };

    const filteredResults = searchResults.filter(
      (user: User) => !addedUsers.find(u => u.id === user.id)
    );

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (filteredResults.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
            handleUserSelect(filteredResults[selectedIndex]);
          }
          break;
        case 'Escape':
          setSearchResults([]);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    // Reset selection when results change
    useEffect(() => {
      setSelectedIndex(-1);
    }, [searchResults]);

    return (
      <div className="mb-4 sm:mb-6 relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full text-center border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
          placeholder="Gunakan ↑↓ untuk navigasi, Enter untuk pilih"
          value={search}
          onChange={handleSearch}
          onKeyDown={handleKeyDown}
        />
        {(loading || searchResults.length > 0) && (
          <ul className="absolute left-0 w-full z-40 border border-gray-200 rounded mt-1 bg-white max-h-48 overflow-y-auto shadow-lg">
            {loading && (
              <li className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 select-none">
                Mencari...
              </li>
            )}
            {filteredResults.map((user: User, index: number) => (
              <li
                key={user.id}
                className={`px-4 py-2 py-2cursor-pointer  ${index === selectedIndex
                  ? 'bg-blue-100 border-l-4 border-blue-500'
                  : 'hover:bg-blue-50'
                  }`}
                onClick={() => handleUserSelect(user)}
              >
                <div className=' text-center '>
                  {user.name} - {user.batch_name}
                </div>
                <div className='text-center text-xs text-gray-500'>
                  {user.address || '-'}
                </div>
              </li>
            ))}
            {filteredResults.length === 0 && searchResults.length > 0 && (
              <li className="px-4 py-2 text-xs text-gray-400 select-none">
                Semua pengguna dalam hasil sudah ditambahkan
              </li>
            )}
            {!loading && searchResults.length === 0 && search.length >= 2 && (
              <li className="px-4 py-2 text-xs text-gray-400 select-none">
                Tidak ada pengguna ditemukan
              </li>
            )}
          </ul>
        )}
      </div>
    );
  });

export default UserSearch; 