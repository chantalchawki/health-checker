import { User } from "../src/entities/user";

declare global {
    declare namespace Express {
        export interface Request {
            user?: User
        }
    }
}