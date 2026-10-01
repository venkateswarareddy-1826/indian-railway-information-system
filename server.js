require("dotenv").config();

const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// SUPABASE CONNECTION
// ===============================

const supabaseUrl = process.env.SUPABASE_URL;

const supabaseKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or API key in .env file");
    process.exit(1);
}

const supabase = createClient(
    supabaseUrl,
    supabaseKey
);

// ===============================
// HOME PAGE
// ===============================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

// ===============================
// TRAIN SEARCH
// ===============================

app.get("/api/trains", async (req, res) => {
    try {
        const search = req.query.search;

        let query = supabase
            .from("rail_trains")
            .select("*");

        if (search && search.trim() !== "") {

            const term = search.trim();

            query = query.or(
                `train_number.ilike.%${term}%,train_name.ilike.%${term}%`
            );
        }

        const { data, error } = await query.limit(100);

        if (error) {
            throw error;
        }

        res.json(data || []);

    } catch (error) {

        console.error(
            "Train search error:",
            error
        );

        res.status(500).json({
            error: error.message
        });
    }
});

// ===============================
// TRAIN DETAILS
// ===============================

app.get("/api/trains/:train_no", async (req, res) => {

    try {

        const trainNo = req.params.train_no;

        const { data, error } =
            await supabase
                .from("rail_trains")
                .select("*")
                .eq("train_number", trainNo)
                .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {

            return res.status(404).json({
                message: "Train not found"
            });
        }

        res.json(data);

    } catch (error) {

        console.error(
            "Train details error:",
            error.message
        );

        res.status(500).json({
            error: error.message
        });
    }
});

// ===============================
// STATION SEARCH
// ===============================

app.get("/api/stations", async (req, res) => {

    try {

        const search = req.query.search;

        let query = supabase
            .from("stations")
            .select("*");

        if (search && search.trim() !== "") {

            const term = search.trim();

            query = query.or(
                `station_name.ilike.%${term}%,station_code.ilike.%${term}%`
            );
        }

        const { data, error } =
            await query.limit(100);

        if (error) {
            throw error;
        }

        res.json(data || []);

    } catch (error) {

        console.error(
            "Station search error:",
            error.message
        );

        res.status(500).json({
            error: error.message
        });
    }
});

// ===============================
// TRAIN ROUTE
// ===============================

app.get("/api/trains/:train_no/route", async (req, res) => {

    try {

        const trainNo = req.params.train_no;

        const { data, error } =
            await supabase
                .from("train_route_stops")
                .select("*")
                .eq("train_no", trainNo)
                .order("stop_order", {
                    ascending: true
                });

        if (error) {
            throw error;
        }

        res.json(data || []);

    } catch (error) {

        console.error(
            "Train route error:",
            error.message
        );

        res.status(500).json({
            error: error.message
        });
    }
});

// ===============================
// LIVE TRAIN RUNNING STATUS
// ===============================

app.get("/api/trains/:train_no/live", async (req, res) => {

    try {

        const trainNo = req.params.train_no;

        console.log(
            `Checking live status for train ${trainNo}...`
        );

        if (!process.env.RAILRADAR_API_KEY) {

            return res.status(500).json({
                error: "RailRadar API key is missing"
            });
        }

        const response = await fetch(
            `https://api.railradar.in/v1/trains/${encodeURIComponent(trainNo)}/live`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${process.env.RAILRADAR_API_KEY}`,

                    "Accept":
                        "application/json"
                }
            }
        );

        const data = await response.json();

        console.log(
            "RailRadar response status:",
            response.status
        );

        if (!response.ok) {

            return res.status(response.status).json(
                data
            );
        }

        res.json(data);

    } catch (error) {

        console.error(
            "Live train status error:",
            error
        );

        res.status(500).json({
            error:
                "Unable to fetch live train status",
            details: error.message
        });
    }
});

// ===============================
// SERVER START
// ===============================

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});