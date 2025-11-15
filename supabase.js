const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://jbifpgchlsllpottkjra.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiaWZwZ2NobHNsbHBvdHRranJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxODEzNjAsImV4cCI6MjA3ODc1NzM2MH0.emT5vIOgaD8if-hBKe1D-eKz9-Oqj4kJxjc7IhcXNVo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

module.exports = supabase;
