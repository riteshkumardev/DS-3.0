// controllers/salaryController.js

export const getSalaryPaymentByBill = async (req, res, next) => {
    try {
        const { billNo } = req.params;

        // SalaryPayment aapka model name hona chahiye
        const payment = await SalaryPayment.findOne({ billNo: billNo });

        if (!payment) {
            res.status(404);
            throw new Error("Payment record not found for this Bill No");
        }

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        next(error);
    }
};