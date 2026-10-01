require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or key is missing!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log("Connecting to Supabase...");

    const { data, error } = await supabase
        .from("trains")
        .select("*")
        .limit(10);

    if (error) {
        console.error("Connection or query failed:", error.message);
        return;
    }

    console.log("Supabase connected successfully!");
    console.log("Train data:");

    console.table(data);
}

testConnection();