const pool = require('../db/db')
const { getUserQuery, getALLUsersQuery, addNewUserQuery, deleteUserQuery, updateUserQuery } = require('../services/userQueries')
const bcrypt = require('bcryptjs')
const getUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const result = await pool.query(getUserQuery, [userId])

        if (result.rows.length === 0) {
            const err = new Error("user not found")
            err.status = 404
            return next(err)
        }

        return res.status(200).json({ user: result.rows[0] })
    } catch (err) {
        return next(err)
    }
}

const getAllUsers = async (req, res, next) => {
    try {
        const result = await pool.query(getALLUsersQuery)

        return res.status(200).json({
            users: result.rows
        })
    } catch (err) {
        return next(err)
    }
}
const addNewUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            const error = new Error('name, email and password are required')
            error.status = 400
            return next(error)
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const result = await pool.query(addNewUserQuery, [name, email, hashedPassword])

        return res.status(201).json({
            success: true,
            msg: "User Added Successfully",
            user: result.rows[0]
        })
    } catch (err) {
        if (err.code === '23505') {
            const error = new Error('Email already exist')
            error.status = 409
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
const deleteUser = async (req, res, next) => {
    try {
        const id = req.params.id
        const result = await pool.query(deleteUserQuery, [id])

        if (!result || result.rows.length == 0) {
            const err = new Error("User doesnot exist")
            err.status = 404
            return next(err)
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully.",
            deletedUser: result.rows[0]
        });
    } catch (err) {
        return next(err)
    }
}


const updateUser = async (req, res, next) => {
    try {
        const id = req.params.id
        let { name, email, password } = req.body;

        const fetchUserData = await pool.query(getUserQuery, [id])
        if (!fetchUserData || fetchUserData.rows.length == 0) {
            const err = new Error("User not found")
            err.status = 404
            return next(err)
        }

        name = name ?? fetchUserData.rows[0].name
        email = email ?? fetchUserData.rows[0].email
        if (password) {
            const salt = await bcrypt.genSalt(10)
            password = await bcrypt.hash(password, salt)
        } else {
            password = fetchUserData.rows[0].password
        }

        const result = await pool.query(updateUserQuery, [name, email, password, id])

        return res.status(200).json({
            success: true,
            msg: "Updated Successfully",
            user: result.rows[0]
        })
    } catch (err) {
        if (err.code === '23505') {
            const error = new Error('Email already exist')
            error.status = 409
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

module.exports = {
    getUser, getAllUsers, addNewUser, deleteUser, updateUser
}