import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

// Verify JWT from Authorization: Bearer <token> header
async function getUser(req) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return null;
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

// GET /issues — returns all issues (requires login)
router.get("/", async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { data, error } = await supabase.from("issues").select("*");
    if (error) return res.status(400).json(error);
    res.json(data);
});

// POST /issues — creates a new issue, sets reporter to current user
router.post("/", async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const issue = { ...req.body, reported_by: user.id };
    const { data, error } = await supabase.from("issues").insert([issue]);
    if (error) return res.status(400).json(error);
    res.json(data);
});

export default router;