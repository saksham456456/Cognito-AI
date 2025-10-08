import React, { useState, useMemo } from 'react';
import type { Chat } from '../types';
import { CognitoLogo } from './Logo';
import { PlusIcon, MessageSquareIcon, SearchIcon, PencilIcon, CheckIcon, XIcon, UserCircleIcon, SunIcon, MoonIcon, DownloadIcon, TrashIcon, InfoIcon, CodeBracketIcon, LayersIcon } from './icons';

// Sidebar ke props ka interface.
interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
  onDeleteAllChats: () => void;
  isSidebarOpen: boolean;
  onExportChat: () => void;
  userName: string;
  onProfileClick: () => void;
  onAboutClick: () => void;
  backgroundAnimation: string;
  onBackgroundAnimationChange: (animation: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  onDeleteAllChats,
  isSidebarOpen,
  onExportChat,
  userName,
  onProfileClick,
  onAboutClick,
  backgroundAnimation,
  onBackgroundAnimationChange
}) => {
  // State variables
  const [searchTerm, setSearchTerm] = useState(''); // Search input ki value.
  const [editingChatId, setEditingChatId] = useState<string | null>(null); // Kaunsa chat rename ho raha hai.
  const [editingTitle, setEditingTitle] = useState(''); // Rename karte waqt naya title.

  // useMemo ka istemal taki chats filter tabhi ho jab 'chats' ya 'searchTerm' badle.
  // Yeh performance improve karta hai.
  const filteredChats = useMemo(() =>
    chats.filter(chat =>
      chat.title.toLowerCase().includes(searchTerm.toLowerCase())
    ), [chats, searchTerm]);

  // Rename shuru karne ke liye function.
  const handleRenameStart = (e: React.MouseEvent, chat: Chat) => {
    e.preventDefault();
    e.stopPropagation(); // Parent element ke click event ko trigger hone se rokta hai.
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  // Rename cancel karne ke liye.
  const handleRenameCancel = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setEditingChatId(null);
    setEditingTitle('');
  };

  // Naya title save karne ke liye.
  const handleRenameSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingChatId && editingTitle.trim()) {
      onRenameChat(editingChatId, editingTitle.trim());
    }
    handleRenameCancel(); // Editing state ko reset karte hain.
  };

  // Chat delete karne ke liye.
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteChat(id);
  }

  return (
    // Sidebar ka main container. Mobile pe left se slide in/out hota hai.
    <aside className={`absolute md:relative z-20 flex-shrink-0 w-80 glassmorphism flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      {/* Sidebar ka header */}
      <div className="p-4 border-b border-card-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CognitoLogo className="h-8 w-8" />
          <h1 className="font-heading text-xl font-bold text-primary tracking-widest uppercase text-glow-primary">COGNITO</h1>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 border-b border-card-border">
          {/* New Chat button */}
          <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 p-2 rounded-lg transition-colors border border-input-border hover:border-primary text-text-medium hover:text-primary font-semibold neon-glow-button">
              <PlusIcon className="w-5 h-5" />
              New Session
          </button>
          {/* Search bar */}
          <div className="relative">
              <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-dark"/>
              <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-input border border-input-border rounded-lg pl-10 pr-4 py-2 text-text-light focus:outline-none focus:border-primary transition-colors"
              />
          </div>
      </div>
      {/* Chat list */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <ul className="space-y-2">
          {filteredChats.map(chat => {
              const isActive = activeChatId === chat.id;
              return (
                  <li key={chat.id}>
                  <div
                      onClick={() => onSelectChat(chat.id)}
                      className={`group relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      isActive ? 'bg-primary/20 text-primary' : 'hover:bg-input'
                      }`}
                  >
                      {/* Active indicator */}
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3/5 w-1 bg-primary rounded-r-full" style={{boxShadow: '0 0 8px var(--primary-glow)'}}></div>}

                      {/* Conditional rendering: agar chat edit ho raha hai to input dikhao, nahi to title */}
                      {editingChatId === chat.id ? (
                          <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleRenameSave(e as any)}
                              onBlur={() => handleRenameCancel()}
                              className="flex-grow bg-transparent focus:outline-none text-primary ml-2"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                          />
                      ) : (
                          <div className="flex items-center gap-3 truncate ml-2">
                              <MessageSquareIcon className="w-5 h-5 flex-shrink-0" />
                              <span className="truncate">{chat.title}</span>
                          </div>
                      )}

                      {/* Edit/Delete controls */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                          {editingChatId === chat.id ? (
                              <>
                                  <button onClick={handleRenameSave} className="p-1 rounded hover:bg-primary/30"><CheckIcon className="w-4 h-4 text-green-500"/></button>
                                  <button onClick={handleRenameCancel} className="p-1 rounded hover:bg-primary/30"><XIcon className="w-4 h-4 text-red-500"/></button>
                              </>
                          ) : (
                              // Ye controls sirf hover pe dikhenge
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => handleRenameStart(e, chat)} className="p-1 rounded hover:bg-primary/30"><PencilIcon className="w-4 h-4 text-text-medium"/></button>
                                  <button onClick={(e) => handleDelete(e, chat.id)} className="p-1 rounded hover:bg-primary/30"><TrashIcon className="w-4 h-4 text-text-medium hover:text-red-500"/></button>
                              </div>
                          )}
                      </div>

                  </div>
                  </li>
              )
          })}
          </ul>
      </nav>
      {/* Sidebar ka footer */}
      <div className="p-2 border-t border-card-border">
          {/* User profile section */}
          <div className="mt-2 p-2 rounded-lg bg-input/50 flex items-center justify-between border border-card-border">
              <button onClick={onProfileClick} className="flex items-center gap-3 truncate text-left p-1 -m-1 rounded-md hover:bg-input w-full">
                  <UserCircleIcon className="w-10 h-10 text-primary" />
                  <div className="truncate">
                      <p className="font-semibold text-text-light">{userName}</p>
                      <p className="text-xs text-text-medium">Operator</p>
                  </div>
              </button>
          </div>
          {/* Action buttons */}
          <ul className="space-y-1 mt-2">
               <li>
                  <div className="w-full flex items-center gap-3 p-2 rounded-md text-sm text-text-medium">
                      <LayersIcon className="w-5 h-5" />
                      <label htmlFor="bg-animation-select" className="flex-1">Background</label>
                      <select
                          id="bg-animation-select"
                          value={backgroundAnimation}
                          onChange={(e) => onBackgroundAnimationChange(e.target.value)}
                          className="bg-input border border-input-border rounded-md px-2 py-1 text-xs text-text-light focus:outline-none focus:border-primary transition-colors"
                      >
                          <option value="particles">Plexus</option>
                          <option value="matrix">Matrix</option>
                          <option value="hexagons">Hex Grid</option>
                          <option value="circuits">Circuits</option>
                      </select>
                  </div>
              </li>
              <li>
                  <button
                      onClick={onAboutClick}
                      className="w-full flex items-center gap-3 p-2 rounded-md text-sm text-text-medium hover:bg-input hover:text-text-light transition-colors group"
                  >
                      <InfoIcon className="w-5 h-5" />
                      <span>About Cognito AI</span>
                  </button>
              </li>
              <li>
                  <button
                      onClick={onExportChat}
                      disabled={!activeChatId}
                      className="w-full flex items-center gap-3 p-2 rounded-md text-sm text-text-medium hover:bg-input hover:text-text-light transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <DownloadIcon className="w-5 h-5" />
                      <span>Export Log</span>
                  </button>
              </li>
              <li>
                  <button
                      onClick={onDeleteAllChats}
                      disabled={chats.length === 0}
                      className="w-full flex items-center gap-3 p-2 rounded-md text-sm text-red-500 hover:bg-red-500/10 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <TrashIcon className="w-5 h-5" />
                      <span>Purge All Logs</span>
                  </button>
              </li>
          </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
