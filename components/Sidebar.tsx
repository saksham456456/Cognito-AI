

import React, { useState, useMemo } from 'react';
import type { Chat } from '../types';
import { CognitoLogo } from './Logo';
import { PlusIcon, MessageSquareIcon, SearchIcon, PencilIcon, CheckIcon, XIcon, UserCircleIcon, SunIcon, MoonIcon, DownloadIcon, TrashIcon, InfoIcon } from './icons';

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
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
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
  theme,
  onToggleTheme,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const filteredChats = useMemo(() =>
    chats.filter(chat =>
      chat.title.toLowerCase().includes(searchTerm.toLowerCase())
    ), [chats, searchTerm]);

  const handleRenameStart = (e: React.MouseEvent, chat: Chat) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleRenameCancel = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleRenameSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingChatId && editingTitle.trim()) {
      onRenameChat(editingChatId, editingTitle.trim());
    }
    handleRenameCancel();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteChat(id);
  }
  
  return (
    <aside className={`absolute md:relative z-20 flex-shrink-0 w-80 bg-card dark:bg-[#1f1f1f] border-r border-card-border dark:border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="p-4 border-b border-card-border dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CognitoLogo className="h-8 w-8" />
          <h1 className="text-xl font-semibold text-primary dark:text-yellow-400 tracking-wider text-outline">COGNITO</h1>
        </div>
        <button onClick={onNewChat} className="p-2 rounded-md hover:bg-input dark:hover:bg-[#292929] transition-colors border border-transparent hover:border-card-border dark:hover:border-zinc-700">
          <PlusIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="p-4">
        <div className="relative">
            <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-card-foreground/40 dark:text-gray-600"/>
            <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-input dark:bg-[#292929] border border-input-border dark:border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-card-foreground dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-yellow-400 transition-colors"
            />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-4">
        <ul className="space-y-2">
          {filteredChats.map(chat => (
            <li key={chat.id}>
              <div
                onClick={() => onSelectChat(chat.id)}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  activeChatId === chat.id ? 'bg-primary/20 dark:bg-yellow-400/10' : 'hover:bg-input dark:hover:bg-[#292929]'
                }`}
              >
                {editingChatId === chat.id ? (
                    <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSave(e as any)}
                        onBlur={() => handleRenameCancel()}
                        className="flex-grow bg-transparent focus:outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div className="flex items-center gap-3 truncate">
                        <MessageSquareIcon className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">{chat.title}</span>
                    </div>
                )}

                <div className="flex items-center gap-1 flex-shrink-0">
                    {editingChatId === chat.id ? (
                        <>
                            <button onClick={handleRenameSave} className="p-1 rounded hover:bg-primary/30 dark:hover:bg-yellow-400/20"><CheckIcon className="w-4 h-4 text-green-500"/></button>
                            <button onClick={handleRenameCancel} className="p-1 rounded hover:bg-primary/30 dark:hover:bg-yellow-400/20"><XIcon className="w-4 h-4 text-red-500"/></button>
                        </>
                    ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => handleRenameStart(e, chat)} className="p-1 rounded hover:bg-primary/30 dark:hover:bg-yellow-400/20"><PencilIcon className="w-4 h-4"/></button>
                            <button onClick={(e) => handleDelete(e, chat.id)} className="p-1 rounded hover:bg-primary/30 dark:hover:bg-yellow-400/20"><TrashIcon className="w-4 h-4 text-card-foreground/70 dark:text-gray-400 hover:text-red-500"/></button>
                        </div>
                    )}
                </div>

              </div>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-2 border-t border-card-border dark:border-zinc-800">
          <div className="mt-2 p-2 rounded-lg bg-input/50 dark:bg-[#292929]/50 flex items-center justify-between border border-card-border dark:border-zinc-700">
              <button onClick={onProfileClick} className="flex items-center gap-3 truncate text-left p-1 -m-1 rounded-md hover:bg-input dark:hover:bg-[#292929]">
                  <UserCircleIcon className="w-10 h-10 text-primary dark:text-yellow-400" />
                  <div className="truncate">
                      <p className="font-semibold text-card-foreground dark:text-gray-200">{userName}</p>
                      <p className="text-xs text-card-foreground/60 dark:text-gray-500">Welcome back</p>
                  </div>
              </button>
          </div>
          <ul className="space-y-1 mt-2">
              <li>
                  <button
                      onClick={onToggleTheme}
                      className="w-full flex items-center gap-3 p-2 rounded-md text-sm text-card-foreground/80 dark:text-gray-300 hover:bg-input dark:hover:bg-[#292929] transition-colors group"
                  >
                      {theme === 'light' 
                          ? <MoonIcon className="w-5 h-5 text-card-foreground/60 dark:text-gray-400" /> 
                          : <SunIcon className="w-5 h-5 text-card-foreground/60 dark:text-gray-400" />}
                      <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                  </button>
              </li>
              <li>
                  <button
                      onClick={onAboutClick}
                      className="w-full flex items-center gap-3 p-2 rounded-md text-sm text-card-foreground/80 dark:text-gray-300 hover:bg-input dark:hover:bg-[#292929] transition-colors group"
                  >
                      <InfoIcon className="w-5 h-5 text-card-foreground/60 dark:text-gray-400 transition-colors" />
                      <span>About Cognito AI</span>
                  </button>
              </li>
              <li>
                  <button
                      onClick={onExportChat}
                      disabled={!activeChatId}
                      className="w-full flex items-center gap-3 p-2 rounded-md text-sm text-card-foreground/80 dark:text-gray-300 hover:bg-input dark:hover:bg-[#292929] transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <DownloadIcon className="w-5 h-5 text-card-foreground/60 dark:text-gray-400 transition-colors" />
                      <span>Export Chat</span>
                  </button>
              </li>
              <li>
                  <button
                      onClick={onDeleteAllChats}
                      disabled={chats.length === 0}
                      className="w-full flex items-center gap-3 p-2 rounded-md text-sm text-red-500 hover:bg-red-500/10 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <TrashIcon className="w-5 h-5" />
                      <span>Clear Conversations</span>
                  </button>
              </li>
          </ul>
      </div>
    </aside>
  );
};

export default Sidebar;