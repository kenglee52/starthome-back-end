import { Request, Response } from "express";
import { Role } from "../models/role.model";

export const getRole =async(req:Request, res:Response)=>{
   try {
      const roles = await Role.findAll();
      res.status(200).json(roles);
   } catch (error) {
     console.error(error);
     res.status(200).send({message: 'Server error'})
   }
}

export const createRole = async(req: Request, res: Response)=>{
   const {roleStatus} = req.body;
    try {
      const result = await Role.create({
         roleStatus
      });
      res.status(201).json({
         message: "Success",
         data: result
      })
   } catch (error) {
     console.error(error);
     res.status(200).send({message: 'Server error', error})
   }
}