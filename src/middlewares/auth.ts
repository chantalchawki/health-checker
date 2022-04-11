import jwt from "jsonwebtoken";

function validateToken(req: any, res: any, next: any) {
    try {
        const header = req.headers['authorization'];
        if (!header) {
            res.status(401).json({message: "You are unauthorized to make this request"});
            return;
        }
    
        const token = header.split(" ")[1];
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'top-secret');
        if (!decodedToken) {
            res.status(401).json({message: "You are unauthorized to make this request"});
            return;
        }

        req.user = decodedToken;
        next();
        
    } catch (err) {
        console.log("#### Error ####", err);
        res.status(401).json({message: "You are unauthorized to make this request"});
        return;
    }
}

export default validateToken;