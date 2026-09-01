-- Create Student Fees & Directory Table
create table if not exists public.student_fees (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references auth.users(id) on delete cascade not null,
  student_name text not null,
  student_email text,
  phone text,
  class_name text not null,
  total_fees numeric default 0,
  paid_fees numeric default 0,
  status text default 'pending', -- 'paid', 'partial', 'pending'
  due_date text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.student_fees enable row level security;

-- Policies
create policy "Teachers can manage their student fees"
  on public.student_fees for all
  using (auth.uid() = teacher_id);

-- Enable Realtime
alter publication supabase_realtime add table public.student_fees;
