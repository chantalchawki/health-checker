import express from 'express';
import { Check } from '../entities/check';
import { User } from '../entities/user';
import validateToken from '../middlewares/auth';
import checkUrl from "../services/check";
import scheduler from "../global";
import { SimpleIntervalJob, Task } from "toad-scheduler";

const router = express.Router();

router.post('/checks', validateToken, async (req: any, res) => {
    try {
        if (!req.body.name || !req.body.url || !req.body.protocol) {
            res.status(400).json({message: "Please enter name, url and protocol"});
            return;
        }
        const user = new User();
        user.id = req.user!.id;

        let headers = null;
        if (req.body.httpHeaders) {
            headers = req.body.httpHeaders?.map((header: { key: string; value: string; }) => {
                return `"${header.key}"` + ": " + `"${header.value}"`
            });
            headers = headers.join(',');
        }

        const check = Check.create({
            name: req.body.name,
            url: req.body.url,
            protocol: req.body.protocol,
            path: req.body.path,
            port: req.body.port,
            webhook: req.body.webhook,
            tags: req.body.tags,
            timeout: req.body.timeout,
            interval: req.body.interval,
            threshold: req.body.threshold,
            username: req.body.authentication?.username,
            password: req.body.authentication?.password,
            httpHeaders: headers,
            user: user 
        });
        await check.save();

        const task = new Task(`check-task-${check.id}`, () => checkUrl(check));
        const job = new SimpleIntervalJob({ minutes: check.interval, }, task, `check-job-${check.id}`);
        scheduler.addSimpleIntervalJob(job);

        res.status(201).json({message: "Url check created successfully", data: check});

    } catch(err) {
        console.log("#### Error ####", err);
        res.status(500);
    }
});

router.get('/checks', validateToken, async (req: any, res) => {
    try {
        const checks = await Check.findBy({user: {id: req.user!.id}});
        if (!checks) {
            res.status(404).json({message: "No checks for this user"});
            return;
        }
        res.status(200).json({data: checks});

    } catch (err) {
        console.log("#### Error ####", err);
        res.status(500);
    }
});

router.get('/checks/:id', validateToken, async (req: any, res) => {
    try {
        const id = parseInt(req.params.id);
        const check = await Check.findOneBy({id: id, user: {id: req.user!.id}});
        if (!check) {
            res.status(404).json({message: "Check not found"});
            return;
        }
        res.status(200).json({data: check});

    } catch (err) {
        console.log("#### Error ####", err);
        res.status(500);
    }
});

router.put('/checks/:id', validateToken, async (req: any, res) => {
    try {
        const id = parseInt(req.params.id);
        const foundCheck = await Check.findOneBy({id: id, user: req.user.id});
        
        if (!foundCheck) {
            res.status(404).json({message: "Check not found"});
            return;
        }
        
        let headers = null;
        if (req.body.httpHeaders) {
            headers = req.body.httpHeaders?.map((header: { key: string; value: string; }) => {
                return `"${header.key}"` + ": " + `"${header.value}"`
            });
            headers = headers.join(',');
        }
        req.body.httpHeaders = headers;

        const updatedCheck = Check.create({...foundCheck, ...req.body, id});
        await updatedCheck.save();

        scheduler.removeById(`check-job-${id}`);
        const task = new Task(`check-task-${updatedCheck.id}`, () => checkUrl(updatedCheck));
        const job = new SimpleIntervalJob({ minutes: updatedCheck.interval }, task, `check-job-${updatedCheck.id}`);
        scheduler.addSimpleIntervalJob(job);
        res.status(200).json({message: "Check updated", data: updatedCheck});

    } catch (err) {
        console.log("#### Error ####", err);
        res.status(500);
    }
});

router.delete('/checks/:id', validateToken, async (req: any, res) => {
    try {
        const id = parseInt(req.params.id);
        const check = await Check.delete({id: id, user: {id: req.user!.id}});
        if (check.affected === 0) {
            res.status(404).json({message: "Check not found"});
            return;
        }

        scheduler.removeById(`check-job-${id}`);
        res.status(200).json({message: "Deleted checks", data: check});

    } catch (err) {
        console.log("#### Error ####", err);
        res.status(500);
    }
});

export default router;
