import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

async function testConnection() {
  if (!supabaseUrl || !supabaseKey) {
    console.log("Supabase credentials missing.");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

  if (error) {
    console.error("Connection failed:", error.message);
  } else {
    console.log("Connection successful! Found users table.");
  }
}

testConnection();
