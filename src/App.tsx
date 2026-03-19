import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, FileText, Link as LinkIcon, Settings, 
  MessageSquare, Search, BrainCircuit, Zap,
  Play, Square, Trash2, ChevronRight, X, UploadCloud,
  Cpu, Menu, MoreVertical, Edit2, Copy, Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { cn, fileToBase64 } from './lib/utils';
import { dbPromise, Source, ChatSession, ChatMessage } from './lib/db';
import { analyzeSource, chatWithSources, generateTTS } from './lib/gemini';

export default function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Settings
  const [useLocalFast, setUseLocalFast] = useState(() => {
    const saved = localStorage.getItem('nexus_useLocalFast');
    return saved ? JSON.parse(saved) : false;
  });
  const [useDeepThinking, setUseDeepThinking] = useState(() => {
    const saved = localStorage.getItem('nexus_useDeepThinking');
    return saved ? JSON.parse(saved) : false;
  });
  const [useSearch, setUseSearch] = useState(() => {
    const saved = localStorage.getItem('nexus_useSearch');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('nexus_useLocalFast', JSON.stringify(useLocalFast));
  }, [useLocalFast]);

  useEffect(() => {
    localStorage.setItem('nexus_useDeepThinking', JSON.stringify(useDeepThinking));
  }, [useDeepThinking]);

  useEffect(() => {
    localStorage.setItem('nexus_useSearch', JSON.stringify(useSearch));
  }, [useSearch]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const db = await dbPromise;
    const allSources = await db.getAll('sources');
    const allChats = await db.getAll('chats');
    setSources(allSources.sort((a, b) => b.createdAt - a.createdAt));
    setChats(allChats.sort((a, b) => b.updatedAt - a.updatedAt));
    
    if (allChats.length > 0 && !currentChatId) {
      setCurrentChatId(allChats[0].id);
    } else if (allChats.length === 0) {
      createNewChat();
    }
  }

  async function createNewChat() {
    const newChat: ChatSession = {
      id: uuidv4(),
      title: 'New Research Session',
      sourceIds: [],
      messages: [],
      updatedAt: Date.now()
    };
    const db = await dbPromise;
    await db.put('chats', newChat);
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setIsSidebarOpen(false);
  }

  async function renameChat(id: string, newTitle: string) {
    const db = await dbPromise;
    const chat = await db.get('chats', id);
    if (chat) {
      chat.title = newTitle;
      await db.put('chats', chat);
      setChats(prev => prev.map(c => c.id === id ? chat : c));
    }
  }

  async function deleteChat(id: string) {
    const db = await dbPromise;
    await db.delete('chats', id);
    setChats(prev => prev.filter(c => c.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(null);
    }
  }

  async function toggleSourceInChat(chatId: string, sourceId: string) {
    const db = await dbPromise;
    const chat = await db.get('chats', chatId);
    if (chat) {
      const sourceIds = [...(chat.sourceIds || [])];
      if (sourceIds.includes(sourceId)) {
        chat.sourceIds = sourceIds.filter(id => id !== sourceId);
      } else {
        chat.sourceIds = [...sourceIds, sourceId];
      }
      await db.put('chats', chat);
      setChats(prev => prev.map(c => c.id === chatId ? chat : c));
    }
  }

  const currentChat = chats.find(c => c.id === currentChatId);

  return (
    <div className="flex h-screen w-full bg-[#030305] text-gray-200 font-sans overflow-hidden selection:bg-cyan-500/30 relative">
      {/* Cinematic Space Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Subtle star grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        {/* Animated Nebulas */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
            rotate: [0, 45, 0]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-cyan-600/30 rounded-full blur-[140px] mix-blend-screen" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.2, 0.15],
            rotate: [0, -45, 0]
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-600/30 rounded-full blur-[140px] mix-blend-screen" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen" 
        />
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030305_100%)] opacity-80" />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-80 bg-[#050505]/80 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 ease-in-out md:transform-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar 
          sources={sources} 
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={(id: string) => {
            setCurrentChatId(id);
            setIsSidebarOpen(false);
          }}
          onNewChat={createNewChat}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onClose={() => setIsSidebarOpen(false)}
          onDeleteSource={async (id: string) => {
            const db = await dbPromise;
            await db.delete('sources', id);
            loadData();
          }}
          onRenameChat={renameChat}
          onDeleteChat={deleteChat}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-transparent border-l border-white/5 w-full min-w-0 z-10">
        {/* Topbar */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-[#0a0a0c]/40 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base md:text-lg font-medium text-white tracking-tight truncate">
              {currentChat?.title || 'Research Session'}
            </h1>
            <SourceSelector 
              sources={sources} 
              selectedIds={currentChat?.sourceIds || []} 
              onToggle={(sourceId: string) => currentChatId && toggleSourceInChat(currentChatId, sourceId)}
            />
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0 overflow-x-auto no-scrollbar">
            <Toggle 
              icon={<Cpu className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              label={<span className="hidden md:inline">Local Edge LLM</span>} 
              active={useLocalFast} 
              onChange={setUseLocalFast} 
              activeColor="text-emerald-400"
              activeBg="bg-emerald-400/10 border-emerald-400/30"
            />
            <Toggle 
              icon={<BrainCircuit className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              label={<span className="hidden md:inline">Deep Thinking</span>} 
              active={useDeepThinking} 
              onChange={setUseDeepThinking}
              disabled={useLocalFast}
              activeColor="text-purple-400"
              activeBg="bg-purple-400/10 border-purple-400/30"
            />
            <Toggle 
              icon={<Search className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              label={<span className="hidden md:inline">Web Grounding</span>} 
              active={useSearch} 
              onChange={setUseSearch}
              activeColor="text-cyan-400"
              activeBg="bg-cyan-400/10 border-cyan-400/30"
            />
          </div>
        </header>

        {/* Chat Messages */}
        <ChatArea 
          chat={currentChat} 
          sources={sources}
          useLocalFast={useLocalFast}
          useDeepThinking={useDeepThinking}
          useSearch={useSearch}
          onUpdateChat={async (update: any) => {
            const db = await dbPromise;
            if (typeof update === 'function') {
              setChats(prev => {
                const next = update(prev);
                // Find the chat that changed and save it to DB
                // We assume only one chat is updated at a time in these functional updates
                const changed = next.find((c, i) => c !== prev[i]);
                if (changed) {
                  db.put('chats', JSON.parse(JSON.stringify(changed)));
                }
                return next;
              });
            } else {
              await db.put('chats', update);
              setChats(prev => prev.map(c => c.id === update.id ? update : c));
            }
          }}
          onNewSource={async (newSource: Source) => {
            const db = await dbPromise;
            await db.put('sources', newSource);
            setSources(prev => [newSource, ...prev]);
          }}
        />
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <UploadModal 
            onClose={() => setIsUploadModalOpen(false)} 
            onUploadComplete={loadData}
          />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal 
            onClose={() => setIsSettingsOpen(false)}
            useLocalFast={useLocalFast}
            setUseLocalFast={setUseLocalFast}
            useDeepThinking={useDeepThinking}
            setUseDeepThinking={setUseDeepThinking}
            useSearch={useSearch}
            setUseSearch={setUseSearch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SourceSelector({ sources, selectedIds, onToggle }: any) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedCount = selectedIds.length;
  const totalCount = sources.length;
  const isAllSelected = selectedCount === 0 || selectedCount === totalCount;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all",
          isAllSelected 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
            : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
        )}
      >
        <span className={cn("w-2 h-2 rounded-full animate-pulse", isAllSelected ? "bg-emerald-500" : "bg-cyan-500")} />
        {isAllSelected ? `${totalCount} Sources` : `${selectedCount}/${totalCount} Selected`}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-2 w-64 bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-white/5 bg-white/5">
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Grounding Sources</h4>
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                {sources.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-600">No sources available</div>
                ) : (
                  sources.map((source: Source) => {
                    const isSelected = selectedIds.includes(source.id);
                    return (
                      <button
                        key={source.id}
                        onClick={() => onToggle(source.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors text-left",
                          isSelected ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                        )}
                      >
                        <div className={cn(
                          "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors",
                          isSelected ? "bg-cyan-500 border-cyan-500" : "border-white/20"
                        )}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="truncate flex-1">{source.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
              {selectedCount > 0 && (
                <div className="p-2 border-t border-white/5 bg-white/[0.02]">
                  <button 
                    onClick={() => {
                      // Toggle all off means select all (default)
                      selectedIds.forEach((id: string) => onToggle(id));
                    }}
                    className="w-full py-1.5 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Clear Selection (Use All)
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Sidebar({ sources, chats, currentChatId, onSelectChat, onNewChat, onOpenUpload, onDeleteSource, onClose, onRenameChat, onDeleteChat, onOpenSettings }: any) {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleRenameSubmit = (id: string) => {
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingChatId(null);
  };

  return (
    <div className="w-80 flex flex-col h-full bg-transparent border-r border-white/5">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white tracking-tight">Nexus<span className="text-cyan-400">DB</span></h2>
          </div>
          <button onClick={onClose} className="md:hidden p-2 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all duration-200 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-8 custom-scrollbar">
        {/* Sources Section */}
        <div>
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Knowledge Base</h3>
            <button onClick={onOpenUpload} className="p-1 hover:bg-white/10 rounded-md transition-colors">
              <Plus className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
          <div className="space-y-1">
            {sources.length === 0 ? (
              <div className="text-xs text-gray-600 px-2 py-3 text-center border border-dashed border-white/10 rounded-lg">
                No sources added yet.
              </div>
            ) : (
              sources.map((source: Source) => (
                <div key={source.id} className="group relative flex flex-col gap-1 p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {source.type === 'document' ? (
                        <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <LinkIcon className="w-4 h-4 text-purple-400 shrink-0" />
                      )}
                      <span className="text-sm text-gray-300 truncate font-medium">{source.name}</span>
                    </div>
                    <button 
                      onClick={() => onDeleteSource(source.id)}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                      {source.category}
                    </span>
                    {source.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chats Section */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Recent Sessions</h3>
          <div className="space-y-1">
            {chats.map((chat: ChatSession) => (
              <div
                key={chat.id}
                className={cn(
                  "group w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all",
                  currentChatId === chat.id 
                    ? "bg-white/10 text-white font-medium shadow-sm" 
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                )}
              >
                {editingChatId === chat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input 
                      autoFocus
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameSubmit(chat.id);
                        if (e.key === 'Escape') setEditingChatId(null);
                      }}
                      onBlur={() => handleRenameSubmit(chat.id)}
                      className="flex-1 bg-black/50 border border-white/20 rounded px-2 py-1 text-sm text-white outline-none"
                    />
                  </div>
                ) : (
                  <button onClick={() => onSelectChat(chat.id)} className="flex items-center gap-3 flex-1 text-left truncate">
                    <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                    <span className="truncate">{chat.title}</span>
                  </button>
                )}
                
                {editingChatId !== chat.id && (
                  <div className="flex items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditTitle(chat.title);
                        setEditingChatId(chat.id);
                      }}
                      className="p-1.5 hover:text-cyan-400 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      className="p-1.5 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Settings Button */}
      <div className="p-4 border-t border-white/5 shrink-0">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors text-sm font-medium"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
}

function SettingsModal({ onClose, useLocalFast, setUseLocalFast, useDeepThinking, setUseDeepThinking, useSearch, setUseSearch }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 shadow-inner">
              <Settings className="w-5 h-5 text-gray-200" />
            </div>
            <h3 className="text-xl font-medium text-white tracking-tight">Settings</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
          {/* AI Models Section */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest pl-1">AI Models & Capabilities</h4>
            
            <div className="space-y-3">
              <div className="flex items-start justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 group">
                <div className="flex gap-4">
                  <div className="mt-0.5 p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-white mb-1.5">Local Edge LLM</h5>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-[250px]">
                      Uses a fast, lightweight model optimized for local-like performance. Disables Deep Thinking.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 mt-2">
                  <Toggle 
                    active={useLocalFast} 
                    onChange={setUseLocalFast} 
                    activeColor="text-emerald-400"
                    activeBg="bg-emerald-400/10 border-emerald-400/30"
                  />
                </div>
              </div>

              <div className="flex items-start justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 group">
                <div className="flex gap-4">
                  <div className="mt-0.5 p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform duration-300">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-white mb-1.5">Deep Thinking</h5>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-[250px]">
                      Enables advanced reasoning for complex queries. Slower but more accurate.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 mt-2">
                  <Toggle 
                    active={useDeepThinking} 
                    onChange={setUseDeepThinking}
                    disabled={useLocalFast}
                    activeColor="text-purple-400"
                    activeBg="bg-purple-400/10 border-purple-400/30"
                  />
                </div>
              </div>

              <div className="flex items-start justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 group">
                <div className="flex gap-4">
                  <div className="mt-0.5 p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-white mb-1.5">Web Grounding</h5>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-[250px]">
                      Allows the AI to search the live web to supplement your knowledge base.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 mt-2">
                  <Toggle 
                    active={useSearch} 
                    onChange={setUseSearch}
                    activeColor="text-cyan-400"
                    activeBg="bg-cyan-400/10 border-cyan-400/30"
                  />
                </div>
              </div>
            </div>
          </section>
          
          {/* Appearance Section */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest pl-1">Appearance</h4>
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white mb-1">Theme</span>
                <span className="text-xs text-gray-400">NexusDB uses a custom dark theme by default.</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-gray-300 shadow-inner">
                Dark (Default)
              </div>
            </div>
          </section>
          
          {/* Data Section */}
          <section className="space-y-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Data & Storage</h4>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-3">
              <p className="text-xs text-gray-400 leading-relaxed">
                Your knowledge base and chat history are stored locally in your browser using IndexedDB. Clearing your browser data will delete this information.
              </p>
              <button 
                onClick={async () => {
                  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                    const db = await dbPromise;
                    await db.clear('sources');
                    await db.clear('chats');
                    window.location.reload();
                  }
                }}
                className="self-start px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors text-xs font-medium"
              >
                Clear All Local Data
              </button>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}

function Toggle({ icon, label, active, onChange, disabled, activeColor, activeBg }: any) {
  return (
    <button
      onClick={() => !disabled && onChange(!active)}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        active 
          ? cn(activeBg, activeColor) 
          : "bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20"
      )}
    >
      {icon}
      {label}
      <div className={cn(
        "w-6 h-3.5 rounded-full relative transition-colors duration-300 ml-1",
        active ? "bg-current opacity-30" : "bg-white/10"
      )}>
        <motion.div 
          layout
          className={cn(
            "absolute top-0.5 w-2.5 h-2.5 rounded-full",
            active ? "bg-current" : "bg-gray-400"
          )}
          initial={false}
          animate={{ left: active ? "12px" : "2px" }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}

function ChatArea({ chat, sources, useLocalFast, useDeepThinking, useSearch, onUpdateChat, onNewSource }: any) {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [playingAudio, setPlayingAudio] = useState<{ source: AudioBufferSourceNode, context: AudioContext } | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, isGenerating]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  if (!chat) return <div className="flex-1 flex items-center justify-center text-gray-500">Select or create a session</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    const updatedChat = {
      ...chat,
      messages: [...chat.messages, userMsg],
      updatedAt: Date.now()
    };
    
    // Auto-generate title for first message
    if (updatedChat.messages.length === 1) {
      updatedChat.title = input.slice(0, 30) + (input.length > 30 ? '...' : '');
    }

    onUpdateChat(updatedChat);
    setInput('');
    setIsGenerating(true);

    try {
      // Create a placeholder for the model response
      const modelMsgId = uuidv4();
      let currentModelMsg: ChatMessage = {
        id: modelMsgId,
        role: 'model',
        content: '',
        timestamp: Date.now()
      };

      await onUpdateChat({
        ...updatedChat,
        messages: [...updatedChat.messages, currentModelMsg]
      });

      const selectedSources = sources.filter(s => 
        !chat.sourceIds || chat.sourceIds.length === 0 || chat.sourceIds.includes(s.id)
      );

      const stream = await chatWithSources(
        updatedChat.messages, 
        selectedSources, 
        useDeepThinking, 
        useSearch, 
        useLocalFast
      );

      let fullText = '';
      let newUrls: string[] = [];
      let lastUpdate = Date.now();
      
      for await (const chunk of stream) {
        fullText += chunk.text;
        
        // Extract grounding chunks for new sources
        const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          chunks.forEach((c: any) => {
            if (c.web?.uri && !newUrls.includes(c.web.uri)) {
              newUrls.push(c.web.uri);
            }
          });
        }
        
        currentModelMsg = { ...currentModelMsg, content: fullText };
        
        // Throttle DB updates for streaming
        if (Date.now() - lastUpdate > 100) {
          await onUpdateChat({
            ...updatedChat,
            messages: [...updatedChat.messages, currentModelMsg]
          });
          lastUpdate = Date.now();
        } else {
          // Still update UI state but maybe not DB? 
          // Actually onUpdateChat handles both. Let's just throttle the whole thing.
          onUpdateChat({
            ...updatedChat,
            messages: [...updatedChat.messages, currentModelMsg]
          });
        }
      }

      // Final update to ensure everything is saved
      await onUpdateChat({
        ...updatedChat,
        messages: [...updatedChat.messages, currentModelMsg]
      });

      // Auto-add new sources
      if (newUrls.length > 0) {
        const existingUrls = sources.map((s: any) => s.url);
        const urlsToAdd = newUrls.filter(url => !existingUrls.includes(url));
        
        for (const url of urlsToAdd) {
          analyzeSource(url, '', true).then(analysis => {
            const newSource: Source = {
              id: uuidv4(),
              type: 'link',
              name: analysis.title || new URL(url).hostname,
              url,
              tags: analysis.tags || ['auto-discovered'],
              category: analysis.category || 'Web Search',
              summary: analysis.summary || 'Automatically discovered during chat.',
              createdAt: Date.now()
            };
            onNewSource(newSource);
          }).catch(console.error);
        }
      }

      // Generate TTS in background
      generateTTS(fullText).then(audioData => {
        if (audioData) {
          // Use a functional update or find the latest chat state to avoid overwriting
          onUpdateChat((prevChats: ChatSession[]) => {
            return prevChats.map(c => {
              if (c.id === updatedChat.id) {
                return {
                  ...c,
                  messages: c.messages.map(m => 
                    m.id === modelMsgId ? { ...m, audioData } : m
                  )
                };
              }
              return c;
            });
          });
        }
      });

    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        role: 'model',
        content: '**Error:** Failed to generate response. Please check your connection and API key.',
        timestamp: Date.now()
      };
      onUpdateChat({
        ...updatedChat,
        messages: [...updatedChat.messages, errorMsg]
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = async (audioData: string, msgId: string) => {
    if (playingAudioId === msgId) {
      playingAudio?.source.stop();
      playingAudio?.context.close();
      setPlayingAudio(null);
      setPlayingAudioId(null);
      return;
    }

    if (playingAudio) {
      playingAudio.source.stop();
      playingAudio.context.close();
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // PCM is 16-bit signed integers
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768;
      }
      
      const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        setPlayingAudioId(null);
        setPlayingAudio(null);
      };
      source.start();
      
      setPlayingAudio({ source, context: audioContext });
      setPlayingAudioId(msgId);
    } catch (error) {
      console.error("Failed to play audio:", error);
      alert("Failed to play audio. The format might be unsupported by your browser.");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar z-10">
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          {chat.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center mt-32 opacity-50">
              <BrainCircuit className="w-16 h-16 mb-4 text-gray-400" />
              <h2 className="text-2xl font-light text-white mb-2">How can I assist your research?</h2>
              <p className="text-sm text-gray-400 max-w-md">
                Ask questions about your uploaded documents and links. I will synthesize information across all your sources.
              </p>
            </div>
          ) : (
            chat.messages.map((msg: ChatMessage) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={cn(
                  "flex flex-col gap-1",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}
              >
                <div className={cn(
                  "flex gap-4 max-w-full md:max-w-[85%]",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                      <BrainCircuit className="w-4 h-4 text-cyan-400" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "rounded-2xl px-5 py-4 relative group w-full overflow-hidden",
                    msg.role === 'user' 
                      ? "bg-white/10 text-white border border-white/5 rounded-tr-sm" 
                      : "bg-transparent text-gray-200"
                  )}>
                    {msg.role === 'model' && msg.audioData && (
                      <button 
                        onClick={() => playAudio(msg.audioData!, msg.id)}
                        className="absolute -left-10 top-2 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100 hidden md:block"
                      >
                        {playingAudioId === msg.id ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    
                    <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-p:leading-relaxed prose-headings:text-white prose-a:text-cyan-400 hover:prose-a:text-cyan-300">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({node, inline, className, children, ...props}: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <div className="relative group/code rounded-lg overflow-hidden my-4 border border-white/10">
                                <div className="flex items-center justify-between px-4 py-2 bg-black/80 border-b border-white/10">
                                  <span className="text-xs font-mono text-gray-400">{match[1]}</span>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                                    className="text-gray-400 hover:text-white transition-colors"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <SyntaxHighlighter
                                  {...props}
                                  children={String(children).replace(/\n$/, '')}
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{ margin: 0, padding: '1rem', background: '#0a0a0c', fontSize: '0.875rem' }}
                                />
                              </div>
                            ) : (
                              <code {...props} className={cn("bg-white/10 rounded px-1.5 py-0.5 text-sm font-mono text-cyan-200", className)}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {msg.content || (isGenerating && msg.role === 'model' ? '...' : '')}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
                
                {/* Message Footer: Timestamp and Actions */}
                <div className={cn(
                  "flex items-center gap-3 text-[10px] text-gray-500 font-medium px-2 mt-1",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row ml-12"
                )}>
                  <span>{format(msg.timestamp, 'MMM d, h:mm a')}</span>
                  {msg.role === 'model' && (
                    <>
                      <button 
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="flex items-center gap-1 hover:text-gray-300 transition-colors"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedId === msg.id ? 'Copied' : 'Copy'}
                      </button>
                      {msg.audioData && (
                        <button 
                          onClick={() => playAudio(msg.audioData!, msg.id)}
                          className="md:hidden flex items-center gap-1 hover:text-cyan-400 transition-colors"
                        >
                          {playingAudioId === msg.id ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          {playingAudioId === msg.id ? 'Stop' : 'Listen'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))
          )}
          {isGenerating && chat.messages[chat.messages.length - 1]?.role === 'user' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 items-start"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                <BrainCircuit className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
              <div className="bg-transparent px-5 py-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 md:p-6 bg-gradient-to-t from-[#030305] via-[#030305] to-transparent z-20">
        <div className="max-w-4xl mx-auto relative">
          <form 
            onSubmit={handleSubmit} 
            className="relative flex items-end gap-2 bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-2 focus-within:border-cyan-500/50 focus-within:bg-[#0a0a0c] transition-all duration-300 shadow-[0_0_40px_rgba(0,0,0,0.8)] focus-within:shadow-[0_0_40px_rgba(0,240,255,0.1)]"
          >
            <div className="flex-1 relative flex items-center">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your research sources..."
                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 resize-none max-h-[200px] min-h-[44px] py-3 px-4 text-sm md:text-base leading-relaxed custom-scrollbar"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>
            <button 
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 text-white hover:opacity-90 disabled:opacity-50 disabled:grayscale transition-all shrink-0 mb-0.5 shadow-lg active:scale-95"
            >
              <Zap className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </form>
          <div className="text-center mt-3 text-[10px] text-gray-500 font-mono uppercase tracking-widest opacity-70">
            AI can make mistakes. Verify important information.
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadModal({ onClose, onUploadComplete }: any) {
  const [type, setType] = useState<'document' | 'link'>('document');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async () => {
    if (type === 'link' && !url) return;
    if (type === 'document' && !file) return;

    setIsProcessing(true);
    try {
      let content = '';
      let mimeType = '';
      let fileData = '';
      let name = '';

      if (type === 'link') {
        content = url;
        name = url;
      } else if (file) {
        name = file.name;
        mimeType = file.type;
        if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
          fileData = await fileToBase64(file);
        } else {
          content = await file.text();
        }
      }

      // Analyze
      const analysis = await analyzeSource(
        type === 'link' ? url : (fileData || content), 
        mimeType,
        type === 'link'
      );

      const newSource: Source = {
        id: uuidv4(),
        type,
        name,
        content,
        fileData,
        mimeType,
        url: type === 'link' ? url : undefined,
        tags: analysis.tags || [],
        category: analysis.category || 'Uncategorized',
        summary: analysis.summary || '',
        createdAt: Date.now()
      };

      const db = await dbPromise;
      await db.put('sources', newSource);
      
      onUploadComplete();
      onClose();
    } catch (e) {
      console.error("Failed to process source", e);
      alert("Failed to process source. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 shadow-inner">
              <UploadCloud className="w-5 h-5 text-gray-200" />
            </div>
            <h3 className="text-xl font-medium text-white tracking-tight">Add Source</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex p-1.5 bg-white/[0.03] border border-white/5 rounded-xl">
            <button 
              onClick={() => setType('document')}
              className={cn("flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300", type === 'document' ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:text-gray-200 hover:bg-white/5")}
            >
              Document
            </button>
            <button 
              onClick={() => setType('link')}
              className={cn("flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300", type === 'link' ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:text-gray-200 hover:bg-white/5")}
            >
              Website Link
            </button>
          </div>

          {type === 'link' ? (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest pl-1">URL</label>
              <input 
                type="url" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all shadow-inner"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest pl-1">File (PDF, TXT, MD)</label>
              <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-8 text-center bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 cursor-pointer group">
                <input 
                  type="file" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.txt,.md,.csv"
                />
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                </div>
                <p className="text-sm text-gray-300 font-medium mb-1">
                  {file ? file.name : "Click or drag file to upload"}
                </p>
                <p className="text-xs text-gray-500">Supports PDF, TXT, MD</p>
              </div>
            </div>
          )}

          <button 
            onClick={handleProcess}
            disabled={isProcessing || (type === 'link' ? !url : !file)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:grayscale transition-all duration-300 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Processing & Analyzing...
              </>
            ) : (
              'Add to Knowledge Base'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
