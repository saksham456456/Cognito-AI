import React, { useState, useMemo } from 'react';
import type { Chat } from '../types';
import { CognitoLogo } from './Logo';
import { PlusIcon, MessageSquareIcon, SearchIcon, PencilIcon, TrashIcon, CheckIcon, XIcon } from './icons';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
  isSidebarOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  isSidebarOpen
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const filteredChats = useMemo(() =>
    chats.filter(chat =>
      chat.title.toLowerCase().includes(searchTerm.toLowerCase())
    ), [chats, searchTerm]);

  const handleRenameStart = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleRenameCancel = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleRenameSave = () => {
    if (editingChatId && editingTitle.trim()) {
      onRenameChat(editingChatId, editingTitle.trim());
    }
    handleRenameCancel();
  };
  
  const handleDelete = (chatId: string) => {
      if (window.confirm("Are you sure you want to delete this chat?")) {
          onDeleteChat(chatId);
      }
  }

  return (
    <aside className={`absolute md:relative z-20 flex-shrink-0 w-80 bg-card border-r border-card-border flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="p-4 border-b border-card-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CognitoLogo className="h-8 w-8" />
          <h1 className="text-xl font-semibold text-primary tracking-wider">COGNITO</h1>
        </div>
        <button onClick={onNewChat} className="p-2 rounded-md hover:bg-input transition-colors">
          <PlusIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="p-4">
        <div className="relative">
            <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-card-foreground/40"/>
            <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-input border border-input-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary transition-colors"
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
                  activeChatId === chat.id ? 'bg-primary/20' : 'hover:bg-input'
                }`}
              >
                {editingChatId === chat.id ? (
                    <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSave()}
                        onBlur={handleRenameCancel}
                        className="flex-grow bg-transparent focus:outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <>
                        <div className="flex items-center gap-3 truncate">
                            <MessageSquareIcon className="w-5 h-5 flex-shrink-0" />
                            <span className="truncate">{chat.title}</span>
                        </div>
                    </>
                )}

                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {editingChatId === chat.id ? (
                        <>
                            <button onClick={handleRenameSave} className="p-1 rounded hover:bg-primary/30"><CheckIcon className="w-4 h-4 text-green-400"/></button>
                            <button onClick={handleRenameCancel} className="p-1 rounded hover:bg-primary/30"><XIcon className="w-4 h-4 text-red-400"/></button>
                        </>
                    ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleRenameStart(chat)} className="p-1 rounded hover:bg-primary/30"><PencilIcon className="w-4 h-4"/></button>
                            <button onClick={() => handleDelete(chat.id)} className="p-1 rounded hover:bg-primary/30"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    )}
                </div>

              </div>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
