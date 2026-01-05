import express from "express"
import auth from "../middleware/auth.js"
import supabaseAdmin from "../Admin.js"

const router = express.Router();

router.get("/doctor", auth, async(req, res)=> {
    try{
      const userId = req.user.id;
      const{data, error} = await supabaseAdmin
      .from("users")
      .select("verification_status")
      .eq("id", userId)
      .single()

      if(error) throw error;
      res.json({
         "status" : data.verification_status
      })
    }catch(err){
        console.log("Error fetching the verification status", err);
        res.status(500).json({ message: "Failed to fetch verification status" });
    }
});

export default router;