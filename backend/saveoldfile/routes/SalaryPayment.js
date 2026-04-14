import SalaryPayment from "../models/SalaryPayment.js"; // Model niche diya hai

export const getSalaryHistory = async (req, res) => {
  try {
    const data = await SalaryPayment.find({ employeeId: req.params.id });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

export const addSalaryPayment = async (req, res) => {
  try {
    const payment = await SalaryPayment.create(req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};