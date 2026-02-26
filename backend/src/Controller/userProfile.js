const pool = require('../db/db');
const express = require("express")

const { getUserQuery } = require('../services/userQueries.js');
const { getAllUserProfilesQuery, getUserProfileQuery, addUserProfileQuery, updateUserProfileQuery } = require('../services/userProfileQueries.js');

const getAllUserProfiles = async (req , res , next) =>{
    try {
        const result = await pool.query(getAllUserProfilesQuery)

        return res.status(200).json({
            userProfiles : result.rows
        })
    } catch (err) {
        return next(err)
    }
}

const getUserProfile = async (req , res , next) =>{
    try {
        const userId = req.params.id

        const isValidUser = await pool.query(getUserQuery , [userId])

        if(!isValidUser || isValidUser.rows.length == 0){
            const error = new Error("No such user exist")
            error.status = 404
            return next(error)
        }

        const result = await pool.query(getUserProfileQuery , [userId])
        return res.status(200).json({
            profile : result.rows[0]
        })
    } catch (err) {
       return next(err)
    }
}

const addUserProfile = async (req , res , next) =>{
    try {
        const userId = req.params.id
        const {bussinessName , phoneNumber , address} = req.body
        const isValidUser = await pool.query(getUserQuery , [userId])

        if(!isValidUser || isValidUser.rows.length == 0){
            const error = new Error("No such user exist")
            error.status = 404
            return next(error)
        }
        const result = await pool.query(addUserProfileQuery , [userId , bussinessName , phoneNumber , address])
        return res.status(201).json({
            success : true,
            profile : result.rows[0]
        })
    } catch (err) {
         if (err.code === '42804') {
            const error = new Error('Bad Request')
            error.status = 400
            return next(error)
        }
        if (err.code === '23502') {
            const error = new Error('Bad Request')
            error.status = 400
            return next(error)
        }
        return next(err)
    }
}

const updateUserProfile = async (req , res , next) =>{
    try {
        const userId = req.params.id
        let {bussinessName , phoneNumber , address} = req.body
        const isValidUser = await pool.query(getUserQuery , [userId])
         
        if(!isValidUser || isValidUser.rows.length == 0){
            const error = new Error("No such user exist")
            error.status = 404
            return next(error)
        }
        const fetchUserData = await pool.query(getUserProfileQuery , [userId])

        if(!fetchUserData || fetchUserData.rows.length === 0){
            const error = new Error("Profile not found")
            error.status = 404
            return next(error)
        }

        bussinessName = bussinessName ?? fetchUserData.rows[0].business_name
        phoneNumber = phoneNumber ?? fetchUserData.rows[0].phone_number
        address = address ?? fetchUserData.rows[0].address

        const result = await pool.query(updateUserProfileQuery , [bussinessName , phoneNumber , address , userId])

        return res.status(200).json({
            success: true,
            msg: "Updated Successfully",
            profile: result.rows[0]
        })
    } catch (err) {
        return next(err)
    }
}

module.exports = {getAllUserProfiles ,getUserProfile, addUserProfile , updateUserProfile};