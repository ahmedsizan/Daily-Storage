import { supabase } from './supabase.ts';
import type { Note, CreateNoteInput, UpdateNoteInput } from './types.ts';

export async function fetchNotes(searchQuery?: string): Promise<Note[]> {
  let query = supabase
    .from('notes')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  if (searchQuery && searchQuery.trim() !== '') {
    const trimmed = searchQuery.trim();
    query = query.or(`title.ilike.%${trimmed}%,content.ilike.%${trimmed}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }

  return (data as Note[]) || [];
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert([
      {
        title: input.title.trim(),
        content: input.content,
        is_pinned: input.is_pinned ?? false
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error);
    throw error;
  }

  return data as Note;
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
  const updates: Record<string, any> = {};
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.content !== undefined) updates.content = input.content;
  if (input.is_pinned !== undefined) updates.is_pinned = input.is_pinned;

  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating note:', error);
    throw error;
  }

  return data as Note;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}

export async function togglePinNote(id: string, currentPinned: boolean): Promise<Note> {
  return updateNote(id, { is_pinned: !currentPinned });
}
