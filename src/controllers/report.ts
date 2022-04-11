import express from 'express';
import { Check } from "../entities/check";
import { History } from '../entities/history';
import validateToken from "../middlewares/auth";

const router = express.Router();

router.get('/reports', validateToken, async(req: any, res: any) => {
    try {
        const checks = await Check.findBy({user: {id: req.user.id}});
        if (!checks) {
            res.status(404).json({message: "No checks for this user"});
            return;
        }

        let reports = [];
        for (const check of checks) {
            let reportData = await generateReport(check);
            reports.push(reportData);
        }
        res.status(200).json({data: reports});

    } catch (err) {
        console.log("#### Error ####", err);
        res.status(500);
    }
});

router.get('/reports/:tag', validateToken, async (req:any, res: any) => {
    const tag = req.params.tag;
    try {
        const checks = await Check.findBy({user: {id: req.user.id}});
        if (!checks) {
            res.status(404).json({message: "No checks for this user"});
            return;
        }

        let reports = [];
        for (const check of checks) {
            if (check.tags) {
                const allChecks = check.tags.split(',');
                if (allChecks.includes(tag)) {
                    let reportData = await generateReport(check);
                    reports.push(reportData);
                }
            }
        }
        res.status(200).json({data: reports});

    }  catch (err) {
        console.log("#### Error ####", err);
        res.status(500);
    }
});

async function generateReport(check: Check) {
    const histories = await History.createQueryBuilder()
    .select()
    .where("checkId = :id", {id: check.id})
    .getMany();

    if (histories.length === 0) {
        return {
            status: "up",
            availablity: 0,
            outages: 0,
            downTime: 0,
            upTime: 0,
            responseTime: 0,
            history: []
        };
    }

    const status = await History.createQueryBuilder()
    .select("status")
    .addSelect("COUNT(*)", "count")
    .addSelect("SUM(responseTime)", "responseTime")
    .where("checkId = :id", {id: check.id})
    .groupBy("status")
    .execute();

    let responseTime = 0, totalUp = 0, totalDown = 0;
    for (const s of status) {
        if (s.status === "up") {
            responseTime = s.responseTime;
            totalUp = s.count;
        } else if (s.status === "down") {
            totalDown = s.count;
        }
    }

    let history = histories.map(history => history.timestamp + ": " + history.status);

    let reportData = {
        status: histories[histories.length-1].status,
        availablity: (totalUp / histories.length) * 100,
        outages: check.outages,
        downTime: check.interval ? totalDown * check.interval : 0,
        upTime: check.interval ? totalUp * check.interval : 0,
        responseTime,
        history
    }

    return reportData;
}

export default router;
