import { Request, Response } from "express";
import { Currency } from "../models/currency.model";

export const getAllCurrency = async(req: Request, res: Response) => {
  try {
         const data = await Currency.findAll();
         res.status(200).json(data);
  } catch (error) {
         console.error(error);
         res.status(500).send({
            message: "Server error"
         });
  }
}