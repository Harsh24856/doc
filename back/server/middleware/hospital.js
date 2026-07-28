export default function hospital(req, res, next){
    if(req.user.role !== "hospital"){
        return res.status(401).json({
            message: "Unauthorized!"
        });
    }
    next();
}