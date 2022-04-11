import { SimpleIntervalJob, Task } from "toad-scheduler";
import scheduler from "../global";
import checkUrl from "../services/check"; 
import { Check } from '../entities/check';
import { User } from "../entities/user";

async function runJobs() {
    const checks = await Check.find({relations: ['user'] });
    checks.forEach((check) => {
        const task = new Task(`check-task-${check.id}`, () => checkUrl(check));
        const job = new SimpleIntervalJob({ minutes: check.interval, }, task, `check-job-${check.id}`);
        scheduler.addSimpleIntervalJob(job);
    })
}

export default runJobs;