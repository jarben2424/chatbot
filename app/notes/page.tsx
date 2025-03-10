import { createClient } from '@/utils/supabase/server'

export default async function Notes() {
  const supabase = await createClient()
  const { data: notes } = await supabase.from("notes").select()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Notes</h1>
      <pre>{JSON.stringify(notes, null, 2)}</pre>
    </div>
  )
} 