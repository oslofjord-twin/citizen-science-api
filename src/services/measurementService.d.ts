export interface CreateMeasurementData {
    userId: string;
    data_type_id: number;
    value: number;
    measurement_date: string;
    latitude: number;
    longitude: number;
    notes?: string;
}
export interface MeasurementFilters {
    data_type_id?: number;
    limit: number;
    offset: number;
    start_date?: string;
    end_date?: string;
}
export declare const createMeasurement: (data: CreateMeasurementData) => Promise<any>;
export declare const getMeasurements: (userId: string, filters: MeasurementFilters) => Promise<{
    measurements: any;
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}>;
//# sourceMappingURL=measurementService.d.ts.map