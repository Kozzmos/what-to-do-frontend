import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://oxpnjzxljpkglxdcfuhe.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94cG5qenhsanBrZ2x4ZGNmdWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NDM5MDcsImV4cCI6MjA3MDIxOTkwN30.M6HhBabMTpiXlTNDbZ9OzvyFPocdHLnUjlc73j4Wv8E"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)