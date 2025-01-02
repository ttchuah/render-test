import moment from "moment";

export const getFirstAndLastDaysOfLastMonth = (): { startDate: number, endDate: number } => {
    const startDate = parseInt(moment().subtract(1, 'months').startOf('month').format("YYYYMMDD"));
    const endDate = parseInt(moment().subtract(1, 'months').endOf('month').format("YYYYMMDD"));
    return {
        startDate, endDate
    };
};
