import type { Request } from "express";
import { RequestBuilder } from "./core/RequestBuilder";
import {
	TemperatureField,
	validTemperatureBody,
	TEMPERATURE_BOUNDS as BOUNDS,
	TemperatureDataField,
	validTemperatureData,
} from "../../shared/temperature.rules";
import { CreateTemperatureMeasurementData } from "services/temperatureService";
import { RecordBuilder } from "./core/RecordBuilder";

export class TemperatureRequestBuilder extends RequestBuilder<TemperatureField> {
	constructor() {
		super(validTemperatureBody, BOUNDS.userIds[0]);
	}
}

export class TemperatureDataBuilder extends RecordBuilder<TemperatureDataField, CreateTemperatureMeasurementData> {
	constructor() {
		super(validTemperatureData);
	}
}

export const createTemperatureRequest = () => new TemperatureRequestBuilder() as TemperatureRequestBuilder & Request;
export const createTemperatureData = () => new TemperatureDataBuilder();
