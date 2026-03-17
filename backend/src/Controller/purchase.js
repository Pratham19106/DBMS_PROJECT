const express = require('express')
const pool = require('../db/db')
const optimizePurchase = (req , res , next) =>{
    try {
        const userId = req.params.userId;
        const {cash , commodity} = req.query;
        
        const vendorsForSpecificComodity = pool.query('getVendorsforCommodity' , [commodity]);
        const vendorList = [];
        for(let vendor in vendorsForSpecficCommodity){
            const vendorId = vendor.vendorId;
            vendorList.push(pool.query("getVendorsWithStatusUnpaid" , [userId , vendorId]));
        }
        const updatedVendoList = optimizePruchaseLogic(vendorList);
    } catch (error) {
        return next(error);
    }
}