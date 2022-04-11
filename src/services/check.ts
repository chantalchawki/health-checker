import { Check, Protocol } from "../entities/check";
import { History } from "../entities/history";
import axios from "axios";
import { EmailNotification } from "./notify";
import { User } from "../entities/user";
import net from "net";
import https from "https";

async function checkUrl(check: Check) {
    try {
        console.log("checking url started on", check.id, check.url);
    
        const histories = await History.createQueryBuilder()
        .select()
        .where("checkId = :id", {id: check.id})
        .orderBy("timestamp", "DESC")
        .limit(check.threshold)
        .getMany();

        let status = null;
        if (check.protocol == Protocol.HTTP || check.protocol === Protocol.HTTPS) {
            status = await checkOnHttp(check);
        } else if (check.protocol === Protocol.TCP) {
            status = await checkOnTcp(check);
        }
    
        let counter = 0;
        for (const history of histories) {
            if (history.status === 'up') {
                break;
            } 
            counter ++;
        }
        
        const user = await User.findOneBy({id: check.user.id});
        if (!user) {
            throw new Error("User not found");
        }
        
        const notification = new EmailNotification();
        if (check.threshold! - 1 === counter && status === 'down') {
            check.outages = check.outages! + 1;
            const updatedCheck = Check.create({...check, id: check.id});
            await updatedCheck.save();

            notification.notify(user, status);
            if (check.webhook) {
                await axios.post(check.webhook, {status, url: check.url});
            }
        } 
        
        if (check.threshold! === counter && status === 'up') {
            notification.notify(user, status);
            if (check.webhook) {
                await axios.post(check.webhook, {status, url: check.url});
            }
        }

    } catch (err) {
        console.log(err);
    }
}

async function checkOnTcp(check: Check) {
    const checkConnection = (port: number, host: string) => {	
        const client = new net.Socket();
    
        return new Promise<boolean>((resolve, reject) => {
            client.connect(port, host, () => {
                client.destroy();
                resolve(true);
            });
            client.on('error', () => {
                client.destroy();
                resolve(false);
            });
        });
    };

    const start = process.hrtime();
    let response = null;
    if (check.port) {
        response = await checkConnection(check.port, check.url);
    }
    const [s, ns] = process.hrtime(start);
    const timeInMs = (ns / 1_000_000) + (s * 1_000);

    const history = new History();
    history.timestamp = Date.now().toString();
    history.check = check;
    history.responseTime = timeInMs;

    if (response) {
        history.status = 'up';
    } else {
        history.status = 'down';
    }

    await history.save()
    return history.status;
}

async function checkOnHttp(check: Check) {
    let config = {};
    config = {
        timeout: check.timeout! * 1000
    };

    if (check.httpHeaders) {
        const httpHeaders = JSON.parse(`{${check.httpHeaders}}`);
        config = {
            ...config,
            headers: httpHeaders
        }
    }

    if (check.username && check.password) {
        config = {
            ...config,
            auth: {
                username: check.username,
                password: check.password
            }
        }
    }

    if (check.ignoreSSL) {
        config = {
            ...config,
            httpsAgent: new https.Agent({
                rejectUnauthorized: check.ignoreSSL,
            }),
        }
    }

    const start = process.hrtime();
    const response = await axios.get(check.url, config)
    .catch(err => {
        return err;
    });
    const [s, ns] = process.hrtime(start);
    const timeInMs = (ns / 1_000_000) + (s * 1_000);

    const history = new History();
    history.timestamp = Date.now().toString();
    history.check = check;
    history.responseTime = timeInMs;

    let statusCode = check.statusCode || 200;
    if (response.status === statusCode) {
        history.status = 'up';
    } else {
        history.status = 'down';
    }

    await history.save()
    return history.status;
}



export default checkUrl;