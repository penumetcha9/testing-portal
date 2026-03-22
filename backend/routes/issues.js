import express from "express"
import { supabase } from "../supabaseClient.js"

const router = express.Router()

router.get("/", async (req, res) => {

    const { data, error } = await supabase
        .from("issues")
        .select("*")

    if (error) return res.status(400).json(error)

    res.json(data)

})

router.post("/", async (req, res) => {

    const issue = req.body

    const { data, error } = await supabase
        .from("issues")
        .insert([issue])

    if (error) return res.status(400).json(error)

    res.json(data)

})

export default router