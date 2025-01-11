import express from 'express';
import { getAnalyticsData, getDailySalesData } from '../controllers/analytics.controller.js';
import { protectRoute,adminRoute } from "../middleware/auth.middlware.js";
import { httpStatus } from "../utils/httpStatus.js";

const router = express.Router();

router.get('/',protectRoute , adminRoute ,async (req, res) => {
    try {
        const analyticsData = await getAnalyticsData();

        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

        const dailySalesDate = await getDailySalesData(startDate, endDate);

        return res.status(200).json({
            status: httpStatus.SUCCESS,
            data: {
                analyticsData,
                dailySalesDate,
            },
        });
    } catch (error) {
        return res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
});

export default router;