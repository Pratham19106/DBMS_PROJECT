const express = require('express')


const optimizePurchaseLogic = (vendorList) => {
    const query = `
    select tolerace_amount , tolerance_level from vendors
    where user_id = $1 and vendor_id = $2
    `
    for(let vendor in vendorList){
        const {updated_at , status , total_amount , amount_paid ,vendor_id , user_id , last_date} = vendor;
        const {tolerance_amount , tolerance_level} = pool.query(query , [user_id , vendor_id]);
        const currDebt = total_amount - amount_paid;
        const timeVendorhasWaited = 
        const res = 

    }
}