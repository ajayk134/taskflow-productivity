import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  StickyNote,
  Pin,
  Search,
  Grid3X3,
  List,
  Trash2,
  Edit3,
  ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { useProjectStore } from '../stores/projectStore';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteProject, setNoteProject] = useState('');
  const { projects, fetchProjects } = useProjectStore();

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/notes');
      setNotes(data.notes || []);
    } catch {
      setNotes([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotes();
    fetchProjects();
  }, [fetchNotes, fetchProjects]);

  const filteredNotes = useMemo(() => {
    let filtered = notes;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
  }, [notes, searchQuery]);

  const openEditor = (note = null) => {
    if (note) {
      setEditingNote(note);
      setNoteTitle(note.title || '');
      setNoteContent(note.content || '');
      setNoteProject(note.project || '');
    } else {
      setEditingNote(null);
      setNoteTitle('');
      setNoteContent('');
      setNoteProject('');
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    try {
      const data = { title: noteTitle, content: noteContent, project: noteProject || undefined };
      if (editingNote) {
        await api.put(`/notes/${editingNote._id}`, data);
        toast.success('Note updated');
      } else {
        await api.post('/notes', data);
        toast.success('Note created');
      }
      setShowEditor(false);
      fetchNotes();
    } catch {
      toast.error('Failed to save note');
    }
  };

  const togglePin = async (note) => {
    try {
      await api.put(`/notes/${note._id}`, { isPinned: !note.isPinned });
      fetchNotes();
    } catch {
      toast.error('Failed to pin note');
    }
  };

  const deleteNote = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      toast.success('Note deleted');
      fetchNotes();
    } catch {
      toast.error('Failed to delete note');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{notes.length} notes</p>
        </div>
        <button onClick={() => openEditor()} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="input pl-10"
          />
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={clsx('p-2 rounded-md transition-colors', viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx('p-2 rounded-md transition-colors', viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filteredNotes.length === 0 && !loading && (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Capture your thoughts and ideas by creating a note."
          onAction={() => openEditor()}
          actionLabel="Create Note"
        />
      )}

      {viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <div
              key={note._id}
              className="card p-4 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => openEditor(note)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{note.title || 'Untitled'}</h3>
                <div className="flex gap-1 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePin(note); }}
                    className={clsx('p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700', note.isPinned ? 'text-amber-500' : 'text-gray-400')}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNote(note._id); }}
                    className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mb-3">{note.content || 'Empty note'}</p>
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span>{format(parseISO(note.updatedAt || note.createdAt), 'MMM d, yyyy')}</span>
                {note.project && (
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500">Project</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {filteredNotes.map((note) => (
            <div
              key={note._id}
              className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group"
              onClick={() => openEditor(note)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); togglePin(note); }}
                className={clsx('flex-shrink-0', note.isPinned ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600')}
              >
                <Pin className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{note.title || 'Untitled'}</p>
                <p className="text-xs text-gray-400 truncate">{note.content || 'Empty note'}</p>
              </div>
              <span className="text-[11px] text-gray-400 flex-shrink-0">{format(parseISO(note.updatedAt || note.createdAt), 'MMM d')}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteNote(note._id); }}
                className="p-1 text-gray-400 hover:text-red-500 transition-all md:opacity-0 md:group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showEditor} onClose={() => setShowEditor(false)} title={editingNote ? 'Edit Note' : 'New Note'} size="lg">
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note title"
              className="w-full text-lg font-semibold bg-transparent focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
              autoFocus
            />
          </div>
          <div>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Start writing..."
              className="w-full min-h-[300px] bg-transparent focus:outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 resize-none leading-relaxed"
            />
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="relative">
              <select
                value={noteProject}
                onChange={(e) => setNoteProject(e.target.value)}
                className="appearance-none input pr-8 text-sm"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setShowEditor(false)} className="btn-secondary btn-sm">Cancel</button>
          <button onClick={handleSave} className="btn-primary btn-sm">{editingNote ? 'Update' : 'Create'}</button>
        </div>
      </Modal>
    </div>
  );
}
