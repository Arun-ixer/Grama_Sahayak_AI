-- Enable pgvector extension
create extension if not exists vector;

-- 1. Profiles Table
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    name text not null,
    state text,
    district text,
    occupation text,
    preferred_language text default 'en'
);

-- 2. Documents Table
create table if not exists public.documents (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade,
    title text not null,
    file_url text not null,
    upload_date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Document Chunks Table
create table if not exists public.document_chunks (
    id uuid default gen_random_uuid() primary key,
    document_id uuid references public.documents on delete cascade,
    content text not null,
    embedding vector(768)
);

-- 4. Chats Table
create table if not exists public.chats (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade,
    title text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Messages Table
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    chat_id uuid references public.chats on delete cascade,
    role text not null, -- 'user' or 'assistant'
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- Drop existing policies if any
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

drop policy if exists "Users can view own documents" on public.documents;
drop policy if exists "Users can insert own documents" on public.documents;
drop policy if exists "Users can delete own documents" on public.documents;

drop policy if exists "Users can view own document chunks" on public.document_chunks;
drop policy if exists "Users can insert own document chunks" on public.document_chunks;

drop policy if exists "Users can view own chats" on public.chats;
drop policy if exists "Users can insert own chats" on public.chats;
drop policy if exists "Users can delete own chats" on public.chats;

drop policy if exists "Users can view own messages" on public.messages;
drop policy if exists "Users can insert own messages" on public.messages;

-- RLS Policies

-- Profile policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Document policies
create policy "Users can view own documents" on public.documents for select using (auth.uid() = user_id);
create policy "Users can insert own documents" on public.documents for insert with check (auth.uid() = user_id);
create policy "Users can delete own documents" on public.documents for delete using (auth.uid() = user_id);

-- Chunk policies
create policy "Users can view own document chunks" on public.document_chunks for select
using (exists (select 1 from public.documents where documents.id = document_chunks.document_id and documents.user_id = auth.uid()));
create policy "Users can insert own document chunks" on public.document_chunks for insert
with check (exists (select 1 from public.documents where documents.id = document_chunks.document_id and documents.user_id = auth.uid()));

-- Chat policies
create policy "Users can view own chats" on public.chats for select using (auth.uid() = user_id);
create policy "Users can insert own chats" on public.chats for insert with check (auth.uid() = user_id);
create policy "Users can delete own chats" on public.chats for delete using (auth.uid() = user_id);

-- Message policies
create policy "Users can view own messages" on public.messages for select
using (exists (select 1 from public.chats where chats.id = messages.chat_id and chats.user_id = auth.uid()));
create policy "Users can insert own messages" on public.messages for insert
with check (exists (select 1 from public.chats where chats.id = messages.chat_id and chats.user_id = auth.uid()));

-- Match Document Chunks function for pgvector similarity search
create or replace function match_document_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
language plpgsql stable
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  join public.documents d on dc.document_id = d.id
  where d.user_id = filter_user_id
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;
