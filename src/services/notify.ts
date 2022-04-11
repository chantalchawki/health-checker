import { User } from "../entities/user";
import nodemailer from "nodemailer";
import push from "./pushover";

interface INotification {
    notify(user: User, status: string): void;
}

export class EmailNotification implements INotification {
    async notify(user: User, status: string): Promise<void> {
        let testAccount =  await nodemailer.createTestAccount();

        let transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass, 
          },
        });
    
        const message =  `Your URL is currently ${status}`;
        let info = await transporter.sendMail({
            from: "chantal.chawki@gmail.com", 
            to: user.email,
            subject: "URL checker update", 
            text: message
        });
    
        push(message);
        console.log("Message sent: %s", info);
    }
}