const pool = require('../db/db')
require('dotenv').config()
const { addNewUserQuery } = require('../services/userQueries')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const registerController = async (req, res, next) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            const err = new Error('name, email and password are required')
            err.status = 400
            return next(err)
        }

        const query = `
        select id from users
        where email = $1
        `
        const isUserAlreadyRegistered = await pool.query(query, [email])

        if (isUserAlreadyRegistered.rows.length > 0) {
            const err = new Error('user already registered')
            err.status = 409
            return next(err)
        }

        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(password, salt)

        const result = await pool.query(addNewUserQuery, [name, email, hashPassword])
        return res.status(201).json({
            success: true,
            msg: "User Added Successfully",
            user: result.rows[0]
        })

    } catch (error) {
        if (error.code === '23505') {
            const err = new Error('user already registered')
            err.status = 409
            return next(err)
        }
        if (error.code === '23502') {
            const error = new Error('Bad Request')
            error.status = 400
            return next(error)
        }

        return next(error)
    }
}


const loginController = async (req, res, next) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            const err = new Error('email and password are required')
            err.status = 400
            return next(err)
        }

        const query = `
        select * from users
        where email = $1
        `
        const isUserAlreadyRegistered = await pool.query(query, [email])

        if (!isUserAlreadyRegistered || isUserAlreadyRegistered.rows.length === 0) {
            const err = new Error('user is not registered')
            err.status = 400
            return next(err)
        }

        const isPassswordMatched = await bcrypt.compare(password, isUserAlreadyRegistered.rows[0].password)

        if (!isPassswordMatched) {
            const err = new Error('Invalid Credential')
            err.status = 400
            return next(err)
        }

        const token = jwt.sign({
            id: isUserAlreadyRegistered.rows[0].id,
            name: isUserAlreadyRegistered.rows[0].name,
            email: isUserAlreadyRegistered.rows[0].email
        }, process.env.JWT_SECRET, { expiresIn: '1h' })

        res.status(200).json({
            success: true,
            message: "User logined in successfully",
            token
        })

    } catch (error) {
        next(error)
    }
}


module.exports = { registerController, loginController }