import express from 'express';
import { User } from '../entities/user';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        if (!req.body.email || !req.body.password) {
            res.status(400).json({message: "Please enter email and password"});
            return;
        }
    
        const existingUser = await User.findOneBy({email: req.body.email});
        if (existingUser) {
            res.status(400).json({message: "This email is already taken"});
            return;
        }
    
        const user = new User();
        user.email = req.body.email;
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        user.password = hashedPassword;
    
        await user.save();
        res.status(201).json({message: "User registered successfully"});

    } catch(err) {
        console.log("#### Error ####", err);
        res.status(500);
    }
});

router.post('/login', async (req, res) => {
    try {
        const foundUser = await User.findOneBy({email: req.body.email});
        if (!foundUser) {
            res.status(400).json({message: "Invalid email or password"});
            return;
        }
        const password = await bcrypt.compare(req.body.password, foundUser!.password);
        if (!password) {
            res.status(400).json({message: "Invalid email or password"});
            return;
        }
    
        const payload = {
            id: foundUser?.id,
            email: foundUser?.email
        }
        const secret = process.env.JWT_SECRET || 'top-secret';
        const token = jwt.sign(payload, secret, { expiresIn: '1d' });
        res.status(200).json({message: "Welcome back!", data: token});
        
    } catch(err) {
        console.log("#### Error ####", err);
        res.status(500);
    }
});

export default router;
