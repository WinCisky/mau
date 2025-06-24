import { createClient } from "@supabase/supabase-js";
import { type Database } from "$lib/database.types";

const supabaseUrl = "https://oowupapsfsiiwawhqhty.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vd3VwYXBzZnNpaXdhd2hxaHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjA5OTYsImV4cCI6MjA2NjA5Njk5Nn0.Lo7Hp1R_r7cYElql9Yy03mR8OaE-H7EEh8CwFA5hIpo";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);