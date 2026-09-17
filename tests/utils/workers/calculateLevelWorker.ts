import workerpool from "workerpool";
import { calculateLevel } from "../../../src/services/temperaturePointsService";

workerpool.worker({ calculateLevel });
