export default function doctor(req, res, next){
    if(req.user.role !== "doctor"){
        return res.status(401).json({
            message: "Unauthorized!"
        });
    }
    next();
}