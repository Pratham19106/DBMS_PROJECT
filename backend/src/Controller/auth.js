const express = require('express')
const pool = require('../db/db')
require('dotenv').config()
const { getUserQuery, addNewUserQuery } = require('../services/userQueries')
const bycrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const registerController = async (req , res , next) =>{
    try {
        const {name , email , password} = req.body
        const query = `
        select name , email from users
        where email = $1 and name = $2
        `
        const isUserAlreadyRegistered = await pool.query(query , [email , name])

        if(isUserAlreadyRegistered.rows.length > 0){
            const err = new Error('user already registered')
            err.status = 400
            return next(err)
        }
        
        const salt = await bycrypt.genSalt(10)
        const hashPassword = await bycrypt.hash(password ,salt)

        const result = await pool.query(addNewUserQuery, [name, email, hashPassword])
         return res.status(201).json({
            success: true,
            msg: "User Added Successfully",
            user: result.rows[0]
        })

    } catch (error) {
         if (error.code === '23502') {
            const error = new Error('Bad Request')
            error.status = 400
            return next(error)
        }

        return next(error)
    }
}


const loginController = async (req , res ,next) =>{
    try {
        const {email , password} = req.body
        const query = `
        select * from users
        where email = $1
        `
        const isUserAlreadyRegistered = await pool.query(query , [email])

        if(!isUserAlreadyRegistered  || isUserAlreadyRegistered.rows.length === 0){
            const err = new Error('user is not registered')
            err.status = 400
            next(err)
        }

        const isPassswordMatched = await bycrypt.compare(password , isUserAlreadyRegistered.rows[0].password)

        if(!isPassswordMatched){
            const err = new Error('Invalid Credential')
            err.status = 400
            return next(err)
        }

        const token = jwt.sign({
            id : isUserAlreadyRegistered.rows[0].id,
            name : isUserAlreadyRegistered.rows[0].name,
            email : isUserAlreadyRegistered.rows[0].email
        } , process.env.JWT_SECRET , {expiresIn : '1h'})
       
       res.status(200).json({
        success : true,
        message : "User logined in successfully",
        token
       })

    } catch (error) {
        next(error)
    }
}


module.exports = {registerController , loginController}