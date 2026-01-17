export default function latency(req, res, next) {
    const start = process.hrtime.bigint();
    res.on("finish", ()=>{
        const end = process.hrtime.bigint();
        const duration = Number(end - start)/1e6;
        console.log(`${req.originalUrl} -> ${duration.toFixed(2)}`);
    });
    next();
}