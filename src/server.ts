import express from "express";
import { AppDataSource } from "./database";
import authRouter from './controllers/auth';
import checkRouter from './controllers/check';
import reportRouter from './controllers/report';
import runJobs from "./services/run-jobs";

AppDataSource.initialize()
    .then(() => {
      console.log("Database connected successfully");
      runJobs();
    })
    .catch((error) => {
      console.log(error);
      process.exit(1);
    });

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(authRouter);
app.use(checkRouter);
app.use(reportRouter);

app.listen(5000, () => {
  console.log("Application started on port 5001");
});


